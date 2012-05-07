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

goog.provide('blk.physics.Movement');

goog.require('blk.env.Entity');
goog.require('blk.physics.MoveTranslation');
goog.require('gf.vec.Quaternion');
goog.require('gf.vec.Ray');
goog.require('goog.asserts');
goog.require('goog.math');
goog.require('goog.vec.Mat4');
goog.require('goog.vec.Vec3');
goog.require('goog.vec.Vec4');



/**
 * Shared player movement code.
 * Handles user physics and movement behavior.
 *
 * @constructor
 * @param {!blk.env.ChunkView} view Chunk view.
 */
blk.physics.Movement = function(view) {
  /**
   * Chunk view.
   * @type {!blk.env.ChunkView}
   */
  this.view = view;

  /**
   * Target entity, if any.
   * @type {blk.env.Entity}
   */
  this.target = null;

  /**
   * Whether the camera is free-floating and should have 6-degrees of freedom.
   * If not set then certain angles will be constrained (such as pitch).
   * @type {boolean}
   */
  this.freeFloating = true;
};


/**
 * Maximum pitch value (in either direction).
 * @protected
 * @const
 * @type {number}
 */
blk.physics.Movement.MAX_PITCH = 85 * Math.PI / 180;


/**
 * Maximum speed when free floating.
 * @private
 * @const
 * @type {number}
 */
blk.physics.Movement.MAX_FLOAT_SPEED_ = 16;


/**
 * Friction coefficient when free floating.
 * @private
 * @const
 * @type {number}
 */
blk.physics.Movement.FLOAT_FRICTION_ = 40;


/**
 * Maximum speed when moving on the ground.
 * @private
 * @const
 * @type {number}
 */
blk.physics.Movement.MAX_GROUND_SPEED_ = 10;


/**
 * Friction coefficient when moving on the ground.
 * @private
 * @const
 * @type {number}
 */
blk.physics.Movement.GROUND_FRICTION_ = 40;


/**
 * Maximum speed when moving in the air.
 * @private
 * @const
 * @type {number}
 */
blk.physics.Movement.MAX_AIR_SPEED_ = 10;


/**
 * Friction coefficient when moving in the air.
 * @private
 * @const
 * @type {number}
 */
blk.physics.Movement.AIR_FRICTION_ = 10;


/**
 * Gravity acceleration on Y.
 * @private
 * @const
 * @type {number}
 */
blk.physics.Movement.GRAVITY_Y_ = -19.8;


/**
 * dy when jumping.
 * @private
 * @const
 * @type {number}
 */
blk.physics.Movement.JUMP_ = 40;


/**
 * Terminal velocity, in meters/sec.
 * @private
 * @const
 * @type {number}
 */
blk.physics.Movement.TERMINAL_VELOCITY_ = 55;


/**
 * Attaches a controller to an entity.
 * @param {!blk.env.Entity} entity Actor to control.
 */
blk.physics.Movement.prototype.attach = function(entity) {
  entity.flags |= blk.env.Entity.Flags.USER_CONTROLLED;
  this.target = entity;
};


/**
 * Detaches the controller from its current entity.
 */
blk.physics.Movement.prototype.detach = function() {
  if (this.target) {
    this.target.flags &= ~blk.env.Entity.Flags.USER_CONTROLLED;
  }
  this.target = null;
};


/**
 * Runs free-floating/god movement logic.
 * The entity can move in all directions and is not clipped to the world. No
 * gravity or water effects.
 * @private
 * @param {number} timeDelta Time delta, in sec.
 * @param {!blk.physics.MoveCommand} cmd Command to execute.
 */
