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

goog.provide('blk.env.server.ChunkSendQueue');

goog.require('blk.env.Chunk');
goog.require('blk.env.MapObserver');
goog.require('blk.io.ChunkSerializer');
goog.require('blk.net.packets.ChunkData');
goog.require('gf.net.PacketWriter');
goog.require('goog.Disposable');
goog.require('goog.array');



/**
 * Queue for sending chunks to clients.
 * This should be added to a {@see blk.env.ChunkView} as an observer to listen
 * for chunks that should be sent.
 *
 * @constructor
 * @extends {goog.Disposable}
 * @implements {blk.env.MapObserver}
 * @param {!gf.net.ServerSession} session Server session.
 * @param {!gf.net.User} user Target user.
 */
blk.env.server.ChunkSendQueue = function(session, user) {
  goog.base(this);

  /**
   * Network session.
   * @private
   * @type {!gf.net.ServerSession}
   */
  this.session_ = session;

  /**
   * User this queue targets.
   * @private
   * @type {!gf.net.User}
   */
  this.user_ = user;

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
  this.lastSortTime_ = -blk.env.server.ChunkSendQueue.QUEUE_SORT_INTERVAL_;

  /**
   * Last time a chunk was sent.
   * Used for rate control.
   * @private
   * @type {number}
   */
  this.lastSendTime_ = 0;
};
goog.inherits(blk.env.server.ChunkSendQueue, goog.Disposable);


/**
 * Seconds between sorts of the send queue.
 * @private
 * @const
 * @type {number}
 */
blk.env.server.ChunkSendQueue.QUEUE_SORT_INTERVAL_ = 3;


/**
 * Maximum number of chunk sends per update.
 * @private
 * @const
 * @type {number}
 */
blk.env.server.ChunkSendQueue.MAX_CHUNK_SENDS_ = 1;


// TODO(benvanik): make this dynamic somehow, perhaps by adjusting by RTT
/**
 * Chunks per second.
 * The higher the value the more likely the network will get choked.
 * @private
 * @const
 * @type {number}
 */
blk.env.server.ChunkSendQueue.CHUNK_SEND_RATE_ =
    gf.NODE ? 20 : 100;


/**
 * Queues chunk data for sending to the user.
 * @param {!blk.env.Chunk} chunk Chunk to send.
 */
blk.env.server.ChunkSendQueue.prototype.enqueue = function(chunk) {
  // TODO(benvanik): faster check - perhaps a LUT by string xyz, even?
  if (goog.array.contains(this.sendQueue_, chunk)) {
    return;
  }
  this.sendQueue_.push(chunk);
  this.lastSortTime_ = 0;
};


/**
 * Handles sending new chunks from the send queue.
 * @param {number} time Current frame time.
 * @param {!goog.vec.Vec3.Float32} center Center viewport point.
 */
blk.env.server.ChunkSendQueue.prototype.process = function(time, center) {
  var sendCount = Math.min(blk.env.server.ChunkSendQueue.MAX_CHUNK_SENDS_,
      this.sendQueue_.length);

  // Re-sort the send list
  if (time - this.lastSortTime_ >
      blk.env.server.ChunkSendQueue.QUEUE_SORT_INTERVAL_) {
    this.lastSortTime_ = time;
    blk.env.Chunk.sortByDistanceFromPoint(this.sendQueue_, center);
  }

  // Throttle sends
  if (time - this.lastSendTime_ >
      1 / blk.env.server.ChunkSendQueue.CHUNK_SEND_RATE_) {
    this.lastSendTime_ = time;
  } else {
    sendCount = 0;
  }

  if (!sendCount) {
    return;
  }

  var writer = gf.net.PacketWriter.getSharedWriter();
  var chunkSerializer = blk.io.ChunkSerializer.getSharedSerializer();
  var packet = blk.net.packets.ChunkData.writeInstance;
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
        this.session_.send(writer.finish(), this.user_);
      }
    }

    // Always drop (in case an error occurred above)
    writer.drop();
  }
};


/**
 * @override
 */
blk.env.server.ChunkSendQueue.prototype.chunkLoaded = function(chunk) {
  this.enqueue(chunk);
};


/**
 * @override
 */
blk.env.server.ChunkSendQueue.prototype.chunkEnteredView = function(chunk) {
  // Only send if already present, otherwise chunkLoaded will send it later
  if (chunk.state == blk.env.Chunk.State.LOADED) {
    this.enqueue(chunk);
  }
};


/**
 * @override
 */
blk.env.server.ChunkSendQueue.prototype.chunkLeftView = goog.nullFunction;


/**
 * @override
 */
blk.env.server.ChunkSendQueue.prototype.invalidateBlock = goog.nullFunction;


/**
 * @override
 */
blk.env.server.ChunkSendQueue.prototype.invalidateBlockRegion =
    goog.nullFunction;
