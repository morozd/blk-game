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

goog.provide('blk.physics.ClientMovement');

goog.require('blk.env.EntityState');
goog.require('blk.net.packets.Move');
goog.require('blk.physics.MoveAction');
goog.require('blk.physics.MoveCommand');
goog.require('blk.physics.MoveTranslation');
goog.require('blk.physics.Movement');
goog.require('gf.input.MouseButton');
goog.require('gf.log');
goog.require('gf.vec.Quaternion');
goog.require('goog.events.KeyCodes');
goog.require('goog.vec.Vec3');
goog.require('goog.vec.Vec4');



/**
 * Client-side movement utility.
 *
 * @constructor
 * @extends {blk.physics.Movement}
 * @param {!blk.env.ChunkView} view Chunk view.
 * @param {!gf.net.ClientSession} session Client session.
 */
blk.physics.ClientMovement = function(view, session) {
  goog.base(this, view);

  /**
   * Client session.
   * @private
   * @type {!gf.net.ClientSession}
   */
  this.session_ = session;

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
   * Next unique sequence ID.
   * @private
   * @type {number}
   */
  this.nextSequenceId_ = 0;

  /**
   * Unused move commands that can be reused to prevent allocations.
   * @private
   * @type {!Array.<!blk.physics.MoveCommand>}
   */
  this.unusedCommands_ = [];

  /**
   * Move commands waiting to be sent to the server.
   * @private
   * @type {!Array.<!blk.physics.MoveCommand>}
   */
  this.pendingCommands_ = [];

  /**
   * Move commands that have not yet been confirmed by the server and should
   * be used for prediction.
   * @private
   * @type {!Array.<!blk.physics.MoveCommand>}
   */
  this.unconfirmedCommands_ = [];

  /**
   * Last time move commands were sent to the server.
   * @private
   * @type {number}
   */
  this.lastSendTime_ = 0;

  /**
   * If true, things look very bad and the user should be disconnected. This
   * occurs if the network drops, the server stops confirming us, etc.
   * @type {boolean}
   */
  this.hasDied = false;
};
goog.inherits(blk.physics.ClientMovement, blk.physics.Movement);


/**
 * Whether client-side prediction is enabled.
 * @private
 * @const
 * @type {boolean}
 */
blk.physics.ClientMovement.PREDICTION_ENABLED_ = true;


/**
 * Number of input updates sent per second.
 * The more updates the higher potential for conjestion, but the smoother the
 * updates for other players.
 * @private
 * @const
 * @type {number}
 */
blk.physics.ClientMovement.CLIENT_UPDATE_RATE_ = (1000 / 20) / 1000;


/**
 * Speed of the mouse drag move operation.
 * @private
 * @const
 * @type {number}
 */
blk.physics.ClientMovement.MOUSE_DRAG_SPEED_ = 0.20;


/**
 * Speed of the mouse lock move operation.
 * @private
 * @const
 * @type {number}
 */
blk.physics.ClientMovement.MOUSE_LOCK_SPEED_ = 0.25;


/**
 * Speed of angular movement.
 * @private
 * @const
 * @type {number}
 */
blk.physics.ClientMovement.ANGLE_SPEED_ = 1 / 140 * Math.PI;


/**
 * Resets the controller.
 */
blk.physics.ClientMovement.prototype.reset = function() {
  this.yaw_ = 0;
  this.pitch_ = 0;
  this.roll_ = 0;
};


/**
 * Confirms commands from the server up to and including the given sequence ID.
 * @param {number} sequence Sequence identifier.
 */
blk.physics.ClientMovement.prototype.confirmCommands = function(sequence) {
  var commands = this.unconfirmedCommands_;
  if (!commands.length) {
    return;
  }

  var killCount = commands.length;
  if (commands[commands.length - 1].sequence <= sequence) {
    // All commands confirmed
  } else {
    // Run through until we find a command that hasn't been confirmed
    for (var n = 0; n < commands.length; n++) {
      var cmd = commands[n];
      if (cmd.sequence > sequence) {
        killCount = n;
        break;
      }
    }
  }
  if (killCount) {
    var deadCommands = commands.splice(0, killCount);
    this.unusedCommands_.push.apply(this.unusedCommands_, deadCommands);
  }
};


/**
 * Sends pending commands to the server.
 * @private
 * @param {!gf.RenderFrame} frame Current update frame.
 */
blk.physics.ClientMovement.prototype.sendPendingCommands_ = function(frame) {
  var delta = frame.time - this.lastSendTime_;
  if (delta >= blk.physics.ClientMovement.CLIENT_UPDATE_RATE_) {
    this.lastSendTime_ = frame.time;

    // Send all pending commands
    this.session_.send(blk.net.packets.Move.createData(
        this.pendingCommands_));

    // Move all pending commands to the unconfirmed list to use for
    // prediction
    this.unconfirmedCommands_.push.apply(this.unconfirmedCommands_,
        this.pendingCommands_);
    this.pendingCommands_.length = 0;
  }

  // Check to see if we've blocked up
  if (this.unconfirmedCommands_.length > 1500) {
    this.hasDied = true;
    gf.log.write('massive backup of commands, dying');
  }
};


