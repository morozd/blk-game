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

goog.require('blk.physics.Movement');
goog.require('blk.sim');
goog.require('blk.sim.Controller');
goog.require('blk.sim.EntityType');
goog.require('blk.sim.Tool');
goog.require('blk.sim.commands.PlayerMoveCommand');
goog.require('gf.sim');
goog.require('gf.vec.Viewport');
goog.require('goog.asserts');



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

  if (goog.DEBUG) {
    this.debugName = 'FpsController';
  }

  /**
   * Cached scratch viewport.
   * @private
   * @type {!gf.vec.Viewport}
   */
  this.viewport_ = new gf.vec.Viewport();

  /**
   * Movement logic.
   * This retains state such as velocity/etc, and must be updated when the
   * controller decides to radically change things (such as respawn/etc).
   * @private
   * @type {!blk.physics.Movement}
   */
  this.movement_ = new blk.physics.Movement();
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

    // Execute movement logic
    this.movement_.executeCommand(command, targetState);

    var player = this.getPlayer();
    var camera = player.getCamera();
    var chunkView = camera.getView();

    // Calculate viewport for use with tool logic
    // TODO(benvanik): calculate elsewhere? cache longer?
    var viewport = this.viewport_;
    var drawDistance = camera.getView().getDrawDistance();
    viewport.setFar(drawDistance);
    camera.calculateViewport(viewport);

    // Execute the actions on the currently held tool
    var actions = command.actions;
    if (command.actions) {
      var heldTool = target.getHeldTool();
      if (heldTool) {
        var params = blk.sim.controllers.FpsController.tmpActionParams_;
        params.initWithPlayerMove(
            command, viewport, chunkView, player, target);
        heldTool.executePlayerAction(command, params);
      }
    }
  }
};


/**
 * Scratch action parameters.
 * @private
 * @type {!blk.sim.Tool.ActionParameters}
 */
blk.sim.controllers.FpsController.tmpActionParams_ =
    new blk.sim.Tool.ActionParameters();
