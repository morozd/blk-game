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

/**
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('blk.sim.EntityType');


/**
 * Entity type table.
 * Entities need only have unique IDs in a single module; in this case, BLK.
 * @enum {number}
 */
blk.sim.EntityType = {
  /** {@see blk.sim.Root} */
  ROOT: 0,
  /** {@see blk.sim.World} */
  WORLD: 1,
  /** {@see blk.sim.Camera} */
  CAMERA: 2,
  /** {@see blk.sim.Player} */
  PLAYER: 3,
  /** {@see blk.sim.controllers.FpsController} */
  FPS_CONTROLLER: 4,
  /** {@see blk.sim.Actor} */
  ACTOR: 5,
  /** {@see blk.sim.Inventory} */
  INVENTORY: 6,
  /** {@see blk.sim.tools.PickaxeTool} */
  PICKAXE_TOOL: 7,
  /** {@see blk.sim.tools.BlockTool} */
  BLOCK_TOOL: 8
};
