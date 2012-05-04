/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

goog.provide('blk.io.RegionFile');

goog.require('blk.env.Chunk');
goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('goog.async.DeferredList');



/**
 * An NxN region of chunks that are stored in a single file on disk.
 *
 * The format and design of this is largely inspirted by McRegion by Scaevolus,
 * however it has been modified to be a bit more efficient.
 *
 * The file is divided into 4096B sectors. All addresses in the file reference
 * sectors.
 *
 * The first sector of the file is 1024 (32 * 32) uint values
 * indicating the offset and size (in sectors) of each chunk in the form:
 * {@code (offset << 8) | size}. Chunk data is limited to 256 sectors or 1M
 * (1048576B), minus the size of the header.
 *
 * Chunk data is stored in contiguous sectors with a minimal header located at
 * the start consisting of the following:
 * - format - uint - maps to {@see blk.io.RegionFile.Format}
 * - uncompressed size - uint - size, in bytes, after decompression
 *
 * @constructor
 * @extends {goog.Disposable}
 * @param {number} x Region offset X.
 * @param {number} y Region offset Y.
 * @param {number} z Region offset Z.
 * @param {string} key Unique key.
 * @param {!gf.io.FileEntry} fileEntry File entry for the region file.
 * @param {blk.io.CompressionFormat} format Format to store chunk data in.
 */
blk.io.RegionFile = function(x, y, z, key, fileEntry, format) {
  goog.base(this);

  /**
   * Region offset X, in world coordinates.
   * @type {number}
   */
  this.x = x;

  /**
   * Region offset Y, in world coordinates.
   * @type {number}
   */
  this.y = y;

  /**
   * Region offset Z, in world coordinates.
   * @type {number}
   */
  this.z = z;

  /**
   * Unique key for the region file.
   * @type {string}
   */
  this.key = key;

  /**
   * File entry.
   * @type {!gf.io.FileEntry}
   */
  this.fileEntry = fileEntry;

  /**
   * Preferred format for chunk data.
   * @type {blk.io.CompressionFormat}
   */
  this.format = format;

  /**
   * Last time the region file was accessed.
   * @type {number}
   */
  this.lastAccessTime = goog.now();

  /**
   * Whether the region file has been prepared and is usable.
   * @type {boolean}
   */
  this.prepared = false;

  /**
   * Chunk table, with one slot per chunk.
   * Each slot is formed of {@code (offset << 8) | size}, with both values as
   * sectors.
   * @private
   * @type {!Uint32Array}
   */
  this.chunkTable_ = new Uint32Array(
      blk.io.RegionFile.TOTAL_CHUNKS);

  /**
   * A bitmap of all sectors in the file, with each value describing whether the
   * sector is in use. The first sector, containing the table, is always in use.
   * @private
   * @type {!Array.<boolean>}
   */
  this.sectorMap_ = [true];

  /**
   * Current reader. This must be reopened each time the file grows.
   * @private
   * @type {gf.io.FileReader}
   */
  this.reader_ = null;

  /**
   * Current writer.
   * @private
   * @type {gf.io.FileWriter}
   */
  this.writer_ = null;
};
goog.inherits(blk.io.RegionFile, goog.Disposable);


/**
 * Number of chunks on X and Z dimensions in the region file.
 * @const
 * @type {number}
 */
blk.io.RegionFile.SIZE_XZ = 32;


/**
 * Bit shift count to translate world coordinates into region coordinates.
 * @const
 * @type {number}
 */
blk.io.RegionFile.SHIFT_XZ = blk.env.Chunk.SHIFT_XZ + 5;


/**
 * Bit mask for chunks on X and Z dimensions in the region file.
 * @const
 * @type {number}
 */
blk.io.RegionFile.MASK_XZ = 0x1F;


/**
 * Total number of chunks a region file can store.
 * @const
 * @type {number}
 */
blk.io.RegionFile.TOTAL_CHUNKS =
    blk.io.RegionFile.SIZE_XZ *
    blk.io.RegionFile.SIZE_XZ;


