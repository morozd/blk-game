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

goog.provide('blk.game.client.LocalPlayer');

goog.require('blk.env.ChunkView');
goog.require('blk.env.client.ViewManager');
goog.require('blk.game.client.ClientPlayer');
goog.require('blk.physics.ClientMovement');
goog.require('gf.vec.Viewport');
goog.require('goog.vec.Mat4');
goog.require('goog.vec.Quaternion');
goog.require('goog.vec.Vec3');



/**
 * Client-side local player.
 *
 * @constructor
 * @extends {blk.game.client.ClientPlayer}
 * @param {!blk.game.client.ClientController} controller Client controller.
 * @param {!gf.net.User} user Net user.
 */
blk.game.client.LocalPlayer = function(controller, user) {
  goog.base(this, user);

  var map = controller.getMap();

  /**
   * @private
   * @type {!blk.game.client.ClientController}
   */
  this.controller_ = controller;

  // Setup local view
  this.view = new blk.env.ChunkView(map,
      blk.env.ChunkView.HIGH_CHUNK_RADIUS_XZ);
  //blk.env.ChunkView.LOW_CHUNK_RADIUS_XZ);
  //this.settings.viewDistance);
  map.addChunkView(this.view);

  /**
   * Map view renderer.
   * @private
   * @type {!blk.env.client.ViewManager}
   */
  this.viewManager_ = new blk.env.client.ViewManager(
      controller.game.getRenderState(), map, this.view);
  this.registerDisposable(this.viewManager_);

  this.view.initialize(goog.vec.Vec3.createFloat32());

  /**
   * Movement controller.
   * @private
   * @type {!blk.physics.ClientMovement}
   */
  this.movement_ = new blk.physics.ClientMovement(
      this.view, controller.session);

  /**
   * Viewport.
   * @private
   * @type {!gf.vec.Viewport}
   */
  this.viewport_ = new gf.vec.Viewport();
};
goog.inherits(blk.game.client.LocalPlayer, blk.game.client.ClientPlayer);


/**
 * @override
 */
blk.game.client.LocalPlayer.prototype.disposeInternal = function() {
  var map = this.controller_.getMap();

  if (this.view) {
    map.removeChunkView(this.view);
    goog.dispose(this.view);
  }

  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
blk.game.client.LocalPlayer.prototype.attachEntity = function(entity) {
  goog.base(this, 'attachEntity', entity);

  // Setup movement prediction
  this.movement_.attach(entity);
  entity.confirmedState = entity.state.clone();
};


/**
 * Confirms a movement sequence number.
 * @param {number} sequence Movement sequence number.
 */
blk.game.client.LocalPlayer.prototype.confirmMovementSequence = function(
    sequence) {
  // Confirm user commands
  this.movement_.confirmCommands(sequence);
};


/**
 * @override
 */
blk.game.client.LocalPlayer.prototype.update = function(frame) {
  goog.base(this, 'update', frame);

  // Update chunk view
  this.view.update(frame, this.viewport_.position);
};


/**
 * Processes the physics for a single frame.
 * Occurs without interpolation applied.
 * @param {!gf.RenderFrame} frame Current frame.
 * @param {!gf.input.Data} inputData Current input data.
 */
blk.game.client.LocalPlayer.prototype.processPhysics =
    function(frame, inputData) {
  var viewport = this.viewport_;

  var display = this.controller_.game.getDisplay();
  viewport.far = this.view.getDrawDistance();
  viewport.reset(display.getSize());

  // Process user input if required, and update viewport matrices
  // NOTE: this is done without the interpolation delay applied so that real
  // times get used
  this.movement_.update(frame, viewport, inputData);
  if (this.movement_.hasDied) {
    return false;
  }

  // Run client-side prediction
  this.movement_.predictMovement(frame);

  if (this.entity) {
    var state = this.entity.state;
    var vm = viewport.viewMatrix;
    goog.vec.Quaternion.toRotationMatrix4(state.rotation, vm);
    goog.vec.Mat4.transpose(vm, vm);
    goog.vec.Mat4.translate(vm,
        -state.position[0], -state.position[1], -state.position[2]);
  }

  // Update viewport matrices/etc now that the controller logic has been applied
  viewport.calculate();

  // Update audio - must be done after the viewport is updated
  var audioManager = this.controller_.game.getAudioManager();
  audioManager.listener.update(viewport.inverseViewMatrix);

  return true;
};
