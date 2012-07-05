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

goog.provide('blk.game.server.ServerPlayer');

goog.require('blk.env.Chunk');
goog.require('blk.game.Player');
goog.require('blk.net.packets.ChunkData');
goog.require('gf.net.PacketWriter');
goog.require('goog.array');
goog.require('goog.vec.Vec3');



/**
 * Server-side player.
 *
 * @constructor
 * @extends {blk.game.Player}
 * @param {!blk.server.ServerGame} game Game.
 * @param {!gf.net.User} user Net user.
 */
blk.game.server.ServerPlayer = function(game, user) {
  goog.base(this, user);

  /**
   * Current game.
   * @type {!blk.server.ServerGame}
   */
  this.game = game;

  /**
   * Movement controller, if any.
   * @type {blk.physics.ServerMovement}
   */
  this.movement = null;

  /**
   * A queue of chunks to send to the player.
   * Chunks are stored in this list as references, not snapshots, as the chunk
   * must be serialized at the time it is sent so the order in the stream is
   * preserved. (for example, if set-block actions are issued on a chunk that
   * is still queued, they will be ignored on the client - by serializing at
   * send time those actions will be rolled into the chunk data).
   * @private
   * @type {!Array.<!blk.env.Chunk>}
   */
  this.sendQueue_ = [];

  /**
   * Last time the chunk queue was sorted. Set to 0 to force a sort.
   * @private
   * @type {number}
   */
  this.lastSortTime_ = 0;
};
goog.inherits(blk.game.server.ServerPlayer, blk.game.Player);


/**
 * Updates the server player, processing queued network actions/etc.
 * @param {!gf.UpdateFrame} frame Current frame.
 */
blk.game.server.ServerPlayer.prototype.update = function(frame) {
  // Process movement
  if (this.movement) {
    this.movement.update(frame);
  }

  // Update views
  if (this.view) {
    this.view.update(frame, this.entity.state.position);
  }

  // Handle pending chunk sends
  if (this.sendQueue_.length) {
    this.processSendQueue_(frame);
  }
};


/**
 * Seconds between sorts of the send queue.
 * @private
 * @const
 * @type {number}
 */
blk.game.server.ServerPlayer.QUEUE_SORT_INTERVAL_ = 3;


/**
 * Maximum number of chunk sends per update.
 * @private
 * @const
 * @type {number}
 */
blk.game.server.ServerPlayer.MAX_CHUNK_SENDS_ = 5;


/**
 * Queues chunk data for sending to the user.
 * @param {!blk.env.Chunk} chunk Chunk to send.
 */
blk.game.server.ServerPlayer.prototype.queueChunkSend = function(chunk) {
  if (goog.array.contains(this.sendQueue_, chunk)) {
    return;
  }
  this.sendQueue_.push(chunk);
  this.lastSortTime_ = 0;
};


/**
 * Handles sending new chunks from the send queue.
 * @private
 * @param {!gf.UpdateFrame} frame Current frame.
 */
blk.game.server.ServerPlayer.prototype.processSendQueue_ = function(frame) {
  var sendCount = Math.min(blk.game.server.ServerPlayer.MAX_CHUNK_SENDS_,
      this.sendQueue_.length);

  // Re-sort the send list
  if (frame.time - this.lastSortTime_ >
      blk.game.server.ServerPlayer.QUEUE_SORT_INTERVAL_) {
    this.lastSortTime_ = frame.time;
    blk.env.Chunk.sortByDistanceFromPoint(this.sendQueue_, this.view.center);
  }

  for (var n = 0; n < sendCount; n++) {
    var chunk = this.sendQueue_.shift();

    // Build the packet piece by piece
    // First write in the packet header
    var writer = blk.game.server.ServerPlayer.packetWriter_;
    var packet = blk.net.packets.ChunkData.writeInstance;
    packet.x = chunk.x;
    packet.y = chunk.y;
    packet.z = chunk.z;
    if (blk.net.packets.ChunkData.write(writer, packet)) {
      // Serialize chunk data
      if (this.game.chunkSerializer.serializeToWriter(chunk, writer)) {
        // Send to user
        this.game.session.send(writer.finish(), this.user);
      }
    }

    // Always drop (in case an error occurred above)
    writer.drop();
  }
};


/**
 * Shared vec3 for math.
 * @private
 * @type {!goog.vec.Vec3.Float32}
 */
blk.game.server.ServerPlayer.tmpVec3_ = goog.vec.Vec3.createFloat32();


/**
 * Shared packet writer.
 * @private
 * @type {!gf.net.PacketWriter}
 */
blk.game.server.ServerPlayer.packetWriter_ = new gf.net.PacketWriter();
