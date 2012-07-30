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

goog.provide('blk.sim.Root');

goog.require('blk.sim');
goog.require('blk.sim.EntityType');
goog.require('gf');
goog.require('gf.sim');
goog.require('gf.sim.Entity');
goog.require('goog.asserts');



/**
 * Abstract actor controller entity.
 * Can be parented to an actor and assigned as a controller.
 *
 * @constructor
 * @extends {gf.sim.Entity}
 * @param {!gf.sim.Simulator} simulator Owning simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.Root = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);

  if (gf.CLIENT) {
    /**
     * Local player.
     * This must be set by the game controller.
     * @private
     * @type {blk.sim.Player}
     */
    this.localPlayer_ = null;
  }
};
goog.inherits(blk.sim.Root, gf.sim.Entity);


/**
 * Entity ID.
 * @const
 * @type {number}
 */
blk.sim.Root.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.EntityType.ROOT);


/**
 * Gets the world entity.
 * @return {!blk.sim.World} Current value.
 */
blk.sim.Root.prototype.getWorld = function() {
  var state = /** @type {!blk.sim.RootState} */ (this.getState());
  var value = state.getWorldIdEntity();
  goog.asserts.assert(value);
  return value;
};


/**
 * Sets the world entity.
 * Must only be called once.
 * @param {!blk.sim.World} value world entity value.
 */
blk.sim.Root.prototype.setWorld = function(value) {
  var state = /** @type {!blk.sim.RootState} */ (this.getState());
  goog.asserts.assert(state.getWorldId() == gf.sim.NO_ENTITY_ID);
  state.setWorldId(value.getId());
};


if (gf.CLIENT) {
  /**
   * Gets the local player.
   * @return {!blk.sim.Player} Local player.
   */
  blk.sim.Root.prototype.getLocalPlayer = function() {
    goog.asserts.assert(this.localPlayer_);
    return this.localPlayer_;
  };


  /**
   * Sets the local player.
   * Must only be called once.
   * @param {!blk.sim.Player} value Player.
   */
  blk.sim.Root.prototype.setLocalPlayer = function(value) {
    goog.asserts.assert(!this.localPlayer_);
    this.localPlayer_ = value;
  };
}
