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

goog.provide('blk.sim.Inventory');

goog.require('blk.sim');
goog.require('blk.sim.EntityType');
goog.require('blk.sim.commands.SetHeldToolCommand');
goog.require('gf');
goog.require('gf.sim');
goog.require('gf.sim.Entity');
goog.require('goog.events.KeyCodes');
goog.require('goog.math');



/**
 * Abstract actor controller entity.
 * Can be parented to an actor and assigned as a controller.
 *
 * @constructor
 * @extends {gf.sim.Entity}
 * @param {!gf.sim.Simulator} simulator Owning simulator.
 * @param {!gf.sim.EntityFactory} entityFactory Entity factory.
 * @param {number} entityId Entity ID.
 * @param {number} entityFlags Bitmask of {@see gf.sim.EntityFlag} values.
 */
blk.sim.Inventory = function(
    simulator, entityFactory, entityId, entityFlags) {
  goog.base(this, simulator, entityFactory, entityId, entityFlags);

  if (goog.DEBUG) {
    this.debugName = 'Inventory';
  }
};
goog.inherits(blk.sim.Inventory, gf.sim.Entity);


/**
 * Entity ID.
 * @const
 * @type {number}
 */
blk.sim.Inventory.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.EntityType.INVENTORY);


/**
 * Gets the target actor of the controller, if any.
 * @return {blk.sim.Actor} Target actor.
 */
blk.sim.Inventory.prototype.getTarget = function() {
  return /** @type {blk.sim.Actor} */ (this.getParent());
};


/**
 * @override
 */
blk.sim.Inventory.prototype.childAdded = function(entity) {
  goog.base(this, 'childAdded', entity);

  // Item was added to the inventory
};


/**
 * @override
 */
blk.sim.Inventory.prototype.childRemoved = function(entity) {
  goog.base(this, 'childRemoved', entity);

  // Item was removed from the inventory
};


/**
 * @override
 */
blk.sim.Inventory.prototype.executeCommand = function(command) {
  goog.base(this, 'executeCommand', command);

  if (command instanceof blk.sim.commands.SetHeldToolCommand) {
    var target = this.getTarget();
    var newTool = /** @type {blk.sim.Tool} */ (this.getChild(command.toolId));
    if (newTool) {
      target.setHeldTool(newTool);
    }
  }
};


if (gf.CLIENT) {
  /**
   * Processes the input control for a single frame.
   * @param {!gf.RenderFrame} frame Current frame.
   * @param {!gf.input.Data} inputData Current input data.
   * @return {boolean} True if input is valid, false if input has failed.
   */
  blk.sim.Inventory.prototype.processInput = function(frame, inputData) {
    var keyboardData = inputData.keyboard;
    var mouseData = inputData.mouse;

    var target = this.getTarget();
    var heldTool = target.getHeldTool();

    var count = this.getChildCount();
    var oldHeldIndex = heldTool ? this.getIndexOfChild(heldTool) : 0;
    var newHeldIndex = oldHeldIndex;

    if (mouseData.dz) {
      // TODO(benvanik): mac touchpad scroll
      var dz = mouseData.dz > 0 ? 1 : -1;
      newHeldIndex = (oldHeldIndex + dz) % count;
      if (newHeldIndex < 0) {
        newHeldIndex = count - 1;
      }
    }

    if (keyboardData.didKeyGoDown(goog.events.KeyCodes.ONE)) {
      newHeldIndex = 0;
    } else if (keyboardData.didKeyGoDown(goog.events.KeyCodes.TWO)) {
      newHeldIndex = 1;
    } else if (keyboardData.didKeyGoDown(goog.events.KeyCodes.THREE)) {
      newHeldIndex = 2;
    } else if (keyboardData.didKeyGoDown(goog.events.KeyCodes.FOUR)) {
      newHeldIndex = 3;
    } else if (keyboardData.didKeyGoDown(goog.events.KeyCodes.FIVE)) {
      newHeldIndex = 4;
    } else if (keyboardData.didKeyGoDown(goog.events.KeyCodes.SIX)) {
      newHeldIndex = 5;
    } else if (keyboardData.didKeyGoDown(goog.events.KeyCodes.SEVEN)) {
      newHeldIndex = 6;
    } else if (keyboardData.didKeyGoDown(goog.events.KeyCodes.EIGHT)) {
      newHeldIndex = 7;
    } else if (keyboardData.didKeyGoDown(goog.events.KeyCodes.NINE)) {
      newHeldIndex = 8;
    } else if (keyboardData.didKeyGoDown(goog.events.KeyCodes.ZERO)) {
      newHeldIndex = 9;
    }

    newHeldIndex = goog.math.clamp(newHeldIndex, 0, count - 1);

    if (newHeldIndex != oldHeldIndex) {
      // Create command
      var cmd = /** @type {!blk.sim.commands.SetHeldToolCommand} */ (
          this.createCommand(blk.sim.commands.SetHeldToolCommand.ID));
      var newTool = this.getChildAtIndex(newHeldIndex);
      cmd.toolId = newTool.getId();
      this.simulator.sendCommand(cmd);

      if (gf.CLIENT) {
        var controller = blk.sim.getClientController(this);
        controller.playClick();
      }
    }

    return true;
  };
}
