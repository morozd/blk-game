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

goog.provide('blk.sim.tools.PickaxeTool');

goog.require('blk.sim');
goog.require('blk.sim.EntityType');
goog.require('blk.sim.Tool');
goog.require('gf.sim');



/**
 * Pickaxe tool entity.
 * A melee tool for thwacking the world.
 *
 * @constructor
 * @extends {blk.sim.Tool}
 * @param {!gf.sim.Simulator} simulator Owning simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.tools.PickaxeTool = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);
};
goog.inherits(blk.sim.tools.PickaxeTool, blk.sim.Tool);


/**
 * Entity ID.
 * @const
 * @type {number}
 */
blk.sim.tools.PickaxeTool.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.EntityType.PICKAXE_TOOL);
