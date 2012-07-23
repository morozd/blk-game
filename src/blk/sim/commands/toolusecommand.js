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

/**
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('blk.sim.commands.ToolUseAction');
goog.provide('blk.sim.commands.ToolUseCommand');

goog.require('blk.sim');
goog.require('blk.sim.commands.CommandType');
goog.require('gf.sim');
goog.require('gf.sim.PredictedCommand');
goog.require('goog.vec.Vec3');


/**
 * Bitmask values used to indicate the kind of use.
 * Expected to be <= 8 bits.
 * @enum {number}
 */
blk.sim.commands.ToolUseAction = {
  /**
   * Normal usage mode.
   */
  NORMAL: 1 << 0,

  /**
   * Alternate usage mode.
   */
  ALTERNATE: 1 << 1
};



/**
 * Simulation command for tool use.
 * Sent from client to server to signal tool use events. Part of the
 * prediction system.
 *
 * @constructor
 * @extends {gf.sim.PredictedCommand}
 * @param {!gf.sim.CommandFactory} commandFactory Command factory.
 */
blk.sim.commands.ToolUseCommand = function(commandFactory) {
  goog.base(this, commandFactory);

  /**
   * Bitmask indicating actions.
   * Zero or more bits set from {@see blk.sim.commands.ToolUseAction}.
   * Expected to be <= 8 bits.
   * @type {number}
   */
  this.actions = 0;

  /**
   * Ray origin point.
   * @type {!goog.vec.Vec3.Float32}
   */
  this.rayOrigin = goog.vec.Vec3.createFloat32();

  /**
   * Ray direction.
   * @type {!goog.vec.Vec3.Float32}
   */
  this.rayDirection = goog.vec.Vec3.createFloat32();
};
goog.inherits(blk.sim.commands.ToolUseCommand,
    gf.sim.PredictedCommand);


/**
 * Gets the ray value.
 * @param {!gf.vec.Ray.Type} result Output result ray.
 */
blk.sim.commands.ToolUseCommand.prototype.getRay = function(result) {
  result[0] = this.rayOrigin[0];
  result[1] = this.rayOrigin[1];
  result[2] = this.rayOrigin[2];
  result[3] = this.rayDirection[0];
  result[4] = this.rayDirection[1];
  result[5] = this.rayDirection[2];
};


/**
 * Sets the ray value.
 * @param {!gf.vec.Ray.Type} value Ray value.
 */
blk.sim.commands.ToolUseCommand.prototype.setRay = function(value) {
  this.rayOrigin[0] = value[0];
  this.rayOrigin[1] = value[1];
  this.rayOrigin[2] = value[2];
  this.rayDirection[0] = value[3];
  this.rayDirection[1] = value[4];
  this.rayDirection[2] = value[5];
};


/**
 * @override
 */
blk.sim.commands.ToolUseCommand.prototype.read = function(reader, timeBase) {
  goog.base(this, 'read', reader, timeBase);

  this.actions = reader.readUint8();
  reader.readVec3(this.rayOrigin);
  reader.readVec3(this.rayDirection);
};


/**
 * @override
 */
blk.sim.commands.ToolUseCommand.prototype.write = function(writer, timeBase) {
  goog.base(this, 'write', writer, timeBase);

  writer.writeUint8(this.actions);
  writer.writeVec3(this.rayOrigin);
  writer.writeVec3(this.rayDirection);
};


/**
 * Command ID.
 * @const
 * @type {number}
 */
blk.sim.commands.ToolUseCommand.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.commands.CommandType.TOOL_USE);


/**
 * Command flags.
 * @const
 * @type {number}
 */
blk.sim.commands.ToolUseCommand.FLAGS = gf.sim.PredictedCommand.FLAGS;
