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

goog.provide('blk.sim.Actor');

goog.require('blk.sim');
goog.require('blk.sim.EntityType');
goog.require('blk.sim.Model');
goog.require('gf.sim');



/**
 * Abstract renderable actor entity.
 * Actors are controllable entities like players, monsters, or vehicles.
 *
 * @constructor
 * @extends {blk.sim.Model}
 * @param {!gf.sim.Simulator} simulator Owning simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.Actor = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);

  if (goog.DEBUG) {
    this.debugName = 'Actor';
  }
};
goog.inherits(blk.sim.Actor, blk.sim.Model);


/**
 * Entity ID.
 * @const
 * @type {number}
 */
blk.sim.Actor.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.EntityType.ACTOR);


/**
 * Gets the currently held tool.
 * @return {blk.sim.Tool} Tool held, if any.
 */
blk.sim.Actor.prototype.getHeldTool = function() {
  var state = /** @type {!blk.sim.ActorState} */ (this.getState());
  return state.getHeldToolIdEntity();
};


/**
 * Sets the tool held by the actor.
 * @param {blk.sim.Tool} value New tool, if any.
 */
blk.sim.Actor.prototype.setHeldTool = function(value) {
  var state = /** @type {!blk.sim.ActorState} */ (this.getState());
  state.setHeldToolId(value ? value.getId() : gf.sim.NO_ENTITY_ID);
};
