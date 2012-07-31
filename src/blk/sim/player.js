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

goog.provide('blk.sim.Player');

goog.require('blk.env.blocks.BlockID');
goog.require('blk.sim');
goog.require('blk.sim.Actor');
goog.require('blk.sim.Camera');
goog.require('blk.sim.EntityType');
goog.require('blk.sim.Inventory');
goog.require('blk.sim.controllers.FpsController');
goog.require('blk.sim.tools.BlockTool');
goog.require('blk.sim.tools.PickaxeTool');
goog.require('gf');
goog.require('gf.sim');
goog.require('gf.sim.Entity');
goog.require('gf.sim.EntityDirtyFlag');
goog.require('gf.sim.EntityFlag');
goog.require('goog.asserts');
goog.require('goog.vec.Vec3');



/**
 * Player entity.
 * Represents a user in the session. Replicated to all clients.
 *
 * @constructor
 * @extends {gf.sim.Entity}
 * @param {!gf.sim.Simulator} simulator Owning simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.Player = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);
};
goog.inherits(blk.sim.Player, gf.sim.Entity);


/**
 * Entity ID.
 * @const
 * @type {number}
 */
blk.sim.Player.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.EntityType.PLAYER);


/**
 * @return {!blk.sim.World} World entity.
 */
blk.sim.Player.prototype.getWorld = function() {
  var parent = this.getParent();
  goog.asserts.assert(parent);
  return /** @type {!blk.sim.World} */ (parent);
};


/**
 * @return {!gf.net.User} User this player represents.
 */
blk.sim.Player.prototype.getUser = function() {
  var state = /** @type {!blk.sim.PlayerState} */ (this.getState());
  var value = state.getUserIdUser();
  goog.asserts.assert(value);
  return value;
};


/**
 * @return {!blk.sim.Actor} Player actor.
 */
blk.sim.Player.prototype.getActor = function() {
  var state = /** @type {!blk.sim.PlayerState} */ (this.getState());
  var value = state.getActorIdEntity();
  goog.asserts.assert(value);
  return value;
};


/**
 * @return {!blk.sim.controllers.FpsController} Player controller.
 */
blk.sim.Player.prototype.getController = function() {
  var state = /** @type {!blk.sim.PlayerState} */ (this.getState());
  var value = /** @type {!blk.sim.controllers.FpsController} */ (
      state.getControllerIdEntity());
  goog.asserts.assert(value);
  return value;
};


/**
 * @return {!blk.sim.Camera} Player camera.
 */
blk.sim.Player.prototype.getCamera = function() {
  var state = /** @type {!blk.sim.PlayerState} */ (this.getState());
  var value = state.getCameraIdEntity();
  goog.asserts.assert(value);
  return value;
};


/**
 * @return {!blk.sim.Inventory} Player camera.
 */
blk.sim.Player.prototype.getInventory = function() {
  var state = /** @type {!blk.sim.PlayerState} */ (this.getState());
  var value = state.getInventoryIdEntity();
  goog.asserts.assert(value);
  return value;
};


