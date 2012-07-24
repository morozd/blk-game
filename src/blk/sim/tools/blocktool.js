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

goog.provide('blk.sim.tools.BlockTool');

goog.require('blk.sim');
goog.require('blk.sim.EntityType');
goog.require('blk.sim.Tool');
goog.require('gf.log');
goog.require('gf.sim');



/**
 * Block tool entity.
 * A block placement tool.
 *
 * @constructor
 * @extends {blk.sim.Tool}
 * @param {!gf.sim.Simulator} simulator Owning simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.tools.BlockTool = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);
};
goog.inherits(blk.sim.tools.BlockTool, blk.sim.Tool);


/**
 * Entity ID.
 * @const
 * @type {number}
 */
blk.sim.tools.BlockTool.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.EntityType.BLOCK_TOOL);


/**
 * Sets the block type this tool represents.
 * @param {!blk.env.Block} value Block type.
 */
blk.sim.tools.BlockTool.prototype.setBlockType = function(value) {
  //
};


/**
 * @override
 */
blk.sim.tools.BlockTool.prototype.performAction = function(
    time, viewport, chunkView, user, screenX, screenY, action) {
  var ray = viewport.getRay(screenX, screenY);
  var maxDistance = 100;
  var intersection = chunkView.intersectBlock(ray, maxDistance);
  if (intersection && intersection.distance <= maxDistance) {
    gf.log.write('clicked block',
        intersection.blockX, intersection.blockY, intersection.blockZ);
  } else {
    gf.log.write('missed block');
  }
};
