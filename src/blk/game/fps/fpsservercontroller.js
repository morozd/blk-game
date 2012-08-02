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

goog.provide('blk.game.fps.FpsServerController');

goog.require('blk.game.server.ServerController');
goog.require('blk.sim.Player');
goog.require('blk.sim.World');
goog.require('goog.asserts');



/**
 * @constructor
 * @extends {blk.game.server.ServerController}
 * @param {!blk.game.server.ServerGame} game Server game.
 * @param {!gf.net.ServerSession} session Network session.
 * @param {!blk.io.MapStore} mapStore Map storage provider, ownership
 *     transferred.
 */
blk.game.fps.FpsServerController = function(game, session, mapStore) {
  goog.base(this, game, session, mapStore);

  /**
   * World entity, containing the map and renderable entities (players/etc).
   * @private
   * @type {blk.sim.World}
   */
  this.world_ = null;
};
goog.inherits(blk.game.fps.FpsServerController,
    blk.game.server.ServerController);


/**
 * @override
 */
blk.game.fps.FpsServerController.prototype.setupSimulation =
    function() {
  var simulator = this.getSimulator();
  var root = this.getRoot();

  // Create the world
  this.world_ = /** @type {!blk.sim.World} */ (
      this.simulator_.createEntity(
          blk.sim.World.ID,
          0));
  this.world_.setParent(root);

  // Setup world
  // This binds the map and the world together
  this.world_.setMap(this.getMap());

  // Set the world
  root.setWorld(this.world_);
};


/**
 * @override
 */
blk.game.fps.FpsServerController.prototype.createPlayer =
    function(user) {
  var simulator = this.getSimulator();
  goog.asserts.assert(this.world_);

  // Create player
  var player = /** @type {!blk.sim.Player} */ (
      simulator.createEntity(
          blk.sim.Player.ID,
          0));

  // Setup and add to world
  player.setup(user);

  // Spawn the player
  player.spawn();

  // TODO(benvanik): make hotkey
  blk.sim.getRoot(player).dumpInfo(0);

  return player;
};


/**
 * @override
 */
blk.game.fps.FpsServerController.prototype.deletePlayer =
    function(player) {
  var simulator = this.getSimulator();

  // TODO(benvanik): delete other player entities

  simulator.removeEntity(player);

  // TODO(benvanik): make hotkey
  blk.sim.getRoot(player).dumpInfo(0);
};
