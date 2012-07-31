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
