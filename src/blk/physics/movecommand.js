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

goog.provide('blk.physics.MoveAction');
goog.provide('blk.physics.MoveCommand');
goog.provide('blk.physics.MoveTranslation');

goog.require('goog.vec.Vec4');


/**
 * Bitmask values used to indicate movement direction along any given axis.
 * Expected to be <= 8 bits.
 * @enum {number}
 */
blk.physics.MoveTranslation = {
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
blk.physics.MoveAction = {
  /**
   * Use the currently selected inventory item.
   */
  USE: 1 << 0
};



/**
 * A single user movement command.
 *
 * @constructor
 */
blk.physics.MoveCommand = function() {
  /**
   * Sequence identifier.
   * @type {number}
   */
  this.sequence = 0;

  /**
   * Game simulation time the move command was generated.
   * @type {number}
   */
  this.time = 0;

  /**
   * Amount of time this move command covers.
   * This is in integer milliseconds.
   * @type {number}
   */
  this.timeDelta = 0;

  /**
   * Viewport rotation quaternion at the time the command was generated.
   * @type {!goog.vec.Vec4.Type}
   */
  this.viewRotation = goog.vec.Vec4.createFloat32();

  /**
   * Bitmask indicating translation movement.
   * Zero or more bits set from {@see blk.physics.MoveTranslation}.
   * Expected to be <= 8 bits.
   * @type {number}
   */
  this.translation = 0;

  /**
   * Bitmask indicating actions.
   * Zero or more bits set from {@see blk.physics.MoveAction}.
   * Expected to be <= 32 bits.
   * @type {number}
   */
  this.actions = 0;

  /**
   * Whether this command has been predicted on the client already.
   * @type {boolean}
   */
  this.havePredicted = false;
};


/**
 * Clamps all values to be safe for sending over the network.
 */
blk.physics.MoveCommand.prototype.makeSafe = function() {
};
