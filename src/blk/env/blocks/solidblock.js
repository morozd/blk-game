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

goog.provide('blk.env.blocks.SolidBlock');

goog.require('blk.env.Block');



/**
 * A solid block.
 *
 * @constructor
 * @extends {blk.env.Block}
 * @param {number} id Static block ID.
 * @param {string} name Human-friendly name.
 * @param {!blk.env.Material} material Material.
 * @param {number} flags Bitmask of flags from {@see blk.env.BlockFlags}.
 * @param {number} atlasSlot Texture atlas slot index.
 */
blk.env.blocks.SolidBlock = function(id, name, material, flags, atlasSlot) {
  goog.base(this, id, name, material, flags, atlasSlot);
};
goog.inherits(blk.env.blocks.SolidBlock, blk.env.Block);