blk.physics.Movement.prototype.freeFloat_ = function(timeDelta, cmd) {
  var state = this.target.state;

  // Apply friction (or stop if going to zero)
  var speed = goog.vec.Vec3.magnitude(state.velocity);
  if (speed > 0.0001) {
    var friction = blk.physics.Movement.FLOAT_FRICTION_;
    var newSpeed = Math.max(0, speed - friction * timeDelta);
    goog.vec.Vec3.scale(state.velocity, newSpeed / speed, state.velocity);
  } else {
    // Stop when getting to zero
    goog.vec.Vec3.setFromValues(state.velocity, 0, 0, 0);
  }

  // Movement bits to values
  var accel = blk.physics.Movement.MAX_FLOAT_SPEED_;
  var acceleratation = blk.physics.Movement.tmpVec3_[0];
  acceleratation[0] = 0;
  acceleratation[0] +=
      !!(cmd.translation & blk.physics.MoveTranslation.POS_X) * accel;
  acceleratation[0] -=
      !!(cmd.translation & blk.physics.MoveTranslation.NEG_X) * accel;
  acceleratation[1] = 0;
  acceleratation[1] +=
      !!(cmd.translation & blk.physics.MoveTranslation.POS_Y) * accel;
  acceleratation[1] -=
      !!(cmd.translation & blk.physics.MoveTranslation.NEG_Y) * accel;
  acceleratation[2] = 0;
  acceleratation[2] +=
      !!(cmd.translation & blk.physics.MoveTranslation.POS_Z) * accel;
  acceleratation[2] -=
      !!(cmd.translation & blk.physics.MoveTranslation.NEG_Z) * accel;

  // Calculate movement direction
  var desiredVelocity = blk.physics.Movement.tmpVec3_[1];
  gf.vec.Quaternion.multVec3(state.rotation, acceleratation, desiredVelocity);
  var desiredDirection = blk.physics.Movement.tmpVec3_[2];
  var mag = goog.vec.Vec3.magnitude(desiredVelocity);
  if (mag) {
    goog.vec.Vec3.scale(desiredVelocity, 1 / mag, desiredDirection);
  } else {
    goog.vec.Vec3.setFromValues(desiredDirection, 0, 0, 0);
  }

  // Cap speed
  var desiredSpeed = goog.vec.Vec3.magnitude(desiredVelocity);
  if (desiredSpeed > blk.physics.Movement.MAX_FLOAT_SPEED_) {
    goog.vec.Vec3.scale(desiredVelocity,
        blk.physics.Movement.MAX_FLOAT_SPEED_ / desiredSpeed, desiredVelocity);
    desiredSpeed = blk.physics.Movement.MAX_FLOAT_SPEED_;
  }

  // Compute acceleration and apply speed
  var currentSpeed = goog.vec.Vec3.dot(state.velocity, desiredDirection);
  var deltaSpeed = desiredSpeed - currentSpeed;
  if (deltaSpeed > 0) {
    var totalAcceleratation = desiredSpeed * timeDelta * 20;
    if (totalAcceleratation > deltaSpeed) {
      totalAcceleratation = deltaSpeed;
    }
    goog.vec.Vec3.scale(
        desiredDirection, totalAcceleratation, desiredDirection);
    goog.vec.Vec3.add(desiredDirection, state.velocity, state.velocity);
  }

  // Move
  var deltaPos = blk.physics.Movement.tmpVec3_[3];
  goog.vec.Vec3.scale(state.velocity, timeDelta, deltaPos);
  goog.vec.Vec3.add(state.position, deltaPos, state.position);
};


/**
 * Makes the given 4x4 matrix a modelview matrix of a camera so that
 * the camera is 'looking at' the given target point.
 * Assumes that the eye is at the origin and up is +Y. This makes this method
 * faster than just using the built-in makeLookAt.
 * @private
 * @param {goog.vec.Mat4.AnyType} mat The matrix.
 * @param {goog.vec.Vec3.AnyType} target The point to aim the camera at.
 */
