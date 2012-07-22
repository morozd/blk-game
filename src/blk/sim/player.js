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

goog.require('blk.sim');
goog.require('blk.sim.Actor');
goog.require('blk.sim.Camera');
goog.require('blk.sim.EntityType');
goog.require('blk.sim.controllers.PlayerController');
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

  /**
   * User.
   * @private
   * @type {gf.net.User}
   */
  this.user_ = null;

  /**
   * Actor representing the player in the world.
   * @private
   * @type {blk.sim.Actor}
   */
  this.actor_ = null;

  /**
   * Player controller logic.
   * @private
   * @type {blk.sim.controllers.PlayerController}
   */
  this.controller_ = null;

  /**
   * Player camera.
   * @private
   * @type {blk.sim.Camera}
   */
  this.camera_ = null;
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
  goog.asserts.assert(this.user_);
  return this.user_;
};


/**
 * @return {!blk.sim.Actor} Player actor.
 */
blk.sim.Player.prototype.getActor = function() {
  goog.asserts.assert(this.actor_);
  return this.actor_;
};


/**
 * @return {!blk.sim.controllers.PlayerController} Player controller.
 */
blk.sim.Player.prototype.getController = function() {
  goog.asserts.assert(this.controller_);
  return this.controller_;
};


/**
 * @return {!blk.sim.Camera} Player camera.
 */
blk.sim.Player.prototype.getCamera = function() {
  goog.asserts.assert(this.camera_);
  return this.camera_;
};


if (gf.SERVER) {
  /**
   * Sets up the player entity for the given user.
   * Can only be called once and must be called immediately after creation.
   * @param {!gf.net.User} user User the player represents.
   * @param {!blk.sim.World} world World the player exists in.
   */
  blk.sim.Player.prototype.setup = function(user, world) {
    var simulator = this.getSimulator();
    var state = /** @type {!blk.sim.PlayerState} */ (this.getState());

    goog.asserts.assert(!this.user_);
    this.user_ = user;
    state.setUserId(user.sessionId);

    // Parent to the world
    this.setParent(world);

    // Create actor
    this.actor_ = /** @type {!blk.sim.Actor} */ (
        simulator.createEntity(
            blk.sim.Actor.ID,
            gf.sim.EntityFlag.UPDATED_FREQUENTLY |
            gf.sim.EntityFlag.PREDICTED |
            gf.sim.EntityFlag.INTERPOLATED |
            gf.sim.EntityFlag.LATENCY_COMPENSATED));
    state.setActorId(this.actor_.getId());

    // Create player controller
    this.controller_ = /** @type {!blk.sim.controllers.PlayerController} */ (
        simulator.createEntity(
            blk.sim.controllers.PlayerController.ID,
            gf.sim.EntityFlag.UPDATED_FREQUENTLY));
    this.controller_.setParent(this.actor_);
    state.setControllerId(this.controller_.getId());

    // Create camera
    this.camera_ = /** @type {!blk.sim.Camera} */ (
        simulator.createEntity(
            blk.sim.Camera.ID,
            gf.sim.EntityFlag.UPDATED_FREQUENTLY |
            gf.sim.EntityFlag.PREDICTED |
            gf.sim.EntityFlag.INTERPOLATED));
    this.camera_.setParent(this.actor_);
    this.camera_.setup(user, world);
    state.setCameraId(this.camera_.getId());

    // TODO(benvanik): create inventory system
  };


  /**
   * Spawns the player in the world.
   */
  blk.sim.Player.prototype.spawn = function() {
    // Add the actor to the world
    this.actor_.setParent(this.getParent());

    // Pick a spawn point
    // TODO(benvanik): be smart, take as input, etc
    var spawnPosition = goog.vec.Vec3.createFloat32FromValues(0, 80, 0);
    this.actor_.getState().setPosition(spawnPosition);
  };


  /**
   * De-spawns the player in the world.
   */
  blk.sim.Player.prototype.despawn = function() {
    // Remove the actor from the world
    this.actor_.setParent(null);
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

      this.user_ = simulator.getUser(state.getUserId());
      this.actor_ = state.getActorIdEntity();
      this.controller_ = state.getControllerIdEntity();
      this.camera_ = state.getCameraIdEntity();
    }
  };
}
