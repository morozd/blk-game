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

goog.provide('blk.sim.World');

goog.require('blk.game.SoundBanks');
goog.require('blk.sim');
goog.require('blk.sim.EntityType');
goog.require('blk.sim.commands.SetBlockCommand');
goog.require('gf');
goog.require('gf.log');
goog.require('gf.sim');
goog.require('gf.sim.SceneEntity');
goog.require('gf.sim.SchedulingPriority');
goog.require('gf.sim.search.ListDatabase');
goog.require('goog.asserts');
goog.require('goog.vec.Vec3');



/**
 * Map entity.
 * The spatial scene root for all spatial entities.
 *
 * @constructor
 * @extends {gf.sim.SceneEntity}
 * @param {!gf.sim.Simulator} simulator Owning simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.World = function(
    simulator, entityFactory, entityId, entityFlags) {
  // TODO(benvanik): custom search database
  var db = new gf.sim.search.ListDatabase();
  goog.base(this, simulator, entityFactory, entityId, entityFlags, db);

  /**
   * Map this world is drawing.
   * @private
   * @type {blk.env.Map}
   */
  this.map_ = null;

  //this.scheduleUpdate(gf.sim.SchedulingPriority.NORMAL);
};
goog.inherits(blk.sim.World, gf.sim.SceneEntity);


/**
 * Entity ID.
 * @const
 * @type {number}
 */
blk.sim.World.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.EntityType.WORLD);


/**
 * Gets the map.
 * @return {!blk.env.Map} The map.
 */
blk.sim.World.prototype.getMap = function() {
  goog.asserts.assert(this.map_);
  return this.map_;
};


/**
 * Sets the map.
 * This can only be called once and must be called immediately after creating
 * the entity.
 * @param {!blk.env.Map} map Map to use.
 */
blk.sim.World.prototype.setMap = function(map) {
  goog.asserts.assert(!this.map_);
  this.map_ = map;

  // TODO(benvanik): could issue some commands here relating to map setup
};


if (gf.CLIENT) {
  /**
   * @override
   */
  blk.sim.World.prototype.executeCommand = function(command) {
    goog.base(this, 'executeCommand', command);

    if (command instanceof blk.sim.commands.SetBlockCommand) {
      this.setBlock(command.x, command.y, command.z, command.data);
    }
  };
}


/**
 * @override
 */
blk.sim.World.prototype.update = function(time, timeDelta) {
  var state = /** @type {!blk.sim.WorldState} */ (
      this.getState());

  if (gf.CLIENT) {
    gf.log.write('client var = ' + state.getTestVar());
  } else {
    state.setTestVar(time | 0);
  }

  this.scheduleUpdate(gf.sim.SchedulingPriority.NORMAL, time + 1);
};


if (gf.CLIENT) {
  /**
   * Processes the map for rendering.
   * @this {blk.sim.World}
   * @param {!gf.RenderFrame} frame Current render frame.
   * @param {!gf.vec.Viewport} viewport Current viewport.
   * @param {!blk.graphics.RenderList} renderList Render command list.
   */
  blk.sim.World.prototype.render = function(frame, viewport, renderList) {
    var db = this.getSpatialDatabase();

    // Walk all entities in the viewport and queue for rendering
    db.forEachInViewport(viewport,
        /**
         * @param {!gf.sim.SpatialEntity} spatialEntity Entity.
         * @param {number} distanceToViewport Distance.
         * @return {boolean|undefined} Cancel flag.
         */
        function(spatialEntity, distanceToViewport) {
          var entity = /** @type {!blk.sim.Model} */ (
              spatialEntity);
          entity.render(frame, viewport, distanceToViewport, renderList);
        });
  };
}


// TODO(benvanik): add state vars:
// - day cycle duration
// - sky color
// - ambient light color
// - sun light color
// - fog color
// - fog params?


/**
 * Sets the block at the given coordinates.
 * This will broadcast world changes to all clients, excluding the given user
 * if desired.
 * @param {number} x Block X.
 * @param {number} y Block Y.
 * @param {number} z Block Z.
 * @param {number} data Raw block data.
 * @param {blk.sim.Player=} opt_filterPlayer Player to prevent sending the event
 *     to. This should be a player that initiated the change if the block change
 *     was predicted on the client.
 */
blk.sim.World.prototype.setBlock = function(x, y, z, data, opt_filterPlayer) {
  var map = this.getMap();

  // Validate block type
  if (data && !map.blockSet.hasBlockWithId(data >> 8)) {
    gf.log.write('unknown block type', data);
    return;
  }

  // Change the block in the map
  var oldData = map.setBlock(x, y, z, data);
  if (oldData == data) {
    // No change - ignore
    return;
  }

  if (gf.SERVER) {
    // Broadcast update, if it changed
    // TODO(benvanik): coalesce these changes and push on update?
    // Create command
    var cmd = /** @type {!blk.sim.commands.SetBlockCommand} */ (
        this.createCommand(blk.sim.commands.SetBlockCommand.ID));
    cmd.x = x;
    cmd.y = y;
    cmd.z = z;
    cmd.data = data;
    var filterUser = opt_filterPlayer ? opt_filterPlayer.getUser() : null;
    this.simulator.broadcastCommand(cmd, filterUser);
  } else if (gf.CLIENT) {
    // Play sound effect on block change
    // TODO(benvanik): centralize sound control
    var soundBlockId = (data ? data : oldData) >> 8;
    if (soundBlockId) {
      var block = map.blockSet.getBlockWithId(soundBlockId);
      var cue = block ? block.material.actionCue : null;
      if (cue) {
        var position = blk.sim.World.tmpVec3_;
        position[0] = x; position[1] = y; position[2] = z;
        var controller = blk.sim.getClientController(this);
        controller.playPointSound(
            blk.game.SoundBanks.BLOCKS,
            cue,
            position);
      }
    }
  }
};


/**
 * Scratch Vec3.
 * @private
 * @type {!goog.vec.Vec3.Float32}
 */
blk.sim.World.tmpVec3_ = goog.vec.Vec3.createFloat32();
