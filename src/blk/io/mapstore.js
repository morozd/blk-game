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

goog.provide('blk.io.MapStore');

goog.require('blk.env.MapInfo');
goog.require('blk.io.ChunkSerializer');
goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.async.Deferred');



/**
 * Base map storage provider.
 *
 * TODO(benvanik): clever scheduling magic - cancel duplicate reads, prevent
 *     duplicate writes, cancel reads/writes when removing, etc
 * TODO(benvanik): overlapping reads/writes for non-conflicting entries
 * TODO(benvanik): basically all that old Phanfare stuff I wrote
 *
 * @constructor
 * @extends {goog.Disposable}
 */
blk.io.MapStore = function() {
  goog.base(this);

  /**
   * An ordered list of all queued actions.
   * @private
   * @type {!Array.<!blk.io.MapStore.QueueEntry>}
   */
  this.queue_ = [];

  /**
   * Whether the queue needs to be sorted by priority.
   * @private
   * @type {boolean}
   */
  this.needsSort_ = false;

  /**
   * Count of in-progress entries.
   * @private
   * @type {number}
   */
  this.inProgress_ = 0;

  /**
   * Whether the map store is processing the queue.
   * @private
   * @type {boolean}
   */
  this.paused_ = true;

  /**
   * Cached chunk serialization utility.
   * @private
   * @type {!blk.io.ChunkSerializer}
   */
  this.chunkSerializer_ = new blk.io.ChunkSerializer();
};
goog.inherits(blk.io.MapStore, goog.Disposable);


/**
 * Sets up the map store.
 * @return {!goog.async.Deferred} A deferred fulfilled when the map store is
 *     ready to be used.
 */
blk.io.MapStore.prototype.setup = goog.abstractMethod;


/**
 * Pauses queue processing.
 * Queue entries that are in progress will not be cancelled.
 */
blk.io.MapStore.prototype.pause = function() {
  this.paused_ = true;
};


/**
 * Resumes queue processing.
 */
blk.io.MapStore.prototype.resume = function() {
  this.paused_ = false;
  this.pump_();
};


/**
 * Gets map information.
 * @return {!goog.async.Deferred} A deferred fulfilled when the read completes.
 *     Successful callbacks receive {@see blk.env.MapInfo}.
 */
blk.io.MapStore.prototype.readInfo = function() {
  var deferred = new goog.async.Deferred();
  this.queueEntry_(new blk.io.MapStore.QueueEntry(deferred,
      blk.io.MapStore.QueueAction.READ_INFO, 0, 0, 0));
  return deferred;
};


/**
 * Finishes a READ_INFO request.
 * @protected
 * @param {!blk.io.MapStore.QueueEntry} entry Queue entry.
 * @param {Object} error Error, if any.
 * @param {ArrayBuffer} data Data, if any - may be null if not found.
 */
blk.io.MapStore.prototype.finishReadInfo = function(entry, error, data) {
  this.completeEntry_(entry);

  // TODO(benvanik): deserialize map info
  var mapInfo = new blk.env.MapInfo();
  var succeeded =
      !error && data;
  if (succeeded) {
    entry.deferred.callback(mapInfo);
  } else {
    entry.deferred.errback(error);
  }
};


/**
 * Writes map information.
 * @param {!blk.env.MapInfo} mapInfo Map info to write.
 * @return {!goog.async.Deferred} A deferred fulfilled when the map has been
 *     updated.
 */
blk.io.MapStore.prototype.writeInfo = function(mapInfo) {
  var deferred = new goog.async.Deferred();
  var entry = new blk.io.MapStore.QueueEntry(
      deferred,
      blk.io.MapStore.QueueAction.WRITE_INFO,
      0, 0, 0);
  entry.version = mapInfo.version;
  // Snapshot the data right now in case it changes later
  entry.data = new Uint8Array(0).buffer;
  if (entry.data) {
    this.queueEntry_(entry);
  } else {
    deferred.errback(null);
  }
  return deferred;
};


/**
 * Finishes a WRITE_INFO request.
 * @protected
 * @param {!blk.io.MapStore.QueueEntry} entry Queue entry.
 * @param {Object} error Error, if any.
 */
