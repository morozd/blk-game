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

goog.provide('blk.sim.entities');

goog.require('blk.sim.controllers.PlayerEntity');
goog.require('blk.sim.entities.MapEntity');
goog.require('blk.sim.tools.PickaxeEntity');
goog.require('gf.sim.EntityFactory');


/**
 * Registers all BLK entities with a simulator.
 * @param {!gf.sim.Simulator} simulator Simulator.
 */
blk.sim.entities.registerEntities = function(simulator) {
  // MAP
  simulator.registerEntityFactory(new gf.sim.EntityFactory(
      blk.sim.entities.MapEntity.ID,
      blk.sim.entities.MapEntity,
      blk.sim.entities.MapEntity.State));

  // PLAYER_CONTROLLER
  simulator.registerEntityFactory(new gf.sim.EntityFactory(
      blk.sim.controllers.PlayerEntity.ID,
      blk.sim.controllers.PlayerEntity,
      blk.sim.controllers.PlayerEntity.State));

  // PICKAXE_TOOL
  simulator.registerEntityFactory(new gf.sim.EntityFactory(
      blk.sim.tools.PickaxeEntity.ID,
      blk.sim.tools.PickaxeEntity,
      blk.sim.tools.PickaxeEntity.State));
};
