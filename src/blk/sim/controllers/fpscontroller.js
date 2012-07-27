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

goog.provide('blk.sim.controllers.FpsController');

goog.require('blk.sim');
goog.require('blk.sim.Controller');
goog.require('blk.sim.EntityType');
goog.require('blk.sim.commands.PlayerMoveCommand');
goog.require('gf.sim');
goog.require('gf.vec.Viewport');
goog.require('goog.asserts');
goog.require('goog.vec.Quaternion');



/**
 * FPS player controller entity.
 * Handles movement and input actions like an FPS.
 *
 * @constructor
 * @extends {blk.sim.Controller}
 * @param {!gf.sim.Simulator} simulator Owning simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.controllers.FpsController = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);

  /**
   * Cached scratch viewport.
   * @private
   * @type {!gf.vec.Viewport}
   */
  this.viewport_ = new gf.vec.Viewport();
  this.viewport_.reset(1, 1);
};
goog.inherits(blk.sim.controllers.FpsController,
    blk.sim.Controller);


/**
 * Entity ID.
 * @const
 * @type {number}
 */
blk.sim.controllers.FpsController.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.EntityType.FPS_CONTROLLER);


// TODO(benvanik): move to PlayerController base?
/**
 * Gets the player that owns this controller.
 * @return {!blk.sim.Player} Player this controller is owned by.
 */
blk.sim.controllers.FpsController.prototype.getPlayer = function() {
  var state = /** @type {!blk.sim.controllers.FpsControllerState} */ (
      this.getState());
  var value = state.getPlayerIdEntity();
  goog.asserts.assert(value);
  return value;
};


/**
 * Sets the player that owns this controller.
 * @param {!blk.sim.Player} value Player that owns this controller.
 */
blk.sim.controllers.FpsController.prototype.setPlayer = function(value) {
  var state = /** @type {!blk.sim.controllers.FpsControllerState} */ (
      this.getState());
  state.setPlayerId(value.getId());
};


/**
 * @override
 */
blk.sim.controllers.FpsController.prototype.executeCommand = function(
    command) {
  goog.base(this, 'executeCommand', command);

  var target = this.getTarget();
  if (!target) {
    return;
  }

  if (command instanceof blk.sim.commands.PlayerMoveCommand) {
    var targetState = /** @type {!gf.sim.SpatialEntityState} */ (
        target.getState());

    var player = this.getPlayer();
    var camera = player.getCamera();
    var chunkView = camera.getView();

    // Set view rotation directly
    var q = blk.sim.controllers.FpsController.tmpQuat_;
    command.getQuaternion(q);
    targetState.setRotation(q);

    // TODO(benvanik): apply translation

    // Calculate viewport for use with tool logic
    // TODO(benvanik): calculate elsewhere? cache longer?
    var viewport = this.viewport_;
    var drawDistance = camera.getView().getDrawDistance();
    if (viewport.far != drawDistance) {
      viewport.far = drawDistance;
      viewport.reset(1, 1);
    }
    camera.calculateViewport(viewport);

    // Execute the actions on the currently held tool
    var actions = command.actions;
    if (command.actions) {
      var heldTool = target.getHeldTool();
      if (heldTool) {
        heldTool.use(command, viewport, chunkView, target);
      }
    }
  }
};


/**
 * Scratch quaternion.
 * @private
 * @type {!goog.vec.Quaternion.Float32}
 */
blk.sim.controllers.FpsController.tmpQuat_ =
    goog.vec.Quaternion.createFloat32();
