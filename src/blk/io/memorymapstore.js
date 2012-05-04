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

goog.provide('blk.io.MemoryMapStore');

goog.require('blk.io.MapStore');
goog.require('goog.asserts');
goog.require('goog.async.Deferred');



/**
 * No-op map storage provider that stores all chunks in memory.
 *
 * @constructor
 * @extends {blk.io.MapStore}
 */
blk.io.MemoryMapStore = function() {
  goog.base(this);

  /**
   * Map info.
   * @private
   * @type {ArrayBuffer}
   */
  this.info_ = null;

  /**
   * All chunk data, indexed by chunk key.
   * @private
   * @type {!Object.<ArrayBuffer>}
   */
  this.chunkData_ = {};
};
goog.inherits(blk.io.MemoryMapStore, blk.io.MapStore);


/**
 * @override
 */
blk.io.MemoryMapStore.prototype.setup = function() {
  this.resume();
  return goog.async.Deferred.succeed(null);
};


/**
 * Gets a unique key for the chunk referenced by the given entry.
 * @private
 * @param {!blk.io.MapStore.QueueEntry} entry Queue entry.
 * @return {string} A unique string key for a chunk.
 */
blk.io.MemoryMapStore.prototype.getChunkKey_ = function(entry) {
  return [entry.x, entry.y, entry.z].join('.');
};


/**
 * @override
 */
blk.io.MemoryMapStore.prototype.processEntry = function(entry) {
  switch (entry.action) {
    case blk.io.MapStore.QueueAction.READ_INFO:
      this.finishReadInfo(entry, null, this.info_);
      break;
    case blk.io.MapStore.QueueAction.WRITE_INFO:
      this.info_ = entry.data;
      this.finishWriteInfo(entry, null);
      break;
    case blk.io.MapStore.QueueAction.READ_CHUNK:
      var chunkData = this.chunkData_[this.getChunkKey_(entry)];
      this.finishReadChunk(entry, null, chunkData);
      break;
    case blk.io.MapStore.QueueAction.WRITE_CHUNK:
      this.chunkData_[this.getChunkKey_(entry)] = entry.data;
      this.finishWriteChunk(entry, null);
      break;
    case blk.io.MapStore.QueueAction.REMOVE_CHUNK:
      delete this.chunkData_[this.getChunkKey_(entry)];
      this.finishRemoveChunk(entry, null);
      break;
    default:
      goog.asserts.fail('unknown action');
      break;
  }
};
