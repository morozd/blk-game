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

goog.provide('blk.sim.ActorEntity');
goog.provide('blk.sim.ClientActorEntity');
goog.provide('blk.sim.ServerActorEntity');

goog.require('blk.sim.ClientPositionedEntity');
goog.require('blk.sim.PositionedEntity');
goog.require('blk.sim.ServerPositionedEntity');
goog.require('gf.log');
goog.require('gf.sim.Variable');
goog.require('gf.sim.VariableFlag');
goog.require('goog.asserts');
goog.require('goog.vec.Vec3');



/**
 * Abstract actor entity.
 * An entity that appears in the world via some model/etc.
 *
 * @constructor
 */
blk.sim.ActorEntity = function() {
  goog.asserts.fail('Cannot create shared proto class');
};



/**
 * Actor entity state.
 * @constructor
 * @extends {blk.sim.PositionedEntity.State}
 * @param {!gf.sim.Entity} entity Entity that this object stores state for.
 * @param {!gf.sim.VariableTable} variableTable A subclass's variable table.
 */
blk.sim.ActorEntity.State = function(entity, variableTable) {
  goog.base(this, entity, variableTable);

  // TODO(benvanik): add vars:
  // - model
  // - animation params (current pose/etc)
  // - controller entity ID
  // - color modulation?

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
      blk.sim.ActorEntity.State.positionTag_);
};
goog.inherits(blk.sim.ActorEntity.State, blk.sim.PositionedEntity.State);


/**
 * @private
 * @type {number}
 */
blk.sim.ActorEntity.State.positionTag_ = gf.sim.Variable.getUniqueTag();


/**
 * Gets the position.
 * @return {!goog.vec.Vec3.Float32} Current value.
 */
blk.sim.ActorEntity.State.prototype.getPosition = function() {
  return this.position_;
};


/**
 * Sets the position.
 * @param {goog.vec.Vec3.Float32} value New value.
 */
blk.sim.ActorEntity.State.prototype.setPosition = function(value) {
  gf.log.write('setPosition:', value[0], value[1], value[2]);
  if (!goog.vec.Vec3.equals(this.position_, value)) {
    goog.vec.Vec3.setFromArray(this.position_, value);
    this.setVariableDirty(this.positionOrdinal_);
  }
};


/**
 * @override
 */
blk.sim.ActorEntity.State.declareVariables = function(variableList) {
  blk.sim.PositionedEntity.State.declareVariables(variableList);
  variableList.push(new gf.sim.Variable.Vec3(
      blk.sim.ActorEntity.State.positionTag_,
      gf.sim.VariableFlag.UPDATED_FREQUENTLY | gf.sim.VariableFlag.INTERPOLATED,
      blk.sim.ActorEntity.State.prototype.getPosition,
      blk.sim.ActorEntity.State.prototype.setPosition));
};



/**
 * Abstract client-side actor entity.
 *
 * @constructor
 * @extends {blk.sim.ClientPositionedEntity}
 * @param {!gf.sim.ClientSimulator} simulator Owning client simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.ClientActorEntity = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);

  // TODO(benvanik): add locals:
  // - viewport
  // - render model
  // - render state
};
goog.inherits(blk.sim.ClientActorEntity, blk.sim.ClientPositionedEntity);



/**
 * Abstract server-side actor entity.
 *
 * @constructor
 * @extends {blk.sim.ServerPositionedEntity}
 * @param {!gf.sim.ServerSimulator} simulator Owning server simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.ServerActorEntity = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);
};
goog.inherits(blk.sim.ServerActorEntity, blk.sim.ServerPositionedEntity);