blk.io.MapStore.prototype.finishWriteInfo = function(entry, error) {
  this.completeEntry_(entry);

  if (!error) {
    entry.deferred.callback(null);
  } else {
    entry.deferred.errback(error);
  }
};


/**
 * Gets chunk data, if present.
 * @param {!blk.env.Chunk} chunk Chunk to read into. Must have its XYZ set.
 * @param {number} priority Priority, with 0 being the highest priority.
 * @return {!goog.async.Deferred} A deferred fulfilled when the read completes.
 */
blk.io.MapStore.prototype.readChunk = function(chunk, priority) {
  var deferred = new goog.async.Deferred();
  var entry = new blk.io.MapStore.QueueEntry(
      deferred,
      blk.io.MapStore.QueueAction.READ_CHUNK, chunk.x, chunk.y, chunk.z);
  entry.chunk = chunk;
  entry.priority = priority;
  this.queueEntry_(entry);
  this.needsSort_ = true;
  return deferred;
};


/**
 * Finishes a READ_CHUNK request.
 * @protected
 * @param {!blk.io.MapStore.QueueEntry} entry Queue entry.
 * @param {Object} error Error, if any.
 * @param {ArrayBuffer} data Data, if any - may be null if not found.
 */
blk.io.MapStore.prototype.finishReadChunk = function(entry, error, data) {
  this.completeEntry_(entry);

  var succeeded =
      !error && data && entry.chunk &&
      this.chunkSerializer_.deserialize(entry.chunk, data);
  if (succeeded) {
    entry.deferred.callback(null);
  } else {
    entry.deferred.errback(error);
  }
};


/**
 * Sets chunk data, adding if required.
 * @param {!blk.env.Chunk} chunk Chunk to write.
 * @return {!goog.async.Deferred} A deferred fulfilled when the chunk has been
 *     updated.
 */
blk.io.MapStore.prototype.writeChunk = function(chunk) {
  var deferred = new goog.async.Deferred();
  var entry = new blk.io.MapStore.QueueEntry(
      deferred,
      blk.io.MapStore.QueueAction.WRITE_CHUNK,
      chunk.x, chunk.y, chunk.z);
  entry.version = chunk.version;
  // Snapshot the data right now in case it changes later
  entry.data = this.chunkSerializer_.serialize(chunk);
  if (entry.data) {
    this.queueEntry_(entry);
  } else {
    deferred.errback(null);
  }
  return deferred;
};


/**
 * Finishes a WRITE_CHUNK request.
 * @protected
 * @param {!blk.io.MapStore.QueueEntry} entry Queue entry.
 * @param {Object} error Error, if any.
 */
blk.io.MapStore.prototype.finishWriteChunk = function(entry, error) {
  this.completeEntry_(entry);

  if (!error) {
    entry.deferred.callback(null);
  } else {
    entry.deferred.errback(error);
  }
};


/**
 * Removes a chunk from the map store.
 * @param {number} x Chunk world X.
 * @param {number} y Chunk world Y.
 * @param {number} z Chunk world Z.
 * @return {!goog.async.Deferred} A deferred fulfilled when the chunk has been
 *     removed.
 */
blk.io.MapStore.prototype.removeChunk = function(x, y, z) {
  var deferred = new goog.async.Deferred();
  this.queueEntry_(new blk.io.MapStore.QueueEntry(deferred,
      blk.io.MapStore.QueueAction.REMOVE_CHUNK, x, y, z));
  return deferred;
};


/**
 * Finishes a REMOVE_CHUNK request.
 * @protected
 * @param {!blk.io.MapStore.QueueEntry} entry Queue entry.
 * @param {Object} error Error, if any.
 */
blk.io.MapStore.prototype.finishRemoveChunk = function(entry, error) {
  this.completeEntry_(entry);

  if (!error) {
    entry.deferred.callback(null);
  } else {
    entry.deferred.errback(error);
  }
};


/**
 * Queues an entry in the list.
 * @private
 * @param {!blk.io.MapStore.QueueEntry} entry New entry.
 */
blk.io.MapStore.prototype.queueEntry_ = function(entry) {
  this.queue_.push(entry);

  // Pump the queue
  if (!this.paused_) {
    this.pump_();
  }
};


