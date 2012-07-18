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

goog.provide('blk.sim.tools.ClientRocketLauncherEntity');
goog.provide('blk.sim.tools.RocketLauncherEntity');
goog.provide('blk.sim.tools.ServerRocketLauncherEntity');

goog.require('blk.sim');
goog.require('blk.sim.ClientToolEntity');
goog.require('blk.sim.ServerToolEntity');
goog.require('blk.sim.ToolEntity');
goog.require('blk.sim.entities.EntityType');
goog.require('gf.log');
goog.require('gf.sim');
goog.require('gf.sim.EntityState');
goog.require('gf.sim.Variable');
goog.require('gf.sim.VariableFlag');
goog.require('goog.asserts');
goog.require('goog.vec.Vec3');



/**
 * Rocket launcher tool entity.
 * A ranged projectile-shooting tool for 'sploding the world.
 *
 * @constructor
 */
blk.sim.tools.RocketLauncherEntity = function() {
  goog.asserts.fail('Cannot create shared proto class');
};


/**
 * Entity ID.
 * @const
 * @type {number}
 */
blk.sim.tools.RocketLauncherEntity.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.entities.EntityType.ROCKETLAUNCHER_TOOL);



/**
 * RocketLauncher entity state.
 * @constructor
 * @extends {blk.sim.ToolEntity.State}
 * @param {!gf.sim.Entity} entity Entity that this object stores state for.
 */
blk.sim.tools.RocketLauncherEntity.State = function(entity) {
  var variableTable = gf.sim.EntityState.getVariableTable(
      blk.sim.tools.RocketLauncherEntity.State.declareVariables);
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
      blk.sim.tools.RocketLauncherEntity.State.positionTag_);
};
goog.inherits(blk.sim.tools.RocketLauncherEntity.State,
    blk.sim.ToolEntity.State);


/**
 * @private
 * @type {number}
 */
blk.sim.tools.RocketLauncherEntity.State.positionTag_ =
    gf.sim.Variable.getUniqueTag();


/**
 * Gets the position.
 * @return {!goog.vec.Vec3.Float32} Current value.
 */
blk.sim.tools.RocketLauncherEntity.State.prototype.getPosition = function() {
  return this.position_;
};


/**
 * Sets the position.
 * @param {goog.vec.Vec3.Float32} value New value.
 */
blk.sim.tools.RocketLauncherEntity.State.prototype.setPosition = function(
    value) {
  gf.log.write('setPosition:', value[0], value[1], value[2]);
  if (!goog.vec.Vec3.equals(this.position_, value)) {
    goog.vec.Vec3.setFromArray(this.position_, value);
    this.setVariableDirty(this.positionOrdinal_);
  }
};


/**
 * @override
 */
blk.sim.tools.RocketLauncherEntity.State.declareVariables = function(
    variableList) {
  blk.sim.ToolEntity.State.declareVariables(variableList);
  variableList.push(new gf.sim.Variable.Vec3(
      blk.sim.tools.RocketLauncherEntity.State.positionTag_,
      gf.sim.VariableFlag.UPDATED_FREQUENTLY | gf.sim.VariableFlag.INTERPOLATED,
      blk.sim.tools.RocketLauncherEntity.State.prototype.getPosition,
      blk.sim.tools.RocketLauncherEntity.State.prototype.setPosition));
};



/**
 * Client-side rocket launcher tool entity.
 *
 * @constructor
 * @extends {blk.sim.ClientToolEntity}
 * @param {!gf.sim.ClientSimulator} simulator Owning client simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.tools.ClientRocketLauncherEntity = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);
};
goog.inherits(blk.sim.tools.ClientRocketLauncherEntity,
    blk.sim.ClientToolEntity);



/**
 * Server-side rocket launcher tool entity.
 *
 * @constructor
 * @extends {blk.sim.ServerToolEntity}
 * @param {!gf.sim.ServerSimulator} simulator Owning server simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.tools.ServerRocketLauncherEntity = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);
};
goog.inherits(blk.sim.tools.ServerRocketLauncherEntity,
    blk.sim.ServerToolEntity);