blk.physics.Movement.makeLookAt_ = function(mat, target) {
  var fwdVec = blk.physics.Movement.tmpVec4_[0];
  goog.vec.Vec3.normalize(target, fwdVec);
  fwdVec[3] = 0;
  var sideVec = blk.physics.Movement.tmpVec4_[1];
  goog.vec.Vec3.setFromValues(sideVec, -fwdVec[2], 0, fwdVec[0]);
  goog.vec.Vec3.normalize(sideVec, sideVec);
  sideVec[3] = 0;
  var upVec = blk.physics.Movement.tmpVec4_[2];
  goog.vec.Vec3.cross(sideVec, fwdVec, upVec);
  goog.vec.Vec3.normalize(upVec, upVec);
  upVec[3] = 0;

  goog.vec.Vec3.negate(fwdVec, fwdVec);
  goog.vec.Mat4.setRow(mat, 0, sideVec);
  goog.vec.Mat4.setRow(mat, 1, upVec);
  goog.vec.Mat4.setRow(mat, 2, fwdVec);
  goog.vec.Mat4.setRowValues(mat, 3, 0, 0, 0, 1);
  goog.vec.Mat4.translate(
      mat, -target[0], -target[1], -target[2]);

  // TODO(benvanik): remove transpose
  goog.vec.Mat4.transpose(mat, mat);
};


/**
 * Runs normal movement logic.
 * The entity is clipped to the world has has special movement behavior when
 * in the air (jumping/falling) and underwater.
 * @private
 * @param {number} timeDelta Time delta, in sec.
 * @param {!blk.physics.MoveCommand} cmd Command to execute.
 */