/**
 * Size, in bytes, of each sector in the file.
 * This should be some reasonable multiple of the sector size in the file
 * system.
 *
 * TODO(benvanik): store this in the file header and allow it to vary - for
 *     example smaller on clients and larger on servers
 *
 * @private
 * @const
 * @type {number}
 */
blk.io.RegionFile.SECTOR_SIZE_ = 4096;


/**
 * Number of sectors to grow the file when extension is required.
 * @private
 * @const
 * @type {number}
 */
blk.io.RegionFile.GROWTH_COUNT_ = 32;


/**
 * Size, in bytes, of the header attached to each chunk data entry.
 * @private
 * @const
 * @type {number}
 */
blk.io.RegionFile.CHUNK_HEADER_SIZE_ = 2 * 4;


/**
 * Compares two region files by their last access time, with the most recently
 * accessed first.
 * @param {!blk.io.RegionFile} a First file.
 * @param {!blk.io.RegionFile} b Second file.
 * @return {number} Sort order.
 */
blk.io.RegionFile.accessTimeComparer = function(a, b) {
  return b.lastAccessTime - a.lastAccessTime;
};


/**
 * @override
 */
blk.io.RegionFile.prototype.disposeInternal = function() {
  goog.dispose(this.reader_);
  goog.dispose(this.writer_);

  goog.base(this, 'disposeInternal');
};


/**
 * Prepares the region file for use, creating it if required.
 * @return {!goog.async.Deferred} A deferred fullfilled when the region file is
 *     ready for use.
 */
blk.io.RegionFile.prototype.prepare = function() {
  var deferred = new goog.async.Deferred();

  goog.async.DeferredList.gatherResults([
    this.fileEntry.createReader(),
    this.fileEntry.createWriter()
  ]).addCallbacks(
      function(results) {
        this.reader_ = /** @type {!gf.io.FileReader} */ (results[0]);
        this.writer_ = /** @type {!gf.io.FileWriter} */ (results[1]);

        if (!this.reader_.getLength()) {
          // File is new and must be initialized
          // This really just means writing out the empty chunk table - the rest
          // should happen automatically through the normal allocation process
          this.write_(0, this.chunkTable_.buffer).addCallbacks(
              function() {
                // Ready!
                this.prepared = true;
                deferred.callback(null);
              },
              function(arg) {
                deferred.errback(arg);
              }, this);
        } else {
          // File has existing contents - read out the chunk table
          var tableSize = blk.io.RegionFile.TOTAL_CHUNKS * 4;
          this.reader_.read(0, tableSize, this.chunkTable_.buffer).addCallbacks(
              function(buffer) {
                if (buffer != this.chunkTable_.buffer) {
                  this.chunkTable_ = new Uint32Array(buffer);
                }

                // Rebuild the sector map
                this.buildSectorMap_();

                // Ready!
                this.prepared = true;
                deferred.callback(null);
              },
              function(arg) {
                deferred.errback(arg);
              }, this);
        }
      },
      function(arg) {
        deferred.errback(arg);
      }, this);

  return deferred;
};


/**
 * Maps a chunk in world coordinates to an index in the chunk table.
 * @private
 * @param {number} x Chunk coordinate X.
 * @param {number} y Chunk coordinate Y.
 * @param {number} z Chunk coordinate Z.
 * @return {number} Index in the chunk table.
 */
blk.io.RegionFile.prototype.getChunkIndex_ = function(x, y, z) {
  var cx = (x >> blk.env.Chunk.SHIFT_XZ) & blk.io.RegionFile.MASK_XZ;
  var cz = (z >> blk.env.Chunk.SHIFT_XZ) & blk.io.RegionFile.MASK_XZ;
  var index = cz * blk.io.RegionFile.SIZE_XZ + cx;
  goog.asserts.assert(index >= 0 && index < this.chunkTable_.length);
  return index;
};


/**
 * Reads a chunk from the region file.
 * @param {number} x Chunk coordinate X.
 * @param {number} y Chunk coordinate Y.
 * @param {number} z Chunk coordinate Z.
 * @return {!goog.async.Deferred} A deferred fulfilled when the request has
 *     completed. Successful callbacks receive an ArrayBuffer with the data or
 *     null if the chunk was not present in the file.
 */
