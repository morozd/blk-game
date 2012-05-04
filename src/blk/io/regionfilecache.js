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

goog.provide('blk.io.RegionFileCache');

goog.require('blk.io.CompressionFormat');
goog.require('blk.io.RegionFile');
goog.require('gf.io.DirectoryEntry');
goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.async.Deferred');



/**
 * A simple LRU cache of open region files.
 *
 * This cache does not support multiple outstanding gets.
 * TODO(benvanik): make overlapping region file requests work
 *
 * @constructor
 * @extends {goog.Disposable}
 * @param {number} maxOpenFiles Maximum number of open files to retain.
 * @param {!gf.io.DirectoryEntry} rootEntry Root directory entry for files.
 */
blk.io.RegionFileCache = function(maxOpenFiles, rootEntry) {
  goog.base(this);

  /**
   * Maximum number of open files to retain.
   * @private
   * @type {number}
   */
  this.maxOpenFiles_ = maxOpenFiles;

  /**
   * All opened region files, mapped by name.
   * @private
   * @type {!Object.<!blk.io.RegionFile>}
   */
  this.cache_ = {};

  /**
   * All opened region files in a list.
   * This is used to quickly sort by access time to find files to close.
   * @private
   * @type {!Array.<blk.io.RegionFile>}
   */
  this.list_ = [];

  /**
   * Root directory entry for region files.
   * @private
   * @type {!gf.io.DirectoryEntry}
   */
  this.rootEntry_ = rootEntry;
};
goog.inherits(blk.io.RegionFileCache, goog.Disposable);


/**
 * @override
 */
blk.io.RegionFileCache.prototype.disposeInternal = function() {
  this.clear();
  goog.base(this, 'disposeInternal');
};


/**
 * Gets the region file containing the given chunk coordinates, creating it if
 * required.
 * @param {number} x Chunk coordinate X.
 * @param {number} y Chunk coordinate Y.
 * @param {number} z Chunk coordinate Z.
 * @return {!goog.async.Deferred} A deferred fulfilled when the region file is
 *     ready for access.
 */
blk.io.RegionFileCache.prototype.get = function(x, y, z) {
  var rx = x >> blk.io.RegionFile.SHIFT_XZ;
  var ry = 0;
  var rz = z >> blk.io.RegionFile.SHIFT_XZ;
  var key = [rx, ry, rz, 'blkregion'].join('.');

  var deferred = new goog.async.Deferred();

  // If cached, quickly return
  var regionFile = this.cache_[key];
  if (regionFile) {
    // Don't support overlapping requests yet!
    goog.asserts.assert(regionFile.prepared);

    regionFile.lastAccessTime = goog.now();
    deferred.callback(regionFile);
  } else {
    // Attempt to open
    this.load_(rx, ry, rz, key, deferred);
  }

  return deferred;
};


/**
 * Loads a region file into the cache.
 * @private
 * @param {number} rx Region offset X.
 * @param {number} ry Region offset Y.
 * @param {number} rz Region offset Z.
 * @param {string} key Unique key.
 * @param {!goog.async.Deferred} deferred A deferred to signal when the region
 *     file is ready for use. Expects the region file as its only argument.
 */
blk.io.RegionFileCache.prototype.load_ = function(rx, ry, rz, key, deferred) {
  // This will create the file if required as empty
  this.rootEntry_.getFile(
      key, gf.io.DirectoryEntry.Behavior.CREATE).addCallbacks(
      function(file) {
        // Maintain the cache size by expelling the oldest file
        if (this.list_.length >= this.maxOpenFiles_) {
          this.expel_();
        }

        // Create region file wrapper
        var regionFile = new blk.io.RegionFile(
            rx << blk.io.RegionFile.SHIFT_XZ,
            ry << blk.io.RegionFile.SHIFT_XZ,
            rz << blk.io.RegionFile.SHIFT_XZ,
            key,
            file,
            blk.io.CompressionFormat.UNCOMPRESSED);

        // Add to cache
        this.cache_[key] = regionFile;
        this.list_.push(regionFile);

        // Prepare for accessing (create file backing, etc)
        regionFile.prepare().addCallbacks(
            function() {
              deferred.callback(regionFile);
            },
            function(arg) {
              deferred.errback(arg);
            }, this);
      },
      function(arg) {
        deferred.errback(arg);
      }, this);
};


/**
 * Expels the oldest file from the cache.
 * @private
 */
blk.io.RegionFileCache.prototype.expel_ = function() {
  if (!this.list_.length) {
    return;
  }
  goog.array.sort(
      this.list_, blk.io.RegionFile.accessTimeComparer);
  var regionFile = this.list_[this.list_.length - 1];
  delete this.cache_[regionFile.key];
  goog.dispose(regionFile);
  this.list_.length--;
};


/**
 * Drops all files from the cache.
 */
blk.io.RegionFileCache.prototype.clear = function() {
  goog.array.forEach(this.list_, goog.dispose);
  this.list_.length = 0;
  this.cache_ = {};
};
