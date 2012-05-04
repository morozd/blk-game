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

goog.provide('blk.env.gen.ChunkBuilder');

goog.require('blk.env.Chunk');



/**
 * Chunk manipulation utility used by generators to quickly produce chunk data.
 * This provides additional functionality for generation-related activities and
 * is higher performance. By living outside of the normal object model it is
 * possible to use this on a worker thread where normal chunks do not exist.
 *
 * TODO(benvanik): utilities for drawing/filling regions/shapes/etc
 *
 * @constructor
 */
blk.env.gen.ChunkBuilder = function() {
  /**
   * Block data.
   * A tightly packed 3 dimensional array of uniform size.
   * Layout is x, z, y, which means it's faster to traverse xz
   *
   * Each block is of the format:
   * - byte: index into block set (0 is air)
   * - byte: block attributes (blk.env.BlockAttr)
   *
   * @type {!Uint16Array}
   */
  this.blockData = new Uint16Array(blk.env.Chunk.TOTAL_BLOCKS);

  /**
   * Zeros for fast clear.
   * @private
   * @type {!Uint16Array}
   */
  this.zeros_ = new Uint16Array(blk.env.Chunk.TOTAL_BLOCKS);
};


/**
 * Begins a build operation.
 */
blk.env.gen.ChunkBuilder.prototype.begin = function() {
  // Clear
  this.blockData.set(this.zeros_);
};


/**
 * Completes the current build operation.
 * @return {!Uint16Array} A reference to the builder block data. Do not modify.
 */
blk.env.gen.ChunkBuilder.prototype.end = function() {
  return this.blockData;
};


/**
 * Gets the full 2-byte block data value for the given world coordinates.
 * @param {number} x Block X, in world coordinates.
 * @param {number} y Block Y, in world coordinates.
 * @param {number} z Block Z, in world coordinates.
 * @return {number} Raw 2-byte block data.
 */
blk.env.gen.ChunkBuilder.prototype.getBlock = function(x, y, z) {
  var bx = x & blk.env.Chunk.MASK_XZ;
  var by = y & blk.env.Chunk.MASK_Y;
  var bz = z & blk.env.Chunk.MASK_XZ;
  var bo = bx + bz * blk.env.Chunk.STRIDE_Z + by * blk.env.Chunk.STRIDE_Y;
  return this.blockData[bo];
};


/**
 * Sets the full 2-byte block data value for the given world coordinates.
 * @param {number} x Block X, in world coordinates.
 * @param {number} y Block Y, in world coordinates.
 * @param {number} z Block Z, in world coordinates.
 * @param {number} value Raw 2-byte block data.
 */
blk.env.gen.ChunkBuilder.prototype.setBlock = function(x, y, z, value) {
  var bx = x & blk.env.Chunk.MASK_XZ;
  var by = y & blk.env.Chunk.MASK_Y;
  var bz = z & blk.env.Chunk.MASK_XZ;
  var bo = bx + bz * blk.env.Chunk.STRIDE_Z + by * blk.env.Chunk.STRIDE_Y;
  this.blockData[bo] = value;
};
