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

goog.provide('blk.env.server.ServerMap');

goog.require('blk.env.Map');
goog.require('blk.env.gen');
goog.require('blk.env.server.ChunkProvider');
goog.require('blk.env.server.ChunkScheduler');
goog.require('goog.async.DeferredList');



/**
 * Server-specific map implementation.
 *
 * @constructor
 * @extends {blk.env.Map}
 * @param {!blk.env.MapParameters} mapParams Map parameters.
 * @param {!blk.io.MapStore} mapStore Map storage provider, ownership
 *     transferred.
 */
blk.env.server.ServerMap = function(mapParams, mapStore) {
  goog.base(this);

  // Create a generator
  var generator = blk.env.gen.createGenerator(mapParams, this.blockSet);

  /**
   * Map creation parameters.
   * @type {!blk.env.MapParameters}
   */
  this.mapParams = mapParams;

  /**
   * Map storage provider.
   * @private
   * @type {!blk.io.MapStore}
   */
  this.mapStore_ = mapStore;
  this.registerDisposable(this.mapStore_);

  /**
   * Update scheduler.
   * @private
   * @type {!blk.env.server.ChunkScheduler}
   */
  this.scheduler_ = new blk.env.server.ChunkScheduler();
  this.registerDisposable(this.scheduler_);

  /**
   * Chunk provider.
   * @private
   * @type {!blk.env.server.ChunkProvider}
   */
  this.chunkProvider_ = new blk.env.server.ChunkProvider(
      this, generator, mapStore);
  this.registerDisposable(this.chunkProvider_);

  /**
   * A list of dirty chunks waiting to be written.
   * @private
   * @type {!Array.<!blk.env.Chunk>}
   */
  this.dirtyChunks_ = [];
};
goog.inherits(blk.env.server.ServerMap, blk.env.Map);


/**
 * @override
 */
blk.env.server.ServerMap.prototype.update = function(frame) {
  goog.base(this, 'update', frame);

  // Run any scheduler logic
  this.scheduler_.update(frame);

  // Issue pending loads/generates/etc
  this.chunkProvider_.update(frame);

  // Process dirty list
  this.processDirtyChunks_(frame);

  // Tick the map store.
  this.mapStore_.update(frame);
};


/**
 * Process the dirty chunk list to write out chunks.
 * @private
 * @param {!gf.UpdateFrame} frame Current update frame.
 */
blk.env.server.ServerMap.prototype.processDirtyChunks_ = function(frame) {
  // TODO(benvanik): write at a sliding interval/etc
  // for (var n = 0; n < this.dirtyChunks_.length; n++) {
  //   var chunk = this.dirtyChunks_[n];
  //   // TODO(benvanik): save
  //   chunk.removeReference();
  // }
  // this.dirtyChunks_.length = 0;
  this.flush();
};


/**
 * @override
 */
blk.env.server.ServerMap.prototype.addDirtyChunk = function(chunk) {
  this.dirtyChunks_.push(chunk);

  // Keep a reference while in the dirty list so that we don't drop dirty chunks
  chunk.addReference();
};


/**
 * Flushes all dirty chunks to disk and returns a deferred signalling
 * completion.
 * @return {!goog.async.Deferred} A deferred fulfilled when all chunks have been
 *     written.
 */
blk.env.server.ServerMap.prototype.flush = function() {
  var deferreds = [];

  // Write each dirty chunk
  for (var n = 0; n < this.dirtyChunks_.length; n++) {
    var chunk = this.dirtyChunks_[n];

    // Serialize chunk and mark clean
    deferreds.push(this.mapStore_.writeChunk(chunk));
    chunk.clearDirty();

    // Remove reference - no longer needed
    chunk.removeReference();
  }
  this.dirtyChunks_.length = 0;

  return new goog.async.DeferredList(deferreds);
};


/**
 * @override
 */
blk.env.server.ServerMap.prototype.requestChunk = function(chunk) {
  // Compute the priority of the chunk request based on the minimum distance to
  // all active views
  // This could be made much faster, but hopefully it is infrequent enough
  // that it doesn't matter (only when there is a chunk cache miss)
  var priority = Number.MAX_VALUE;
  for (var n = 0; n < this.activeViews.length; n++) {
    var view = this.activeViews[n];
    var x = chunk.x - view.center[0];
    var z = chunk.z - view.center[2];
    var distanceSq = x * x + z * z;
    if (distanceSq < priority) {
      priority = distanceSq;
    }
  }
  if (priority == Number.MAX_VALUE) {
    priority = undefined;
  }

  this.chunkProvider_.requestChunk(chunk, priority);
};
