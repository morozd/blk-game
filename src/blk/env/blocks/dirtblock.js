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

goog.provide('blk.env.blocks.DirtBlock');

goog.require('blk.env.BlockFlags');
goog.require('blk.env.Face');
goog.require('blk.env.blocks.BlockID');
goog.require('blk.env.blocks.SolidBlock');
goog.require('blk.env.materials');



/**
 * Dirt block.
 *
 * @constructor
 * @extends {blk.env.blocks.SolidBlock}
 */
blk.env.blocks.DirtBlock = function() {
  goog.base(this,
      blk.env.blocks.BlockID.DIRT,
      'Dirt',
      blk.env.materials.ground,
      blk.env.BlockFlags.BREAKABLE | blk.env.BlockFlags.COLLIDABLE,
      blk.env.blocks.DirtBlock.DIRT_BOTTOM_);
};
goog.inherits(blk.env.blocks.DirtBlock, blk.env.blocks.SolidBlock);


/**
 * @private
 * @const
 * @type {number}
 */
blk.env.blocks.DirtBlock.GRASS_TOP_ = 0;//98;


/**
 * @private
 * @const
 * @type {number}
 */
blk.env.blocks.DirtBlock.DIRT_BOTTOM_ = 2;//160;


/**
 * @private
 * @const
 * @type {number}
 */
blk.env.blocks.DirtBlock.MIX_SIDE_ = 3;//114;


/**
 * @override
 */
blk.env.blocks.DirtBlock.prototype.getFaceSlot =
    function(x, y, z, face, light, attrs) {
  var hasGrass = !!(attrs & 0x1);
  if (hasGrass) {
    switch (face) {
      case blk.env.Face.POS_Z:
      case blk.env.Face.NEG_Z:
      case blk.env.Face.POS_X:
      case blk.env.Face.NEG_X:
        return blk.env.blocks.DirtBlock.MIX_SIDE_;
      case blk.env.Face.POS_Y:
        return blk.env.blocks.DirtBlock.GRASS_TOP_;
      default:
      case blk.env.Face.NEG_Y:
        return blk.env.blocks.DirtBlock.DIRT_BOTTOM_;
    }
  } else {
    return blk.env.blocks.DirtBlock.DIRT_BOTTOM_;
  }
};
