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

goog.provide('blk.sim.Controller');

goog.require('gf');
goog.require('gf.sim.Entity');
goog.require('gf.sim.EntityState');



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
blk.sim.Controller = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);
};
goog.inherits(blk.sim.Controller, gf.sim.Entity);


/**
 * Gets the target actor of the controller, if any.
 * @return {blk.sim.Actor} Target actor.
 */
blk.sim.Controller.prototype.getTarget = function() {
  return /** @type {blk.sim.Actor} */ (this.getParent());
};


if (gf.CLIENT) {
  /**
   * Processes the input control for a single frame.
   * @param {!gf.RenderFrame} frame Current frame.
   * @param {!gf.input.Data} inputData Current input data.
   * @return {boolean} True if input is valid, false if input has failed.
   */
  blk.sim.Controller.prototype.processInput = goog.abstractMethod;
};



/**
 * Controller entity state.
 * @constructor
 * @extends {gf.sim.EntityState}
 * @param {!gf.sim.Entity} entity Entity that this object stores state for.
 * @param {!gf.sim.VariableTable} variableTable A subclass's variable table.
 */
blk.sim.Controller.State = function(entity, variableTable) {
  goog.base(this, entity, variableTable);
};
goog.inherits(blk.sim.Controller.State,
    gf.sim.EntityState);


/**
 * @override
 */
blk.sim.Controller.State.declareVariables = function(
    variableList) {
  gf.sim.EntityState.declareVariables(variableList);
};
