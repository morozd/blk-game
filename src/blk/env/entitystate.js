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

goog.provide('blk.env.EntityState');

goog.require('goog.vec.Quaternion');
goog.require('goog.vec.Vec3');
goog.require('goog.vec.Vec4');



// SIMDEPRECATED
/**
 * The world state of an entity.
 * This structure is used for prediction, input control, and rendering.
 *
 * @constructor
 * @param {number=} opt_entityId Entity ID.
 * @param {number=} opt_time Game time of the update, in seconds.
 * @param {number=} opt_flags Flags.
 * @param {goog.vec.Vec3.Float32=} opt_position Position.
 * @param {goog.vec.Vec4.Float32=} opt_rotation Rotation.
 * @param {goog.vec.Vec3.Float32=} opt_velocity Position velocity.
 */
blk.env.EntityState = function(opt_entityId, opt_time, opt_flags, opt_position,
    opt_rotation, opt_velocity) {
  /**
   * Entity ID.
   * @type {number}
   */
  this.entityId = opt_entityId || 0;

  /**
   * Game time, in seconds, this state was generated.
   * @type {number}
   */
  this.time = opt_time || 0;

  /**
   * Flags from {@see blk.env.EntityState.Flags}.
   * @type {number}
   */
  this.flags = opt_flags || 0;

  /**
   * Position in world coordinates.
   * @type {!goog.vec.Vec3.Float32}
   */
  this.position = opt_position || goog.vec.Vec3.createFloat32();

  /**
   * Rotation.
   * @type {!goog.vec.Quaternion.Float32}
   */
  this.rotation = /** @type {!goog.vec.Quaternion.Float32} */ (
      opt_rotation || goog.vec.Quaternion.createFloat32());

  /**
   * Velocity along each axis.
   * @type {!goog.vec.Vec3.Float32}
   */
  this.velocity = opt_velocity || goog.vec.Vec3.createFloat32();
};


/**
 * Flags for the state update.
 * @enum {number}
 */
blk.env.EntityState.Flags = {
  /**
   * Do not interpolate the state, but immediately set (teleport/etc).
   */
  NO_INTERPOLATE: 0x0001
};


/**
 * Clones the entity state, returning a new copy.
 * @return {!blk.env.EntityState} Cloned entity state.
 */
blk.env.EntityState.prototype.clone = function() {
  var clone = new blk.env.EntityState(
      this.entityId,
      this.time,
      this.flags);
  goog.vec.Vec3.setFromArray(clone.position, this.position);
  goog.vec.Quaternion.setFromArray(clone.rotation, this.rotation);
  goog.vec.Vec3.setFromArray(clone.velocity, this.velocity);
  return clone;
};


/**
 * Updates an entity state with the values from another entity state.
 * @param {!blk.env.EntityState} other Other entity state.
 */
blk.env.EntityState.prototype.setFromState = function(other) {
  this.entityId = other.entityId;
  this.time = other.time;
  this.flags = other.flags;
  goog.vec.Vec3.setFromArray(this.position, other.position);
  goog.vec.Quaternion.setFromArray(this.rotation, other.rotation);
  goog.vec.Vec3.setFromArray(this.velocity, other.velocity);
};


/**
 * Compares one entity state to another.
 * @param {!blk.env.EntityState} other Other entity state.
 * @return {boolean} True if the entity states are equalish.
 */
blk.env.EntityState.prototype.equals = function(other) {
  return goog.vec.Vec3.equals(this.position, other.position) &&
      goog.vec.Vec4.equals(this.rotation, other.rotation) &&
      goog.vec.Vec3.equals(this.velocity, other.velocity);
};


/**
 * Interpolates between two states and stores the output in the third.
 * @param {!blk.env.EntityState} state1 First state.
 * @param {!blk.env.EntityState} state2 Second state.
 * @param {number} t Interpolation coefficient, [0-1].
 * @param {!blk.env.EntityState} state Output state.
 */
blk.env.EntityState.interpolate = function(state1, state2, t, state) {
  goog.vec.Vec3.lerp(
      state1.position, state2.position,
      t, state.position);
  goog.vec.Quaternion.slerp(
      state1.rotation, state2.rotation,
      t, state.rotation);
  goog.vec.Vec3.lerp(
      state1.velocity, state2.velocity,
      t, state.velocity);
};
