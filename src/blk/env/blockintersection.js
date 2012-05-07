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

goog.provide('blk.env.BlockIntersection');

goog.require('goog.asserts');



/**
 * The results of an intersection with a block.
 *
 * @constructor
 * @param {!blk.env.Chunk} chunk Chunk.
 * @param {number} blockX Block X.
 * @param {number} blockY Block Y.
 * @param {number} blockZ Block Z.
 * @param {number} blockData Block data.
 * @param {number} distance Distance from ray origin to block.
 * @param {!goog.vec.Vec3.Float32} point Point on block ray intersected.
 *     Not cloned.
 */
blk.env.BlockIntersection = function(
    chunk, blockX, blockY, blockZ, blockData, distance, point) {
  /**
   * Chunk that the block is contained in.
   * @type {!blk.env.Chunk}
   */
  this.chunk = chunk;

  /**
   * Block X, in world units.
   * @type {number}
   */
  this.blockX = blockX;

  /**
   * Block Y, in world units.
   * @type {number}
   */
  this.blockY = blockY;

  /**
   * Block Z, in world units.
   * @type {number}
   */
  this.blockZ = blockZ;

  /**
   * Block data.
   * @type {number}
   */
  this.blockData = blockData;

  /**
   * Distance from the ray origin to the block, in world units.
   * @type {number}
   */
  this.distance = distance;

  goog.asserts.assert(point);

  /**
   * Point, in world space, the ray intersected the block.
   * @type {!goog.vec.Vec3.Float32}
   */
  this.point = point;
};