/**
 * Updates the controller during the render loop.
 * @param {!gf.RenderFrame} frame Current render frame.
 * @param {!gf.vec.Viewport} viewport Current viewport.
 * @param {!gf.input.Data} inputData Frame input data.
 */
blk.physics.ClientMovement.prototype.update = function(frame, viewport,
    inputData) {
  if (this.hasDied) {
    return;
  }

  // Send any pending commands (if needed)
  if (this.pendingCommands_.length) {
    this.sendPendingCommands_(frame);
  }

  // Ignore if not bound
  if (!this.target) {
    return;
  }

  // Handle actions
  var translation = this.sampleMove_(frame, viewport, inputData);
  var lookChanged = this.sampleLook_(frame, viewport, inputData);
  var actions = this.sampleActions_(frame, viewport, inputData);

  // Clamp rotation angles
  if (!this.freeFloating) {
    this.pitch_ = Math.max(-blk.physics.Movement.MAX_PITCH,
        Math.min(blk.physics.Movement.MAX_PITCH, this.pitch_));
    this.roll_ = 0;
  }

  // Generate a movement command, if movement occurred
  var didChange = !!translation || lookChanged || !!actions;

  // TODO(benvanik): don't always issue a command for every frame
  // This is wrong, and shouldn't be required, but seems to be to keep the
  // physics pumping both on client and server.
  // Perhaps enqueue 'physics' commands (special action) that won't get
  // serialized and sent over the network?
  didChange = true;

  if (didChange) {
    // Grab a pooled command or make a new one, fill with data
    var cmd = this.unusedCommands_.length ? this.unusedCommands_.shift() :
        new blk.physics.MoveCommand();
    cmd.sequence = this.nextSequenceId_++;
    cmd.time = (frame.time * 1000) | 0;
    cmd.timeDelta = (frame.timeDelta * 1000) | 0;
    gf.vec.Quaternion.makeEulerZYX(cmd.viewRotation,
        this.yaw_, this.pitch_, this.roll_);
    cmd.translation = translation;
    cmd.actions = actions;
    cmd.havePredicted = false;
    cmd.makeSafe();
    this.pendingCommands_.push(cmd);

    // Update client view angles
    if (this.target) {
      var state = this.target.state;
      goog.vec.Vec4.setFromArray(state.rotation, cmd.viewRotation);
    }
  }
};


/**
 * Samples input for entity movement.
 * @private
 * @param {!gf.RenderFrame} frame Current render frame.
 * @param {!gf.vec.Viewport} viewport Current viewport.
 * @param {!gf.input.Data} inputData Frame input data.
 * @return {number} Translation movement bitmask.
 */
blk.physics.ClientMovement.prototype.sampleMove_ = function(frame, viewport,
    inputData) {
  var keyboardData = inputData.keyboard;

  var moveMask = 0;

  // Keyboard move
  if (keyboardData.isKeyDown(goog.events.KeyCodes.W)) {
    moveMask |= blk.physics.MoveTranslation.NEG_Z;
  }
  if (keyboardData.isKeyDown(goog.events.KeyCodes.S)) {
    moveMask |= blk.physics.MoveTranslation.POS_Z;
  }
  if (keyboardData.isKeyDown(goog.events.KeyCodes.A)) {
    moveMask |= blk.physics.MoveTranslation.NEG_X;
  }
  if (keyboardData.isKeyDown(goog.events.KeyCodes.D)) {
    moveMask |= blk.physics.MoveTranslation.POS_X;
  }
  if (keyboardData.isKeyDown(goog.events.KeyCodes.Q)) {
    moveMask |= blk.physics.MoveTranslation.POS_Y;
  }
  if (keyboardData.isKeyDown(goog.events.KeyCodes.Z)) {
    moveMask |= blk.physics.MoveTranslation.NEG_Y;
  }

  // Jumping
  if (keyboardData.isKeyDown(goog.events.KeyCodes.SPACE)) {
    moveMask |= blk.physics.MoveTranslation.JUMP;
  }

  // TODO(benvanik): touch input handling (virtual dpad)

  // TODO(benvanik): gamepad handling

  return moveMask;
};


/**
 * Samples input for entity viewport adjustment.
 * @private
 * @param {!gf.RenderFrame} frame Current render frame.
 * @param {!gf.vec.Viewport} viewport Current viewport.
 * @param {!gf.input.Data} inputData Frame input data.
 * @return {boolean} True if the viewport changed.
 */