blk.io.RegionFile.prototype.readChunkData = function(x, y, z) {
  var deferred = new goog.async.Deferred();

  var chunkIndex = this.getChunkIndex_(x, y, z);
  var tableData = this.chunkTable_[chunkIndex];
  var offset = (tableData >> 8) * blk.io.RegionFile.SECTOR_SIZE_;
  var size = (tableData & 0xFF) * blk.io.RegionFile.SECTOR_SIZE_;
  if (!size) {
    // Chunk not present in the file
    deferred.callback(null);
  } else {
    // Read the data (all sectors)
    this.reader_.read(offset, size).addCallbacks(
        function(data) {
          deferred.callback(data);
        },
        function(arg) {
          deferred.errback(arg);
        }, this);
  }

  return deferred;
};


/**
 * Writes a chunk to the region file.
 * @param {number} x Chunk coordinate X.
 * @param {number} y Chunk coordinate Y.
 * @param {number} z Chunk coordinate Z.
 * @param {!ArrayBuffer} data Chunk data.
 * @return {!goog.async.Deferred} A deferred fulfilled when the request has
 *     completed.
 */
blk.io.RegionFile.prototype.writeChunkData =
    function(x, y, z, data) {
  var deferred = new goog.async.Deferred();

  var totalSize = data.byteLength;

  var chunkIndex = this.getChunkIndex_(x, y, z);
  var tableData = this.chunkTable_[chunkIndex];
  var offset = tableData >> 8;

  var oldSectorCount = tableData & 0xFF;
  var newSectorCount = Math.ceil(totalSize / blk.io.RegionFile.SECTOR_SIZE_);
  goog.asserts.assert(newSectorCount <= 0xFF);
  if (newSectorCount > 0xFF) {
    // TODO(benvanik): better handling of chunk max size spills
    deferred.errback(null);
    return deferred;
  }

  if (offset && oldSectorCount == newSectorCount) {
    // Same size and already allocated, overwrite existing data
    // No need to update main table
    this.write_(offset, data).addCallbacks(
        function() {
          deferred.callback();
        },
        function(arg) {
          deferred.errback(arg);
        });
  } else {
    // Deallocate, if allocated
    if (offset) {
      this.deallocateSectors_(offset, oldSectorCount);
    }

    // Allocate sectors
    this.allocateSectors_(newSectorCount).addCallbacks(
        function(offset) {
          // Update the table
          tableData = (offset << 8) | newSectorCount;
          this.chunkTable_[chunkIndex] = tableData;

          // Write the contents
          this.write_(offset, data).addCallbacks(
              function() {
                // Write the header sector
                this.write_(0, this.chunkTable_.buffer).addCallbacks(
                    function() {
                      // Done!
                      deferred.callback();
                    },
                    function(arg) {
                      deferred.errback(arg);
                    });
              },
              function(arg) {
                deferred.errback(arg);
              }, this);
        },
        function(arg) {
          deferred.errback(arg);
        }, this);
  }

  return deferred;
};


/**
 * Removes the requested chunk from the region file.
 * @param {number} x Chunk coordinate X.
 * @param {number} y Chunk coordinate Y.
 * @param {number} z Chunk coordinate Z.
 * @return {!goog.async.Deferred} A deferred fulfilled when the request has
 *     completed.
 */
blk.io.RegionFile.prototype.removeChunkData = function(x, y, z) {
  var chunkIndex = this.getChunkIndex_(x, y, z);
  var tableData = this.chunkTable_[chunkIndex];
  var offset = tableData >> 8;
  var count = tableData & 0xFF;
  if (!offset) {
    // Not allocated - no-op
    return goog.async.Deferred.succeed(null);
  } else {
    // Deallocate
    this.deallocateSectors_(offset, count);

    // Reset table entry
    this.chunkTable_[chunkIndex] = 0;

    // Write the header sector
    return this.write_(0, this.chunkTable_.buffer);
  }
};


/**
 * Builds the sector map from the chunk table.
 * @private
 */
