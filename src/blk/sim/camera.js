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
goog.require('blk.sim.commands.SetAspectRatioCommand');
goog.require('gf');
goog.require('gf.sim');
goog.require('gf.sim.SchedulingPriority');
goog.require('gf.sim.SpatialEntity');
goog.require('goog.asserts');
goog.require('goog.vec.Vec3');
goog.require('goog.vec.Vec4');



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

  // TODO(benvanik): viewport picking without AR
  /**
   * Aspect ratio to force viewports to.
   * This is received from the client and must match in order to ensure
   * viewport picking is identical.
   * @private
   * @type {number|undefined}
   */
  this.aspectRatio_ = undefined;

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
   * @override
   */
  blk.sim.Camera.prototype.executeCommand = function(command) {
    goog.base(this, 'executeCommand', command);

    if (command instanceof blk.sim.commands.SetAspectRatioCommand) {
      this.aspectRatio_ = command.aspectRatio;
    }
  };

  /**
   * Sets up the camera for the given user.
   * @param {!gf.net.User} user User the camera is owned by.
   */
  blk.sim.Camera.prototype.setup = function(user) {
    var simulator = this.getSimulator();
    var state = /** @type {!blk.sim.CameraState} */ (this.getState());

    var map = blk.sim.getMap(this);
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
    var sphere = blk.sim.Camera.tmpSphere_;
    var parent = this.getParent();
    if (parent instanceof gf.sim.SpatialEntity) {
      parent.getBoundingSphere(sphere);
    } else {
      this.getBoundingSphere(sphere);
    }

    this.sendQueue_.process(time, sphere);
    this.scheduleUpdate(gf.sim.SchedulingPriority.LOW, gf.sim.NEXT_TICK);
  };
}


if (gf.CLIENT) {
  /**
   * Prepares the camera for use and ensures that the data is coherent.
   * @param {!gf.vec.Viewport} viewport Primary viewport.
   */
  blk.sim.Camera.prototype.prepareFrame = function(viewport) {
    var state = /** @type {!blk.sim.CameraState} */ (this.getState());
    var aspectRatio = viewport.width / viewport.height;
    if (aspectRatio != this.aspectRatio_) {
      this.aspectRatio_ = aspectRatio;

      // Create command
      var cmd = /** @type {!blk.sim.commands.SetAspectRatioCommand} */ (
          this.createCommand(blk.sim.commands.SetAspectRatioCommand.ID));
      cmd.aspectRatio = aspectRatio;
      this.simulator.sendCommand(cmd);
    }
  };
}


/**
 * @override
 */
blk.sim.Camera.prototype.calculateViewport = function(viewport) {
  if (this.aspectRatio_) {
    viewport.setAspectRatio(this.aspectRatio_);
  }

  var parent = this.getParent();
  if (parent instanceof gf.sim.SpatialEntity) {
    // Parented to an actor - use their view
    parent.calculateViewport(viewport);
  } else {
    // Standalone - use our state
    goog.base(this, 'calculateViewport', viewport);
  }
};


/**
 * Scratch bounding sphere.
 * @private
 * @type {!goog.vec.Vec4.Type}
 */
blk.sim.Camera.tmpSphere_ = goog.vec.Vec4.createFloat32();
