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

goog.require('blk.env.ChunkView');
goog.require('blk.env.Entity');
goog.require('blk.env.MapParameters');
goog.require('blk.env.server.ServerMap');
goog.require('blk.game.server.ServerMapObserver');
goog.require('blk.game.server.ServerPlayer');
goog.require('blk.game.server.SimulationObserver');
goog.require('blk.io.ChunkSerializer');
goog.require('blk.io.CompressionFormat');
goog.require('blk.net.packets.EntityCreate');
goog.require('blk.net.packets.EntityDelete');
goog.require('blk.net.packets.MapCreate');
goog.require('blk.net.packets.Move');
goog.require('blk.net.packets.ReadyPlayer');
goog.require('blk.net.packets.RequestChunkData');
goog.require('blk.net.packets.SetBlock');
goog.require('blk.sim.World');
goog.require('blk.sim.commands');
goog.require('blk.sim.entities');
goog.require('gf');
goog.require('gf.log');
goog.require('gf.net.NetworkService');
goog.require('gf.net.PacketWriter');
goog.require('gf.net.SessionState');
goog.require('gf.net.chat.ServerChatService');
goog.require('gf.sim.ServerSimulator');
goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.async.Deferred');
goog.require('goog.vec.Vec3');



/**
 * Abstract server game controller.
 * @constructor
 * @extends {goog.Disposable}
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

  /**
   * Server net service.
   * @private
   * @type {!blk.game.server.ServerController.NetService_}
   */
  this.netService_ = new blk.game.server.ServerController.NetService_(this);
  this.session.registerService(this.netService_);

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
   * Map entity.
   * @private
   * @type {blk.sim.World}
   */
  this.world_ = null;

  /**
   * Player listing.
   * @private
   * @type {!Array.<!blk.game.server.ServerPlayer>}
   */
  this.players_ = [];

  // If running in a web worker, don't use compression (it's a waste)
  var compressionFormat;
  if (gf.SERVER && !gf.NODE) {
    compressionFormat = blk.io.CompressionFormat.UNCOMPRESSED;
  }

  /**
   * Cached chunk serialization utility used when sending chunks to clients.
   * @private
   * @type {!blk.io.ChunkSerializer}
   */
  this.chunkSerializer_ = new blk.io.ChunkSerializer(compressionFormat);

  // SIMDEPRECATED
  /**
   * @private
   * @type {number}
   */
  this.nextEntityId_ = 0;
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
 * @return {!blk.io.ChunkSerializer} Chunk serialization utility.
 */
blk.game.server.ServerController.prototype.getChunkSerializer = function() {
  return this.chunkSerializer_;
};


/**
 * Gets a list of all currently connected players.
 * Do not modify the results. The results may change at any time.
 * @return {!Array.<!blk.game.server.ServerPlayer>} A list of players.
 */
blk.game.server.ServerController.prototype.getPlayerList = function() {
  return this.players_;
};


/**
 * Gets a player by session ID.
 * @param {string} sessionId User session ID.
 * @return {blk.game.server.ServerPlayer} Player, if found.
 */
blk.game.server.ServerController.prototype.getPlayerBySessionId =
    function(sessionId) {
  var user = this.session.getUserBySessionId(sessionId);
  if (user) {
    return /** @type {blk.game.server.ServerPlayer} */ (user.data);
  }
  return null;
};


/**
 * Gets a player by wire ID.
 * @param {number} wireId User wire ID.
 * @return {blk.game.server.ServerPlayer} Player, if found.
 */
