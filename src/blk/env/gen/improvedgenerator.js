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

goog.provide('blk.env.gen.ImprovedGenerator');

goog.require('blk.env.Chunk');
goog.require('blk.env.blocks.BlockID');
goog.require('blk.env.gen.Generator');
goog.require('gf.math.Random');
goog.require('gf.math.SimplexNoise');



/**
 * Generator that builds a somewhat cooler fractal terrain.
 *
 * @constructor
 * @extends {blk.env.gen.Generator}
 * @param {!blk.env.MapParameters} mapParams Map parameters.
 * @param {!blk.env.BlockSet} blockSet Block set.
 */
blk.env.gen.ImprovedGenerator = function(mapParams, blockSet) {
  goog.base(this, mapParams, blockSet);

  var random = new gf.math.Random(mapParams.seed);

  /**
   * Perlin simplex noise factory.
   * @private
   * @type {!gf.math.SimplexNoise}
   */
  this.noise_ = new gf.math.SimplexNoise(random);
};
goog.inherits(blk.env.gen.ImprovedGenerator, blk.env.gen.Generator);


/**
 * Y coordinate to place the plane at.
 * @private
 * @const
 * @type {number}
 */
blk.env.gen.ImprovedGenerator.PLANE_Y_ = 64;


/**
 * @override
 */
blk.env.gen.ImprovedGenerator.prototype.fillChunk =
    function(random, chunkX, chunkY, chunkZ, chunkBuilder) {
  var noise = this.noise_;

  var scalar = blk.env.Chunk.SIZE_Y / 5;
  var dirtBlock = blk.env.blocks.BlockID.DIRT << 8;
  var grassBlock = (blk.env.blocks.BlockID.DIRT << 8) | 1;

  for (var ix = 0; ix < blk.env.Chunk.SIZE_XZ; ix++) {
    var bx = chunkX + ix;
    for (var iz = 0; iz < blk.env.Chunk.SIZE_XZ; iz++) {
      var bz = chunkZ + iz;

      var n = noise.sample(bx * 0.001, bz * 0.001) * 0.5;
      n += noise.sample((bx + 100) * 0.002, bz * 0.002) * 0.25;
      n += noise.sample((bx + 100) * 0.01, bz * 0.01) * 0.25;
      var top = (n * scalar + blk.env.gen.ImprovedGenerator.PLANE_Y_) | 0;
      if (top < 1) {
        top = 1;
      }

      chunkBuilder.setBlock(ix, top, iz, grassBlock);
      chunkBuilder.setBlockColumn(ix, 0, top - 1, iz, dirtBlock);
    }
  }
};