if (gf.SERVER) {
  /**
   * Sets up the player entity for the given user.
   * Can only be called once and must be called immediately after creation.
   * @param {!gf.net.User} user User the player represents.
   */
  blk.sim.Player.prototype.setup = function(user) {
    var simulator = this.getSimulator();
    var state = /** @type {!blk.sim.PlayerState} */ (this.getState());

    // Set owner so that permissions allow the owner to issue commands
    this.setOwner(user);
    state.setUserId(user.sessionId);

    // Parent to the world
    var root = blk.sim.getRoot(this);
    var world = root.getWorld();
    var map = world.getMap();
    this.setParent(world);

    // Create actor
    var actor = /** @type {!blk.sim.Actor} */ (
        simulator.createEntity(
            blk.sim.Actor.ID,
            gf.sim.EntityFlag.UPDATED_FREQUENTLY |
            gf.sim.EntityFlag.PREDICTED |
            gf.sim.EntityFlag.INTERPOLATED |
            gf.sim.EntityFlag.LATENCY_COMPENSATED));
    state.setActorId(actor.getId());

    // Create player controller
    var controller = /** @type {!blk.sim.controllers.FpsController} */ (
        simulator.createEntity(
            blk.sim.controllers.FpsController.ID,
            gf.sim.EntityFlag.UPDATED_FREQUENTLY |
            gf.sim.EntityFlag.OWNER_ONLY));
    controller.setOwner(user);
    controller.setParent(actor);
    controller.setPlayer(this);
    state.setControllerId(controller.getId());

    // Create camera
    var camera = /** @type {!blk.sim.Camera} */ (
        simulator.createEntity(
            blk.sim.Camera.ID,
            gf.sim.EntityFlag.UPDATED_FREQUENTLY |
            gf.sim.EntityFlag.PREDICTED |
            gf.sim.EntityFlag.INTERPOLATED |
            gf.sim.EntityFlag.OWNER_ONLY));
    camera.setOwner(user);
    camera.setParent(actor);
    camera.setup(user);
    state.setCameraId(camera.getId());

    // Create inventory
    var inventory = /** @type {!blk.sim.Inventory} */ (
        simulator.createEntity(
            blk.sim.Inventory.ID,
            0));
    inventory.setOwner(user);
    inventory.setParent(actor);
    state.setInventoryId(inventory.getId());

    // Add a pickaxe to the inventory
    var pickaxeTool = /** @type {!blk.sim.tools.PickaxeTool} */ (
        simulator.createEntity(
            blk.sim.tools.PickaxeTool.ID,
            0));
    pickaxeTool.setOwner(user);
    pickaxeTool.setParent(inventory);

    // Add a few blocks to the inventory
    var blockTypes = [
      map.blockSet.getBlockWithId(blk.env.blocks.BlockID.DIRT),
      map.blockSet.getBlockWithId(blk.env.blocks.BlockID.STONE),
      map.blockSet.getBlockWithId(blk.env.blocks.BlockID.BRICK),
      map.blockSet.getBlockWithId(blk.env.blocks.BlockID.WOOD),
      map.blockSet.getBlockWithId(blk.env.blocks.BlockID.GLASS)
    ];
    for (var n = 0; n < blockTypes.length; n++) {
      var blockTool = /** @type {!blk.sim.tools.BlockTool} */ (
          simulator.createEntity(
              blk.sim.tools.BlockTool.ID,
              0));
      blockTool.setOwner(user);
      blockTool.setParent(inventory);
      blockTool.setBlockType(blockTypes[n]);
      // TODO(benvanik): count?

      if (n == 0) {
        // TODO(benvanik): make this part of the inventory task
        blockTool.setParent(actor);
        actor.setHeldTool(blockTool);
      }
    }
  };


  /**
   * Spawns the player in the world.
   */
  blk.sim.Player.prototype.spawn = function() {
    // Add the actor to the world
    var actor = this.getActor();
    actor.setParent(this.getParent());

    // Pick a spawn point
    // TODO(benvanik): be smart, take as input, etc
    var spawnPosition = goog.vec.Vec3.createFloat32FromValues(0, 80, 0);
    actor.getState().setPosition(spawnPosition);
  };


  /**
   * De-spawns the player in the world.
   */
  blk.sim.Player.prototype.despawn = function() {
    // Remove the actor from the world
    var actor = this.getActor();
    actor.setParent(null);
  };
}


if (gf.CLIENT) {
  /**
   * @override
   */
  blk.sim.Player.prototype.postNetworkUpdate = function() {
    // Player was created - find entities
    if (this.dirtyFlags & gf.sim.EntityDirtyFlag.CREATED) {
      var simulator = this.getSimulator();
      var state = /** @type {!blk.sim.PlayerState} */ (this.getState());

      // TODO(benvanik): find a way to avoid this -- UserID var type?
      this.user_ = simulator.getUser(state.getUserId());
    }
  };
}
