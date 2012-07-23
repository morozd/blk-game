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

goog.provide('blk.sim.controllers.ClientFpsController');
goog.provide('blk.sim.controllers.FpsController');

goog.require('blk.sim');
goog.require('blk.sim.Controller');
goog.require('blk.sim.EntityType');
goog.require('blk.sim.commands.PlayerMoveCommand');
goog.require('blk.sim.commands.PlayerMoveTranslation');
goog.require('gf.input.MouseButton');
goog.require('gf.sim');
goog.require('goog.events.KeyCodes');
goog.require('goog.vec.Quaternion');



/**
 * FPS player controller entity.
 * Handles movement and input actions like an FPS.
 *
 * @constructor
 * @extends {blk.sim.Controller}
 * @param {!gf.sim.Simulator} simulator Owning simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.controllers.FpsController = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);
};
goog.inherits(blk.sim.controllers.FpsController,
    blk.sim.Controller);


/**
 * Entity ID.
 * @const
 * @type {number}
 */
blk.sim.controllers.FpsController.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.EntityType.FPS_CONTROLLER);


/**
 * @override
 */
blk.sim.controllers.FpsController.prototype.executeCommand = function(
    command) {
  goog.base(this, 'executeCommand', command);

  var target = this.getTarget();
  if (!target) {
    return;
  }

  if (command instanceof blk.sim.commands.PlayerMoveCommand) {
    var targetState = /** @type {!gf.sim.SpatialEntityState} */ (
        target.getState());

    // Set view rotation directly
    var q = blk.sim.controllers.FpsController.tmpQuat_;
    command.getQuaternion(q);
    targetState.setRotation(q);

    // TODO(benvanik): apply translation
  }
};


/**
 * Scratch quaternion.
 * @private
 * @type {!goog.vec.Quaternion.Float32}
 */
blk.sim.controllers.FpsController.tmpQuat_ =
    goog.vec.Quaternion.createFloat32();



/**
 * Client-side FPS player controller entity.
 * Handles movement and input actions like an FPS, storing state for input
 * handling and other things.
 *
 * @constructor
 * @extends {blk.sim.controllers.FpsController}
 * @param {!gf.sim.Simulator} simulator Owning simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.controllers.ClientFpsController = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);

  /**
   * Mouse input sensitivity scalar.
   * @type {number}
   */
  this.mouseSensitivity = 1;

  /**
   * Whether to smooth mouse input.
   * @type {boolean}
   */
  this.mouseSmoothing = true;

  /**
   * @private
   * @type {number}
   */
  this.averageX_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.averageY_ = 0;

  /**
   * Viewport angle yaw.
   * @private
   * @type {number}
   */
  this.yaw_ = 0.0001;

  /**
   * Viewport angle pitch.
   * @private
   * @type {number}
   */
  this.pitch_ = 0;

  /**
   * Viewport angle roll.
   * @private
   * @type {number}
   */
  this.roll_ = 0;

  // TODO(benvanik): make mode, move to state vars
  /**
   * Whether the camera is free-floating and should have 6-degrees of freedom.
   * If not set then certain angles will be constrained (such as pitch).
   * @type {boolean}
   */
  this.freeFloating = true;
};
goog.inherits(blk.sim.controllers.ClientFpsController,
    blk.sim.controllers.FpsController);


/**
 * Speed of the mouse drag move operation.
 * @private
 * @const
 * @type {number}
 */
blk.sim.controllers.ClientFpsController.MOUSE_DRAG_SPEED_ = 0.20;


/**
 * Speed of the mouse lock move operation.
 * @private
 * @const
 * @type {number}
 */
blk.sim.controllers.ClientFpsController.MOUSE_LOCK_SPEED_ = 0.25;


/**
 * Speed of angular movement.
 * @private
 * @const
 * @type {number}
 */
blk.sim.controllers.ClientFpsController.ANGLE_SPEED_ = 1 / 140 * Math.PI;


