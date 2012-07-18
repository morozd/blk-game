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

goog.require('blk.sim.ClientMapEntity');
goog.require('blk.sim.MapEntity');
goog.require('blk.sim.ServerMapEntity');
goog.require('blk.sim.controllers.ClientPlayerEntity');
goog.require('blk.sim.controllers.PlayerEntity');
goog.require('blk.sim.controllers.ServerPlayerEntity');
goog.require('blk.sim.tools.ClientPickaxeEntity');
goog.require('blk.sim.tools.PickaxeEntity');
goog.require('blk.sim.tools.ServerPickaxeEntity');
goog.require('gf');
goog.require('gf.sim.EntityFactory');


/**
 * Registers all BLK entities with a simulator.
 * @param {!gf.sim.Simulator} simulator Simulator.
 */
blk.sim.entities.registerEntities = function(simulator) {
  // MAP
  simulator.registerEntityFactory(new gf.sim.EntityFactory(
      blk.sim.MapEntity.ID,
      gf.SERVER ?
          blk.sim.ServerMapEntity : blk.sim.ClientMapEntity,
      blk.sim.MapEntity.State));

  // PLAYER_CONTROLLER
  simulator.registerEntityFactory(new gf.sim.EntityFactory(
      blk.sim.controllers.PlayerEntity.ID,
      gf.SERVER ?
          blk.sim.controllers.ServerPlayerEntity :
          blk.sim.controllers.ClientPlayerEntity,
      blk.sim.controllers.PlayerEntity.State));

  // PICKAXE_TOOL
  simulator.registerEntityFactory(new gf.sim.EntityFactory(
      blk.sim.tools.PickaxeEntity.ID,
      gf.SERVER ?
          blk.sim.tools.ServerPickaxeEntity : blk.sim.tools.ClientPickaxeEntity,
      blk.sim.tools.PickaxeEntity.State));
};