blk.physics.ClientMovement.prototype.sampleLook_ = function(frame, viewport,
    inputData) {
  var keyboardData = inputData.keyboard;
  var mouseData = inputData.mouse;

  var oldYaw = this.yaw_;
  var oldPitch = this.pitch_;
  var oldRoll = this.roll_;

  // View angle rotation via keyboard
  if (keyboardData.isKeyDown(goog.events.KeyCodes.LEFT)) {
    this.yaw_ += blk.physics.ClientMovement.ANGLE_SPEED_;
  }
  if (keyboardData.isKeyDown(goog.events.KeyCodes.RIGHT)) {
    this.yaw_ -= blk.physics.ClientMovement.ANGLE_SPEED_;
  }
  if (keyboardData.isKeyDown(goog.events.KeyCodes.UP)) {
    this.pitch_ += blk.physics.ClientMovement.ANGLE_SPEED_;
  }
  if (keyboardData.isKeyDown(goog.events.KeyCodes.DOWN)) {
    this.pitch_ -= blk.physics.ClientMovement.ANGLE_SPEED_;
  }
  if (keyboardData.isKeyDown(goog.events.KeyCodes.OPEN_SQUARE_BRACKET)) {
    this.roll_ += blk.physics.ClientMovement.ANGLE_SPEED_;
  }
  if (keyboardData.isKeyDown(goog.events.KeyCodes.CLOSE_SQUARE_BRACKET)) {
    this.roll_ -= blk.physics.ClientMovement.ANGLE_SPEED_;
  }

  // Mouse move (requiring a drag if not locked)
  var requireDrag = !mouseData.isLocked;
  if (!requireDrag || !!(mouseData.buttons & gf.input.MouseButton.LEFT)) {
    var speed = mouseData.isLocked ?
        blk.physics.ClientMovement.MOUSE_DRAG_SPEED_ :
        blk.physics.ClientMovement.MOUSE_LOCK_SPEED_;
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
    this.yaw_ -= dyaw * blk.physics.ClientMovement.ANGLE_SPEED_;
    this.pitch_ -= dpitch * blk.physics.ClientMovement.ANGLE_SPEED_;
  }

  // TODO(benvanik): touch input handling

  // TODO(benvanik): gamepad handling

  return (
      this.yaw_ != oldYaw || this.pitch_ != oldPitch || this.roll_ != oldRoll);
};


/**
 * Samples input for actions.
 * @private
 * @param {!gf.RenderFrame} frame Current render frame.
 * @param {!gf.vec.Viewport} viewport Current viewport.
 * @param {!gf.input.Data} inputData Frame input data.
 * @return {number} Action bitmask.
 */
blk.physics.ClientMovement.prototype.sampleActions_ = function(frame, viewport,
    inputData) {
  var keyboardData = inputData.keyboard;
  var mouseData = inputData.mouse;

  var actions = 0;

  // Use
  if (keyboardData.isKeyDown(goog.events.KeyCodes.E)) {
    actions |= blk.physics.MoveAction.USE;
  }

  return actions;
};


/**
 * Predicts client movement based on input commands.
 * @param {!gf.RenderFrame} frame Current render frame.
 */
blk.physics.ClientMovement.prototype.predictMovement = function(frame) {
  var entity = this.target;
  if (!entity) {
    return;
  }

  if (entity.confirmedState) {
    entity.state.setFromState(entity.confirmedState);
  } else {
    entity.state = new blk.env.EntityState(entity.id);
  }

  if (blk.physics.ClientMovement.PREDICTION_ENABLED_) {
    // TODO(benvanik): prevent alloc
    //var pastState = entity.state.clone();

    // Run all unconfirmed commands
    for (var n = 0; n < this.unconfirmedCommands_.length; n++) {
      var cmd = this.unconfirmedCommands_[n];
      // if (cmd.time >= frame.time) {
      //   break;
      // }
      //pastState.setFromState(entity.state);
      this.executeCommand(frame.time, cmd);
    }

    // Run all unsent commands
    for (var n = 0; n < this.pendingCommands_.length; n++) {
      var cmd = this.pendingCommands_[n];
      // if (cmd.time >= frame.time) {
      //   break;
      // }
      //pastState.setFromState(entity.state);
      this.executeCommand(frame.time, cmd);
    }

    // Lerp the last two states
    // var futureState = entity.state;
    // if (pastState.time != futureState.time) {
    //   var tt = frame.time - (200 / 1000);
    //   var duration = futureState.time - pastState.time;
    //   var baseTime = tt - pastState.time;
    //   var t = baseTime / (futureState.time - pastState.time);
    //   gf.log.write(tt, pastState.time, futureState.time, t);
    //   t = goog.math.clamp(t, 0, 1);
    //   blk.env.EntityState.interpolate(pastState, futureState, t,
    //       entity.state);
    // }

    // State should now be up to date!
    // gf.log.write(entity.state.position[0], entity.state.position[1],
    //     entity.state.position[2]);
  }
};


/**
 * Temporary vec3 for math.
 * @private
 * @type {!goog.vec.Vec3.Float32}
 */
blk.physics.ClientMovement.tmpVec3_ = goog.vec.Vec3.createFloat32();
