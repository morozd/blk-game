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

goog.provide('blk.env.blocks.WoodBlock');

goog.require('blk.env.BlockFlags');
goog.require('blk.env.blocks.BlockID');
goog.require('blk.env.blocks.SolidBlock');
goog.require('blk.env.materials');



/**
 * Wood block.
 *
 * @constructor
 * @extends {blk.env.blocks.SolidBlock}
 */
blk.env.blocks.WoodBlock = function() {
  goog.base(this,
      blk.env.blocks.BlockID.WOOD,
      'Wood',
      blk.env.materials.wood,
      blk.env.BlockFlags.BREAKABLE | blk.env.BlockFlags.COLLIDABLE,
      4);
};
goog.inherits(blk.env.blocks.WoodBlock, blk.env.blocks.SolidBlock);
