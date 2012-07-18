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

goog.provide('blk.sim.controllers.ClientPlayerEntity');
goog.provide('blk.sim.controllers.PlayerEntity');
goog.provide('blk.sim.controllers.ServerPlayerEntity');

goog.require('blk.sim');
goog.require('blk.sim.ClientControllerEntity');
goog.require('blk.sim.ControllerEntity');
goog.require('blk.sim.ServerControllerEntity');
goog.require('blk.sim.entities.EntityType');
goog.require('gf.log');
goog.require('gf.sim');
goog.require('gf.sim.EntityState');
goog.require('gf.sim.Variable');
goog.require('gf.sim.VariableFlag');
goog.require('goog.asserts');
goog.require('goog.vec.Vec3');



/**
 * Player controller entity.
 * A controller that represents a real player. Handles input and prediction.
 *
 * @constructor
 */
blk.sim.controllers.PlayerEntity = function() {
  goog.asserts.fail('Cannot create shared proto class');
};


/**
 * Entity ID.
 * @const
 * @type {number}
 */
blk.sim.controllers.PlayerEntity.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.entities.EntityType.PLAYER_CONTROLLER);



/**
 * Player entity state.
 * @constructor
 * @extends {blk.sim.ControllerEntity.State}
 * @param {!gf.sim.Entity} entity Entity that this object stores state for.
 */
blk.sim.controllers.PlayerEntity.State = function(entity) {
  var variableTable = gf.sim.EntityState.getVariableTable(
      blk.sim.controllers.PlayerEntity.State.declareVariables);
  goog.base(this, entity, variableTable);

  /**
   * @private
   * @type {!goog.vec.Vec3.Float32}
   */
  this.position_ = goog.vec.Vec3.createFloat32();

  /**
   * @private
   * @type {number}
   */
  this.positionOrdinal_ = variableTable.getOrdinal(
      blk.sim.controllers.PlayerEntity.State.positionTag_);
};
goog.inherits(blk.sim.controllers.PlayerEntity.State,
    blk.sim.ControllerEntity.State);


/**
 * @private
 * @type {number}
 */
blk.sim.controllers.PlayerEntity.State.positionTag_ =
    gf.sim.Variable.getUniqueTag();


/**
 * Gets the position.
 * @return {!goog.vec.Vec3.Float32} Current value.
 */
blk.sim.controllers.PlayerEntity.State.prototype.getPosition = function() {
  return this.position_;
};


/**
 * Sets the position.
 * @param {goog.vec.Vec3.Float32} value New value.
 */
blk.sim.controllers.PlayerEntity.State.prototype.setPosition = function(value) {
  gf.log.write('setPosition:', value[0], value[1], value[2]);
  if (!goog.vec.Vec3.equals(this.position_, value)) {
    goog.vec.Vec3.setFromArray(this.position_, value);
    this.setVariableDirty(this.positionOrdinal_);
  }
};


/**
 * @override
 */
blk.sim.controllers.PlayerEntity.State.declareVariables = function(
    variableList) {
  blk.sim.ControllerEntity.State.declareVariables(variableList);
  variableList.push(new gf.sim.Variable.Vec3(
      blk.sim.controllers.PlayerEntity.State.positionTag_,
      gf.sim.VariableFlag.UPDATED_FREQUENTLY | gf.sim.VariableFlag.INTERPOLATED,
      blk.sim.controllers.PlayerEntity.State.prototype.getPosition,
      blk.sim.controllers.PlayerEntity.State.prototype.setPosition));
};



/**
 * Client-side player controller entity.
 *
 * @constructor
 * @extends {blk.sim.ClientControllerEntity}
 * @param {!gf.sim.ClientSimulator} simulator Owning client simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.controllers.ClientPlayerEntity = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);

  // TODO(benvanik): add locals:
  // - chunk view
};
goog.inherits(blk.sim.controllers.ClientPlayerEntity,
    blk.sim.ClientControllerEntity);



/**
 * Server-side player controller entity.
 *
 * @constructor
 * @extends {blk.sim.ServerControllerEntity}
 * @param {!gf.sim.ServerSimulator} simulator Owning server simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.controllers.ServerPlayerEntity = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);

  // TODO(benvanik): add locals:
  // - chunk view
};
goog.inherits(blk.sim.controllers.ServerPlayerEntity,
    blk.sim.ServerControllerEntity);
