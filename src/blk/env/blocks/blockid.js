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

goog.provide('blk.env.blocks.BlockID');


/**
 * List of static block IDs.
 * @enum {number}
 */
blk.env.blocks.BlockID = {
  /** Air - not technically a real block. */
  AIR: 0,

  /** blk.env.blocks.DirtBlock  */
  DIRT: 1,

  /** blk.env.blocks.StoneBlock */
  STONE: 2,

  /** blk.env.blocks.BrickBlock */
  BRICK: 3,

  /** blk.env.blocks.WoodBlock */
  WOOD: 4,

  /** blk.env.blocks.GlassBlock */
  GLASS: 5
};
