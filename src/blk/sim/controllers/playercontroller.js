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

goog.provide('blk.sim.controllers.PlayerController');

goog.require('blk.sim');
goog.require('blk.sim.Controller');
goog.require('blk.sim.EntityType');
goog.require('gf');
goog.require('gf.sim');
goog.require('gf.sim.EntityState');



/**
 * Abstract actor controller entity.
 * Can be parented to an actor and assigned as a controller.
 *
 * @constructor
 * @extends {blk.sim.Controller}
 * @param {!gf.sim.Simulator} simulator Owning simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.controllers.PlayerController = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);
};
goog.inherits(blk.sim.controllers.PlayerController,
    blk.sim.Controller);


/**
 * Entity ID.
 * @const
 * @type {number}
 */
blk.sim.controllers.PlayerController.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.EntityType.PLAYER_CONTROLLER);


if (gf.CLIENT) {
  /**
   * @override
   */
  blk.sim.controllers.PlayerController.prototype.processInput = function(
      frame, inputData) {
    var state = /** @type {!blk.sim.controllers.PlayerControllerState} */ (
        this.getState());
    var target = this.getTarget();

    // TODO(benvanik): input

    return true;
  };
}



/**
 * Controller entity state.
 * @constructor
 * @extends {blk.sim.ControllerState}
 * @param {!gf.sim.Entity} entity Entity that this object stores state for.
 * @param {!gf.sim.VariableTable=} opt_variableTable A subclass's variable
 *     table, if subclassed.
 */
blk.sim.controllers.PlayerControllerState = function(
    entity, opt_variableTable) {
  var variableTable = opt_variableTable || gf.sim.EntityState.getVariableTable(
      blk.sim.controllers.PlayerControllerState.declareVariables);
  goog.base(this, entity, variableTable);
};
goog.inherits(blk.sim.controllers.PlayerControllerState,
    blk.sim.ControllerState);


/**
 * @override
 */
blk.sim.controllers.PlayerControllerState.declareVariables = function(
    variableList) {
  blk.sim.ControllerState.declareVariables(variableList);
};
