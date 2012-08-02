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

goog.provide('blk.sim.commands.SetBlockCommand');

goog.require('blk.sim');
goog.require('blk.sim.commands.CommandType');
goog.require('gf.sim');
goog.require('gf.sim.Command');



/**
 * Sets a block in the world.
 * Sent from the server to clients to indicate block changes.
 *
 * @constructor
 * @extends {gf.sim.Command}
 * @param {!gf.sim.CommandFactory} commandFactory Command factory.
 */
blk.sim.commands.SetBlockCommand = function(commandFactory) {
  goog.base(this, commandFactory);

  /**
   * Block X in world coordinates.
   * @type {number}
   */
  this.x = 0;

  /**
   * Block Y in world coordinates.
   * @type {number}
   */
  this.y = 0;

  /**
   * Block Z in world coordinates.
   * @type {number}
   */
  this.z = 0;

  /**
   * New block data value.
   * This is a uint16 to match the slot in the {@see blk.env.Chunk}.
   * @type {number}
   */
  this.data = 0;
};
goog.inherits(blk.sim.commands.SetBlockCommand, gf.sim.Command);


/**
 * @override
 */
blk.sim.commands.SetBlockCommand.prototype.read = function(reader) {
  goog.base(this, 'read', reader);

  this.x = reader.readVarInt();
  this.y = reader.readVarInt();
  this.z = reader.readVarInt();
  this.data = reader.readUint16();
};


/**
 * @override
 */
blk.sim.commands.SetBlockCommand.prototype.write = function(writer) {
  goog.base(this, 'write', writer);

  writer.writeVarInt(this.x);
  writer.writeVarInt(this.y);
  writer.writeVarInt(this.z);
  writer.writeUint16(this.data);
};


/**
 * Command ID.
 * @const
 * @type {number}
 */
blk.sim.commands.SetBlockCommand.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.commands.CommandType.SET_BLOCK);


/**
 * Command flags.
 * @const
 * @type {number}
 */
blk.sim.commands.SetBlockCommand.FLAGS = 0;
