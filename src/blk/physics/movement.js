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

goog.provide('blk.physics.Movement');

goog.require('blk.sim.commands.PlayerMoveTranslation');
goog.require('gf.vec.Quaternion');
goog.require('gf.vec.Ray');
goog.require('goog.vec.Mat4');
goog.require('goog.vec.Quaternion');
goog.require('goog.vec.Vec3');
goog.require('goog.vec.Vec4');



/**
 * Shared player movement code.
 * Handles user physics and movement behavior.
 *
 * @constructor
 */
blk.physics.Movement = function() {
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
blk.physics.Movement.MAX_FLOAT_SPEED_ = 18;


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
 * Runs free-floating/god movement logic.
 * The entity can move in all directions and is not clipped to the world. No
 * gravity or water effects.
 * @private
 * @param {number} timeDelta Time delta, in sec.
 * @param {!blk.sim.commands.PlayerMoveCommand} command Command to execute.
 * @param {!gf.sim.SpatialEntityState} targetState Target entity state.
 */
blk.physics.Movement.prototype.freeFloat_ = function(
    timeDelta, command, targetState) {
  var oldPosition = targetState.getPosition();
  var newPosition = blk.physics.Movement.tmpVec3_[4];
  var rotation = targetState.getRotation();
  var oldVelocity = targetState.getVelocity();
  var newVelocity = blk.physics.Movement.tmpVec3_[5];

  // Apply friction (or stop if going to zero)
  var speed = goog.vec.Vec3.magnitude(oldVelocity);
  if (speed > 0.0001) {
    var friction = blk.physics.Movement.FLOAT_FRICTION_;
    var newSpeed = Math.max(0, speed - friction * timeDelta);
    goog.vec.Vec3.scale(oldVelocity, newSpeed / speed, newVelocity);
  } else {
    // Stop when getting to zero
    goog.vec.Vec3.setFromValues(newVelocity, 0, 0, 0);
  }

  // Movement bits to values
  var translation = command.translation;
  var accel = blk.physics.Movement.MAX_FLOAT_SPEED_;
  var acceleratation = blk.physics.Movement.tmpVec3_[0];
  acceleratation[0] = 0;
  acceleratation[0] +=
      !!(translation & blk.sim.commands.PlayerMoveTranslation.POS_X) * accel;
  acceleratation[0] -=
      !!(translation & blk.sim.commands.PlayerMoveTranslation.NEG_X) * accel;
  acceleratation[1] = 0;
  acceleratation[1] +=
      !!(translation & blk.sim.commands.PlayerMoveTranslation.POS_Y) * accel;
  acceleratation[1] -=
      !!(translation & blk.sim.commands.PlayerMoveTranslation.NEG_Y) * accel;
  acceleratation[2] = 0;
  acceleratation[2] +=
      !!(translation & blk.sim.commands.PlayerMoveTranslation.POS_Z) * accel;
  acceleratation[2] -=
      !!(translation & blk.sim.commands.PlayerMoveTranslation.NEG_Z) * accel;

  // Calculate movement direction
  var desiredVelocity = blk.physics.Movement.tmpVec3_[1];
  gf.vec.Quaternion.multVec3(rotation, acceleratation, desiredVelocity);
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
  var currentSpeed = goog.vec.Vec3.dot(newVelocity, desiredDirection);
  var deltaSpeed = desiredSpeed - currentSpeed;
  if (deltaSpeed > 0) {
    var totalAcceleratation = desiredSpeed * timeDelta * 20;
    if (totalAcceleratation > deltaSpeed) {
      totalAcceleratation = deltaSpeed;
    }
    goog.vec.Vec3.scale(
        desiredDirection, totalAcceleratation, desiredDirection);
    goog.vec.Vec3.add(desiredDirection, newVelocity, newVelocity);
  }

  // Move
  var deltaPos = blk.physics.Movement.tmpVec3_[3];
  goog.vec.Vec3.scale(newVelocity, timeDelta, deltaPos);
  goog.vec.Vec3.add(oldPosition, deltaPos, newPosition);
  targetState.setPosition(newPosition);
  targetState.setVelocity(newVelocity);
};


/**
 * Executes a command on the current state.
 * @param {!blk.sim.commands.PlayerMoveCommand} command Command to execute.
 * @param {!gf.sim.SpatialEntityState} targetState Target entity state.
 */
blk.physics.Movement.prototype.executeCommand = function(command, targetState) {
  var oldPosition = targetState.getPosition();

  // Get the amount of time this command covers
  var timeDelta = command.getTimeDelta();

  // Set view rotation directly
  // We could enforce this/do something, but it's not really needed... unless
  // there are aimbots...
  var q = blk.physics.Movement.tmpQuat_;
  command.getQuaternion(q);
  targetState.setRotation(q);

  // Only apply collision/friction/etc if not free-floating
  if (this.freeFloating) {
    this.freeFloat_(timeDelta, command, targetState);
  } else {
    //this.move_(timeDelta, command);
  }
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


/**
 * Temp quaternion for math.
 * @private
 * @type {!goog.vec.Quaternion.Float32}
 */
blk.physics.Movement.tmpQuat_ = goog.vec.Quaternion.createFloat32();