blk.io.RegionFile.prototype.buildSectorMap_ = function() {
  // Reset the map
  var fileCount = this.writer_.getLength() / blk.io.RegionFile.SECTOR_SIZE_;
  goog.asserts.assert(fileCount == Math.floor(fileCount));
  this.sectorMap_.length = fileCount;
  this.sectorMap_[0] = true;
  for (var n = 1; n < this.sectorMap_.length; n++) {
    this.sectorMap_[n] = false;
  }

  // Mark all used sectors
  for (var n = 0; n < this.chunkTable_.length; n++) {
    var tableData = this.chunkTable_[n];
    var offset = tableData >> 8;
    var count = tableData & 0xFF;
    if (offset) {
      for (var m = 0; m < count; m++) {
        this.sectorMap_[offset + m] = true;
      }
    }
  }
};


/**
 * Allocates the requested number of sectors, extending the file if needed.
 * @private
 * @param {number} count Sector count.
 * @return {!goog.async.Deferred} A deferred fulfilled when the allocation has
 *     completed. Successful callbacks receive a sector offset to a
 *     contiguous number of sectors.
 */
blk.io.RegionFile.prototype.allocateSectors_ = function(count) {
  var deferred = new goog.async.Deferred();

  // Find a contiuous block in the sector map
  var runStart = this.sectorMap_.indexOf(false);
  var runLength = 0;
  if (count > 1 && runStart != -1) {
    for (var n = runStart; n < this.sectorMap_.length; n++) {
      if (runLength) {
        if (!this.sectorMap_[n]) {
          runLength++;
        } else {
          runLength = 0;
        }
      } else if (!this.sectorMap_[n]) {
        runStart = n;
        runLength = 1;
      }
      if (runLength >= count) {
        break;
      }
    }
  }

  if (runLength >= count) {
    // Found an existing stretch of free space - mark used and callback
    var offset = runStart;
    for (var n = 0; n < count; n++) {
      this.sectorMap_[offset + n] = true;
    }
    deferred.callback(offset);
  } else {
    // No free space - extend the file
    var newSectors = Math.max(count, blk.io.RegionFile.GROWTH_COUNT_);
    var newSize = this.writer_.getLength() +
        newSectors * blk.io.RegionFile.SECTOR_SIZE_;
    this.writer_.setLength(newSize).addCallbacks(
        function() {
          // Extend the sector map
          var oldLength = this.sectorMap_.length;
          this.sectorMap_.length += newSectors;
          for (var n = 0; n < newSectors; n++) {
            this.sectorMap_[oldLength + n] = false;
          }

          // Pick a run at the end of the file
          var offset = oldLength;
          for (var n = 0; n < count; n++) {
            this.sectorMap_[offset + n] = true;
          }

          // Need to recreate the reader now that the size has changed
          goog.dispose(this.reader_);
          this.reader_ = null;
          this.fileEntry.createReader().addCallbacks(
              function(reader) {
                this.reader_ = reader;

                // Done!
                deferred.callback(offset);
              },
              function(arg) {
                deferred.errback(arg);
              }, this);
        },
        function(arg) {
          deferred.errback(arg);
        }, this);
  }

  return deferred;
};


/**
 * Deallocates the rquested sectors.
 * This does not shrink the file.
 * @private
 * @param {number} offset Sector offset.
 * @param {number} count Sector count.
 */
blk.io.RegionFile.prototype.deallocateSectors_ = function(offset, count) {
  for (var n = 0; n < count; n++) {
    this.sectorMap_[offset + n] = false;
  }
};


/**
 * Writes a list of ArrayBuffers to the given offset in the file.
 * @private
 * @param {number} offset Offset, in sectors, to start writing.
 * @param {...ArrayBuffer} var_args ArrayBuffers to write.
 * @return {!goog.async.Deferred} A deferred fulfilled when the write has
 *     completed.
 */
blk.io.RegionFile.prototype.write_ = function(offset, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  args.unshift(offset * blk.io.RegionFile.SECTOR_SIZE_);
  return this.writer_.write.apply(this.writer_, args);
};
