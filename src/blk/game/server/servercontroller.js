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

goog.provide('blk.game.server.ServerController');

goog.require('blk.env.MapParameters');
goog.require('blk.env.server.ServerMap');
goog.require('blk.game.server.SimulationObserver');
goog.require('blk.net.packets.ReadyPlayer');
goog.require('blk.sim.Root');
goog.require('blk.sim.commands');
goog.require('blk.sim.entities');
goog.require('gf.log');
goog.require('gf.net.INetworkService');
goog.require('gf.net.SessionState');
goog.require('gf.net.chat.ServerChatService');
goog.require('gf.sim.ServerSimulator');
goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.async.Deferred');



/**
 * Abstract server game controller.
 * @constructor
 * @extends {goog.Disposable}
 * @implements {gf.net.INetworkService}
 * @param {!blk.game.server.ServerGame} game Server game.
 * @param {!gf.net.ServerSession} session Network session.
 * @param {!blk.io.MapStore} mapStore Map storage provider, ownership
 *     transferred.
 */
blk.game.server.ServerController = function(game, session, mapStore) {
  goog.base(this);

  // Reset runtime clock
  game.clock = session.clock;

  /**
   * Server game this instance is controlling.
   * @protected
   * @type {!blk.game.server.ServerGame}
   */
  this.game = game;

  /**
   * Network session.
   * @type {!gf.net.ServerSession}
   */
  this.session = session;
  this.session.registerService(this);

  /**
   * Chat server.
   * @private
   * @type {!gf.net.chat.ServerChatService}
   */
  this.chatService_ = new gf.net.chat.ServerChatService(session);
  this.session.registerService(this.chatService_);

  // TODO(benvanik): pull from somewhere - args?
  var mapParams = new blk.env.MapParameters();

  /**
   * Map.
   * @private
   * @type {!blk.env.server.ServerMap}
   */
  this.map_ = new blk.env.server.ServerMap(mapParams, mapStore);
  this.registerDisposable(this.map_);

  /**
   * Server-side simulation.
   * @private
   * @type {!gf.sim.ServerSimulator}
   */
  this.simulator_ = new gf.sim.ServerSimulator(game, this.session,
      blk.game.server.SimulationObserver);
  this.registerDisposable(this.simulator_);
  blk.sim.commands.registerCommands(this.simulator_);
  blk.sim.entities.registerEntities(this.simulator_);

  /**
   * Root entity.
   * @private
   * @type {blk.sim.Root}
   */
  this.root_ = null;

  /**
   * Player listing.
   * @private
   * @type {!Array.<!blk.sim.Player>}
   */
  this.players_ = [];
};
goog.inherits(blk.game.server.ServerController, goog.Disposable);


/**
 * Gets the server simulator.
 * @return {!gf.sim.ServerSimulator} Server-side simulation.
 */
blk.game.server.ServerController.prototype.getSimulator = function() {
  return this.simulator_;
};


/**
 * @return {!blk.env.server.ServerMap} Game map.
 */
blk.game.server.ServerController.prototype.getMap = function() {
  return this.map_;
};


/**
 * @return {!blk.sim.Root} Root entity.
 */
blk.game.server.ServerController.prototype.getRoot = function() {
  goog.asserts.assert(this.root_);
  return this.root_;
};


/**
 * Gets a list of all currently connected players.
 * Do not modify the results. The results may change at any time.
 * @return {!Array.<!blk.sim.Player>} A list of players.
 */
blk.game.server.ServerController.prototype.getPlayerList = function() {
  return this.players_;
};


/**
 * Gets a player by session ID.
 * @param {string} sessionId User session ID.
 * @return {blk.sim.Player} Player, if found.
 */
blk.game.server.ServerController.prototype.getPlayerBySessionId =
    function(sessionId) {
  var user = this.session.getUserBySessionId(sessionId);
  if (user) {
    return /** @type {blk.sim.Player} */ (user.data);
  }
  return null;
};


/**
 * Gets a player by wire ID.
 * @param {number} wireId User wire ID.
 * @return {blk.sim.Player} Player, if found.
 */
blk.game.server.ServerController.prototype.getPlayerByWireId =
    function(wireId) {
  var user = this.session.getUserByWireId(wireId);
  if (user) {
    return /** @type {blk.sim.Player} */ (user.data);
  }
  return null;
};


/**
 * Handles player change events.
 * Called when a player joins, leaves, or updates their metadata.
 * @protected
 */
blk.game.server.ServerController.prototype.handlePlayersChanged =
    goog.nullFunction;


/**
 * Loads any resources required by the controller before the game can start.
 * @return {!goog.async.Deferred} A deferred fulfilled when the server is ready.
 */
blk.game.server.ServerController.prototype.load = function() {
  var deferred = new goog.async.Deferred();

  // TODO(benvanik): wait on initial map load?

  var simulator = this.getSimulator();

  // Root sim entity
  this.root_ = /** @type {!blk.sim.Root} */ (
      this.simulator_.createEntity(
          blk.sim.Root.ID,
          0));
  simulator.setRootEntity(this.root_);

  // Create initial simulation state
  this.setupSimulation();

  // Start accepting connections
  this.session.ready();
  deferred.callback(null);
  return deferred;
};


