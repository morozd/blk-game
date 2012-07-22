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

goog.provide('blk.sim.World');

goog.require('blk.sim');
goog.require('blk.sim.EntityType');
goog.require('gf');
goog.require('gf.log');
goog.require('gf.sim');
goog.require('gf.sim.SceneEntity');
goog.require('gf.sim.SchedulingPriority');
goog.require('gf.sim.search.ListDatabase');
goog.require('goog.asserts');



/**
 * Map entity.
 * The spatial scene root for all spatial entities.
 *
 * @constructor
 * @extends {gf.sim.SceneEntity}
 * @param {!gf.sim.Simulator} simulator Owning simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.World = function(
    simulator, entityFactory, entityId, entityFlags) {
  // TODO(benvanik): custom search database
  var db = new gf.sim.search.ListDatabase();
  goog.base(this, simulator, entityFactory, entityId, entityFlags, db);

  /**
   * Map this world is drawing.
   * @private
   * @type {blk.env.Map}
   */
  this.map_ = null;

  //this.scheduleUpdate(gf.sim.SchedulingPriority.NORMAL);
};
goog.inherits(blk.sim.World, gf.sim.SceneEntity);


/**
 * Entity ID.
 * @const
 * @type {number}
 */
blk.sim.World.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.EntityType.WORLD);


/**
 * Gets the map.
 * @return {!blk.env.Map} The map.
 */
blk.sim.World.prototype.getMap = function() {
  goog.asserts.assert(this.map_);
  return this.map_;
};


/**
 * Sets the map.
 * This can only be called once and must be called immediately after creating
 * the entity.
 * @param {!blk.env.Map} map Map to use.
 */
blk.sim.World.prototype.setMap = function(map) {
  goog.asserts.assert(!this.map_);
  this.map_ = map;

  // TODO(benvanik): could issue some commands here relating to map setup
};


/**
 * @override
 */
blk.sim.World.prototype.update = function(time, timeDelta) {
  var state = /** @type {!blk.sim.WorldState} */ (
      this.getState());

  if (gf.CLIENT) {
    gf.log.write('client var = ' + state.getTestVar());
  } else {
    state.setTestVar(time | 0);
  }

  this.scheduleUpdate(gf.sim.SchedulingPriority.NORMAL, time + 1);
};


if (gf.CLIENT) {
  /**
   * Processes the map for rendering.
   * @this {blk.sim.World}
   * @param {!gf.RenderFrame} frame Current render frame.
   * @param {!gf.vec.Viewport} viewport Current viewport.
   * @param {!blk.graphics.RenderList} renderList Render command list.
   */
  blk.sim.World.prototype.render = function(frame, viewport, renderList) {
    var db = this.getSpatialDatabase();

    // Walk all entities in the viewport and queue for rendering
    db.forEachInViewport(viewport,
        /**
         * @param {!gf.sim.SpatialEntity} spatialEntity Entity.
         * @param {number} distanceToViewport Distance.
         * @return {boolean|undefined} Cancel flag.
         */
        function(spatialEntity, distanceToViewport) {
          var entity = /** @type {!blk.sim.Model} */ (
              spatialEntity);
          entity.render(frame, viewport, distanceToViewport, renderList);
        });
  };
}


// TODO(benvanik): add state vars:
// - day cycle duration
// - sky color
// - ambient light color
// - sun light color
// - fog color
// - fog params?
