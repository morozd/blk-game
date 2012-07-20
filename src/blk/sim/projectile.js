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

goog.provide('blk.sim.Projectile');

goog.require('blk.sim.Model');



/**
 * Abstract renderable projectile entity.
 *
 * @constructor
 * @extends {blk.sim.Model}
 * @param {!gf.sim.Simulator} simulator Owning simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.Projectile = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);
};
goog.inherits(blk.sim.Projectile, blk.sim.Model);



/**
 * Projectile entity state.
 * @constructor
 * @extends {blk.sim.Model.State}
 * @param {!gf.sim.Entity} entity Entity that this object stores state for.
 * @param {!gf.sim.VariableTable} variableTable A subclass's variable table.
 */
blk.sim.Projectile.State = function(entity, variableTable) {
  goog.base(this, entity, variableTable);
};
goog.inherits(blk.sim.Projectile.State,
    blk.sim.Model.State);


/**
 * @override
 */
blk.sim.Projectile.State.declareVariables = function(
    variableList) {
  blk.sim.Model.State.declareVariables(variableList);
};
