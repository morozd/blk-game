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

goog.provide('blk.sim.ClientToolEntity');
goog.provide('blk.sim.ServerToolEntity');
goog.provide('blk.sim.ToolEntity');

goog.require('blk.sim.ActorEntity');
goog.require('blk.sim.ClientActorEntity');
goog.require('blk.sim.ServerActorEntity');
goog.require('gf.log');
goog.require('gf.sim.Variable');
goog.require('gf.sim.VariableFlag');
goog.require('goog.asserts');
goog.require('goog.vec.Vec3');



/**
 * Abstract tool entity.
 * An entity that can be used to perform some action (generate commands/etc).
 *
 * @constructor
 */
blk.sim.ToolEntity = function() {
  goog.asserts.fail('Cannot create shared proto class');
};



/**
 * Tool entity state.
 * @constructor
 * @extends {blk.sim.ActorEntity.State}
 * @param {!gf.sim.Entity} entity Entity that this object stores state for.
 * @param {!gf.sim.VariableTable} variableTable A subclass's variable table.
 */
blk.sim.ToolEntity.State = function(entity, variableTable) {
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
      blk.sim.ToolEntity.State.positionTag_);
};
goog.inherits(blk.sim.ToolEntity.State, blk.sim.ActorEntity.State);


/**
 * @private
 * @type {number}
 */
blk.sim.ToolEntity.State.positionTag_ = gf.sim.Variable.getUniqueTag();


/**
 * Gets the position.
 * @return {!goog.vec.Vec3.Float32} Current value.
 */
blk.sim.ToolEntity.State.prototype.getPosition = function() {
  return this.position_;
};


/**
 * Sets the position.
 * @param {goog.vec.Vec3.Float32} value New value.
 */
blk.sim.ToolEntity.State.prototype.setPosition = function(value) {
  gf.log.write('setPosition:', value[0], value[1], value[2]);
  if (!goog.vec.Vec3.equals(this.position_, value)) {
    goog.vec.Vec3.setFromArray(this.position_, value);
    this.setVariableDirty(this.positionOrdinal_);
  }
};


/**
 * @override
 */
blk.sim.ToolEntity.State.declareVariables = function(variableList) {
  blk.sim.ActorEntity.State.declareVariables(variableList);
  variableList.push(new gf.sim.Variable.Vec3(
      blk.sim.ToolEntity.State.positionTag_,
      gf.sim.VariableFlag.UPDATED_FREQUENTLY | gf.sim.VariableFlag.INTERPOLATED,
      blk.sim.ToolEntity.State.prototype.getPosition,
      blk.sim.ToolEntity.State.prototype.setPosition));
};



/**
 * Abstract client-side tool entity.
 *
 * @constructor
 * @extends {blk.sim.ClientActorEntity}
 * @param {!gf.sim.ClientSimulator} simulator Owning client simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.ClientToolEntity = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);
};
goog.inherits(blk.sim.ClientToolEntity, blk.sim.ClientActorEntity);
goog.mixin(blk.sim.ClientToolEntity.prototype,
    blk.sim.ToolEntity.prototype);



/**
 * Abstract server-side tool entity.
 *
 * @constructor
 * @extends {blk.sim.ServerActorEntity}
 * @param {!gf.sim.ServerSimulator} simulator Owning server simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.ServerToolEntity = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);
};
goog.inherits(blk.sim.ServerToolEntity, blk.sim.ServerActorEntity);
goog.mixin(blk.sim.ServerToolEntity.prototype,
    blk.sim.ToolEntity.prototype);
