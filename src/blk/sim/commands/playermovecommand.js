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
goog.require('gf.vec.Quaternion');


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


// TODO(benvanik): find a nice way to avoid the up/down bits
// This is easy to do on the server (as commands are executed only once) but
// a bit trickier on the client with prediction
// When more actions are added and this exceeds 8 bits, figure it out :)
/**
 * Bitmask values used to indicate the kind of action a player is toggling.
 * Expected to be <= 8 bits.
 * @enum {number}
 */
blk.sim.commands.PlayerMoveAction = {
  /**
   * Signal bit indicating that any of the actions should be performed at a
   * given offset in the viewport instead of at the center.
   * When this bit is present the screenX/screenY values will be set to [0-1]
   * values indicating where on the screen the action was performed at.
   */
  PERFORM_AT_POINT: 1 << 0,

  /**
   * Normal usage mode, held.
   */
  USE_NORMAL: 1 << 1,

  /**
   * Normal usage mode, latch down.
   */
  USE_NORMAL_DOWN: 1 << 2,

  /**
   * Normal usage mode, latch up.
   */
  USE_NORMAL_UP: 1 << 3,

  /**
   * Alternate usage mode, held.
   */
  USE_ALTERNATE: 1 << 4,

  /**
   * Alternate usage mode, latch down.
   */
  USE_ALTERNATE_DOWN: 1 << 5,

  /**
   * Alternate usage mode, latch up.
   */
  USE_ALTERNATE_UP: 1 << 6
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

  /**
   * Quantized screen X.
   * From [0-1] to [0-0xFFFF] to fit in a uint16.
   * @type {number}
   */
  this.screenX_ = 0;

  /**
   * Quantized screen Y.
   * From [0-1] to [0-0xFFFF] to fit in a uint16.
   * @type {number}
   */
  this.screenY_ = 0;

  /**
   * Quantized yaw angle.
   * @private
   * @type {number}
   */
  this.yaw_ = 0;

  /**
   * Quantized pitch angle.
   * @private
   * @type {number}
   */
  this.pitch_ = 0;

  /**
   * Quantized roll angle.
   * @private
   * @type {number}
   */
  this.roll_ = 0;
};
goog.inherits(blk.sim.commands.PlayerMoveCommand, gf.sim.PredictedCommand);


/**
 * @return {number} [0-1] screen coordinate on X, if
 *     {@see blk.sim.commands.PlayerMoveAction#PERFORM_AT_POINT} is set.
 */
blk.sim.commands.PlayerMoveCommand.prototype.getScreenX = function() {
  return this.screenX_ / 0xFFFF;
};


/**
 * @return {number} [0-1] screen coordinate on Y, if
 *     {@see blk.sim.commands.PlayerMoveAction#PERFORM_AT_POINT} is set.
 */
blk.sim.commands.PlayerMoveCommand.prototype.getScreenY = function() {
  return this.screenY_ / 0xFFFF;
};


/**
 * Sets the screen coordinates for a command and mark it with the
 * {@see blk.sim.commands.PlayerMoveAction#PERFORM_AT_POINT} bit.
 * @param {number} screenX Screen X in [0-1].
 * @param {number} screenY Screen Y in [0-1].
 */
blk.sim.commands.PlayerMoveCommand.prototype.setScreenCoordinates = function(
    screenX, screenY) {
  this.actions |= blk.sim.commands.PlayerMoveAction.PERFORM_AT_POINT;
  this.screenX_ = (screenX * 0xFFFF) | 0;
  this.screenY_ = (screenY * 0xFFFF) | 0;
};


/**
 * Sets the euler angles of view rotation.
 * @param {number} yaw Yaw angle, in radians.
 * @param {number} pitch Pitch angle, in radians.
 * @param {number} roll Roll angle, in radians.
 */
blk.sim.commands.PlayerMoveCommand.prototype.setAngles = function(
    yaw, pitch, roll) {
  // Quantize to [-32767,32767] by converting to degrees
  // TODO(benvanik): even fewer bits?
  this.yaw_ = (((yaw * 180 / Math.PI) % 360) / 360 * 32767) | 0;
  this.pitch_ = (((pitch * 180 / Math.PI) % 360) / 360 * 32767) | 0;
  this.roll_ = (((roll * 180 / Math.PI) % 360) / 360 * 32767) | 0;
};


/**
 * Constant to multiply angles by unquantize.
 * @private
 * @const
 * @type {number}
 */
blk.sim.commands.PlayerMoveCommand.UNQUANT_CONST_ =
    1 / 32767 * 360 * Math.PI / 180;


/**
 * Calculates a quaternion for the view rotation based.
 * @param {!goog.vec.Quaternion.Float32} result Result quaternion.
 */
blk.sim.commands.PlayerMoveCommand.prototype.getQuaternion = function(result) {
  // Unquantize
  gf.vec.Quaternion.makeEulerZYX(result,
      this.yaw_ * blk.sim.commands.PlayerMoveCommand.UNQUANT_CONST_,
      this.pitch_ * blk.sim.commands.PlayerMoveCommand.UNQUANT_CONST_,
      this.roll_ * blk.sim.commands.PlayerMoveCommand.UNQUANT_CONST_);
};


/**
 * @override
 */
blk.sim.commands.PlayerMoveCommand.prototype.read = function(reader) {
  goog.base(this, 'read', reader);

  this.translation = reader.readUint8();
  this.actions = reader.readUint8();
  if (this.actions & blk.sim.commands.PlayerMoveAction.PERFORM_AT_POINT) {
    this.screenX_ = reader.readUint16();
    this.screenY_ = reader.readUint16();
  }
  this.yaw_ = reader.readInt16();
  this.pitch_ = reader.readInt16();
  //this.roll_ = reader.readInt16();
};


/**
 * @override
 */
blk.sim.commands.PlayerMoveCommand.prototype.write = function(writer) {
  goog.base(this, 'write', writer);

  writer.writeUint8(this.translation);
  writer.writeUint8(this.actions);
  if (this.actions & blk.sim.commands.PlayerMoveAction.PERFORM_AT_POINT) {
    writer.writeUint16(this.screenX_);
    writer.writeUint16(this.screenY_);
  }
  writer.writeInt16(this.yaw_);
  writer.writeInt16(this.pitch_);
  //writer.writeInt16(this.roll_);
};


/**
 * Command ID.
 * @const
 * @type {number}
 */
blk.sim.commands.PlayerMoveCommand.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.commands.CommandType.PLAYER_MOVE);


/**
 * Command flags.
 * @const
 * @type {number}
 */
blk.sim.commands.PlayerMoveCommand.FLAGS = gf.sim.PredictedCommand.FLAGS;
