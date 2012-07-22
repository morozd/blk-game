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
goog.require('gf.sim.EntityState');
goog.require('goog.vec.Mat4');
goog.require('goog.vec.Quaternion');



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

  // TODO(benvanik): add vars:
  // - controller entity ID
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
 * Actor entity state.
 * @constructor
 * @extends {blk.sim.ModelState}
 * @param {!gf.sim.Entity} entity Entity that this object stores state for.
 * @param {gf.sim.VariableTable=} opt_variableTable A subclass's variable table.
 */
blk.sim.ActorState = function(entity, opt_variableTable) {
  var variableTable = opt_variableTable || gf.sim.EntityState.getVariableTable(
      blk.sim.ActorState.declareVariables);
  goog.base(this, entity, variableTable);
};
goog.inherits(blk.sim.ActorState,
    blk.sim.ModelState);


/**
 * @override
 */
blk.sim.ActorState.declareVariables = function(
    variableList) {
  blk.sim.ModelState.declareVariables(variableList);
};
