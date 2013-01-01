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

goog.require('blk.sim');
goog.require('gf');
goog.require('gf.sim');
goog.require('gf.sim.SchedulingPriority');
goog.require('gf.sim.SpatialEntity');



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

  if (goog.DEBUG) {
    this.debugName = 'Model';
  }

  // TODO(benvanik): add locals:
  // - attachments (track child add/remove)

  /**
   * Loaded model instance.
   * On clients this will be a render model, on the server this will be
   * data-only.
   * @private
   * @type {gf.mdl.Instance}
   */
  this.modelInstance_ = null;

  /**
   * True if a model reload is pending.
   * This is used to prevent multiple reloads.
   * @private
   * @type {boolean}
   */
  this.reloadPending_ = false;
};
goog.inherits(blk.sim.Model, gf.sim.SpatialEntity);


/**
 * @override
 */
blk.sim.Model.prototype.disposeInternal = function() {
  goog.dispose(this.modelInstance_);
  this.modelInstance_ = null;

  goog.base(this, 'disposeInternal');
};


/**
 * Checks if a model needs to be reloaded and schedules the reload.
 * Loads, reloads, or unloads the model as needed.
 * @private
 */
blk.sim.Model.prototype.checkModelReload_ = function() {
  var state = /** @type {!blk.sim.ModelState} */ (this.getState());
  var newModelId = state.getModelId();
  newModelId = newModelId.length ? newModelId : null;
  var oldModelId = this.modelInstance_ ? this.modelInstance_.model.id : null;
  if (newModelId == oldModelId) {
    // Same model (or unloaded) - ignore
    return;
  }

  // Schedule reload
  if (!this.reloadPending_) {
    this.reloadPending_ = true;
    this.simulator.getScheduler().scheduleEvent(
        gf.sim.SchedulingPriority.IDLE,
        gf.sim.NEXT_TICK,
        this.reloadModel_, this);
  }
};


/**
 * Loads, reloads, or unloads the model as needed.
 * @private
 * @param {number} time Current time.
 * @param {number} timeDelta Time elapsed since the event was scheduled.
 */
blk.sim.Model.prototype.reloadModel_ = function(time, timeDelta) {
  var state = /** @type {!blk.sim.ModelState} */ (this.getState());
  var newModelId = state.getModelId();

  if (!this.reloadPending_) {
    return;
  }

  // Unload current
  if (this.modelInstance_) {
    goog.dispose(this.modelInstance_);
    this.modelInstance_ = null;
  }

  // Perform reload
  if (newModelId) {
    var library;
    if (gf.CLIENT) {
      library = blk.sim.getClientController(this).getModelLibrary();
    } else if (gf.SERVER) {
      library = blk.sim.getServerController(this).getModelLibrary();
    }
    this.modelInstance_ = library.createModelInstance(newModelId);
  }

  this.reloadPending_ = false;
};


/**
 * @return {string} Model name.
 */
blk.sim.Model.prototype.getModelId = function() {
  var state = /** @type {!blk.sim.ModelState} */ (this.getState());
  return state.getModelId();
};


if (gf.SERVER) {
  /**
   * Sets the model name.
   * @param {string} value New model name.
   */
  blk.sim.Model.prototype.setModelId = function(value) {
    var state = /** @type {!blk.sim.ModelState} */ (this.getState());
    state.setModelId(value);

    this.checkModelReload_();
  };
}

if (gf.CLIENT) {
  /**
   * @override
   */
  blk.sim.Model.prototype.postNetworkUpdate = function() {
    goog.base(this, 'postNetworkUpdate');

    this.checkModelReload_();
  };
}


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
    if (!this.modelInstance_) {
      return;
    }

    // TODO(benvanik): pick LOD

    // Animate
    // TODO(benvanik): update instance with time/etc

    // Queue for rendering
    var transformMatrix = renderList.drawModelInstance(
        /** @type {!gf.mdl.RenderInstance} */ (this.modelInstance_));
    this.getTransform(transformMatrix);

    // TODO(benvanik): render attachments
  };
}
