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
goog.require('goog.asserts');



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

  // TODO(benvanik): cache block type
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
 * Gets the block type this tool creates.
 * @return {!blk.env.Block} Block type.
 */
blk.sim.tools.BlockTool.prototype.getBlockType = function() {
  // TODO(benvanik): make a million times faster - good god
  var state = /** @type {!blk.sim.tools.BlockToolState} */ (this.getState());
  var value = state.getBlockType();
  var map = blk.sim.getMap(this);
  var block = map.blockSet.getBlockWithId(value);
  goog.asserts.assert(block);
  return block;
};


/**
 * Sets the block type this tool creates.
 * @param {!blk.env.Block} value Block type.
 */
blk.sim.tools.BlockTool.prototype.setBlockType = function(value) {
  var state = /** @type {!blk.sim.tools.BlockToolState} */ (this.getState());
  state.setBlockType(value.id);
};


/**
 * @override
 */
blk.sim.tools.BlockTool.prototype.performAction = function(params, action) {
  var maxDistance = 100;
  var intersection = params.chunkView.intersectBlock(params.ray, maxDistance);
  if (intersection && intersection.distance <= maxDistance) {
    gf.log.write('clicked block',
        intersection.blockX, intersection.blockY, intersection.blockZ);
    if (action == 0) {
      this.addBlock_(params, intersection);
    } else if (action == 1) {
      this.setBlock_(
          params,
          intersection.blockX,
          intersection.blockY,
          intersection.blockZ,
          null);
    }
  }
};


/**
 * Adds a block based on the given intersection.
 * @private
 * @param {!blk.sim.Tool.ActionParameters} params Action parameters.
 * @param {!blk.env.BlockIntersection} intersection Intersection.
 */
blk.sim.tools.BlockTool.prototype.addBlock_ = function(params, intersection) {
  var wx = intersection.blockX;
  var wy = intersection.blockY;
  var wz = intersection.blockZ;

  // Determine the face intersected and add the block there
  var dx = 0;
  var dy = 0;
  var dz = 0;
  var ipt = intersection.point;
  if (ipt[0] == wx) {
    dx--;
  } else if (ipt[0] == wx + 1) {
    dx++;
  }
  if (ipt[1] == wy) {
    dy--;
  } else if (ipt[1] == wy + 1) {
    dy++;
  }
  if (ipt[2] == wz) {
    dz--;
  } else if (ipt[2] == wz + 1) {
    dz++;
  }
  var nx = wx + dx;
  var ny = wy + dy;
  var nz = wz + dz;

  this.setBlock_(params, nx, ny, nz, this.getBlockType());
};


/**
 * Sets the block at the given coordinates.
 * @private
 * @param {!blk.sim.Tool.ActionParameters} params Action parameters.
 * @param {number} x Block X.
 * @param {number} y Block Y.
 * @param {number} z Block Z.
 * @param {blk.env.Block} block Block type, or null to remove.
 */
blk.sim.tools.BlockTool.prototype.setBlock_ = function(params, x, y, z, block) {
  var filterPlayer = params.player;
  var data = block ? block.id << 8 : 0;
  var world = blk.sim.getWorld(this);
  world.setBlock(x, y, z, data, filterPlayer);
};