/**
 * Maximum pitch value (in either direction).
 * @private
 * @const
 * @type {number}
 */
blk.sim.controllers.ClientFpsController.MAX_PITCH_ = 85 * Math.PI / 180;


/**
 * @override
 */
blk.sim.controllers.ClientFpsController.prototype.processInput = function(
    frame, inputData) {
  var state = /** @type {!blk.sim.controllers.FpsControllerState} */ (
      this.getState());
  var target = this.getTarget();
  if (!target) {
    return true;
  }

  this.processMovement_(frame, inputData, target);
  this.processActions_(frame, inputData, target);

  return true;
};


/**
 * Processes movement and generates a
 * {@see blk.sim.commands.PlayerMoveCommand} if needed.
 * @private
 * @param {!gf.RenderFrame} frame Render frame.
 * @param {!gf.input.Data} inputData Input data.
 * @param {!blk.sim.Actor} target Target actor entity.
 */
blk.sim.controllers.ClientFpsController.prototype.processMovement_ =
    function(frame, inputData, target) {
  // TODO(benvanik): to reduce network traffic this needs to be reworked such
  // that this function is only capturing state. Each client update tick the
  // state should then be flushed, ensuring that only 20hz of input is ever
  // sent (so 20 commands/sec max).
  // Right now it very easy to flood the network with player move commands :(

  // Sample inputs
  var translation = this.sampleMove_(frame, inputData);
  var lookChanged = this.sampleLook_(frame, inputData);

  // Clamp rotation angles
  if (!this.freeFloating) {
    var maxPitch = blk.sim.controllers.ClientFpsController.MAX_PITCH_;
    this.pitch_ = Math.max(-maxPitch, Math.min(maxPitch, this.pitch_));
    this.roll_ = 0;
  }

  // Generate a movement command, if movement occurred
  var didChange = !!translation || lookChanged;
  if (didChange) {
    var cmd = /** @type {!blk.sim.commands.PlayerMoveCommand} */ (
        this.createCommand(blk.sim.commands.PlayerMoveCommand.ID));
    cmd.setTime(frame.time);
    cmd.translation = translation;
    cmd.setAngles(this.yaw_, this.pitch_, this.roll_);
    this.simulator.sendCommand(cmd);
  }
};


/**
 * Processes actions and generates instances of
 * {@see blk.sim.commands.ToolUseCommand} and others if needed.
 * @private
 * @param {!gf.RenderFrame} frame Render frame.
 * @param {!gf.input.Data} inputData Input data.
 * @param {!blk.sim.Actor} target Target actor entity.
 */
blk.sim.controllers.ClientFpsController.prototype.processActions_ =
    function(frame, inputData, target) {
  //
};


/**
 * Samples input for entity movement.
 * @private
 * @param {!gf.RenderFrame} frame Current render frame.
 * @param {!gf.input.Data} inputData Frame input data.
 * @return {number} Translation movement bitmask.
 */
blk.sim.controllers.ClientFpsController.prototype.sampleMove_ = function(
    frame, inputData) {
  var keyboardData = inputData.keyboard;

  var moveMask = 0;

  // Keyboard move
  if (keyboardData.isKeyDown(goog.events.KeyCodes.W)) {
    moveMask |= blk.sim.commands.PlayerMoveTranslation.NEG_Z;
  }
  if (keyboardData.isKeyDown(goog.events.KeyCodes.S)) {
    moveMask |= blk.sim.commands.PlayerMoveTranslation.POS_Z;
  }
  if (keyboardData.isKeyDown(goog.events.KeyCodes.A)) {
    moveMask |= blk.sim.commands.PlayerMoveTranslation.NEG_X;
  }
  if (keyboardData.isKeyDown(goog.events.KeyCodes.D)) {
    moveMask |= blk.sim.commands.PlayerMoveTranslation.POS_X;
  }
  if (keyboardData.isKeyDown(goog.events.KeyCodes.Q)) {
    moveMask |= blk.sim.commands.PlayerMoveTranslation.POS_Y;
  }
  if (keyboardData.isKeyDown(goog.events.KeyCodes.Z)) {
    moveMask |= blk.sim.commands.PlayerMoveTranslation.NEG_Y;
  }

  // Jumping
  if (keyboardData.isKeyDown(goog.events.KeyCodes.SPACE)) {
    moveMask |= blk.sim.commands.PlayerMoveTranslation.JUMP;
  }

  // TODO(benvanik): touch input handling (virtual dpad)

  // TODO(benvanik): gamepad handling

  return moveMask;
};


