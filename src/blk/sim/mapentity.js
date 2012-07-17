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

goog.provide('blk.sim.ClientMapEntity');
goog.provide('blk.sim.MapEntity');
goog.provide('blk.sim.ServerMapEntity');

goog.require('blk.sim');
goog.require('blk.sim.entities.EntityType');
goog.require('gf.sim');
goog.require('gf.sim.ClientEntity');
goog.require('gf.sim.EntityState');
goog.require('gf.sim.ServerEntity');
goog.require('goog.asserts');



/**
 * Map entity.
 * A global singleton entity that defines map parameters.
 *
 *
 *
 * @constructor
 */
blk.sim.MapEntity = function() {
  goog.asserts.fail('Cannot create shared proto class');
};


/**
 * Entity ID.
 * @const
 * @type {number}
 */
blk.sim.MapEntity.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.entities.EntityType.MAP);


/**
 * Test shared method.
 * @param {number} a A.
 * @return {number} Value.
 */
blk.sim.MapEntity.prototype.sharedMethod = function(a) {
  return a + 1;
};



/**
 * Map entity state.
 * @constructor
 * @extends {gf.sim.EntityState}
 * @param {!gf.sim.Entity} entity Entity that this object stores state for.
 */
blk.sim.MapEntity.State = function(entity) {
  var vtable = gf.sim.EntityState.getVariableTable(blk.sim.MapEntity.State);
  goog.base(this, entity, vtable);

  // TODO(benvanik): add vars:
  // - day cycle duration
  // - sky color
  // - ambient light color
  // - sun light color
  // - fog color
  // - fog params?
};
goog.inherits(blk.sim.MapEntity.State, gf.sim.EntityState);


/**
 * @override
 */
blk.sim.MapEntity.State.declareVariables = function(variableList) {
  // TODO(benvanik): add vars
};



/**
 * Client-side map entity.
 *
 * @constructor
 * @extends {gf.sim.ClientEntity}
 * @param {!gf.sim.ClientSimulator} simulator Owning client simulator.
 * @param {!gf.sim.EntityType} entityType Entity type.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.ClientMapEntity = function(
    simulator, entityType, entityId, entityFlags) {
  goog.base(this, simulator, entityType, entityId, entityFlags);
};
goog.inherits(blk.sim.ClientMapEntity, gf.sim.ClientEntity);
goog.mixin(blk.sim.ClientMapEntity.prototype, blk.sim.MapEntity.prototype);



/**
 * Server-side map entity.
 *
 * @constructor
 * @extends {gf.sim.ServerEntity}
 * @param {!gf.sim.ServerSimulator} simulator Owning server simulator.
 * @param {!gf.sim.EntityType} entityType Entity type.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.ServerMapEntity = function(
    simulator, entityType, entityId, entityFlags) {
  goog.base(this, simulator, entityType, entityId, entityFlags);
};
goog.inherits(blk.sim.ServerMapEntity, gf.sim.ServerEntity);
goog.mixin(blk.sim.ServerMapEntity.prototype, blk.sim.MapEntity.prototype);
