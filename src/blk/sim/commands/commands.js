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

goog.provide('blk.sim.commands');

goog.require('blk.sim.commands.PlayerMoveCommand');
goog.require('blk.sim.commands.SetAspectRatioCommand');
goog.require('blk.sim.commands.SetBlockCommand');
goog.require('blk.sim.commands.SetHeldToolCommand');
goog.require('gf.sim.CommandFactory');


/**
 * Registers all BLK commands with a simulator.
 * @param {!gf.sim.Simulator} simulator Simulator.
 */
blk.sim.commands.registerCommands = function(simulator) {
  // SET_ASPECT_RATIO
  simulator.registerCommandFactory(new gf.sim.CommandFactory(
      blk.sim.commands.SetAspectRatioCommand.ID,
      blk.sim.commands.SetAspectRatioCommand,
      blk.sim.commands.SetAspectRatioCommand.FLAGS));

  // PLAYER_MOVE
  simulator.registerCommandFactory(new gf.sim.CommandFactory(
      blk.sim.commands.PlayerMoveCommand.ID,
      blk.sim.commands.PlayerMoveCommand,
      blk.sim.commands.PlayerMoveCommand.FLAGS));

  // SET_BLOCK
  simulator.registerCommandFactory(new gf.sim.CommandFactory(
      blk.sim.commands.SetBlockCommand.ID,
      blk.sim.commands.SetBlockCommand,
      blk.sim.commands.SetBlockCommand.FLAGS));

  // SET_HELD_TOOL
  simulator.registerCommandFactory(new gf.sim.CommandFactory(
      blk.sim.commands.SetHeldToolCommand.ID,
      blk.sim.commands.SetHeldToolCommand,
      blk.sim.commands.SetHeldToolCommand.FLAGS));
};
