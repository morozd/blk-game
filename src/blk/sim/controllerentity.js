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

goog.provide('blk.sim.ClientControllerEntity');
goog.provide('blk.sim.ControllerEntity');
goog.provide('blk.sim.ServerControllerEntity');

goog.require('gf.log');
goog.require('gf.sim.ClientEntity');
goog.require('gf.sim.EntityState');
goog.require('gf.sim.ServerEntity');
goog.require('gf.sim.Variable');
goog.require('gf.sim.VariableFlag');
goog.require('goog.asserts');
goog.require('goog.vec.Vec3');



/**
 * Abstract actor controller entity.
 * An entity that controls other actor entities.
 *
 * @constructor
 */
blk.sim.ControllerEntity = function() {
  goog.asserts.fail('Cannot create shared proto class');
};



/**
 * Actor controller entity state.
 * @constructor
 * @extends {gf.sim.EntityState}
 * @param {!gf.sim.Entity} entity Entity that this object stores state for.
 * @param {!gf.sim.VariableTable} variableTable A subclass's variable table.
 */
blk.sim.ControllerEntity.State = function(entity, variableTable) {
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
      blk.sim.ControllerEntity.State.positionTag_);
};
goog.inherits(blk.sim.ControllerEntity.State, gf.sim.EntityState);


/**
 * @private
 * @type {number}
 */
blk.sim.ControllerEntity.State.positionTag_ = gf.sim.Variable.getUniqueTag();


/**
 * Gets the position.
 * @return {!goog.vec.Vec3.Float32} Current value.
 */
blk.sim.ControllerEntity.State.prototype.getPosition = function() {
  return this.position_;
};


/**
 * Sets the position.
 * @param {goog.vec.Vec3.Float32} value New value.
 */
blk.sim.ControllerEntity.State.prototype.setPosition = function(value) {
  gf.log.write('setPosition:', value[0], value[1], value[2]);
  if (!goog.vec.Vec3.equals(this.position_, value)) {
    goog.vec.Vec3.setFromArray(this.position_, value);
    this.setVariableDirty(this.positionOrdinal_);
  }
};


/**
 * @override
 */
blk.sim.ControllerEntity.State.declareVariables = function(variableList) {
  gf.sim.EntityState.declareVariables(variableList);
  variableList.push(new gf.sim.Variable.Vec3(
      blk.sim.ControllerEntity.State.positionTag_,
      gf.sim.VariableFlag.UPDATED_FREQUENTLY | gf.sim.VariableFlag.INTERPOLATED,
      blk.sim.ControllerEntity.State.prototype.getPosition,
      blk.sim.ControllerEntity.State.prototype.setPosition));
};



/**
 * Abstract client-side actor controller entity.
 *
 * @constructor
 * @extends {gf.sim.ClientEntity}
 * @param {!gf.sim.ClientSimulator} simulator Owning client simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.ClientControllerEntity = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);
};
goog.inherits(blk.sim.ClientControllerEntity, gf.sim.ClientEntity);
goog.mixin(blk.sim.ClientControllerEntity.prototype,
    blk.sim.ControllerEntity.prototype);



/**
 * Abstract server-side actor controller entity.
 *
 * @constructor
 * @extends {gf.sim.ServerEntity}
 * @param {!gf.sim.ServerSimulator} simulator Owning server simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.ServerControllerEntity = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);
};
goog.inherits(blk.sim.ServerControllerEntity, gf.sim.ServerEntity);
goog.mixin(blk.sim.ServerControllerEntity.prototype,
    blk.sim.ControllerEntity.prototype);
