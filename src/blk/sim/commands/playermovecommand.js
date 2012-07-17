/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
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

goog.provide('blk.sim.commands.PlayerMoveAction');
goog.provide('blk.sim.commands.PlayerMoveCommand');
goog.provide('blk.sim.commands.PlayerMoveTranslation');

goog.require('blk.sim');
goog.require('blk.sim.commands.CommandType');
goog.require('gf.sim');
goog.require('gf.sim.PredictedCommand');
goog.require('goog.vec.Quaternion');


/**
 * Bitmask values used to indicate movement direction along any given axis.
 * Expected to be <= 8 bits.
 * @enum {number}
 */
blk.sim.commands.PlayerMoveTranslation = {
  POS_X: 1 << 0,
  NEG_X: 1 << 1,
  POS_Y: 1 << 2,
  NEG_Y: 1 << 3,
  POS_Z: 1 << 4,
  NEG_Z: 1 << 5,
  CROUCH: 1 << 6,
  JUMP: 1 << 7
};


/**
 * Bitmask values used to indicate actions performed by the player.
 * Expected to be <= 8 bits.
 * @enum {number}
 */
blk.sim.commands.PlayerMoveAction = {
  /**
   * Use the currently selected inventory item.
   */
  USE: 1 << 0,

  /**
   * Use the currently selected inventory item in its alternate mode.
   */
  USE_ALT: 1 << 1

  // TODO(benvanik): change inventory/etc?
};



/**
 * Simulation command for player movement.
 * Sent from client to server to signal player input events. Part of the
 * prediction system.
 *
 * @constructor
 * @extends {gf.sim.PredictedCommand}
 * @param {!gf.sim.CommandFactory} commandFactory Command factory.
 */
blk.sim.commands.PlayerMoveCommand = function(commandFactory) {
  goog.base(this, commandFactory);

  /**
   * Viewport rotation quaternion at the time the command was generated.
   * @type {!goog.vec.Quaternion.Float32}
   */
  this.viewRotation = goog.vec.Quaternion.createFloat32();

  /**
   * Bitmask indicating translation movement.
   * Zero or more bits set from {@see blk.sim.commands.PlayerMoveTranslation}.
   * Expected to be <= 8 bits.
   * @type {number}
   */
  this.translation = 0;

  /**
   * Bitmask indicating actions.
   * Zero or more bits set from {@see blk.sim.commands.PlayerMoveAction}.
   * Expected to be <= 8 bits.
   * @type {number}
   */
  this.actions = 0;
};
goog.inherits(blk.sim.commands.PlayerMoveCommand, gf.sim.PredictedCommand);


/**
 * @override
 */
blk.sim.commands.PlayerMoveCommand.prototype.read = function(reader) {
  goog.base(this, 'read', reader);

  reader.readVec4(this.viewRotation);
  this.translation = reader.readUint8();
  this.actions = reader.readUint8();
};


/**
 * @override
 */
blk.sim.commands.PlayerMoveCommand.prototype.write = function(writer) {
  goog.base(this, 'write', writer);

  writer.writeVec4(this.viewRotation);
  writer.writeUint8(this.translation);
  writer.writeUint8(this.actions);
};


/**
 * Command ID.
 * @const
 * @type {number}
 */
blk.sim.commands.PlayerMoveCommand.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.commands.CommandType.PLAYER_MOVE);
