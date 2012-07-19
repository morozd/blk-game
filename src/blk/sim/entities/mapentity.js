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

goog.provide('blk.sim.entities.MapEntity');

goog.require('blk.sim');
goog.require('blk.sim.entities.EntityType');
goog.require('gf');
goog.require('gf.log');
goog.require('gf.sim');
goog.require('gf.sim.EntityState');
goog.require('gf.sim.SchedulingPriority');
goog.require('gf.sim.Variable');
goog.require('gf.sim.entities.SceneEntity');



/**
 * Map entity.
 * The spatial scene root for all spatial entities.
 *
 * @constructor
 * @extends {gf.sim.entities.SceneEntity}
 * @param {!gf.sim.Simulator} simulator Owning simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.entities.MapEntity = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);

  this.scheduleUpdate(gf.sim.SchedulingPriority.NORMAL);
};
goog.inherits(blk.sim.entities.MapEntity, gf.sim.entities.SceneEntity);


/**
 * Entity ID.
 * @const
 * @type {number}
 */
blk.sim.entities.MapEntity.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.entities.EntityType.MAP);


/**
 * @override
 */
blk.sim.entities.MapEntity.prototype.update = function(time, timeDelta) {
  var state = /** @type {!blk.sim.entities.MapEntity.State} */ (this.state);

  if (gf.CLIENT) {
    gf.log.write('client var = ' + state.getTestVar());
  } else {
    state.setTestVar(this.sharedMethod(time | 0));
  }

  this.scheduleUpdate(gf.sim.SchedulingPriority.NORMAL, time + 1);
};



/**
 * Map entity state.
 * @constructor
 * @extends {gf.sim.entities.SceneEntity.State}
 * @param {!gf.sim.Entity} entity Entity that this object stores state for.
 * @param {!gf.sim.VariableTable} variableTable A subclass's variable table.
 */
blk.sim.entities.MapEntity.State = function(entity, variableTable) {
  goog.base(this, entity, variableTable);

  // TODO(benvanik): add vars:
  // - day cycle duration
  // - sky color
  // - ambient light color
  // - sun light color
  // - fog color
  // - fog params?

  /**
   * @private
   * @type {number}
   */
  this.testVar_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.testVarOrdinal_ = variableTable.getOrdinal(
      blk.sim.entities.MapEntity.State.tags_.testVar);
};
goog.inherits(blk.sim.entities.MapEntity.State, gf.sim.EntityState);


/**
 * @private
 * @type {!Object.<number>}
 */
blk.sim.entities.MapEntity.State.tags_ = {
  testVar: gf.sim.Variable.getUniqueTag()
};


/**
 * Gets test var.
 * @return {number} Current value.
 */
blk.sim.entities.MapEntity.State.prototype.getTestVar = function() {
  return this.testVar_;
};


/**
 * Sets test var.
 * @param {number} value New value.
 */
blk.sim.entities.MapEntity.State.prototype.setTestVar = function(value) {
  gf.log.write('setTestVar(' + value + ')');
  if (this.testVar_ != value) {
    this.testVar_ = value;
    this.setVariableDirty(this.testVarOrdinal_);
  }
};


/**
 * @override
 */
blk.sim.entities.MapEntity.State.declareVariables = function(variableList) {
  gf.sim.entities.SceneEntity.State.declareVariables(variableList);
  variableList.push(new gf.sim.Variable.Float(
      blk.sim.entities.MapEntity.State.tags_.testVar,
      0,
      blk.sim.entities.MapEntity.State.prototype.getTestVar,
      blk.sim.entities.MapEntity.State.prototype.setTestVar));
};
