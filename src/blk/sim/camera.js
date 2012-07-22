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

goog.provide('blk.sim.Camera');

goog.require('blk.env.ChunkView');
goog.require('blk.env.server.ChunkSendQueue');
goog.require('blk.sim');
goog.require('blk.sim.EntityType');
goog.require('gf');
goog.require('gf.sim');
goog.require('gf.sim.SchedulingPriority');
goog.require('gf.sim.SpatialEntity');
goog.require('goog.asserts');
goog.require('goog.vec.Mat4');
goog.require('goog.vec.Quaternion');
goog.require('goog.vec.Vec3');



/**
 * Camera entity.
 * Cameras exist in the world in one of two states: attached to the World
 * (in which case the camera is independently movable) and attached to another
 * spatial entity (that defines the camera location).
 *
 * Cameras handle rendering the world, maintaining map view information, and
 * requesting map chunk data. Cameras are expensive and only one should exist
 * per player, with the camera being moved around as needed instead of recreated
 * or duplicated.
 *
 * @constructor
 * @extends {gf.sim.SpatialEntity}
 * @param {!gf.sim.Simulator} simulator Owning simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.Camera = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);

  /**
   * Map.
   * @private
   * @type {blk.env.Map}
   */
  this.map_ = null;

  /**
   * Chunk view.
   * @private
   * @type {blk.env.ChunkView}
   */
  this.view_ = null;

  if (gf.SERVER) {
    /**
     * Chunk send queue.
     * Used for queuing chunks that need to be sent to a client and sending them
     * without overflowing the network.
     * @private
     * @type {blk.env.server.ChunkSendQueue}
     */
    this.sendQueue_ = null;
  }

  // TODO(benvanik): call frequently
  //this.sendQueue_.process(frame);
};
goog.inherits(blk.sim.Camera, gf.sim.SpatialEntity);


/**
 * @override
 */
blk.sim.Camera.prototype.disposeInternal = function() {
  // Remove view from map and destroy
  if (this.map_ && this.view_) {
    this.map_.removeChunkView(this.view_);
    goog.dispose(this.view_);
  }

  goog.base(this, 'disposeInternal');
};


/**
 * Entity ID.
 * @const
 * @type {number}
 */
blk.sim.Camera.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.EntityType.CAMERA);


/**
 * Gets the map.
 * @return {!blk.env.Map} The map.
 */
blk.sim.Camera.prototype.getMap = function() {
  goog.asserts.assert(this.map_);
  return this.map_;
};


/**
 * Sets the map.
 * This can only be called once and must be called immediately after creating
 * the entity.
 * @param {!blk.env.Map} map Map to use.
 */
blk.sim.Camera.prototype.setMap = function(map) {
  goog.asserts.assert(!this.map_);
  this.map_ = map;

  // Create view
  this.view_ = new blk.env.ChunkView(
      map,
      blk.env.ChunkView.LOW_CHUNK_RADIUS_XZ);
  //blk.env.ChunkView.HIGH_CHUNK_RADIUS_XZ
  map.addChunkView(this.view_);

  if (gf.CLIENT) {
    this.view_.initialize(goog.vec.Vec3.createFloat32());
  }
};


/**
 * @return {!blk.env.ChunkView} Chunk view.
 */
blk.sim.Camera.prototype.getView = function() {
  goog.asserts.assert(this.view_);
  return this.view_;
};


if (gf.SERVER) {
  /**
   * Sets up the camera for the given user.
   * @param {!gf.net.User} user User the camera is owned by.
   * @param {!blk.sim.World} world World camera exists in.
   */
  blk.sim.Camera.prototype.setup = function(user, world) {
    var simulator = this.getSimulator();
    var state = /** @type {!blk.sim.CameraState} */ (this.getState());

    var map = world.getMap();
    this.setMap(map);

    // Setup send queue
    var session = /** @type {!gf.net.ServerSession} */ (simulator.getSession());
    this.sendQueue_ = new blk.env.server.ChunkSendQueue(session, user);
    this.registerDisposable(this.sendQueue_);
    this.view_.addObserver(this.sendQueue_);

    // Initialize view
    // TODO(benvanik): only after spawn? on reparent? etc
    var spawnPosition = goog.vec.Vec3.createFloat32FromValues(0, 80, 0);
    this.view_.initialize(spawnPosition);

    this.scheduleUpdate(gf.sim.SchedulingPriority.LOW, gf.sim.NEXT_TICK);
  };

  /**
   * @override
   */
  blk.sim.Camera.prototype.update = function(time, timeDelta) {
    // Get center point
    // TODO(benvanik): get center
    var center = goog.vec.Vec3.createFloat32FromValues(0, 0, 0);

    this.sendQueue_.process(time, center);
    this.scheduleUpdate(gf.sim.SchedulingPriority.LOW, gf.sim.NEXT_TICK);
  };
}


/**
 * Calculates a viewport from the cameras perspective.
 * @param {!gf.vec.Viewport} viewport Viewport to fill with the results.
 */
blk.sim.Camera.prototype.calculateViewport = function(viewport) {
  var parent = this.getParent();
  if (parent instanceof gf.sim.SpatialEntity) {
    // Parented to an actor - use their view
    parent.calculateViewport(viewport);
  } else {
    // Standalone - use our state
    var state = /** @type {!blk.sim.CameraState} */ (this.getState());

    // Set matrix based on state
    var vm = viewport.viewMatrix;
    var position = state.getPosition();
    var rotation = state.getRotation();
    // TODO(benvanik): does scale matter?
    goog.vec.Quaternion.toRotationMatrix4(rotation, vm);
    goog.vec.Mat4.transpose(vm, vm);
    goog.vec.Mat4.translate(vm,
        -position[0], -position[1], -position[2]);

    // Update viewport matrices/etc now that the controller logic has been
    // applied
    viewport.calculate();
  }
};
