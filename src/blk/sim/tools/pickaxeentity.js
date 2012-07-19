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

goog.provide('blk.sim.entities.PickaxeEntity');
goog.provide('blk.sim.tools.PickaxeEntity');

goog.require('blk.sim');
goog.require('blk.sim.entities.EntityType');
goog.require('blk.sim.entities.ToolEntity');
goog.require('gf.sim');



/**
 * Pickaxe tool entity.
 * A melee tool for thwacking the world.
 *
 * @constructor
 * @extends {blk.sim.entities.ToolEntity}
 * @param {!gf.sim.Simulator} simulator Owning simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.entities.PickaxeEntity = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);
};
goog.inherits(blk.sim.entities.PickaxeEntity, blk.sim.entities.ToolEntity);


/**
 * Entity ID.
 * @const
 * @type {number}
 */
blk.sim.tools.PickaxeEntity.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.entities.EntityType.PICKAXE_TOOL);



/**
 * Pickaxe entity state.
 * @constructor
 * @extends {blk.sim.entities.ToolEntity.State}
 * @param {!gf.sim.Entity} entity Entity that this object stores state for.
 * @param {!gf.sim.VariableTable} variableTable A subclass's variable table.
 */
blk.sim.entities.PickaxeEntity.State = function(entity, variableTable) {
  goog.base(this, entity, variableTable);
};
goog.inherits(blk.sim.entities.PickaxeEntity.State,
    blk.sim.entities.ToolEntity.State);


/**
 * @override
 */
blk.sim.entities.PickaxeEntity.State.declareVariables = function(
    variableList) {
  blk.sim.entities.ToolEntity.State.declareVariables(variableList);
};
