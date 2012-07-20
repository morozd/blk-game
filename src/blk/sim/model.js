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

goog.provide('blk.sim.Model');

goog.require('gf');
goog.require('gf.sim.SpatialEntity');
goog.require('gf.sim.Variable');
goog.require('gf.sim.VariableFlag');



/**
 * Abstract renderable model entity.
 *
 * @constructor
 * @extends {gf.sim.SpatialEntity}
 * @param {!gf.sim.Simulator} simulator Owning simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.Model = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);

  // TODO(benvanik): add locals:
  // - viewport
  // - render model
  // - render state
  // - attachments (track child add/remove)
};
goog.inherits(blk.sim.Model, gf.sim.SpatialEntity);


/**
 * Gets a list of attachments currently on the model.
 * The list returned is mutable and should not be cached.
 * @return {!Array.<!blk.sim.Model>} A list of attachments.
 */
blk.sim.Model.prototype.getAttachments = function() {
  // TODO(benvanik): get attachments
  return [];
};


if (gf.CLIENT) {
  /**
   * Processes the model for rendering.
   * @this {blk.sim.Model}
   * @param {!gf.RenderFrame} frame Current render frame.
   * @param {!gf.vec.Viewport} viewport Current viewport.
   * @param {number} distanceToViewport Distance from the entity to the viewport
   *     eye point.
   * @param {!blk.graphics.RenderList} renderList Render command list.
   */
  blk.sim.Model.prototype.render = function(
      frame, viewport, distanceToViewport, renderList) {
    // TODO(benvanik): queue for rendering

    // TODO(benvanik): render attachments
  };
}



/**
 * Model entity state.
 * @constructor
 * @extends {gf.sim.SpatialEntity.State}
 * @param {!gf.sim.Entity} entity Entity that this object stores state for.
 * @param {!gf.sim.VariableTable} variableTable A subclass's variable table.
 */
blk.sim.Model.State = function(entity, variableTable) {
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
      blk.sim.Model.State.tags_.modelName);

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
      blk.sim.Model.State.tags_.modelColor);

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
      blk.sim.Model.State.tags_.attachPoint);
};
goog.inherits(blk.sim.Model.State,
    gf.sim.SpatialEntity.State);


/**
 * @private
 * @type {!Object.<number>}
 */
blk.sim.Model.State.tags_ = {
  modelName: gf.sim.Variable.getUniqueTag(),
  modelColor: gf.sim.Variable.getUniqueTag(),
  attachPoint: gf.sim.Variable.getUniqueTag()
};


/**
 * Gets the model name.
 * @return {string} Current value.
 */
blk.sim.Model.State.prototype.getModelName = function() {
  return this.modelName_;
};


/**
 * Sets the model name.
 * @param {string} value New value.
 */
blk.sim.Model.State.prototype.setModelName = function(value) {
  if (this.modelName_ != value) {
    this.modelName_ = value;
    this.setVariableDirty(this.modelNameOrdinal_);
  }
};


/**
 * Gets the model color as 0xAABBGGRR.
 * @return {number} Current value.
 */
blk.sim.Model.State.prototype.getModelColor = function() {
  return this.modelColor_;
};


/**
 * Sets the model color as 0xAABBGGRR.
 * @param {number} value New value.
 */
blk.sim.Model.State.prototype.setModelColor = function(value) {
  if (this.modelColor_ != value) {
    this.modelColor_ = value;
    this.setVariableDirty(this.modelColorOrdinal_);
  }
};


/**
 * Gets the attachment point.
 * @return {number} Current value.
 */
blk.sim.Model.State.prototype.getAttachPoint = function() {
  return this.attachPoint_;
};


/**
 * Sets the attachment point.
 * @param {number} value New value.
 */
blk.sim.Model.State.prototype.setAttachPoint = function(value) {
  if (this.attachPoint_ != value) {
    this.attachPoint_ = value;
    this.setVariableDirty(this.attachPointOrdinal_);
  }
};


/**
 * @override
 */
blk.sim.Model.State.declareVariables = function(variableList) {
  gf.sim.SpatialEntity.State.declareVariables(variableList);
  variableList.push(new gf.sim.Variable.String(
      blk.sim.Model.State.tags_.modelName,
      0,
      blk.sim.Model.State.prototype.getModelName,
      blk.sim.Model.State.prototype.setModelName));
  variableList.push(new gf.sim.Variable.Color(
      blk.sim.Model.State.tags_.modelColor,
      gf.sim.VariableFlag.UPDATED_FREQUENTLY | gf.sim.VariableFlag.INTERPOLATED,
      blk.sim.Model.State.prototype.getModelColor,
      blk.sim.Model.State.prototype.setModelColor));
  variableList.push(new gf.sim.Variable.Integer(
      blk.sim.Model.State.tags_.attachPoint,
      0,
      blk.sim.Model.State.prototype.getAttachPoint,
      blk.sim.Model.State.prototype.setAttachPoint));
};
