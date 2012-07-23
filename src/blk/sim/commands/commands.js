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
goog.require('blk.sim.commands.ToolUseCommand');
goog.require('gf.sim.CommandFactory');


/**
 * Registers all BLK commands with a simulator.
 * @param {!gf.sim.Simulator} simulator Simulator.
 */
blk.sim.commands.registerCommands = function(simulator) {
  // PLAYER_MOVE
  simulator.registerCommandFactory(new gf.sim.CommandFactory(
      blk.sim.commands.PlayerMoveCommand.ID,
      blk.sim.commands.PlayerMoveCommand,
      blk.sim.commands.PlayerMoveCommand.FLAGS));

  // TOOL_USE
  simulator.registerCommandFactory(new gf.sim.CommandFactory(
      blk.sim.commands.ToolUseCommand.ID,
      blk.sim.commands.ToolUseCommand,
      blk.sim.commands.ToolUseCommand.FLAGS));
};
