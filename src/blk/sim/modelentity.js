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

goog.provide('blk.sim.ClientModelEntity');
goog.provide('blk.sim.ModelEntity');
goog.provide('blk.sim.ServerModelEntity');

goog.require('blk.sim.ClientPositionedEntity');
goog.require('blk.sim.PositionedEntity');
goog.require('blk.sim.ServerPositionedEntity');
goog.require('gf.sim.Variable');
goog.require('gf.sim.VariableFlag');
goog.require('goog.asserts');



/**
 * Abstract model entity.
 * An entity that appears in the world via some model/etc.
 *
 * @constructor
 */
blk.sim.ModelEntity = function() {
  goog.asserts.fail('Cannot create shared proto class');
};



/**
 * Model entity state.
 * @constructor
 * @extends {blk.sim.PositionedEntity.State}
 * @param {!gf.sim.Entity} entity Entity that this object stores state for.
 * @param {!gf.sim.VariableTable} variableTable A subclass's variable table.
 */
blk.sim.ModelEntity.State = function(entity, variableTable) {
  goog.base(this, entity, variableTable);

  // TODO(benvanik): add vars:
  // - model tag info (variants/etc)
  // - model skin info
  // - animation params (current pose/etc)

  // TODO(benvanik): move to string table
  /**
   * Model name.
   * @private
   * @type {string}
   */
  this.modelName_ = '';

  /**
   * @private
   * @type {number}
   */
  this.modelNameOrdinal_ = variableTable.getOrdinal(
      blk.sim.ModelEntity.State.modelNameTag_);

  /**
   * Model color modulation as 0xAABBGGRR.
   * @private
   * @type {number}
   */
  this.modelColor_ = 0xFFFFFFFF;

  /**
   * @private
   * @type {number}
   */
  this.modelColorOrdinal_ = variableTable.getOrdinal(
      blk.sim.ModelEntity.State.modelColorTag_);
};
goog.inherits(blk.sim.ModelEntity.State, blk.sim.PositionedEntity.State);


/**
 * @private
 * @type {number}
 */
blk.sim.ModelEntity.State.modelNameTag_ = gf.sim.Variable.getUniqueTag();


/**
 * @private
 * @type {number}
 */
blk.sim.ModelEntity.State.modelColorTag_ = gf.sim.Variable.getUniqueTag();


/**
 * Gets the model name.
 * @return {string} Current value.
 */
blk.sim.ModelEntity.State.prototype.getModelName = function() {
  return this.modelName_;
};


/**
 * Sets the model name.
 * @param {string} value New value.
 */
blk.sim.ModelEntity.State.prototype.setModelName = function(value) {
  if (this.modelName_ != value) {
    this.modelName_ = value;
    this.setVariableDirty(this.modelNameOrdinal_);
  }
};


/**
 * Gets the model color as 0xAABBGGRR.
 * @return {number} Current value.
 */
blk.sim.ModelEntity.State.prototype.getModelColor = function() {
  return this.modelColor_;
};


/**
 * Sets the model color as 0xAABBGGRR.
 * @param {number} value New value.
 */
blk.sim.ModelEntity.State.prototype.setModelColor = function(value) {
  if (this.modelColor_ != value) {
    this.modelColor_ = value;
    this.setVariableDirty(this.modelColorOrdinal_);
  }
};


/**
 * @override
 */
blk.sim.ModelEntity.State.declareVariables = function(variableList) {
  blk.sim.PositionedEntity.State.declareVariables(variableList);
  variableList.push(new gf.sim.Variable.String(
      blk.sim.ModelEntity.State.modelNameTag_,
      0,
      blk.sim.ModelEntity.State.prototype.getModelName,
      blk.sim.ModelEntity.State.prototype.setModelName));
  variableList.push(new gf.sim.Variable.Color(
      blk.sim.ModelEntity.State.modelColorTag_,
      gf.sim.VariableFlag.UPDATED_FREQUENTLY | gf.sim.VariableFlag.INTERPOLATED,
      blk.sim.ModelEntity.State.prototype.getModelColor,
      blk.sim.ModelEntity.State.prototype.setModelColor));
};



/**
 * Abstract client-side model entity.
 *
 * @constructor
 * @extends {blk.sim.ClientPositionedEntity}
 * @param {!gf.sim.ClientSimulator} simulator Owning client simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.ClientModelEntity = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);

  // TODO(benvanik): add locals:
  // - viewport
  // - render model
  // - render state
};
goog.inherits(blk.sim.ClientModelEntity, blk.sim.ClientPositionedEntity);



/**
 * Abstract server-side model entity.
 *
 * @constructor
 * @extends {blk.sim.ServerPositionedEntity}
 * @param {!gf.sim.ServerSimulator} simulator Owning server simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.ServerModelEntity = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);
};
goog.inherits(blk.sim.ServerModelEntity, blk.sim.ServerPositionedEntity);
