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
goog.require('blk.env.Entity');
goog.require('blk.net.packets.ChunkData');
goog.require('blk.net.packets.EntityPosition');
goog.require('blk.physics.ServerMovement');
goog.require('gf.net.PacketWriter');
goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.vec.Vec3');



/**
 * Server-side player.
 *
 * @constructor
 * @extends {goog.Disposable}
 * @param {!blk.game.server.ServerController} controller Server controller.
 * @param {!gf.net.User} user Net user.
 */
blk.game.server.ServerPlayer = function(controller, user) {
  goog.base(this);

  /**
   * @private
   * @type {!blk.game.server.ServerController}
   */
  this.controller_ = controller;

  /**
   * Net user.
   * @protected
   * @type {!gf.net.User}
   */
  this.user = user;

  /**
   * Primary player entity.
   * @protected
   * @type {blk.sim.Player}
   */
  this.entity2 = null;

  // SIMDEPRECATED
  /**
   * Entity assigned to this player, if any.
   * @type {blk.env.Entity}
   */
  this.entity = null;

  /**
   * Chunk view.
   * @type {blk.env.ChunkView}
   */
  this.view = null;

  // SIMDEPRECATED
  /**
   * Movement controller, if any.
   * @private
   * @type {blk.physics.ServerMovement}
   */
  this.movement_ = null;

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
goog.inherits(blk.game.server.ServerPlayer, goog.Disposable);


/**
 * @return {!gf.net.User} The net user the player is associated with.
 */
blk.game.server.ServerPlayer.prototype.getUser = function() {
  return this.user;
};


// SIMDEPRECATED
/**
 * Attaches an entity to a player.
 * @param {!blk.env.Entity} entity Player entity.
 */
blk.game.server.ServerPlayer.prototype.attachEntity = function(entity) {
  // Bind
  this.entity = entity;
  entity.player = this;

  // Mark as being user controlled
  entity.flags = blk.env.Entity.Flags.USER_CONTROLLED;

  // Setup movement
  goog.asserts.assert(this.view);
  this.movement_ = new blk.physics.ServerMovement(this.view);
  this.movement_.attach(entity);
};


// SIMDEPRECATED
/**
 * Queues a list of movement commands sent from the player.
 * @param {!Array.<!blk.physics.MoveCommand>} commands Move commands.
 */
blk.game.server.ServerPlayer.prototype.queueMovementCommands =
    function(commands) {
  if (this.movement_) {
    this.movement_.queueCommands(commands);
  }
};


/**
 * Updates the player-related logic.
 * @param {!gf.UpdateFrame} frame Current frame.
 */
blk.game.server.ServerPlayer.prototype.update = function(frame) {
  // SIMDEPRECATED
  // Process movement
  if (this.movement_) {
    this.movement_.update(frame);
  }

  // SIMDEPRECATED - move to player entity?
  // Update views
  if (this.view) {
    this.view.update(frame, this.entity.state.position);
  }

  // Handle pending chunk sends
  if (this.sendQueue_.length) {
    this.processSendQueue_(frame);
  }
};


// SIMDEPRECATED
/**
 * Sends an update packet to the given player with entity state deltas.
 * @param {!gf.UpdateFrame} frame Current update frame.
 * @param {!Array.<!blk.env.EntityState>} entityStates Entity state deltas.
 */
blk.game.server.ServerPlayer.prototype.sendUpdate = function(
    frame, entityStates) {
  var movement = this.movement_;

  // Determine if we need to send a sequence ID
  var sequence = -1;
  var needsSequenceUpdate = false;
  if (movement) {
    needsSequenceUpdate = movement.lastSequence != movement.lastSequenceSent;
    sequence = movement.lastSequence;
    movement.lastSequenceSent = movement.lastSequence;
  }

  // Only send packet if we need to confirm a sequence or update entities
  // TODO(benvanik): delay confirming sequences a bit to reduce network
  //     traffic when nothing is moving
  if (entityStates.length || needsSequenceUpdate) {
    this.controller_.session.send(
        blk.net.packets.EntityPosition.createData(sequence, entityStates),
        this.getUser());
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

  var writer = gf.net.PacketWriter.getSharedWriter();
  var packet = blk.net.packets.ChunkData.writeInstance;
  var chunkSerializer = this.controller_.getChunkSerializer();
  for (var n = 0; n < sendCount; n++) {
    var chunk = this.sendQueue_.shift();

    // Build the packet piece by piece
    // First write in the packet header
    packet.x = chunk.x;
    packet.y = chunk.y;
    packet.z = chunk.z;
    if (blk.net.packets.ChunkData.write(writer, packet)) {
      // Serialize chunk data
      if (chunkSerializer.serializeToWriter(chunk, writer)) {
        // Send to user
        this.controller_.session.send(writer.finish(), this.user);
      }
    }

    // Always drop (in case an error occurred above)
    writer.drop();
  }
};
