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

goog.provide('blk.server.ServerNetService');

goog.require('blk.net.packets.MapCreate');
goog.require('blk.net.packets.Move');
goog.require('blk.net.packets.RequestChunkData');
goog.require('blk.net.packets.SetBlock');
goog.require('gf');
goog.require('gf.log');
goog.require('gf.net.NetworkService');
goog.require('gf.net.PacketWriter');



/**
 * Server network handling.
 *
 * @constructor
 * @extends {gf.net.NetworkService}
 * @param {!blk.server.ServerGame} game Game.
 */
blk.server.ServerNetService = function(game) {
  goog.base(this, game.session);

  /**
   * Game.
   * @type {!blk.server.ServerGame}
   */
  this.game = game;
};
goog.inherits(blk.server.ServerNetService, gf.net.NetworkService);


/**
 * @override
 */
blk.server.ServerNetService.prototype.setupSwitch = function(packetSwitch) {
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
blk.server.ServerNetService.prototype.connected = function() {
};


/**
 * @override
 */
blk.server.ServerNetService.prototype.disconnected = function() {
};


/**
 * @override
 */
blk.server.ServerNetService.prototype.userConnected = function(user) {
  this.game.handleUserConnect(user);
};


/**
 * @override
 */
blk.server.ServerNetService.prototype.userDisconnected = function(user) {
  this.game.handleUserDisconnect(user);
};


/**
 * @override
 */
blk.server.ServerNetService.prototype.userUpdated = function(user) {
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
blk.server.ServerNetService.prototype.handleMapCreate_ = function(packet,
    packetType, reader) {
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

  //this.game.setupMap(false);

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
blk.server.ServerNetService.prototype.handleRequestChunkData_ = function(packet,
    packetType, reader) {
  var requestChunkData = blk.net.packets.RequestChunkData.read(reader);
  if (!requestChunkData) {
    return false;
  }

  var user = packet.user;
  if (!user) {
    return false;
  }
  var player = /** @type {blk.Player} */ (user.data);
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
blk.server.ServerNetService.prototype.handleSetBlock_ = function(packet,
    packetType, reader) {
  var setBlock = blk.net.packets.SetBlock.read(reader);
  if (!setBlock) {
    return false;
  }

  var user = packet.user;
  if (!user) {
    return false;
  }

  return this.game.setBlock(
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
blk.server.ServerNetService.prototype.handleMove_ = function(packet,
    packetType, reader) {
  var move = blk.net.packets.Move.read(reader);
  if (!move) {
    return false;
  }

  var user = packet.user;
  if (!user) {
    return false;
  }

  return this.game.movePlayer(user, move.commands);
};


/**
 * Shared packet writer.
 * @private
 * @type {!gf.net.PacketWriter}
 */
blk.server.ServerNetService.packetWriter_ = new gf.net.PacketWriter();
