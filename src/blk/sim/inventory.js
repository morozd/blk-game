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

goog.provide('blk.sim.Inventory');

goog.require('gf');
goog.require('gf.sim.Entity');



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
blk.sim.Inventory = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);
};
goog.inherits(blk.sim.Inventory, gf.sim.Entity);


/**
 * Entity ID.
 * @const
 * @type {number}
 */
blk.sim.Inventory.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.EntityType.INVENTORY);


/**
 * Gets the target actor of the controller, if any.
 * @return {blk.sim.Actor} Target actor.
 */
blk.sim.Inventory.prototype.getTarget = function() {
  return /** @type {blk.sim.Actor} */ (this.getParent());
};


/**
 * @override
 */
blk.sim.Inventory.prototype.childAdded = function(entity) {
  goog.base(this, 'childAdded', entity);

  // Item was added to the inventory
};


/**
 * @override
 */
blk.sim.Inventory.prototype.childRemoved = function(entity) {
  goog.base(this, 'childRemoved', entity);

  // Item was removed from the inventory
};


/**
 * @override
 */
blk.sim.Inventory.prototype.executeCommand = function(command) {
  goog.base(this, 'executeCommand', command);

  // TODO(benvanik): inventory commands
};


if (gf.CLIENT) {
  /**
   * Processes the input control for a single frame.
   * @param {!gf.RenderFrame} frame Current frame.
   * @param {!gf.input.Data} inputData Current input data.
   * @return {boolean} True if input is valid, false if input has failed.
   */
  blk.sim.Inventory.prototype.processInput = goog.abstractMethod;
}
