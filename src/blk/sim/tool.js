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

goog.provide('blk.sim.Tool');

goog.require('blk.sim.Model');
goog.require('blk.sim.commands.PlayerMoveAction');
goog.require('gf.vec.Ray');



/**
 * Abstract renderable tool entity.
 *
 * Tools can be held (attached on some actor), contained within something
 * (parented to an inventory or box), or standalone in the world (no parent).
 * Held:
 * - Position/etc indicates relative position to parent attachment point
 * Contained:
 * - Position ignored
 * Standalone:
 * - Position is world position
 *
 * @constructor
 * @extends {blk.sim.Model}
 * @param {!gf.sim.Simulator} simulator Owning simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.Tool = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);
};
goog.inherits(blk.sim.Tool, blk.sim.Model);


/**
 * @override
 */
blk.sim.Tool.prototype.parentChanged = function(oldParent, newParent) {
  goog.base(this, 'parentChanged', oldParent, newParent);

  // Parent changed - added/removed from inventory, in/out of hand, etc
};


/**
 * Handles player move command actions.
 * @param {!blk.sim.commands.PlayerMoveCommand} command Command.
 * @param {!blk.sim.Tool.ActionParameters} params Action parameters.
 */
blk.sim.Tool.prototype.executePlayerAction = function(command, params) {
  // TODO(benvanik): handle prediction logic (hasPredicted)
  if (command.hasPredicted) {
    // For now we ignore - in the future we'll want to predict properly
    return;
  }

  // TODO(benvanik): tool flags (melee-able, use-from-inventory, etc)
  // TODO(benvanik): handle basic repeat logic (instaneous, held-down, etc)

  // Perform each requested action
  // All state stays the same, so reissue with different action indices
  var actions = command.actions;
  if (actions & blk.sim.commands.PlayerMoveAction.USE_NORMAL_DOWN) {
    this.performAction(params, 0);
  }
  if (actions & blk.sim.commands.PlayerMoveAction.USE_ALTERNATE_DOWN) {
    this.performAction(params, 1);
  }
};


/**
 * Performs an action.
 * @protected
 * @param {!blk.sim.Tool.ActionParameters} params Action parameters.
 * @param {number} action Action index; 0 = normal, 1 = alternate.
 */
blk.sim.Tool.prototype.performAction = goog.nullFunction;



/**
 * Parameters populated by tool use.
 * Used in lieu of function arguments to enable more complex parameter setup.
 * @constructor
 */
blk.sim.Tool.ActionParameters = function() {
  /**
   * Time the action occurred.
   * @type {number}
   */
  this.time = 0;

  /**
   * Viewport of the user.
   * Used for handling any screen-related picking/etc.
   * The dimensions may not match the screen size, but the aspect ratio will
   * be the same.
   * @type {gf.vec.Viewport}
   */
  this.viewport = null;

  /**
   * Chunk view, centered around or near the actor.
   * @type {blk.env.ChunkView}
   */
  this.chunkView = null;

  /**
   * Player that used the tool.
   * Both this and an actor can be set, indicating that a player-predicted actor
   * issued the use.
   * If an AI used the tool then this will be null.
   * @type {blk.sim.Player}
   */
  this.player = null;

  /**
   * Actor that used the tool.
   * This actor may be controlled by the player or by an AI.
   * @type {blk.sim.Actor}
   */
  this.actor = null;

  /**
   * Input position X in screen [0-1].
   * @type {number}
   */
  this.screenX = 0;

  /**
   * Input position Y in screen [0-1].
   * @type {number}
   */
  this.screenY = 0;

  /**
   * Ray along the user click.
   * @type {!gf.vec.Ray.Type}
   */
  this.ray = gf.vec.Ray.create();
};


/**
 * Prepares the parameters from the given player move command.
 * @param {!blk.sim.commands.PlayerMoveCommand} command Command.
 * @param {!gf.vec.Viewport} viewport Camera viewport.
 * @param {!blk.env.ChunkView} chunkView Chunk view.
 * @param {!blk.sim.Player} player Player using the tool.
 * @param {!blk.sim.Actor} actor Actor using the tool.
 */
blk.sim.Tool.ActionParameters.prototype.initWithPlayerMove = function(
    command, viewport, chunkView, player, actor) {
  this.time = command.getTime();
  this.viewport = viewport;
  this.chunkView = chunkView;
  this.player = player;
  this.actor = actor;

  // Get screen X/Y (in [0-1])
  this.screenX = 0.5;
  this.screenY = 0.5;
  if (command.actions & blk.sim.commands.PlayerMoveAction.PERFORM_AT_POINT) {
    this.screenX = command.getScreenX();
    this.screenY = command.getScreenY();
  }

  // Cast a ray
  viewport.getRay(this.screenX, this.screenY, this.ray);
};
