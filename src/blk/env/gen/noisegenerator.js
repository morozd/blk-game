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

goog.provide('blk.env.gen.NoiseGenerator');

goog.require('blk.env.Chunk');
goog.require('blk.env.blocks.BlockID');
goog.require('blk.env.gen.Generator');
goog.require('gf.math.PerlinNoise');
goog.require('gf.math.Random');



/**
 * Generator that builds a simple noise modulated XZ ground plane.
 *
 * @constructor
 * @extends {blk.env.gen.Generator}
 * @param {!blk.env.MapParameters} mapParams Map parameters.
 * @param {!blk.env.BlockSet} blockSet Block set.
 */
blk.env.gen.NoiseGenerator = function(mapParams, blockSet) {
  goog.base(this, mapParams, blockSet);

  var random = new gf.math.Random(mapParams.seed);

  /**
   * Perlin noise factory.
   * @private
   * @type {!gf.math.PerlinNoise}
   */
  this.noise_ = new gf.math.PerlinNoise(random, 15);
};
goog.inherits(blk.env.gen.NoiseGenerator, blk.env.gen.Generator);


/**
 * Y coordinate to place the plane at.
 * @private
 * @const
 * @type {number}
 */
blk.env.gen.NoiseGenerator.PLANE_Y_ = 64;


/**
 * @override
 */
blk.env.gen.NoiseGenerator.prototype.fillChunk =
    function(random, chunkX, chunkY, chunkZ, chunkBuilder) {
  var noise = this.noise_;

  var py = blk.env.gen.NoiseGenerator.PLANE_Y_;
  var minx = chunkX;
  var maxx = chunkX + blk.env.Chunk.SIZE_XZ;
  var minz = chunkZ;
  var maxz = chunkZ + blk.env.Chunk.SIZE_XZ;
  var dirtBlock = blk.env.blocks.BlockID.DIRT << 8;

  for (var ix = minx; ix < maxx; ix++) {
    for (var iz = minz; iz < maxz; iz++) {
      var v = noise.sampleTileable(ix + 1000, iz + 1000,
          blk.env.Chunk.SIZE_XZ);
      var ty = Math.max(0, Math.min(15, (v / 1000) | 0));
      for (var iy = 0; iy <= py + ty; iy++) {
        var blockData = dirtBlock;
        if (iy >= py + ty) {
          // Add grass
          blockData |= 1;
        }
        chunkBuilder.setBlock(ix, iy, iz, blockData);
      }
    }
  }
};
