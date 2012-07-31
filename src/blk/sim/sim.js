/**
 * Copyright 2012 Google Inc. All Rights Reserved.
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

goog.provide('blk.sim');

goog.require('gf');
// Extra requires to shut up type warnings
/** @suppress {extraRequire} */
goog.require('gf.sim.ClientSimulator');
/** @suppress {extraRequire} */
goog.require('gf.sim.ServerSimulator');
goog.require('goog.asserts');


/**
 * BLK module ID.
 * Used by {@see gf.sim.createTypeId} to create entity/command type IDs.
 * @const
 * @type {number}
 */
blk.sim.BLK_MODULE_ID = 1;


/**
 * Gets the root entity.
 * @param {!gf.sim.Entity} entity Entity in the simulation.
 * @return {!blk.sim.Root} The root entity.
 */
blk.sim.getRoot = function(entity) {
  var value = /** @type {blk.sim.Root} */ (entity.simulator.getRootEntity());
  goog.asserts.assert(value);
  return value;
};


/**
 * Gets the world entity.
 * @param {!gf.sim.Entity} entity Entity in the simulation.
 * @return {!blk.sim.World} The world entity.
 */
blk.sim.getWorld = function(entity) {
  var root = blk.sim.getRoot(entity);
  return root.getWorld();
};


/**
 * Gets the BLK map.
 * @param {!gf.sim.Entity} entity Entity in the simulation.
 * @return {!blk.env.Map} The map.
 */
blk.sim.getMap = function(entity) {
  var world = blk.sim.getWorld(entity);
  return world.getMap();
};


if (gf.SERVER) {
  /**
   * Gets the game controller that owns the simulator.
   * @param {!gf.sim.Entity} entity Entity in the simulation.
   * @return {!blk.game.server.ServerController} Server controller.
   */
  blk.sim.getServerController = function(entity) {
    var root = blk.sim.getRoot(entity);
    return /** @type {!blk.game.server.ServerController} */ (
        root.getGameController());
  };
}


if (gf.CLIENT) {
  /**
   * Gets the game controller that owns the simulator.
   * @param {!gf.sim.Entity} entity Entity in the simulation.
   * @return {!blk.game.client.ClientController} Client controller.
   */
  blk.sim.getClientController = function(entity) {
    var root = blk.sim.getRoot(entity);
    return /** @type {!blk.game.client.ClientController} */ (
        root.getGameController());
  };

  /**
   * Gets the local player.
   * @param {!gf.sim.Entity} entity Entity in the simulation.
   * @return {!blk.sim.Player} The local player entity.
   */
  blk.sim.getLocalPlayer = function(entity) {
    var root = blk.sim.getRoot(entity);
    return root.getLocalPlayer();
  };

  /**
   * Gets the local player camera.
   * @param {!gf.sim.Entity} entity Entity in the simulation.
   * @return {!blk.sim.Camera} The camera entity.
   */
  blk.sim.getLocalCamera = function(entity) {
    var player = blk.sim.getLocalPlayer(entity);
    return player.getCamera();
  };

  /**
   * Gets the local player chunk view.
   * @param {!gf.sim.Entity} entity Entity in the simulation.
   * @return {!blk.env.ChunkView} The local chunk view.
   */
  blk.sim.getLocalChunkView = function(entity) {
    var camera = blk.sim.getLocalCamera(entity);
    return camera.getView();
  };
}
