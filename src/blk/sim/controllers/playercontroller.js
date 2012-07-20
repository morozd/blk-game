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

goog.require('blk.sim.Controller');
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
 * Controller entity state.
 * @constructor
 * @extends {blk.sim.Controller.State}
 * @param {!gf.sim.Entity} entity Entity that this object stores state for.
 * @param {!gf.sim.VariableTable=} opt_variableTable A subclass's variable
 *     table, if subclassed.
 */
blk.sim.controllers.PlayerController.State = function(entity, opt_variableTable) {
  var variableTable = opt_variableTable || gf.sim.EntityState.getVariableTable(
      blk.sim.controllers.PlayerController.State.declareVariables);
  goog.base(this, entity, variableTable);
};
goog.inherits(blk.sim.controllers.PlayerController.State,
    blk.sim.Controller.State);


/**
 * @override
 */
blk.sim.controllers.PlayerController.State.declareVariables = function(
    variableList) {
  blk.sim.Controller.State.declareVariables(variableList);
};