blk.game.server.ServerController.prototype.getPlayerByWireId =
    function(wireId) {
  var user = this.session.getUserByWireId(wireId);
  if (user) {
    return /** @type {blk.game.server.ServerPlayer} */ (user.data);
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

  // Create initial simulation state
  this.setupSimulation();

  // Start accepting connections
  this.session.ready();
  deferred.callback(null);
  return deferred;
};


// TODO(benvanik): make all of this subclass only?
/**
 * Sets up the simulation on initial load.
 * @protected
 */
blk.game.server.ServerController.prototype.setupSimulation = function() {
  // Map
  this.world_ = /** @type {!blk.sim.World} */ (
      this.simulator_.createEntity(
          blk.sim.World.ID,
          0));
};


/**
 * Handles a new user.
 * @protected
 * @param {!gf.net.User} user User that connected.
 */
blk.game.server.ServerController.prototype.userConnected = function(user) {
  var map = this.map_;

  gf.log.write('client connected', user.sessionId, user.info, user.agent);

  // Create player
  var player = new blk.game.server.ServerPlayer(this, user);
  user.data = player;
  this.players_.push(player);

  // Add to chat channels
  this.chatService_.join(user, 'main');

  // Create player entity
  var playerEntity = this.createPlayer(user);

  // Pick a spawn position
  var spawnPosition = goog.vec.Vec3.createFloat32FromValues(0, 80, 0);

  // Create view - must be cleaned up on player disconnect
  var view = new blk.env.ChunkView(map,
      blk.env.ChunkView.HIGH_CHUNK_RADIUS_XZ);
  //blk.env.ChunkView.LOW_CHUNK_RADIUS_XZ);
  map.addChunkView(view);
  player.view = view;

  // Setup observer
  var observer = new blk.game.server.ServerMapObserver(player, view);
  view.addObserver(observer);

  // Initialize view - must be done after observers are added
  view.initialize(spawnPosition);

  // Send all existing entities
  for (var n = 0; n < map.entities.length; n++) {
    var entity = map.entities[n];
    this.session.send(blk.net.packets.EntityCreate.createData(
        entity.id,
        entity.flags,
        entity.player ? entity.player.getUser().wireId : 0xFF,
        entity.state.position,
        entity.state.rotation,
        entity.state.velocity), user);
  }

  // Create entity
  var entity = new blk.env.Entity(this.nextEntityId_++);
  map.addEntity(entity);
  goog.vec.Vec3.setFromArray(entity.state.position, spawnPosition);

  // Setup movement controller
  player.attachEntity(entity);

  // Broadcast new entity
  this.session.send(blk.net.packets.EntityCreate.createData(
      entity.id,
      entity.flags,
      entity.player ? entity.player.getUser().wireId : 0xFF,
      entity.state.position,
      entity.state.rotation,
      entity.state.velocity));

  // TODO(benvanik): send all map chunks

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

  var player = /** @type {blk.game.server.ServerPlayer} */ (user.data);
  if (!player) {
    return;
  }

  // Delete entity
  var entity = player.entity;
  if (entity) {
    map.removeEntity(entity);
    this.session.send(blk.net.packets.EntityDelete.createData(entity.id));
  }

  // Remove view
  if (player.view) {
    map.removeChunkView(player.view);
    goog.dispose(player.view);
    player.view = null;
  }

  // Delete player entity
  //this.deletePlayer(playerEntity);

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
  var map = this.map_;
  map.update(frame);

  // Update simulation
  this.simulator_.update(frame);

  // SIMDEPRECATED
  // Update each player
  for (var n = 0; n < this.players_.length; n++) {
    var player = this.players_[n];
    player.update(frame);
  }

  // SIMDEPRECATED
  // Broadcast any pending updates to users
  // TODO(benvanik): only send updates relevant to each user vs. broadcast all
  // NOTE: always sending, even if not updates, so sequence numbers get ACKed
  var entityStates = [];
  for (var n = 0; n < map.entities.length; n++) {
    var entity = map.entities[n];
    if (!entity.hasSentLatestState) {
      entity.state.time = (frame.time * 1000) | 0;
      entityStates.push(entity.state);
      entity.hasSentLatestState = true;
    }
  }
  for (var n = 0; n < this.players_.length; n++) {
    var player = this.players_[n];
    player.sendUpdate(frame, entityStates);
  }
};


/**
 * Renders the screen contents.
 * @param {!gf.RenderFrame} frame Current render frame.
 */
blk.game.server.ServerController.prototype.render = function(frame) {
};


/**
 * Sets a block and broadcasts the update.
 * @param {!gf.net.User} user User who performed the change.
 * @param {number} x Block X.
 * @param {number} y Block Y.
 * @param {number} z Block Z.
 * @param {number} blockData Block data.
 * @return {boolean} False if an error occurred setting the block.
 */
blk.game.server.ServerController.prototype.setBlock =
    function(user, x, y, z, blockData) {
  var player = /** @type {blk.game.server.ServerPlayer} */ (user.data);
  if (!player || !player.view) {
    return false;
  }

  var view = player.view;

  // TODO(benvanik): verify user can act on the block (distance check/etc)

  // Validate block type
  if (blockData && !this.map_.blockSet.hasBlockWithId(blockData >> 8)) {
    gf.log.write('unknown block type');
    return false;
  }

  // Set
  var changed = view.setBlock(x, y, z, blockData);

  // Broadcast update, if it changed
  if (changed) {
    this.session.send(blk.net.packets.SetBlock.createData(
        x, y, z, blockData));
  }

  return true;
};



/**
 * Server network handling.
 *
 * @private
 * @constructor
 * @extends {gf.net.NetworkService}
 * @param {!blk.game.server.ServerController} controller Server controller.
 */
blk.game.server.ServerController.NetService_ = function(controller) {
  goog.base(this, controller.session);

  /**
   * @private
   * @type {!blk.game.server.ServerController}
   */
  this.controller_ = controller;
};
goog.inherits(blk.game.server.ServerController.NetService_,
    gf.net.NetworkService);


/**
 * @override
 */
blk.game.server.ServerController.NetService_.prototype.setupSwitch =
    function(packetSwitch) {
  packetSwitch.register(
      blk.net.packets.MapCreate.ID,
      this.handleMapCreate_, this);
  packetSwitch.register(
      blk.net.packets.RequestChunkData.ID,
      this.handleRequestChunkData_, this);
  packetSwitch.register(
      blk.net.packets.SetBlock.ID,
      this.handleSetBlock_, this);
  packetSwitch.register(
      blk.net.packets.Move.ID,
      this.handleMove_, this);
};


/**
 * @override
 */
blk.game.server.ServerController.NetService_.prototype.userConnected =
    function(user) {
  this.controller_.userConnected(user);
};


/**
 * @override
 */
blk.game.server.ServerController.NetService_.prototype.userDisconnected =
    function(user) {
  this.controller_.userDisconnected(user);
};


/**
 * @override
 */
blk.game.server.ServerController.NetService_.prototype.userUpdated =
    function(user) {
  gf.log.write('user ' + user + ' changed name');
};


/**
 * Handles map create packets.
 * @private
 * @param {!gf.net.Packet} packet Packet.
 * @param {number} packetType Packet type ID.
 * @param {!gf.net.PacketReader} reader Packet reader.
 * @return {boolean} True if the packet was handled successfully.
 */
blk.game.server.ServerController.NetService_.prototype.handleMapCreate_ =
    function(packet, packetType, reader) {
  var mapCreate = blk.net.packets.MapCreate.read(reader);
  if (!mapCreate) {
    return false;
  }

  if (gf.NODE) {
    // TODO(benvanik): if real server, only allow admins - for now, die
    gf.log.write('ignoring map create');
    return false;
  }

  gf.log.write('user ' + packet.user + ' invoking map create...');

  //this.controller_.setupMap(false);

  return true;
};


/**
 * Handles chunk data request packets.
 * @private
 * @param {!gf.net.Packet} packet Packet.
 * @param {number} packetType Packet type ID.
 * @param {!gf.net.PacketReader} reader Packet reader.
 * @return {boolean} True if the packet was handled successfully.
 */
blk.game.server.ServerController.NetService_.prototype.handleRequestChunkData_ =
    function(packet, packetType, reader) {
  var requestChunkData = blk.net.packets.RequestChunkData.read(reader);
  if (!requestChunkData) {
    return false;
  }

  var user = packet.user;
  if (!user) {
    return false;
  }
  var player = /** @type {blk.game.server.ServerPlayer} */ (user.data);
  if (!player) {
    return false;
  }

  var view = player.view;
  if (!view) {
    return false;
  }

  for (var n = 0; n < requestChunkData.entries.length; n++) {
    var entry = requestChunkData.entries[n];
    var chunk = view.getChunk(entry.x, entry.y, entry.z);
    if (chunk) {
      player.queueChunkSend(chunk);
    }
  }

  return true;
};


/**
 * Handles set block packets.
 * @private
 * @param {!gf.net.Packet} packet Packet.
 * @param {number} packetType Packet type ID.
 * @param {!gf.net.PacketReader} reader Packet reader.
 * @return {boolean} True if the packet was handled successfully.
 */
blk.game.server.ServerController.NetService_.prototype.handleSetBlock_ =
    function(packet, packetType, reader) {
  var setBlock = blk.net.packets.SetBlock.read(reader);
  if (!setBlock) {
    return false;
  }

  var user = packet.user;
  if (!user) {
    return false;
  }

  return this.controller_.setBlock(
      user,
      setBlock.x, setBlock.y, setBlock.z, setBlock.blockData);
};


/**
 * Handles move packets.
 * @private
 * @param {!gf.net.Packet} packet Packet.
 * @param {number} packetType Packet type ID.
 * @param {!gf.net.PacketReader} reader Packet reader.
 * @return {boolean} True if the packet was handled successfully.
 */
blk.game.server.ServerController.NetService_.prototype.handleMove_ =
    function(packet, packetType, reader) {
  var move = blk.net.packets.Move.read(reader);
  if (!move) {
    return false;
  }

  var user = packet.user;
  if (!user) {
    return false;
  }
  var player = /** @type {blk.game.server.ServerPlayer} */ (user.data);
  if (!player) {
    return false;
  }

  player.queueMovementCommands(move.commands);

  return true;
};


/**
 * Shared packet writer.
 * @private
 * @type {!gf.net.PacketWriter}
 */
blk.game.server.ServerController.NetService_.packetWriter_ =
    new gf.net.PacketWriter();