/**
 * Samples input for entity viewport adjustment.
 * @private
 * @param {!gf.RenderFrame} frame Current render frame.
 * @param {!gf.input.Data} inputData Frame input data.
 * @return {boolean} True if the viewport changed.
 */
blk.sim.controllers.ClientFpsController.prototype.sampleLook_ = function(
    frame, inputData) {
  var keyboardData = inputData.keyboard;
  var mouseData = inputData.mouse;

  var oldYaw = this.yaw_;
  var oldPitch = this.pitch_;
  var oldRoll = this.roll_;

  // View angle rotation via keyboard
  if (keyboardData.isKeyDown(goog.events.KeyCodes.LEFT)) {
    this.yaw_ += blk.sim.controllers.ClientFpsController.ANGLE_SPEED_;
  }
  if (keyboardData.isKeyDown(goog.events.KeyCodes.RIGHT)) {
    this.yaw_ -= blk.sim.controllers.ClientFpsController.ANGLE_SPEED_;
  }
  if (keyboardData.isKeyDown(goog.events.KeyCodes.UP)) {
    this.pitch_ += blk.sim.controllers.ClientFpsController.ANGLE_SPEED_;
  }
  if (keyboardData.isKeyDown(goog.events.KeyCodes.DOWN)) {
    this.pitch_ -= blk.sim.controllers.ClientFpsController.ANGLE_SPEED_;
  }
  if (keyboardData.isKeyDown(goog.events.KeyCodes.OPEN_SQUARE_BRACKET)) {
    this.roll_ += blk.sim.controllers.ClientFpsController.ANGLE_SPEED_;
  }
  if (keyboardData.isKeyDown(goog.events.KeyCodes.CLOSE_SQUARE_BRACKET)) {
    this.roll_ -= blk.sim.controllers.ClientFpsController.ANGLE_SPEED_;
  }

  // Mouse move (requiring a drag if not locked)
  var requireDrag = !mouseData.isLocked;
  if (!requireDrag || !!(mouseData.buttons & gf.input.MouseButton.LEFT)) {
    var speed = mouseData.isLocked ?
        blk.sim.controllers.ClientFpsController.MOUSE_DRAG_SPEED_ :
        blk.sim.controllers.ClientFpsController.MOUSE_LOCK_SPEED_;
    var dx = mouseData.dx * speed;
    var dy = mouseData.dy * speed;
    if (this.mouseSmoothing) {
      this.averageX_ = (this.averageX_ + dx) / 2;
      this.averageY_ = (this.averageY_ + dy) / 2;
      if (Math.abs(this.averageX_) < 0.01) {
        this.averageX_ = 0;
      }
      if (Math.abs(this.averageY_) < 0.01) {
        this.averageY_ = 0;
      }
    } else {
      this.averageX_ = dx;
      this.averageY_ = dy;
    }
    var dyaw = this.averageX_ * this.mouseSensitivity;
    var dpitch = this.averageY_ * this.mouseSensitivity;
    this.yaw_ -=
        dyaw * blk.sim.controllers.ClientFpsController.ANGLE_SPEED_;
    this.pitch_ -=
        dpitch * blk.sim.controllers.ClientFpsController.ANGLE_SPEED_;
  }

  // TODO(benvanik): touch input handling

  // TODO(benvanik): gamepad handling

  return (
      this.yaw_ != oldYaw || this.pitch_ != oldPitch || this.roll_ != oldRoll);
};
