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

goog.provide('blk.env.blocks.RedClothBlock');
goog.provide('blk.env.blocks.GreenClothBlock');
goog.provide('blk.env.blocks.YellowClothBlock');
goog.provide('blk.env.blocks.BlueClothBlock');

goog.require('blk.env.BlockFlags');
goog.require('blk.env.blocks.BlockID');
goog.require('blk.env.blocks.SolidBlock');
goog.require('blk.env.materials');



/**
 * Cloth block.
 *
 * @constructor
 * @extends {blk.env.blocks.SolidBlock}
 */
blk.env.blocks.RedClothBlock = function() {
  goog.base(this,
      blk.env.blocks.BlockID.RED_CLOTH,
      'Red Cloth',
      blk.env.materials.cloth,
      blk.env.BlockFlags.BREAKABLE | blk.env.BlockFlags.COLLIDABLE,
      129);
};
goog.inherits(blk.env.blocks.RedClothBlock, blk.env.blocks.SolidBlock);



/**
 * Cloth block.
 *
 * @constructor
 * @extends {blk.env.blocks.SolidBlock}
 */
blk.env.blocks.GreenClothBlock = function() {
  goog.base(this,
      blk.env.blocks.BlockID.GREEN_CLOTH,
      'Green Cloth',
      blk.env.materials.cloth,
      blk.env.BlockFlags.BREAKABLE | blk.env.BlockFlags.COLLIDABLE,
      145);
};
goog.inherits(blk.env.blocks.GreenClothBlock, blk.env.blocks.SolidBlock);



/**
 * Cloth block.
 *
 * @constructor
 * @extends {blk.env.blocks.SolidBlock}
 */
blk.env.blocks.YellowClothBlock = function() {
  goog.base(this,
      blk.env.blocks.BlockID.YELLOW_CLOTH,
      'Yellow Cloth',
      blk.env.materials.cloth,
      blk.env.BlockFlags.BREAKABLE | blk.env.BlockFlags.COLLIDABLE,
      162);
};
goog.inherits(blk.env.blocks.YellowClothBlock, blk.env.blocks.SolidBlock);



/**
 * Cloth block.
 *
 * @constructor
 * @extends {blk.env.blocks.SolidBlock}
 */
blk.env.blocks.BlueClothBlock = function() {
  goog.base(this,
      blk.env.blocks.BlockID.BLUE_CLOTH,
      'Blue Cloth',
      blk.env.materials.cloth,
      blk.env.BlockFlags.BREAKABLE | blk.env.BlockFlags.COLLIDABLE,
      177);
};
goog.inherits(blk.env.blocks.BlueClothBlock, blk.env.blocks.SolidBlock);
