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

goog.provide('blk.sim.entities.ModelEntity');

goog.require('gf.sim.Variable');
goog.require('gf.sim.VariableFlag');
goog.require('gf.sim.entities.SpatialEntity');



/**
 * Abstract renderable model entity.
 *
 * @constructor
 * @extends {gf.sim.entities.SpatialEntity}
 * @param {!gf.sim.Simulator} simulator Owning simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.entities.ModelEntity = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);

  // TODO(benvanik): add locals:
  // - viewport
  // - render model
  // - render state
  // - attachments (track child add/remove)
};
goog.inherits(blk.sim.entities.ModelEntity, gf.sim.entities.SpatialEntity);


/**
 * Gets a list of attachments currently on the model.
 * The list returned is mutable and should not be cached.
 * @return {!Array.<!blk.sim.entities.ModelEntity>} A list of attachments.
 */
blk.sim.entities.ModelEntity.prototype.getAttachments = function() {
  // TODO(benvanik): get attachments
  return [];
};



/**
 * Model entity state.
 * @constructor
 * @extends {gf.sim.entities.SpatialEntity.State}
 * @param {!gf.sim.Entity} entity Entity that this object stores state for.
 * @param {!gf.sim.VariableTable} variableTable A subclass's variable table.
 */
blk.sim.entities.ModelEntity.State = function(entity, variableTable) {
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
      blk.sim.entities.ModelEntity.State.modelNameTag_);

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
      blk.sim.entities.ModelEntity.State.modelColorTag_);

  /**
   * Attachment point.
   * @private
   * @type {number}
   */
  this.attachPoint_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.attachPointOrdinal_ = variableTable.getOrdinal(
      blk.sim.entities.ModelEntity.State.attachPointTag_);
};
goog.inherits(blk.sim.entities.ModelEntity.State,
    gf.sim.entities.SpatialEntity.State);


/**
 * @private
 * @type {number}
 */
blk.sim.entities.ModelEntity.State.modelNameTag_ =
    gf.sim.Variable.getUniqueTag();


/**
 * @private
 * @type {number}
 */
blk.sim.entities.ModelEntity.State.modelColorTag_ =
    gf.sim.Variable.getUniqueTag();


/**
 * @private
 * @type {number}
 */
blk.sim.entities.ModelEntity.State.attachPointTag_ =
    gf.sim.Variable.getUniqueTag();


/**
 * Gets the model name.
 * @return {string} Current value.
 */
blk.sim.entities.ModelEntity.State.prototype.getModelName = function() {
  return this.modelName_;
};


/**
 * Sets the model name.
 * @param {string} value New value.
 */
blk.sim.entities.ModelEntity.State.prototype.setModelName = function(value) {
  if (this.modelName_ != value) {
    this.modelName_ = value;
    this.setVariableDirty(this.modelNameOrdinal_);
  }
};


/**
 * Gets the model color as 0xAABBGGRR.
 * @return {number} Current value.
 */
blk.sim.entities.ModelEntity.State.prototype.getModelColor = function() {
  return this.modelColor_;
};


/**
 * Sets the model color as 0xAABBGGRR.
 * @param {number} value New value.
 */
blk.sim.entities.ModelEntity.State.prototype.setModelColor = function(value) {
  if (this.modelColor_ != value) {
    this.modelColor_ = value;
    this.setVariableDirty(this.modelColorOrdinal_);
  }
};


/**
 * Gets the attachment point.
 * @return {string} Current value.
 */
blk.sim.entities.ModelEntity.State.prototype.getAttachPoint = function() {
  return this.attachPoint_;
};


/**
 * Sets the attachment point.
 * @param {string} value New value.
 */
blk.sim.entities.ModelEntity.State.prototype.setAttachPoint = function(value) {
  if (this.attachPoint_ != value) {
    this.attachPoint_ = value;
    this.setVariableDirty(this.attachPointOrdinal_);
  }
};


/**
 * @override
 */
blk.sim.entities.ModelEntity.State.declareVariables = function(variableList) {
  gf.sim.entities.SpatialEntity.State.declareVariables(variableList);
  variableList.push(new gf.sim.Variable.String(
      blk.sim.entities.ModelEntity.State.modelNameTag_,
      0,
      blk.sim.entities.ModelEntity.State.prototype.getModelName,
      blk.sim.entities.ModelEntity.State.prototype.setModelName));
  variableList.push(new gf.sim.Variable.Color(
      blk.sim.entities.ModelEntity.State.modelColorTag_,
      gf.sim.VariableFlag.UPDATED_FREQUENTLY | gf.sim.VariableFlag.INTERPOLATED,
      blk.sim.entities.ModelEntity.State.prototype.getModelColor,
      blk.sim.entities.ModelEntity.State.prototype.setModelColor));
  variableList.push(new gf.sim.Variable.Integer(
      blk.sim.entities.ModelEntity.State.attachPointTag_,
      0,
      blk.sim.entities.ModelEntity.State.prototype.getAttachPoint,
      blk.sim.entities.ModelEntity.State.prototype.setAttachPoint));
};
