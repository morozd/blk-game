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
goog.require('blk.sim.EntityType');
goog.require('blk.sim.controllers.PlayerController');
goog.require('gf');
goog.require('gf.sim');
goog.require('gf.sim.Entity');
goog.require('gf.sim.EntityDirtyFlag');
goog.require('gf.sim.EntityFlag');
goog.require('gf.sim.EntityState');
goog.require('gf.sim.Variable');
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
 * @return {!gf.net.User} User this player represents.
 */
blk.sim.Player.prototype.getUser = function() {
  goog.asserts.assert(this.user_);
  return this.user_;
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
    var state = /** @type {!blk.sim.Player.State} */ (this.getState());

    goog.asserts.assert(!this.user_);
    this.user_ = user;
    state.setUserId(user.sessionId);

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

    // TODO(benvanik): create inventory system

    // Parent to the world
    this.setParent(world);
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
    var simulator = this.getSimulator();
    var state = /** @type {!blk.sim.Player.State} */ (this.getState());

    // Player was created - find entities
    if (this.dirtyFlags & gf.sim.EntityDirtyFlag.CREATED) {
      this.user_ = simulator.getUser(state.getUserId());
      this.actor_ = /** @type {!blk.sim.Actor} */ (
          simulator.getEntity(state.getActorId()));
      this.controller_ = /** @type {!blk.sim.controllers.PlayerController} */ (
          simulator.getEntity(state.getControllerId()));
    }
  };
}



/**
 * Player entity state.
 * @constructor
 * @extends {gf.sim.EntityState}
 * @param {!gf.sim.Entity} entity Entity that this object stores state for.
 * @param {gf.sim.VariableTable=} opt_variableTable A subclass's variable table.
 */
blk.sim.Player.State = function(entity, opt_variableTable) {
  var variableTable = opt_variableTable || gf.sim.EntityState.getVariableTable(
      blk.sim.Player.State.declareVariables);
  goog.base(this, entity, variableTable);

  /**
   * User session ID.
   * @private
   * @type {string}
   */
  this.userId_ = '';

  /**
   * @private
   * @type {number}
   */
  this.userIdOrdinal_ = variableTable.getOrdinal(
      blk.sim.Player.State.tags_.userId);

  /**
   * Actor entity ID.
   * @private
   * @type {number}
   */
  this.actorId_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.actorIdOrdinal_ = variableTable.getOrdinal(
      blk.sim.Player.State.tags_.actorId);

  /**
   * Controller entity ID.
   * @private
   * @type {number}
   */
  this.controllerId_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.controllerIdOrdinal_ = variableTable.getOrdinal(
      blk.sim.Player.State.tags_.controllerId);
};
goog.inherits(blk.sim.Player.State, gf.sim.EntityState);


/**
 * @private
 * @type {!Object.<number>}
 */
blk.sim.Player.State.tags_ = {
  userId: gf.sim.Variable.getUniqueTag(),
  actorId: gf.sim.Variable.getUniqueTag(),
  controllerId: gf.sim.Variable.getUniqueTag()
};


/**
 * Gets the user session ID.
 * @return {string} Current value.
 */
blk.sim.Player.State.prototype.getUserId = function() {
  return this.userId_;
};


/**
 * Sets the user session ID.
 * @param {string} value New value.
 */
blk.sim.Player.State.prototype.setUserId = function(value) {
  if (!this.userId_ != value) {
    this.userId_ = value;
    this.setVariableDirty(this.userIdOrdinal_);
  }
};


/**
 * Gets the actor entity ID.
 * @return {number} Current value.
 */
blk.sim.Player.State.prototype.getActorId = function() {
  return this.actorId_;
};


/**
 * Sets the actor entity ID.
 * @param {number} value New value.
 */
blk.sim.Player.State.prototype.setActorId = function(value) {
  if (!this.actorId_ != value) {
    this.actorId_ = value;
    this.setVariableDirty(this.actorIdOrdinal_);
  }
};


/**
 * Gets the controller entity ID.
 * @return {number} Current value.
 */
blk.sim.Player.State.prototype.getControllerId = function() {
  return this.controllerId_;
};


/**
 * Sets the controller entity ID.
 * @param {number} value New value.
 */
blk.sim.Player.State.prototype.setControllerId = function(value) {
  if (!this.actorId_ != value) {
    this.controllerId_ = value;
    this.setVariableDirty(this.controllerIdOrdinal_);
  }
};


/**
 * @override
 */
blk.sim.Player.State.declareVariables = function(variableList) {
  gf.sim.EntityState.declareVariables(variableList);
  variableList.push(new gf.sim.Variable.String(
      blk.sim.Player.State.tags_.userId,
      0,
      blk.sim.Player.State.prototype.getUserId,
      blk.sim.Player.State.prototype.setUserId));
  variableList.push(new gf.sim.Variable.EntityID(
      blk.sim.Player.State.tags_.actorId,
      0,
      blk.sim.Player.State.prototype.getActorId,
      blk.sim.Player.State.prototype.setActorId));
  variableList.push(new gf.sim.Variable.EntityID(
      blk.sim.Player.State.tags_.controllerId,
      0,
      blk.sim.Player.State.prototype.getControllerId,
      blk.sim.Player.State.prototype.setControllerId));
};
