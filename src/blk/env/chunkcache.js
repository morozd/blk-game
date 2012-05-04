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

goog.provide('blk.env.ChunkCache');

goog.require('blk.env.Chunk');
goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.asserts');



/**
 * Map chunk cache.
 *
 * TODO(benvanik): make an LRU with some memory min/max
 *
 * @constructor
 * @extends {goog.Disposable}
 */
blk.env.ChunkCache = function() {
  goog.base(this);

  /**
   * All chunks currently loaded, mapped by x | z (16 bits each).
   * @private
   * @type {!Object.<number, !blk.env.Chunk>}
   */
  this.chunks_ = {};

  /**
   * A list of unused chunks that can be dropped.
   * TODO(benvanik): may a priority queue, with time last used as key.
   * @private
   * @type {!Array.<!blk.env.Chunk>}
   */
  this.unusedChunks_ = [];

  /**
   * Total number of chunks in the cache (both used and unused).
   * @private
   * @type {number}
   */
  this.totalCount_ = 0;

  /**
   * Estimated total size of the cache GL buffers, in bytes.
   * @private
   * @type {number}
   */
  this.totalSize_ = 0;
};
goog.inherits(blk.env.ChunkCache, goog.Disposable);


/**
 * @override
 */
blk.env.ChunkCache.prototype.disposeInternal = function() {
  // Flush all unused chunks
  this.unusedChunks_.length = 0;

  goog.base(this, 'disposeInternal');
};


/**
 * Process the unused chunk list and remove any chunks no longer needed.
 * @param {!gf.UpdateFrame} frame Current update frame.
 */
blk.env.ChunkCache.prototype.update = function(frame) {
  // TODO(benvanik): LRU/expel chunks/etc
  // Right now chunks are dropped ASAP
  while (this.unusedChunks_.length) {
    var chunk = this.unusedChunks_.shift();
    this.remove_(chunk);
  }
};


/**
 * Gets the number of chunks alive in the cache (used and unused).
 * @return {number} Chunk count.
 */
blk.env.ChunkCache.prototype.getTotalCount = function() {
  return this.totalCount_;
};


/**
 * Gets the number of used chunks in the cache.
 * @return {number} Chunk count.
 */
blk.env.ChunkCache.prototype.getUsedCount = function() {
  return this.totalCount_ - this.unusedChunks_.length;
};


/**
 * Gets an estimate of the total size of the cache, in bytes.
 * @return {number} Size of the chunks in memory, in bytes.
 */
blk.env.ChunkCache.prototype.getSize = function() {
  return this.totalSize_;
};


/**
 * Gets a chunk from the cache, if it is present.
 * @param {number} x Chunk X, in world coordinates.
 * @param {number} y Chunk Y, in world coordinates.
 * @param {number} z Chunk Z, in world coordinates.
 * @return {blk.env.Chunk} Chunk with the given chunk coordinates, if found.
 */
blk.env.ChunkCache.prototype.get = function(x, y, z) {
  if (y >> blk.env.Chunk.SHIFT_Y != 0) {
    return null;
  }
  var cx = x >> blk.env.Chunk.SHIFT_XZ;
  var cz = z >> blk.env.Chunk.SHIFT_XZ;

  // NOTE: y currently ignored

  var key = ((cx & 0xFFFF) << 16) | (cz & 0xFFFF);
  return this.chunks_[key] || null;
};


/**
 * Adds the given chunk to the cache.
 * @param {!blk.env.Chunk} chunk Chunk.
 */
blk.env.ChunkCache.prototype.add = function(chunk) {
  goog.asserts.assert(chunk.y == 0);
  var cx = chunk.x >> blk.env.Chunk.SHIFT_XZ;
  var cz = chunk.z >> blk.env.Chunk.SHIFT_XZ;
  var key = ((cx & 0xFFFF) << 16) | (cz & 0xFFFF);
  goog.asserts.assert(!this.chunks_[key]);
  this.chunks_[key] = chunk;
  if (!chunk.hasReferences()) {
    this.unusedChunks_.push(chunk);
  }
  this.totalCount_++;
  this.totalSize_ += blk.env.Chunk.ESTIMATED_SIZE;
};


/**
 * Removes the given chunk from the cache.
 * @param {!blk.env.Chunk} chunk Chunk.
 */
blk.env.ChunkCache.prototype.remove = function(chunk) {
  this.remove_(chunk);
  if (!chunk.hasReferences()) {
    goog.array.remove(this.unusedChunks_, chunk);
  }
};


/**
 * Removes the given chunk from the cache.
 * @private
 * @param {!blk.env.Chunk} chunk Chunk.
 */
blk.env.ChunkCache.prototype.remove_ = function(chunk) {
  var cx = chunk.x >> blk.env.Chunk.SHIFT_XZ;
  var cz = chunk.z >> blk.env.Chunk.SHIFT_XZ;
  var key = ((cx & 0xFFFF) << 16) | (cz & 0xFFFF);
  delete this.chunks_[key];
  this.totalSize_ -= blk.env.Chunk.ESTIMATED_SIZE;
  this.totalCount_--;
};


/**
 * Adds a chunk to the unused list.
 * This must only be called when the chunk is newly unused.
 * @param {!blk.env.Chunk} chunk Newly unused chunk.
 */
blk.env.ChunkCache.prototype.markChunkUnused = function(chunk) {
  this.unusedChunks_.push(chunk);
};


/**
 * Removes a chunk from the unused list.
 * This must only be called when the chunk is newly used.
 * @param {!blk.env.Chunk} chunk Newly used chunk.
 */
blk.env.ChunkCache.prototype.markChunkUsed = function(chunk) {
  goog.array.remove(this.unusedChunks_, chunk);
};
