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

goog.provide('blk.sim.PlayerEntity');

goog.require('blk.sim');
goog.require('blk.sim.controllers.PlayerEntity');
goog.require('blk.sim.entities.ActorEntity');
goog.require('blk.sim.entities.EntityType');
goog.require('gf');
goog.require('gf.sim.Entity');
goog.require('gf.sim.EntityFlag');
goog.require('gf.sim.EntityState');
goog.require('goog.asserts');



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
blk.sim.PlayerEntity = function(
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
   * @type {blk.sim.entities.ActorEntity}
   */
  this.actor_ = null;

  /**
   * Player controller logic.
   * @private
   * @type {blk.sim.controllers.PlayerEntity}
   */
  this.playerController_ = null;
};
goog.inherits(blk.sim.PlayerEntity, gf.sim.Entity);


/**
 * Entity ID.
 * @const
 * @type {number}
 */
blk.sim.PlayerEntity.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.entities.EntityType.PLAYER);


/**
 * Sets up the player entity for the given user.
 * Can only be called once and must be called immediately after creation.
 * @this {blk.sim.PlayerEntity}
 * @param {!gf.net.User} user User the player represents.
 */
blk.sim.PlayerEntity.prototype.setup = gf.SERVER ? function(user) {
  var simulator = this.getSimulator();

  goog.asserts.assert(!this.user_);
  this.user_ = user;

  // Create actor
  this.actor_ = /** @type {!blk.sim.entities.ActorEntity} */ (
      simulator.createEntity(
          blk.sim.entities.ActorEntity.ID,
          gf.sim.EntityFlag.UPDATED_FREQUENTLY |
          gf.sim.EntityFlag.PREDICTED |
          gf.sim.EntityFlag.INTERPOLATED |
          gf.sim.EntityFlag.LATENCY_COMPENSATED));
  simulator.addEntity(this.actor_);

  // Create player controller
  this.playerController_ = /** @type {!blk.sim.controllers.PlayerEntity} */ (
      simulator.createEntity(
          blk.sim.controllers.PlayerEntity.ID,
          gf.sim.EntityFlag.UPDATED_FREQUENTLY));
  simulator.addEntity(this.playerController_);
  this.playerController_.setParent(this.actor_);

  // TODO(benvanik): create inventory system
} : goog.nullFunction;



/**
 * Player entity state.
 * @constructor
 * @extends {gf.sim.EntityState}
 * @param {!gf.sim.Entity} entity Entity that this object stores state for.
 * @param {gf.sim.VariableTable=} opt_variableTable A subclass's variable table.
 */
blk.sim.PlayerEntity.State = function(entity, opt_variableTable) {
  var variableTable = opt_variableTable || gf.sim.EntityState.getVariableTable(
      blk.sim.PlayerEntity.State.declareVariables);
  goog.base(this, entity, variableTable);

  //
};
goog.inherits(blk.sim.PlayerEntity.State,
    gf.sim.EntityState);


/**
 * @override
 */
blk.sim.PlayerEntity.State.declareVariables = function(
    variableList) {
  gf.sim.EntityState.declareVariables(variableList);
};
