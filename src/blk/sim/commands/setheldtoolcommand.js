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

goog.provide('blk.sim.commands.SetHeldToolCommand');

goog.require('blk.sim');
goog.require('blk.sim.commands.CommandType');
goog.require('gf.sim');
goog.require('gf.sim.Command');



/**
 * Sets the held tool of an actor.
 * Sent from the client to the server to request tool changes.
 *
 * @constructor
 * @extends {gf.sim.Command}
 * @param {!gf.sim.CommandFactory} commandFactory Command factory.
 */
blk.sim.commands.SetHeldToolCommand = function(commandFactory) {
  goog.base(this, commandFactory);

  /**
   * Tool entity ID.
   * @type {number}
   */
  this.tool = 0;
};
goog.inherits(blk.sim.commands.SetHeldToolCommand, gf.sim.Command);


/**
 * @override
 */
blk.sim.commands.SetHeldToolCommand.prototype.read = function(reader) {
  goog.base(this, 'read', reader);

  this.tool = reader.readUint32();
};


/**
 * @override
 */
blk.sim.commands.SetHeldToolCommand.prototype.write = function(writer) {
  goog.base(this, 'write', writer);

  writer.writeUint32(this.tool);
};


/**
 * Command ID.
 * @const
 * @type {number}
 */
blk.sim.commands.SetHeldToolCommand.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.commands.CommandType.SET_HELD_TOOL);


/**
 * Command flags.
 * @const
 * @type {number}
 */
blk.sim.commands.SetHeldToolCommand.FLAGS = 0;
