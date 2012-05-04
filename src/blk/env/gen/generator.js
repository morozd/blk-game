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

goog.provide('blk.env.gen.Generator');



/**
 * Base type for map chunk generators.
 *
 * @constructor
 * @param {!blk.env.MapParameters} mapParams Map parameters.
 * @param {!blk.env.BlockSet} blockSet Block set.
 */
blk.env.gen.Generator = function(mapParams, blockSet) {
  /**
   * Map creation parameters.
   * @type {!blk.env.MapParameters}
   */
  this.mapParams = mapParams;

  /**
   * Block set.
   * @type {!blk.env.BlockSet}
   */
  this.blockSet = blockSet;
};


/**
 * Fills a chunk with content.
 * This method should only act on the chunk given and inspect no other chunks.
 * Coarse details, such as terrain/etc should be filled in. Finer details, such
 * as associated entities/etc or changes that require adjacent chunk information
 * should wait until the population phase.
 *
 * @param {!gf.math.Random} random Random number generator.
 * @param {number} chunkX Chunk X, in world coordinates.
 * @param {number} chunkY Chunk Y, in world coordinates.
 * @param {number} chunkZ Chunk Z, in world coordinates.
 * @param {!blk.env.gen.ChunkBuilder} chunkBuilder Chunk to fill.
 */
blk.env.gen.Generator.prototype.fillChunk = goog.nullFunction;


/**
 * Populates an already-filled chunk with content.
 * Adjacent chunks in all 4 directions will already exist and can be queried
 * through the view.
 *
 * @param {!gf.math.Random} random Random number generator.
 * @param {!blk.env.ChunkView} view Chunk view containing the given chunk.
 * @param {!blk.env.Chunk} chunk Chunk to fill.
 */
blk.env.gen.Generator.prototype.populateChunk = goog.nullFunction;
