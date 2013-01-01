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

goog.require('blk.sim.commands.PlayerMoveAction');
goog.require('blk.sim.commands.PlayerMoveCommand');
goog.require('blk.sim.commands.PlayerMoveTranslation');
goog.require('blk.sim.controllers.FpsController');
/** @suppress {extraRequire} */
goog.require('gf.input.Data');
goog.require('gf.input.MouseButton');
goog.require('goog.events.KeyCodes');



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

  /**
   * Accumulated mouse movement delta.
   * @private
   * @type {number}
   */
  this.dragDelta_ = 0;

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
    frame, inputData, viewport) {
  var state = /** @type {!blk.sim.controllers.FpsControllerState} */ (
      this.getState());
  var target = this.getTarget();
  if (!target) {
    return true;
  }

  this.processMovement_(frame, inputData, target, viewport);

  return true;
};


/**
 * Processes movement and generates a
 * {@see blk.sim.commands.PlayerMoveCommand} if needed.
 * @private
 * @param {!gf.RenderFrame} frame Render frame.
 * @param {!gf.input.Data} inputData Input data.
 * @param {!blk.sim.Actor} target Target actor entity.
 * @param {!gf.vec.Viewport} viewport Previous frame viewport.
 */
blk.sim.controllers.ClientFpsController.prototype.processMovement_ =
    function(frame, inputData, target, viewport) {
  var mouseData = inputData.mouse;
  if (frame.time <= 0) {
    return;
  }

  // TODO(benvanik): to reduce network traffic this needs to be reworked such
  // that this function is only capturing state. Each client update tick the
  // state should then be flushed, ensuring that only 20hz of input is ever
  // sent (so 20 commands/sec max).
  // Right now it very easy to flood the network with player move commands :(

  // Sample inputs
  var translation = this.sampleMove_(frame, inputData);
  var lookChanged = this.sampleLook_(frame, inputData);
  var actions = this.sampleActions_(frame, inputData, viewport);

  // Clamp rotation angles
  if (!this.freeFloating) {
    var maxPitch = blk.sim.controllers.ClientFpsController.MAX_PITCH_;
    this.pitch_ = Math.max(-maxPitch, Math.min(maxPitch, this.pitch_));
    this.roll_ = 0;
  }

  // Generate a movement command, if movement occurred
  var didChange = !!translation || lookChanged || !!actions;
  // TODO(benvanik): find a way to run physics without sending each frame
  didChange = true;
  if (didChange) {
    // Create command
    var cmd = /** @type {!blk.sim.commands.PlayerMoveCommand} */ (
        this.createCommand(blk.sim.commands.PlayerMoveCommand.ID));
    cmd.setTime(frame.time);
    cmd.setTimeDelta(frame.timeDelta);
    cmd.translation = translation;
    cmd.actions = actions;
    cmd.setAngles(this.yaw_, this.pitch_, this.roll_);

    // Get crosshair position bits, if we performed an action
    // This are required to ensure that both click-at-point and mouse-lock
    // center point modes work
    if (actions && !mouseData.isLocked) {
      var mx = mouseData.clientX / viewport.width;
      var my = mouseData.clientY / viewport.height;
      cmd.setScreenCoordinates(mx, my);
    }

    this.simulator.sendCommand(cmd);
  }
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


/**
 * Number of pixels the mouse must move to cancel discrete input actions.
 * @private
 * @const
 * @type {number}
 */
blk.sim.controllers.ClientFpsController.DRAG_HYSTERESIS_ = 4;


// TODO(benvanik): move to var
/**
 * Seconds between action repeats when buttons are held.
 * @private
 * @const
 * @type {number}
 */
blk.sim.controllers.ClientFpsController.ACTION_REPEAT_INTERVAL_ = 250 / 1000;


/**
 * Samples input for actions.
 * @private
 * @param {!gf.RenderFrame} frame Render frame.
 * @param {!gf.input.Data} inputData Input data.
 * @param {!gf.vec.Viewport} viewport Target actor viewport.
 * @return {number} Bitmask of actions.
 */
blk.sim.controllers.ClientFpsController.prototype.sampleActions_ =
    function(frame, inputData, viewport) {
  var keyboardData = inputData.keyboard;
  var mouseData = inputData.mouse;

  var dragHysteresis = blk.sim.controllers.ClientFpsController.DRAG_HYSTERESIS_;

  var actions = 0;

  if (keyboardData.didKeyGoDown(goog.events.KeyCodes.E)) {
    actions |= blk.sim.commands.PlayerMoveAction.USE_NORMAL_DOWN;
    actions |= blk.sim.commands.PlayerMoveAction.USE_NORMAL;
  } else if (keyboardData.isKeyDown(goog.events.KeyCodes.E)) {
    actions |= blk.sim.commands.PlayerMoveAction.USE_NORMAL;
  } else if (keyboardData.didKeyGoUp(goog.events.KeyCodes.E)) {
    actions |= blk.sim.commands.PlayerMoveAction.USE_NORMAL_UP;
  }

  // Right-click emulation
  var useBits = blk.sim.commands.PlayerMoveAction.USE_NORMAL;
  var useDownBits = blk.sim.commands.PlayerMoveAction.USE_NORMAL_DOWN;
  var useUpBits = blk.sim.commands.PlayerMoveAction.USE_NORMAL_UP;
  if (keyboardData.ctrlKey) {
    useBits = blk.sim.commands.PlayerMoveAction.USE_ALTERNATE;
    useDownBits = blk.sim.commands.PlayerMoveAction.USE_ALTERNATE_DOWN;
    useUpBits = blk.sim.commands.PlayerMoveAction.USE_ALTERNATE_UP;
  }

  if (mouseData.isLocked) {
    // Lock mode
    if (mouseData.buttonsDown & gf.input.MouseButton.LEFT) {
      actions |= useDownBits;
      actions |= useBits;
    } else if (mouseData.buttons & gf.input.MouseButton.LEFT) {
      actions |= useBits;
    } else if (mouseData.buttonsUp & gf.input.MouseButton.LEFT) {
      actions |= useUpBits;
    }
    if (mouseData.buttonsDown & gf.input.MouseButton.RIGHT) {
      actions |= blk.sim.commands.PlayerMoveAction.USE_ALTERNATE_DOWN;
      actions |= blk.sim.commands.PlayerMoveAction.USE_ALTERNATE;
    } else if (mouseData.buttons & gf.input.MouseButton.RIGHT) {
      actions |= blk.sim.commands.PlayerMoveAction.USE_ALTERNATE;
    } else if (mouseData.buttonsUp & gf.input.MouseButton.RIGHT) {
      actions |= blk.sim.commands.PlayerMoveAction.USE_ALTERNATE_UP;
    }
  } else {
    // Drag mode
    if (mouseData.buttonsUp & gf.input.MouseButton.LEFT) {
      if (keyboardData.ctrlKey) {
        // Right click emulation
        this.dragDelta_ = Number.MAX_VALUE;
        actions |= useDownBits;
        actions |= useBits;
        actions |= useUpBits;
      } else if (this.dragDelta_ < dragHysteresis) {
        actions |= useDownBits;
        actions |= useBits;
        actions |= useUpBits;
      }
    }
    if (mouseData.buttonsUp & gf.input.MouseButton.RIGHT) {
      actions |= blk.sim.commands.PlayerMoveAction.USE_ALTERNATE_DOWN;
      actions |= blk.sim.commands.PlayerMoveAction.USE_ALTERNATE;
      actions |= blk.sim.commands.PlayerMoveAction.USE_ALTERNATE_UP;
    }
    if (mouseData.buttons) {
      this.dragDelta_ += Math.abs(mouseData.dx) + Math.abs(mouseData.dy);
    } else {
      this.dragDelta_ = 0;
    }
  }

  return actions;
};