/**
 * Sets up the simulation on initial load.
 * @protected
 */
blk.game.server.ServerController.prototype.setupSimulation =
    goog.abstractMethod;


/**
 * Handles a new user.
 * @protected
 * @param {!gf.net.User} user User that connected.
 */
blk.game.server.ServerController.prototype.userConnected = function(user) {
  var map = this.map_;

  gf.log.write('client connected', user.sessionId, user.info, user.agent);

  // Add to chat channels
  this.chatService_.join(user, 'main');

  // Create player entity
  var player = this.createPlayer(user);
  user.data = player;
  this.players_.push(player);

  // Signal player ready
  this.session.send(blk.net.packets.ReadyPlayer.createData(), user);

  this.handlePlayersChanged();
};


/**
 * Creates a player entity for the given user and adds it to the simulation.
 * @protected
 * @param {!gf.net.User} user User the player represents.
 * @return {!blk.sim.Player} Player entity.
 */
blk.game.server.ServerController.prototype.createPlayer = goog.abstractMethod;


/**
 * Handles a dead user.
 * @protected
 * @param {!gf.net.User} user User that disconnected.
 */
blk.game.server.ServerController.prototype.userDisconnected = function(user) {
  var map = this.map_;

  gf.log.write('client disconnected', user.sessionId);

  var player = /** @type {blk.sim.Player} */ (user.data);
  if (!player) {
    return;
  }

  // Delete player entity
  this.deletePlayer(player);

  // Remove from roster
  goog.array.remove(this.players_, player);
  goog.dispose(player);
};


/**
 * Deletes a player entity and removes it from the simulation.
 * @protected
 * @param {!blk.sim.Player} player Player entity.
 */
blk.game.server.ServerController.prototype.deletePlayer = goog.abstractMethod;


/**
 * @override
 */
blk.game.server.ServerController.prototype.userUpdated = goog.nullFunction;


/**
 * Handles game-ending errors.
 * @protected
 * @param {string} message Error message.
 * @param {*=} opt_arg Optional argument.
 */
blk.game.server.ServerController.prototype.handleError =
    function(message, opt_arg) {
  // Log the error
  gf.log.write('Error: ' + message, opt_arg);

  // Graceful disconnect
  // TODO(benvanik): log with server?
  this.session.unready();

  // TODO(benvanik): die?
};


/**
 * Maximum amount of time, in ms, the network poll is allowed to take.
 * @private
 * @const
 * @type {number}
 */
blk.game.server.ServerController.MAX_NETWORK_POLL_TIME_ = 5;


/**
 * Updates the game contents.
 * @param {!gf.UpdateFrame} frame Current update frame.
 */
blk.game.server.ServerController.prototype.update = function(frame) {
  // Ignore updating when disconnected/stopped
  if (this.session.state == gf.net.SessionState.DISCONNECTED) {
    return;
  }

  // Poll for network activity
  this.session.poll(blk.game.server.ServerController.MAX_NETWORK_POLL_TIME_);

  // Check for new disconnection
  if (this.session.state == gf.net.SessionState.DISCONNECTED) {
    // TODO(benvanik): sys exit?
    gf.log.write('Server disconnected!?');
    return;
  }

  // Update game state
  this.map_.update(frame);

  // Update simulation
  this.simulator_.update(frame);
};


/**
 * Renders the screen contents.
 * @param {!gf.RenderFrame} frame Current render frame.
 */
blk.game.server.ServerController.prototype.render = function(frame) {
};


// // SIMDEPRECATED
// /**
//  * Sets a block and broadcasts the update.
//  * @param {!gf.net.User} user User who performed the change.
//  * @param {number} x Block X.
//  * @param {number} y Block Y.
//  * @param {number} z Block Z.
//  * @param {number} blockData Block data.
//  * @return {boolean} False if an error occurred setting the block.
//  */
// blk.game.server.ServerController.prototype.setBlock =
//     function(user, x, y, z, blockData) {
//   var player = /** @type {blk.sim.Player} */ (user.data);
//   if (!player || !player.view) {
//     return false;
//   }

//   var view = player.view;

//   // TODO(benvanik): verify user can act on the block (distance check/etc)

//   // Validate block type
//   if (blockData && !this.map_.blockSet.hasBlockWithId(blockData >> 8)) {
//     gf.log.write('unknown block type');
//     return false;
//   }

//   // Set
//   var changed = view.setBlock(x, y, z, blockData);

//   // Broadcast update, if it changed
//   if (changed) {
//     this.session.send(blk.net.packets.SetBlock.createData(
//         x, y, z, blockData));
//   }

//   return true;
// };


/**
 * @override
 */
blk.game.server.ServerController.prototype.connected = goog.nullFunction;


/**
 * @override
 */
blk.game.server.ServerController.prototype.disconnected = goog.nullFunction;