blk.physics.Movement.prototype.move_ = function(timeDelta, cmd) {
  var state = this.target.state;

  // Detect the current location
  var location = this.classifyPosition_(state.position);

  // Apply friction (or stop if going to zero)
  var friction = location == blk.physics.Movement.Location_.AIR ?
      blk.physics.Movement.AIR_FRICTION_ :
      blk.physics.Movement.GROUND_FRICTION_;
  var currentVelocity = blk.physics.Movement.tmpVec3_[0];
  goog.vec.Vec3.setFromValues(currentVelocity,
      state.velocity[0], 0, state.velocity[2]);
  var speed = goog.vec.Vec3.magnitude(currentVelocity);
  if (speed > 0.0001) {
    var newSpeed = Math.max(0, speed - friction * timeDelta);
    goog.vec.Vec3.scale(currentVelocity, newSpeed / speed, currentVelocity);
    state.velocity[0] = currentVelocity[0];
    state.velocity[2] = currentVelocity[2];
  } else {
    // Stop when getting to zero
    state.velocity[0] = 0;
    state.velocity[2] = 0;
  }

  // Movement bits to values
  var accel = location == blk.physics.Movement.Location_.AIR ?
      blk.physics.Movement.MAX_AIR_SPEED_ :
      blk.physics.Movement.MAX_GROUND_SPEED_;
  // if (cmd.translation & blk.physics.MoveTranslation.CROUCH) {
  //   // TODO(benvanik): crouch logic
  // }
  var acceleratation = blk.physics.Movement.tmpVec3_[0];
  acceleratation[0] = 0;
  acceleratation[0] +=
      !!(cmd.translation & blk.physics.MoveTranslation.POS_X) * accel;
  acceleratation[0] -=
      !!(cmd.translation & blk.physics.MoveTranslation.NEG_X) * accel;
  acceleratation[1] = 0;
  acceleratation[2] = 0;
  acceleratation[2] +=
      !!(cmd.translation & blk.physics.MoveTranslation.POS_Z) * accel;
  acceleratation[2] -=
      !!(cmd.translation & blk.physics.MoveTranslation.NEG_Z) * accel;

  // Need to strip out the Y from the quaternion, which (I think) is nasty
  // Basically we multiply through the look-ahead vector to get a unit vector in
  // the direction of rotation, strip out the Y, then create a look-at matrix
  // from the origin to the resulting point. We can then use this look-at matrix
  // to multiply through our acceleration to get a delta velocity.
  var vp = blk.physics.Movement.tmpVec3_[1];
  goog.vec.Vec3.setFromValues(vp, 0, 0, -1);
  gf.vec.Quaternion.multVec3(state.rotation, vp, vp);
  vp[1] = 0;
  var m = blk.physics.Movement.tmpMat4_;
  blk.physics.Movement.makeLookAt_(m, vp);
  var desiredVelocity = blk.physics.Movement.tmpVec3_[1];
  goog.vec.Mat4.multVec3(m, acceleratation, desiredVelocity);
  var desiredDirection = blk.physics.Movement.tmpVec3_[2];
  goog.vec.Vec3.normalize(desiredVelocity, desiredDirection);

  // Cap speed on XZ
  var desiredSpeed = goog.vec.Vec3.magnitude(desiredVelocity);
  if (desiredSpeed > blk.physics.Movement.MAX_GROUND_SPEED_) {
    goog.vec.Vec3.scale(desiredVelocity,
        blk.physics.Movement.MAX_GROUND_SPEED_ / desiredSpeed,
        desiredVelocity);
    desiredSpeed = blk.physics.Movement.MAX_GROUND_SPEED_;
  }

  // Compute acceleration and apply speed in XZ only
  var vy = state.velocity[1];
  state.velocity[1] = 0;
  var currentSpeed =
      Math.abs(goog.vec.Vec3.dot(state.velocity, desiredDirection));
  var deltaSpeed = desiredSpeed - currentSpeed;
  if (deltaSpeed) {
    var totalAcceleratation = desiredSpeed * timeDelta * 20;
    if (totalAcceleratation > deltaSpeed) {
      totalAcceleratation = deltaSpeed;
    }
    goog.vec.Vec3.scale(
        desiredDirection, totalAcceleratation, desiredDirection);
    goog.vec.Vec3.add(desiredDirection, state.velocity, state.velocity);
  }
  state.velocity[1] = vy;

  // Handle jumps
  if (cmd.translation & blk.physics.MoveTranslation.JUMP) {
    // TODO(benvanik): jump logic - right now this is jetpack physics
    state.velocity[1] += blk.physics.Movement.JUMP_ * timeDelta;
  }

  // Move
  var deltaPos = blk.physics.Movement.tmpVec3_[3];
  goog.vec.Vec3.scale(state.velocity, timeDelta, deltaPos);

  // Collision detect
  var targetPos = blk.physics.Movement.tmpVec3_[4];
  goog.vec.Vec3.add(state.position, deltaPos, targetPos);
  location = this.collideWithMap_(state.position, deltaPos, targetPos);

  // Apply gravity and clamp to terminal velocity
  if (location == blk.physics.Movement.Location_.AIR) {
    var gv = blk.physics.Movement.GRAVITY_Y_ * timeDelta;
    state.velocity[1] = goog.math.clamp(
        state.velocity[1] + gv,
        -blk.physics.Movement.TERMINAL_VELOCITY_,
        blk.physics.Movement.TERMINAL_VELOCITY_);
  } else {
    state.velocity[1] = 0;
  }

  goog.vec.Vec3.setFromArray(state.position, targetPos);
};


/**
 * A location that the player can be in.
 * @private
 * @enum {number}
 */
blk.physics.Movement.Location_ = {
  GROUND: 0,
  AIR: 1,
  WATER: 2
};


/**
 * Classifies the current position of the player.
 * @private
 * @param {!goog.vec.Vec3.Float32} position Position to test.
 * @return {blk.physics.Movement.Location_} Position location type.
 */
blk.physics.Movement.prototype.classifyPosition_ = function(position) {
  var ray = blk.physics.Movement.tmpRay_;
  gf.vec.Ray.setFromValues(ray,
      position[0], position[1] - 1.5, position[2],
      0, -1.5, 0);
  var intersection = this.view.intersectBlock(ray, 1.5);
  if (intersection) {
    // Collided with ground or water
    return blk.physics.Movement.Location_.GROUND;
  } else {
    return blk.physics.Movement.Location_.AIR;
  }
};


/**
 * Collides against the map, adjusting the delta position.
 * @private
 * @param {!goog.vec.Vec3.Float32} position Starting position on this frame.
 * @param {!goog.vec.Vec3.Float32} deltaPos Position delta.
 * @param {!goog.vec.Vec3.Float32} targetPos Target position - updated with
 *     collision value.
 * @return {blk.physics.Movement.Location_} Position location type.
 */
