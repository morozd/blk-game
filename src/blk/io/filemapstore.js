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

goog.provide('blk.io.FileMapStore');

goog.require('blk.io.MapStore');
goog.require('blk.io.RegionFileCache');
goog.require('gf.io');
goog.require('gf.io.FileSystemType');
goog.require('goog.asserts');
goog.require('goog.async.Deferred');



/**
 * Map storage provider based on the GM file system API.
 * Chunks are divided into 'chunk regions', with each region being a fixed size
 * number of chunks.
 *
 * The inspiration for this comes from the McRegion file format. It works well
 * there so it should work well here. One difference required when implementing
 * is that the region files are extended much larger each growth event, as
 * changing the size of files is an expensive operation.
 *
 * @constructor
 * @extends {blk.io.MapStore}
 * @param {string} basePath Base map path.
 */
blk.io.FileMapStore = function(basePath) {
  goog.base(this);

  /**
   * Base path for all file operations, such as /foo/maps/map01/.
   * @private
   * @type {string}
   */
  this.basePath_ = basePath;

  /**
   * File system.
   * @private
   * @type {gf.io.FileSystem}
   */
  this.fs_ = null;

  /**
   * Root directory entry under which all map files are stored.
   * @private
   * @type {gf.io.DirectoryEntry}
   */
  this.root_ = null;

  /**
   * A cache of region files.
   * @private
   * @type {blk.io.RegionFileCache}
   */
  this.regionCache_ = null;
};
goog.inherits(blk.io.FileMapStore, blk.io.MapStore);


/**
 * Default quota size, in bytes.
 * @private
 * @const
 * @type {number}
 */
blk.io.FileMapStore.DEFAULT_QUOTA_SIZE_ = 1024 * 1024 * 1024;


/**
 * Maximum number of region files to keep open.
 * This number should be large enough that many users in different locations
 * don't cause thrashing.
 * @private
 * @const
 * @type {number}
 */
blk.io.FileMapStore.MAX_OPEN_REGION_FILES_ = 256;


/**
 * @override
 */
blk.io.FileMapStore.prototype.setup = function() {
  var deferred = new goog.async.Deferred();

  // Request a file system
  gf.io.requestFileSystem(
      gf.io.FileSystemType.PERSISTENT,
      blk.io.FileMapStore.DEFAULT_QUOTA_SIZE_).addCallbacks(
      function(fs) {
        // Ready!
        this.fs_ = fs;
        fs.getRoot().createPath(this.basePath_).addCallbacks(
            function(entry) {
              this.root_ = entry;

              this.root_.createPath('regions').addCallbacks(
                  function(regionRoot) {
                    this.regionCache_ = new blk.io.RegionFileCache(
                        blk.io.FileMapStore.MAX_OPEN_REGION_FILES_, regionRoot);
                    this.registerDisposable(this.regionCache_);

                    this.resume();
                    deferred.callback(null);
                  },
                  function(arg) {
                    deferred.errback(arg);
                  }, this);
            },
            function(arg) {
              deferred.errback(arg);
            }, this);
      },
      function(arg) {
        deferred.errback(arg);
      }, this);

  return deferred;
};


/**
 * @override
 */
blk.io.FileMapStore.prototype.processEntry = function(entry) {
  goog.asserts.assert(this.regionCache_);
  goog.asserts.assert(this.root_);

  switch (entry.action) {
    case blk.io.MapStore.QueueAction.READ_INFO:
      this.root_.getFile('info.bin').addCallbacks(
          function(file) {
            file.read().addCallbacks(
                function(data) {
                  this.finishReadInfo(entry, null, data);
                },
                function(arg) {
                  this.finishReadInfo(entry, arg, null);
                }, this);
          },
          function(arg) {
            this.finishReadInfo(entry, arg, null);
          }, this);
      break;
    case blk.io.MapStore.QueueAction.WRITE_INFO:
      goog.asserts.assert(entry.data);
      this.root_.getFile('info.bin').addCallbacks(
          function(file) {
            file.write(entry.data).addCallbacks(
                function() {
                  this.finishWriteInfo(entry, null);
                },
                function(arg) {
                  this.finishWriteInfo(entry, arg);
                }, this);
          },
          function(arg) {
            this.finishWriteInfo(entry, arg);
          }, this);
      break;
    case blk.io.MapStore.QueueAction.READ_CHUNK:
      this.regionCache_.get(entry.x, entry.y, entry.z).addCallbacks(
          function(regionFile) {
            regionFile.readChunkData(entry.x, entry.y, entry.z).addCallbacks(
                function(data) {
                  this.finishReadChunk(entry, null, data);
                },
                function(arg) {
                  this.finishReadChunk(entry, arg, null);
                }, this);
          },
          function(arg) {
            this.finishReadChunk(entry, arg, null);
          }, this);
      break;
    case blk.io.MapStore.QueueAction.WRITE_CHUNK:
      goog.asserts.assert(entry.data);
      this.regionCache_.get(entry.x, entry.y, entry.z).addCallbacks(
          function(regionFile) {
            regionFile.writeChunkData(
                entry.x, entry.y, entry.z, entry.data).addCallbacks(
                function() {
                  this.finishWriteChunk(entry, null);
                },
                function(arg) {
                  this.finishWriteChunk(entry, arg);
                }, this);
          },
          function(arg) {
            this.finishWriteChunk(entry, arg);
          }, this);
      break;
    case blk.io.MapStore.QueueAction.REMOVE_CHUNK:
      this.regionCache_.get(entry.x, entry.y, entry.z).addCallbacks(
          function(regionFile) {
            regionFile.removeChunkData(entry.x, entry.y, entry.z).addCallbacks(
                function() {
                  this.finishRemoveChunk(entry, null);
                },
                function(arg) {
                  this.finishRemoveChunk(entry, arg);
                }, this);
          },
          function(arg) {
            this.finishRemoveChunk(entry, arg);
          }, this);
      break;
    default:
      goog.asserts.fail('unknown action');
      break;
  }
};
