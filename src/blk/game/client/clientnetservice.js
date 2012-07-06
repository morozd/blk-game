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

goog.provide('blk.game.client.ClientNetService');

goog.require('blk.io.ChunkSerializer');
goog.require('blk.net.packets.ChunkData');
goog.require('blk.net.packets.EntityCreate');
goog.require('blk.net.packets.EntityDelete');
goog.require('blk.net.packets.EntityPosition');
goog.require('blk.net.packets.MapInfo');
goog.require('blk.net.packets.ReadyPlayer');
goog.require('blk.net.packets.SetBlock');
goog.require('gf.log');
goog.require('gf.net.NetworkService');
goog.require('goog.vec.Vec3');
goog.require('goog.vec.Vec4');



/**
 * Client network handling.
 *
 * @constructor
 * @extends {gf.net.NetworkService}
 * @param {!blk.game.client.ClientGame} game Game.
 */
blk.game.client.ClientNetService = function(game) {
  goog.base(this, game.session);

  /**
   * Game.
   * @type {!blk.game.client.ClientGame}
   */
  this.game = game;

  /**
   * Cached chunk serialization utility.
   * @private
   * @type {!blk.io.ChunkSerializer}
   */
  this.chunkSerializer_ = new blk.io.ChunkSerializer();
};
goog.inherits(blk.game.client.ClientNetService, gf.net.NetworkService);


/**
 * @override
 */
blk.game.client.ClientNetService.prototype.setupSwitch =
    function(packetSwitch) {
  packetSwitch.register(
      blk.net.packets.MapInfo.ID,
      this.handleMapInfo_, this);
  packetSwitch.register(
      blk.net.packets.ChunkData.ID,
      this.handleChunkData_, this);
  packetSwitch.register(
      blk.net.packets.ReadyPlayer.ID,
      this.handleReadyPlayer_, this);

  packetSwitch.register(
      blk.net.packets.SetBlock.ID,
      this.handleSetBlock_, this);

  packetSwitch.register(
      blk.net.packets.EntityCreate.ID,
      this.handleEntityCreate_, this);
  packetSwitch.register(
      blk.net.packets.EntityDelete.ID,
      this.handleEntityDelete_, this);
  packetSwitch.register(
      blk.net.packets.EntityPosition.ID,
      this.handleEntityPosition_, this);
};


/**
 * @override
 */
blk.game.client.ClientNetService.prototype.connected = function() {

};


/**
 * @override
 */
blk.game.client.ClientNetService.prototype.disconnected = function() {

};


/**
 * @override
 */
blk.game.client.ClientNetService.prototype.userConnected = function(user) {
  //this.game.handleUserConnect(user);
};


/**
 * @override
 */
blk.game.client.ClientNetService.prototype.userDisconnected = function(user) {
  //this.game.handleUserDisconnect(user);
};


/**
 * @override
 */
blk.game.client.ClientNetService.prototype.userUpdated = function(user) {
  //this.game.handleUserUpdate(user);
};


/**
 * Handles map info packets.
 * @private
 * @param {!gf.net.Packet} packet Packet.
 * @param {number} packetType Packet type ID.
 * @param {!gf.net.PacketReader} reader Packet reader.
 * @return {boolean} True if the packet was handled successfully.
 */
blk.game.client.ClientNetService.prototype.handleMapInfo_ =
    function(packet, packetType, reader) {
  var mapInfo = blk.net.packets.MapInfo.read(reader);
  if (!mapInfo) {
    return false;
  }

  //var map = this.game.state.map;

  gf.log.write('map info');

  return true;
};


/**
 * Handles chunk data packets.
 * @private
 * @param {!gf.net.Packet} packet Packet.
 * @param {number} packetType Packet type ID.
 * @param {!gf.net.PacketReader} reader Packet reader.
 * @return {boolean} True if the packet was handled successfully.
 */
blk.game.client.ClientNetService.prototype.handleChunkData_ =
    function(packet, packetType, reader) {
  var chunkData = blk.net.packets.ChunkData.read(reader);
  if (!chunkData) {
    return false;
  }

  // var map = this.game.state.map;

  // // Grab chunk from the cache, load
  // var chunk = map.getChunk(chunkData.x, chunkData.y, chunkData.z);
  // if (!this.chunkSerializer_.deserializeFromReader(chunk, reader)) {
  //   // TODO(benvanik): signal load failure? set state?
  //   return false;
  // }

  // TODO(benvanik): maybe fade in?

  return true;
};


/**
 * Handles player ready packets.
 * @private
 * @param {!gf.net.Packet} packet Packet.
 * @param {number} packetType Packet type ID.
 * @param {!gf.net.PacketReader} reader Packet reader.
 * @return {boolean} True if the packet was handled successfully.
 */
blk.game.client.ClientNetService.prototype.handleReadyPlayer_ =
    function(packet, packetType, reader) {
  var readyPlayer = blk.net.packets.ReadyPlayer.read(reader);
  if (!readyPlayer) {
    return false;
  }

  // All map data has been transferred, ready!
  //this.game.makeReady();

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
blk.game.client.ClientNetService.prototype.handleSetBlock_ =
    function(packet, packetType, reader) {
  var setBlock = blk.net.packets.SetBlock.read(reader);
  if (!setBlock) {
    return false;
  }

  // this.game.setBlock(
  //     setBlock.x, setBlock.y, setBlock.z, setBlock.blockData);

  return true;
};


/**
 * Handles entity create packets.
 * @private
 * @param {!gf.net.Packet} packet Packet.
 * @param {number} packetType Packet type ID.
 * @param {!gf.net.PacketReader} reader Packet reader.
 * @return {boolean} True if the packet was handled successfully.
 */
blk.game.client.ClientNetService.prototype.handleEntityCreate_ =
    function(packet, packetType, reader) {
  var entityCreate = blk.net.packets.EntityCreate.read(reader);
  if (!entityCreate) {
    return false;
  }

  var entityId = entityCreate.id;
  var userId = entityCreate.playerWireId;

  // var entity = this.game.createEntity(entityId, userId);
  // if (entity) {
  //   goog.vec.Vec3.setFromArray(entity.state.position, entityCreate.position);
  //   goog.vec.Vec4.setFromArray(entity.state.rotation, entityCreate.rotation);
  //   goog.vec.Vec3.setFromArray(entity.state.velocity, entityCreate.velocity);
  // }

  return true;
};


/**
 * Handles entity delete packets.
 * @private
 * @param {!gf.net.Packet} packet Packet.
 * @param {number} packetType Packet type ID.
 * @param {!gf.net.PacketReader} reader Packet reader.
 * @return {boolean} True if the packet was handled successfully.
 */
blk.game.client.ClientNetService.prototype.handleEntityDelete_ =
    function(packet, packetType, reader) {
  var entityDelete = blk.net.packets.EntityDelete.read(reader);
  if (!entityDelete) {
    return false;
  }

  var entityId = entityDelete.id;

  //this.game.deleteEntity(entityId);

  return true;
};


/**
 * Handles entity position packets.
 * @private
 * @param {!gf.net.Packet} packet Packet.
 * @param {number} packetType Packet type ID.
 * @param {!gf.net.PacketReader} reader Packet reader.
 * @return {boolean} True if the packet was handled successfully.
 */
blk.game.client.ClientNetService.prototype.handleEntityPosition_ =
    function(packet, packetType, reader) {
  var entityPosition = blk.net.packets.EntityPosition.read(reader);
  if (!entityPosition) {
    return false;
  }

  // this.game.updateEntityPosition(
  //     entityPosition.sequence, entityPosition.states);

  return true;
};
