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

goog.provide('blk.sim.tools.ClientRocketEntity');
goog.provide('blk.sim.tools.RocketEntity');
goog.provide('blk.sim.tools.ServerRocketEntity');

goog.require('blk.sim');
goog.require('blk.sim.ClientProjectileEntity');
goog.require('blk.sim.ProjectileEntity');
goog.require('blk.sim.ServerProjectileEntity');
goog.require('blk.sim.entities.EntityType');
goog.require('gf.log');
goog.require('gf.sim');
goog.require('gf.sim.EntityState');
goog.require('gf.sim.Variable');
goog.require('gf.sim.VariableFlag');
goog.require('goog.asserts');
goog.require('goog.vec.Vec3');



/**
 * Rocket projectile entity.
 * A self-propelled rocket projectile, shot from rocket launchers.
 *
 * @constructor
 */
blk.sim.tools.RocketEntity = function() {
  goog.asserts.fail('Cannot create shared proto class');
};


/**
 * Entity ID.
 * @const
 * @type {number}
 */
blk.sim.tools.RocketEntity.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.entities.EntityType.ROCKET_PROJECTILE);



/**
 * Rocket entity state.
 * @constructor
 * @extends {blk.sim.ProjectileEntity.State}
 * @param {!gf.sim.Entity} entity Entity that this object stores state for.
 */
blk.sim.tools.RocketEntity.State = function(entity) {
  var variableTable = gf.sim.EntityState.getVariableTable(
      blk.sim.tools.RocketEntity.State.declareVariables);
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
      blk.sim.tools.RocketEntity.State.positionTag_);
};
goog.inherits(blk.sim.tools.RocketEntity.State,
    blk.sim.ProjectileEntity.State);


/**
 * @private
 * @type {number}
 */
blk.sim.tools.RocketEntity.State.positionTag_ =
    gf.sim.Variable.getUniqueTag();


/**
 * Gets the position.
 * @return {!goog.vec.Vec3.Float32} Current value.
 */
blk.sim.tools.RocketEntity.State.prototype.getPosition = function() {
  return this.position_;
};


/**
 * Sets the position.
 * @param {goog.vec.Vec3.Float32} value New value.
 */
blk.sim.tools.RocketEntity.State.prototype.setPosition = function(value) {
  gf.log.write('setPosition:', value[0], value[1], value[2]);
  if (!goog.vec.Vec3.equals(this.position_, value)) {
    goog.vec.Vec3.setFromArray(this.position_, value);
    this.setVariableDirty(this.positionOrdinal_);
  }
};


/**
 * @override
 */
blk.sim.tools.RocketEntity.State.declareVariables = function(
    variableList) {
  blk.sim.ProjectileEntity.State.declareVariables(variableList);
  variableList.push(new gf.sim.Variable.Vec3(
      blk.sim.tools.RocketEntity.State.positionTag_,
      gf.sim.VariableFlag.UPDATED_FREQUENTLY | gf.sim.VariableFlag.INTERPOLATED,
      blk.sim.tools.RocketEntity.State.prototype.getPosition,
      blk.sim.tools.RocketEntity.State.prototype.setPosition));
};



/**
 * Client-side rocket projectile entity.
 *
 * @constructor
 * @extends {blk.sim.ClientProjectileEntity}
 * @param {!gf.sim.ClientSimulator} simulator Owning client simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.tools.ClientRocketEntity = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);
};
goog.inherits(blk.sim.tools.ClientRocketEntity,
    blk.sim.ClientProjectileEntity);



/**
 * Server-side rocket projectile entity.
 *
 * @constructor
 * @extends {blk.sim.ServerProjectileEntity}
 * @param {!gf.sim.ServerSimulator} simulator Owning server simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.tools.ServerRocketEntity = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);
};
goog.inherits(blk.sim.tools.ServerRocketEntity,
    blk.sim.ServerProjectileEntity);