/**
 * Pumps the queue.
 * @private
 */
blk.io.MapStore.prototype.pump_ = function() {
  // Don't remove items so that we keep blocking against them
  // They will be removed on completion
  if (!this.inProgress_ && this.queue_.length) {
    if (this.needsSort_) {
      this.needsSort_ = false;

      // TODO(benvanik): make this a million times more efficient
      // Sort the head of the queue up until the first unprioritized entry
      var sortEnd = this.queue_.length - 1;
      for (var n = 0; n < this.queue_.length; n++) {
        if (this.queue_[n].priority == Number.MAX_VALUE) {
          sortEnd = n - 1;
          break;
        }
      }
      if (sortEnd) {
        // Sort by priority
        if (sortEnd == this.queue_.length - 1) {
          // Sorting entire array
          goog.array.sort(this.queue_,
              blk.io.MapStore.QueueEntry.comparePriority);
        } else {
          // Sorting subregion
          // TODO(benvanik): find a nice way to do a sub-region sort
          var region = this.queue_.slice(0, sortEnd);
          goog.array.sort(region, blk.io.MapStore.QueueEntry.comparePriority);
          for (var n = 0; n < region.length; n++) {
            this.queue_[n] = region[n];
          }
        }
      }
    }

    var nextEntry = this.queue_[0];
    this.inProgress_++;
    this.processEntry(nextEntry);
  }
};


/**
 * Processes a single queue entry.
 * @protected
 * @param {!blk.io.MapStore.QueueEntry} entry Queue entry to process.
 */
blk.io.MapStore.prototype.processEntry = goog.abstractMethod;


/**
 * Completes the processing of an entry.
 * @private
 * @param {!blk.io.MapStore.QueueEntry} entry Queue entry to process.
 */
blk.io.MapStore.prototype.completeEntry_ = function(entry) {
  goog.asserts.assert(this.inProgress_ > 0);
  this.inProgress_--;
  goog.array.remove(this.queue_, entry);

  // Pump the queue
  if (!this.paused_) {
    this.pump_();
  }
};


/**
 * Queue action type.
 * @protected
 * @enum {number}
 */
blk.io.MapStore.QueueAction = {
  READ_INFO: 0,
  WRITE_INFO: 1,
  READ_CHUNK: 2,
  WRITE_CHUNK: 3,
  REMOVE_CHUNK: 4

  // TODO(benvanik): entity lists/etc
};



/**
 * An entry in the map store write queue.
 * @protected
 * @constructor
 * @param {!goog.async.Deferred} deferred Deferred to receive callback.
 * @param {blk.io.MapStore.QueueAction} action Action to perform.
 * @param {number} x Chunk world X.
 * @param {number} y Chunk world Y.
 * @param {number} z Chunk world Z.
 */
blk.io.MapStore.QueueEntry = function(
    deferred, action, x, y, z) {
  /**
   * @type {!goog.async.Deferred}
   */
  this.deferred = deferred;

  /**
   * @type {blk.io.MapStore.QueueAction}
   */
  this.action = action;

  /**
   * @type {number}
   */
  this.x = x;

  /**
   * @type {number}
   */
  this.y = y;

  /**
   * @type {number}
   */
  this.z = z;

  /**
   * Chunk to read into, if a read.
   * @type {blk.env.Chunk}
   */
  this.chunk = null;

  /**
   * Priority, with lower values being higher priority.
   * @type {number}
   */
  this.priority = Number.MAX_VALUE;

  /**
   * Version, if a write.
   * @type {number}
   */
  this.version = 0;

  /**
   * Map/chunk data, if a write.
   * @type {ArrayBuffer}
   */
  this.data = null;
};


/**
 * Comparision function for sorts.
 * Should only be used on entries that have a valid priority (not MAX_VALUE).
 * @param {!blk.io.MapStore.QueueEntry} a First entry.
 * @param {!blk.io.MapStore.QueueEntry} b Second entry.
 * @return {number} Comparision result.
 */
blk.io.MapStore.QueueEntry.comparePriority = function(a, b) {
  return a.priority - b.priority;
};
