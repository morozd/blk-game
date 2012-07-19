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

goog.provide('blk.sim.ClientPositionedEntity');
goog.provide('blk.sim.PositionedEntity');
goog.provide('blk.sim.ServerPositionedEntity');

goog.require('gf.log');
goog.require('gf.sim.ClientEntity');
goog.require('gf.sim.EntityState');
goog.require('gf.sim.ServerEntity');
goog.require('gf.sim.Variable');
goog.require('gf.sim.VariableFlag');
goog.require('goog.asserts');
goog.require('goog.vec.Mat4');
goog.require('goog.vec.Quaternion');
goog.require('goog.vec.Vec3');
goog.require('goog.vec.Vec4');



/**
 * Abstract positioned entity.
 * An entity that exists in the world and has a position/orientation.
 * Can participate in the physics system.
 *
 * @constructor
 */
blk.sim.PositionedEntity = function() {
  goog.asserts.fail('Cannot create shared proto class');
};


/**
 * @private
 * @type {!goog.vec.Mat4.Float32}
 */
blk.sim.PositionedEntity.prototype.transform_;


/**
 * @return {!gf.sim.Entity} Entity.
 */
blk.sim.PositionedEntity.prototype.getParent;


/**
 * Calculates a transformation matrix from this entity up to the root (or a
 * given parent entity).
 * @param {!goog.vec.Mat4.Float32} result Matrix to populate with the transform.
 * @param {gf.sim.Entity=} opt_relativeToParent Parent entity to get the
 *     transform to. If omitted then the transform is relative to the root.
 * @return {!goog.vec.Mat4.Float32} The result matrix, for chaining.
 */
blk.sim.PositionedEntity.prototype.getTransform = function(
    result, opt_relativeToParent) {
  goog.vec.Mat4.setFromArray(result, this.transform_);
  var untilParent = opt_relativeToParent || null;
  var current = this.getParent();
  while (current != untilParent) {
    if (current instanceof blk.sim.ClientPositionedEntity ||
        current instanceof blk.sim.ServerPositionedEntity) {
      goog.vec.Mat4.multMat(current.transform_, result, result);
    }
    current = this.getParent();
  }
  return result;
};



/**
 * Positioned entity state.
 * @constructor
 * @extends {gf.sim.EntityState}
 * @param {!gf.sim.Entity} entity Entity that this object stores state for.
 * @param {!gf.sim.VariableTable} variableTable A subclass's variable table.
 */
blk.sim.PositionedEntity.State = function(entity, variableTable) {
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
      blk.sim.PositionedEntity.State.positionTag_);

  /**
   * @private
   * @type {!goog.vec.Quaternion.Float32}
   */
  this.orientation_ = goog.vec.Quaternion.createFloat32();

  /**
   * @private
   * @type {number}
   */
  this.orientationOrdinal_ = variableTable.getOrdinal(
      blk.sim.PositionedEntity.State.orientationTag_);
};
goog.inherits(blk.sim.PositionedEntity.State, gf.sim.EntityState);


/**
 * @private
 * @type {number}
 */
blk.sim.PositionedEntity.State.positionTag_ = gf.sim.Variable.getUniqueTag();


/**
 * @private
 * @type {number}
 */
blk.sim.PositionedEntity.State.orientationTag_ = gf.sim.Variable.getUniqueTag();


/**
 * Gets the position.
 * @return {!goog.vec.Vec3.Float32} Current value.
 */
blk.sim.PositionedEntity.State.prototype.getPosition = function() {
  return this.position_;
};


/**
 * Sets the position.
 * @param {goog.vec.Vec3.Float32} value New value.
 */
blk.sim.PositionedEntity.State.prototype.setPosition = function(value) {
  gf.log.write('setPosition:', value[0], value[1], value[2]);
  if (!goog.vec.Vec3.equals(this.position_, value)) {
    goog.vec.Vec3.setFromArray(this.position_, value);
    this.setVariableDirty(this.positionOrdinal_);
  }
};


/**
 * Gets the orientation.
 * @return {!goog.vec.Quaternion.Float32} Current value.
 */
blk.sim.PositionedEntity.State.prototype.getOrientation = function() {
  return this.orientation_;
};


/**
 * Sets the orientation.
 * @param {goog.vec.Quaternion.Float32} value New value.
 */
blk.sim.PositionedEntity.State.prototype.setOrientation = function(value) {
  gf.log.write('setOrientation:', value[0], value[1], value[2], value[3]);
  if (!goog.vec.Vec4.equals(this.orientation_, value)) {
    goog.vec.Quaternion.setFromArray(this.orientation_, value);
    this.setVariableDirty(this.orientationOrdinal_);
  }
};


/**
 * @override
 */
blk.sim.PositionedEntity.State.declareVariables = function(variableList) {
  gf.sim.EntityState.declareVariables(variableList);
  variableList.push(new gf.sim.Variable.Vec3(
      blk.sim.PositionedEntity.State.positionTag_,
      gf.sim.VariableFlag.UPDATED_FREQUENTLY | gf.sim.VariableFlag.INTERPOLATED,
      blk.sim.PositionedEntity.State.prototype.getPosition,
      blk.sim.PositionedEntity.State.prototype.setPosition));
  variableList.push(new gf.sim.Variable.Quaternion(
      blk.sim.PositionedEntity.State.orientationTag_,
      gf.sim.VariableFlag.UPDATED_FREQUENTLY | gf.sim.VariableFlag.INTERPOLATED,
      blk.sim.PositionedEntity.State.prototype.getOrientation,
      blk.sim.PositionedEntity.State.prototype.setOrientation,
      true));
};



/**
 * Abstract client-side positioned entity.
 *
 * @constructor
 * @extends {gf.sim.ClientEntity}
 * @param {!gf.sim.ClientSimulator} simulator Owning client simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.ClientPositionedEntity = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);
};
goog.inherits(blk.sim.ClientPositionedEntity, gf.sim.ClientEntity);
blk.sim.ClientPositionedEntity.prototype.getTransform =
    blk.sim.PositionedEntity.prototype.getTransform;



/**
 * Abstract server-side positioned entity.
 *
 * @constructor
 * @extends {gf.sim.ServerEntity}
 * @param {!gf.sim.ServerSimulator} simulator Owning server simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.ServerPositionedEntity = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);
};
goog.inherits(blk.sim.ServerPositionedEntity, gf.sim.ServerEntity);
blk.sim.ServerPositionedEntity.prototype.getTransform =
    blk.sim.PositionedEntity.prototype.getTransform;
