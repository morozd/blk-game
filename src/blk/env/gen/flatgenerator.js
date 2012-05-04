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

goog.provide('blk.env.gen.FlatGenerator');

goog.require('blk.env.Chunk');
goog.require('blk.env.blocks.BlockID');
goog.require('blk.env.gen.Generator');



/**
 * Generator that builds a flat XZ ground plane.
 *
 * @constructor
 * @extends {blk.env.gen.Generator}
 * @param {!blk.env.MapParameters} mapParams Map parameters.
 * @param {!blk.env.BlockSet} blockSet Block set.
 */
blk.env.gen.FlatGenerator = function(mapParams, blockSet) {
  goog.base(this, mapParams, blockSet);
};
goog.inherits(blk.env.gen.FlatGenerator, blk.env.gen.Generator);


/**
 * Y coordinate to place the plane at.
 * @private
 * @const
 * @type {number}
 */
blk.env.gen.FlatGenerator.PLANE_Y_ = 0;


/**
 * @override
 */
blk.env.gen.FlatGenerator.prototype.fillChunk = function(random,
    chunkX, chunkY, chunkZ, chunkBuilder) {
  var py = blk.env.gen.FlatGenerator.PLANE_Y_;
  var y = chunkY;
  if (!(y <= py && y >= py)) {
    return;
  }

  // Fill XZ plane
  var minx = chunkX;
  var maxx = chunkX + blk.env.Chunk.SIZE_XZ;
  var minz = chunkZ;
  var maxz = chunkZ + blk.env.Chunk.SIZE_XZ;
  for (var ix = minx; ix < maxx; ix++) {
    for (var iz = minz; iz < maxz; iz++) {
      var blockData = blk.env.blocks.BlockID.DIRT << 8;
      chunkBuilder.setBlock(ix, py, iz, blockData);
    }
  }
};
