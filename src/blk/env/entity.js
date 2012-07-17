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

goog.provide('blk.env.Entity');

goog.require('blk.env.EntityState');
goog.require('gf.vec.BoundingBox');
goog.require('goog.Disposable');
goog.require('goog.math');



// SIMDEPRECATED
/**
 * An entity in the game world.
 * Actors are updated each simulation tick and can be rendered. Certain entities
 * can be controlled by the user.
 *
 * @constructor
 * @extends {goog.Disposable}
 * @param {number} entityId Entity ID.
 */
blk.env.Entity = function(entityId) {
  goog.base(this);

  /**
   * Entity ID.
   * @type {number}
   */
  this.id = entityId;

  /**
   * Current state of the entity.
   * On clients this is either the predicted state (if the player) or the
   * interpolated state (if not the player).
   * On the server this is the current state.
   * @type {!blk.env.EntityState}
   */
  this.state = new blk.env.EntityState(entityId);

  /**
   * The last confirmed state from the server.
   * Used for client-side prediction, this will contain the last known good
   * state from the server. All unconfirmed user commands should be replayed
   * against this state to generate the current state.
   * @type {blk.env.EntityState}
   */
  this.confirmedState = null;

  /**
   * State history, used by clients for interpolation.
   * @private
   * @type {!Array.<!blk.env.EntityState>}
   */
  this.stateHistory_ = [this.state];

  /**
   * Whether the latest state has been broadcast yet.
   * Used by the server to indicate whether an entity is dirty and needs to
   * be refreshed for clients.
   * @type {boolean}
   */
  this.hasSentLatestState = false;

  /**
   * Flags bitmask of {@see blk.env.Entity.Flags}.
   * @type {number}
   */
  this.flags = 0;

  /**
   * Associated player, if any.
   * @type {blk.game.Player}
   */
  this.player = null;

  /**
   * Axis-aligned bounding box.
   * @type {!gf.vec.BoundingBox}
   */
  this.boundingBox = gf.vec.BoundingBox.create();

  /**
   * Title for the entity, if any.
   * @type {string?}
   */
  this.title = null;

  /**
   * Render data stash.
   * @type {Object}
   */
  this.renderData = null;
};
goog.inherits(blk.env.Entity, goog.Disposable);


/**
 * Entity flags bitmask values.
 * @enum {number}
 */
blk.env.Entity.Flags = {
  /**
   * Entity participates in the physics system (collisions/etc).
   */
  PHYSICS_OBJECT: 1,

  /**
   * Entity is user controlled.
   */
  USER_CONTROLLED: 2
};


/**
 * Maximum distance an entity will be interpolated - if more than this, it'll
 * teleport.
 * @private
 * @const
 * @type {number}
 */
blk.env.Entity.MAX_INTERPOLATION_DISTANCE_ = 10;


/**
 * Gets a snapshot of the current entity state.
 * @return {!blk.env.EntityState} Actor state.
 */
blk.env.Entity.prototype.cloneState = function() {
  return this.state.clone();
};


/**
 * Adds a new state update from the network.
 * The state will not immediately take effect (unless the player has teleported)
 * and will be used for interpolation.
 * @param {!blk.env.EntityState} newState New state.
 */
blk.env.Entity.prototype.updateState = function(newState) {
  // Handle teleports
  if (newState.flags & blk.env.EntityState.Flags.NO_INTERPOLATE) {
    this.stateHistory_.length = 0;
    this.state = newState.clone();
  }

  // Add to history
  this.stateHistory_.push(newState);
};


/**
 * Updates an entity.
 * @param {!gf.UpdateFrame} frame Current update frame.
 */
blk.env.Entity.prototype.update = function(frame) {
  // TODO(benvanik): update entity
};


/**
 * Updates the interpolated state.
 * @param {number} time Game time, in seconds.
 */
blk.env.Entity.prototype.interpolate = function(time) {
  // Need at least two states to interpolate
  if (!this.stateHistory_.length) {
    return;
  } else if (this.stateHistory_.length == 1) {
    var state = this.stateHistory_[this.stateHistory_.length - 1];
    state.time = time;
    this.state.setFromState(state);
    return;
  }

  // Find the two states that straddle the current time
  var futureState = null;
  for (var n = 1; n < this.stateHistory_.length; n++) {
    futureState = this.stateHistory_[n];
    if (futureState.time >= time) {
      break;
    }
  }
  if (!futureState) {
    var state = this.stateHistory_[this.stateHistory_.length - 1];
    state.time = time;
    this.state.setFromState(state);
    this.state.time = time;
    return;
  }
  var pastState = this.stateHistory_[n - 1];

  // Find interpolation factor t
  var duration = futureState.time - pastState.time;
  var baseTime = time - pastState.time;
  var t = baseTime / (futureState.time - pastState.time);
  t = goog.math.clamp(t, 0, 1);

  // Remove past state only if we go over it
  if (t >= 1) {
    this.stateHistory_.splice(0, n - 1);
  }

  // Interpolate
  blk.env.EntityState.interpolate(pastState, futureState, t, this.state);
};
