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

goog.require('blk.env');
goog.require('blk.env.ChunkView');
goog.require('blk.env.blocks.BlockID');
goog.require('blk.env.client.ViewManager');
goog.require('blk.game.client.ClientPlayer');
goog.require('blk.physics.ClientMovement');
goog.require('gf.input.MouseButton');
goog.require('gf.vec.Viewport');
goog.require('goog.events.KeyCodes');
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

  // TODO(benvanik): make a player property
  /**
   * God mode toggle.
   * @type {boolean}
   */
  this.godMode_ = true;

  // TODO(benvanik): move input elsewhere (this assumes an FPS)
  /**
   * Accumulated mouse movement delta.
   * @private
   * @type {number}
   */
  this.dragDelta_ = 0;

  /**
   * Last time an action was repeated.
   * @private
   * @type {number}
   */
  this.repeatTime_ = 0;
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
 * @return {!gf.vec.Viewport} The player viewport.
 */
blk.game.client.LocalPlayer.prototype.getViewport = function() {
  return this.viewport_;
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

  // Prepare viewport for updating
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


/**
 * Processes new input data.
 * @protected
 * @param {!gf.RenderFrame} frame Current render frame.
 * @param {!gf.input.Data} inputData Updated input data.
 * @return {boolean} True if the input was handled exclusively.
 */
blk.game.client.LocalPlayer.prototype.processInput =
    function(frame, inputData) {
  var keyboardData = inputData.keyboard;

  // Chunk rebuild
  if (keyboardData.didKeyGoDown(goog.events.KeyCodes.BACKSPACE)) {
    this.viewManager_.rebuildAll();
  }

  // Debug visuals
  if (keyboardData.didKeyGoDown(goog.events.KeyCodes.V)) {
    this.viewManager_.setDebugVisuals(!this.viewManager_.debugVisuals);
  }

  // Process actions
  this.processInputActions_(frame, inputData);

  return false;
};


/**
 * Processes action input handlers.
 * @private
 * @param {!gf.RenderFrame} frame Current render frame.
 * @param {!gf.input.Data} inputData Updated input data.
 */
blk.game.client.LocalPlayer.prototype.processInputActions_ =
    function(frame, inputData) {
  var viewport = this.viewport_;
  var map = this.controller_.getMap();
  var view = this.view;
  goog.asserts.assert(view);

  var keyboardData = inputData.keyboard;
  var mouseData = inputData.mouse;

  var addButton = keyboardData.didKeyGoDown(goog.events.KeyCodes.E);
  var removeButton = false;

  if (!mouseData.isLocked) {
    // Drag mode
    if (mouseData.buttonsUp & gf.input.MouseButton.LEFT) {
      if (this.dragDelta_ < 4) {
        addButton = true;
      }
    }
    removeButton = mouseData.buttonsUp & gf.input.MouseButton.RIGHT;
    if (keyboardData.ctrlKey &&
        mouseData.buttonsUp & gf.input.MouseButton.LEFT) {
      removeButton = true;
      this.dragDelta_ = Number.MAX_VALUE;
    }
    if (mouseData.buttons) {
      this.dragDelta_ += Math.abs(mouseData.dx) + Math.abs(mouseData.dy);
    } else {
      this.dragDelta_ = 0;
    }
  } else {
    // Lock mode
    if (mouseData.buttonsDown & gf.input.MouseButton.LEFT) {
      this.repeatTime_ = frame.time;
      addButton |= true;
    } else if (mouseData.buttons & gf.input.MouseButton.LEFT) {
      var dt = frame.time - this.repeatTime_;
      if (dt > blk.env.ACTION_REPEAT_INTERVAL) {
        addButton = true;
        this.repeatTime_ = frame.time;
      }
    } else if (mouseData.buttonsDown & gf.input.MouseButton.RIGHT) {
      this.repeatTime_ = frame.time;
      removeButton |= true;
    } else if (mouseData.buttons & gf.input.MouseButton.RIGHT) {
      var dt = frame.time - this.repeatTime_;
      if (dt > blk.env.ACTION_REPEAT_INTERVAL) {
        removeButton = true;
        this.repeatTime_ = frame.time;
      }
    }
  }
  // If ctrl is held, turn adds into removes
  if (addButton && keyboardData.ctrlKey) {
    addButton = false;
    removeButton = true;
  }
  if (removeButton) {
    // Remove button takes priority
    addButton = false;
  }

  if (addButton || removeButton) {
    var mx = mouseData.clientX;
    var my = mouseData.clientY;
    if (mouseData.isLocked) {
      mx = viewport.width / 2;
      my = viewport.height / 2;
    }
    var ray = viewport.getRay(mx, my);
    var maxDistance = (this.godMode_ || keyboardData.shiftKey) ?
        blk.env.MAX_ACTION_DISTANCE_GOD : blk.env.MAX_ACTION_DISTANCE;
    var intersection = view.intersectBlock(ray, maxDistance);
    // TODO(benvanik): check on new add position, not existing position
    if (intersection && intersection.distance <= maxDistance) {
      // Find the block on the side we care about
      var wx = intersection.blockX;
      var wy = intersection.blockY;
      var wz = intersection.blockZ;
      if (addButton) {
        // Determine the face intersected and add the block there
        var dx = 0;
        var dy = 0;
        var dz = 0;
        var ipt = intersection.point;
        if (ipt[0] == wx) {
          dx--;
        } else if (ipt[0] == wx + 1) {
          dx++;
        }
        if (ipt[1] == wy) {
          dy--;
        } else if (ipt[1] == wy + 1) {
          dy++;
        }
        if (ipt[2] == wz) {
          dz--;
        } else if (ipt[2] == wz + 1) {
          dz++;
        }
        var nx = wx + dx;
        var ny = wy + dy;
        var nz = wz + dz;
        var block = map.blockSet.get(blk.env.blocks.BlockID.DIRT);
        // this.blockTypes_[this.blockIndex_];

        // Client-side action
        this.controller_.setBlock(nx, ny, nz, block.id << 8);

        // Send to server
        this.controller_.session.send(blk.net.packets.SetBlock.createData(
            nx, ny, nz, block.id << 8));
      } else if (removeButton) {
        // Client-side action
        this.controller_.setBlock(wx, wy, wz, 0);

        // Send to server
        this.controller_.session.send(blk.net.packets.SetBlock.createData(
            wx, wy, wz, 0));
      }
    }
  }

  // This code will draw a block along a ray
  // var ray = viewport.getRay(mouseData.clientX, mouseData.clientY);
  // var maxDistance = blk.env.MAX_ACTION_DISTANCE_GOD;
  // var intersection = map.intersectBlock(ray, maxDistance);
  // // TODO(benvanik): check on new add position, not existing position
  // if (intersection && intersection.distance <= maxDistance) {
  //   var wx = intersection.blockX;
  //   var wy = intersection.blockY;
  //   var wz = intersection.blockZ;
  //   var block = this.blockTypes_[this.blockIndex_];
  //   map.drawBlocks(
  //       ray[0], ray[1], ray[2],
  //       wx, wy, wz,
  //       block.id << 8);
  //   if (block.material.actionCue) {
  //     this.sounds.playPoint(block.material.actionCue,
  //         goog.vec.Vec3.createFloat32FromValues(ray[0], ray[1], ray[2]));
  //   }
  // }
};


/**
 * Renders the local player's viewport.
 * @param {!gf.RenderFrame} frame Current render frame.
 */
blk.game.client.LocalPlayer.prototype.renderViewport = function(frame) {
  this.viewManager_.render(frame, this.viewport_, this);
};