blk.physics.Movement.prototype.collideWithMap_ = function(position, deltaPos,
    targetPos) {
  var ray = blk.physics.Movement.tmpRay_;

  // Check Y first
  if (deltaPos[1] <= 0) {
    // Falling - trace ray from feet down
    var d = Math.min(-0.1, deltaPos[1]);
    gf.vec.Ray.setFromValues(ray,
        position[0], position[1] - 1.5, position[2],
        0, d, 0);
    var intersection = this.view.intersectBlock(ray, -d);
    if (intersection) {
      // Collided with ground or water
      deltaPos[1] = -intersection.distance;
      targetPos[1] = position[1] + deltaPos[1];
      return blk.physics.Movement.Location_.GROUND;
    }
  } else {
    // Jumping - trace ray from head up
    gf.vec.Ray.setFromValues(ray,
        position[0], position[1], position[2],
        0, deltaPos[1], 0);
    var intersection = this.view.intersectBlock(ray, deltaPos[1]);
    // if (intersection) {
    //   // Collided with ceiling
    // }
  }

  // Check XZ

  return blk.physics.Movement.Location_.AIR;
};


/**
 * Performs any actions in a command.
 * Only runs once when predicting.
 * @private
 * @param {number} time Current game simulation time.
 * @param {!blk.physics.MoveCommand} cmd Command to execute.
 */
blk.physics.Movement.prototype.performActions_ = function(time, cmd) {
  goog.asserts.assert(!cmd.havePredicted);

  //if (cmd.actions & blk.physics.MoveAction.USE) {
  // TODO(benvanik): use the currently selected inventory item
  // Need to build an inventory system, inventory switching, etc...
  // May require additional data payload for this kind of stuff, something
  // like a SET_INVENTORY action with a uint slot #
  //}
};


/**
 * Executes a command on the current state.
 * @protected
 * @param {number} time Current game simulation time.
 * @param {!blk.physics.MoveCommand} cmd Command to execute.
 */
blk.physics.Movement.prototype.executeCommand = function(time, cmd) {
  var state = this.target.state;
  var timeDelta = cmd.timeDelta / 1000;

  // TODO(benvanik): validate angles/etc
  goog.vec.Vec4.setFromArray(state.rotation, cmd.viewRotation);

  // Only apply collision/friction/etc if not free-floating
  if (this.freeFloating) {
    this.freeFloat_(timeDelta, cmd);
  } else {
    this.move_(timeDelta, cmd);
  }

  if (!cmd.havePredicted && cmd.actions) {
    this.performActions_(timeDelta, cmd);
  }

  state.time = cmd.time;

  cmd.havePredicted = true;
};


/**
 * Temp vec3 for math.
 * @private
 * @type {!Array.<!goog.vec.Vec3.Float32>}
 */
blk.physics.Movement.tmpVec3_ = [
  goog.vec.Vec3.createFloat32(),
  goog.vec.Vec3.createFloat32(),
  goog.vec.Vec3.createFloat32(),
  goog.vec.Vec3.createFloat32(),
  goog.vec.Vec3.createFloat32()
];


/**
 * Temp vec4 for math.
 * @private
 * @type {!Array.<!goog.vec.Vec4.Float32>}
 */
blk.physics.Movement.tmpVec4_ = [
  goog.vec.Vec4.createFloat32(),
  goog.vec.Vec4.createFloat32(),
  goog.vec.Vec4.createFloat32()
];


/**
 * Temp mat4 for math.
 * @private
 * @type {!goog.vec.Vec3.Float32}
 */
blk.physics.Movement.tmpMat4_ = goog.vec.Mat4.createFloat32();


/**
 * Temp ray for math.
 * @private
 * @type {!gf.vec.Ray.Type}
 */
blk.physics.Movement.tmpRay_ = gf.vec.Ray.create();
