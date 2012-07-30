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

goog.provide('blk.sim.commands.SetAspectRatioCommand');

goog.require('blk.sim');
goog.require('blk.sim.commands.CommandType');
goog.require('gf.sim');
goog.require('gf.sim.Command');



/**
 * Sets the aspect ratio of a camera.
 * Sent from the client to the server when the aspect ratio changes.
 *
 * @constructor
 * @extends {gf.sim.Command}
 * @param {!gf.sim.CommandFactory} commandFactory Command factory.
 */
blk.sim.commands.SetAspectRatioCommand = function(commandFactory) {
  goog.base(this, commandFactory);

  /**
   * Aspect ratio.
   * @type {number}
   */
  this.aspectRatio = 0;
};
goog.inherits(blk.sim.commands.SetAspectRatioCommand, gf.sim.Command);


/**
 * @override
 */
blk.sim.commands.SetAspectRatioCommand.prototype.read = function(
    reader, timeBase) {
  goog.base(this, 'read', reader, timeBase);

  this.aspectRatio = reader.readFloat32();
};


/**
 * @override
 */
blk.sim.commands.SetAspectRatioCommand.prototype.write = function(
    writer, timeBase) {
  goog.base(this, 'write', writer, timeBase);

  writer.writeFloat32(this.aspectRatio);
};


/**
 * Command ID.
 * @const
 * @type {number}
 */
blk.sim.commands.SetAspectRatioCommand.ID = gf.sim.createTypeId(
    blk.sim.BLK_MODULE_ID, blk.sim.commands.CommandType.SET_ASPECT_RATIO);


/**
 * Command flags.
 * @const
 * @type {number}
 */
blk.sim.commands.SetAspectRatioCommand.FLAGS = 0;
