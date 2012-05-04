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

goog.provide('blk.env.client.SegmentCache');

goog.require('goog.Disposable');
goog.require('goog.array');



/**
 * Render chunk cache.
 *
 * @constructor
 * @extends {goog.Disposable}
 */
blk.env.client.SegmentCache = function() {
  goog.base(this);

  /**
   * A list of all chunk segment renderers in the cache.
   * @type {!Array.<!blk.env.client.SegmentRenderer>}
   */
  this.list = [];

  /**
   * Estimated total size of the cache GL buffers, in bytes.
   * @private
   * @type {number}
   */
  this.totalSize_ = 0;
};
goog.inherits(blk.env.client.SegmentCache, goog.Disposable);


/**
 * Gets the number of chunk renderers alive in the cache.
 * @return {number} Chunk renderer count.
 */
blk.env.client.SegmentCache.prototype.getCount = function() {
  return this.list.length;
};


/**
 * Gets an estimate of the total size of the cache, in bytes.
 * @return {number} Size of the buffers on the GPU, in bytes.
 */
blk.env.client.SegmentCache.prototype.getSize = function() {
  return this.totalSize_;
};


/**
 * Resets the size estimate.
 */
blk.env.client.SegmentCache.prototype.resetSize = function() {
  this.totalSize_ = 0;
};


/**
 * Adjusts the cache size tracking by the given delta.
 * @param {number} delta Delta size bytes.
 */
blk.env.client.SegmentCache.prototype.adjustSize = function(delta) {
  this.totalSize_ += delta;
};


/**
 * Adds the given chunk renderer to the cache.
 * @param {!blk.env.client.SegmentRenderer} segmentRenderer Chunk renderer.
 */
blk.env.client.SegmentCache.prototype.add = function(segmentRenderer) {
  this.list.push(segmentRenderer);
  this.totalSize_ += segmentRenderer.estimatedSize;
};


/**
 * Removes the given chunk renderer from the cache.
 * @param {!blk.env.client.SegmentRenderer} segmentRenderer Chunk renderer.
 */
blk.env.client.SegmentCache.prototype.remove = function(segmentRenderer) {
  goog.array.remove(this.list, segmentRenderer);
  this.totalSize_ -= segmentRenderer.estimatedSize;
};
