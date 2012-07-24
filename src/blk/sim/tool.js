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
 * Uses the tool.
 * @param {!blk.sim.commands.PlayerMoveCommand} command Command.
 * @param {!gf.vec.Viewport} viewport Viewport of the user.
 * @param {blk.sim.Actor} user Using actor, if any.
 */
blk.sim.Tool.prototype.use = function(command, viewport, user) {
  // TODO(benvanik): handle prediction logic (hasPredicted)
  if (command.hasPredicted) {
    // For now we ignore - in the future we'll want to predict properly
    return;
  }

  // TODO(benvanik): tool flags (melee-able, use-from-inventory, etc)
  // TODO(benvanik): handle basic repeat logic (instaneous, held-down, etc)

  var actions = command.actions;

  var sx = 0.5;
  var sy = 0.5;
  if (actions & blk.sim.commands.PlayerMoveAction.PERFORM_AT_POINT) {
    sx = command.getScreenX();
    sy = command.getScreenY();
  }

  if (actions & blk.sim.commands.PlayerMoveAction.USE_NORMAL_DOWN) {
    this.performAction(command.getTime(), viewport, user, sx, sy, 0);
  }
  if (actions & blk.sim.commands.PlayerMoveAction.USE_ALTERNATIVE_DOWN) {
    this.performAction(command.getTime(), viewport, user, sx, sy, 1);
  }
};


/**
 * Performs an action.
 * @protected
 * @param {number} time Time the action occurred.
 * @param {!gf.vec.Viewport} viewport Viewport of the user.
 * @param {blk.sim.Actor} user Using actor, if any.
 * @param {number} screenX Screen X, in [0-1].
 * @param {number} screenY Screen Y, in [0-1].
 * @param {number} action Action index.
 */
blk.sim.Tool.prototype.performAction = goog.nullFunction;
