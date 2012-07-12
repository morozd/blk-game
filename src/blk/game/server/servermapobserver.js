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

goog.provide('blk.game.server.ServerMapObserver');

goog.require('blk.env.Chunk');
goog.require('blk.env.MapObserver');



/**
 * Server map observer.
 * Handles sending map chunks and other tasks.
 *
 * @constructor
 * @implements {blk.env.MapObserver}
 * @param {!blk.game.server.ServerPlayer} player Player.
 * @param {!blk.env.ChunkView} view Active view.
 */
blk.game.server.ServerMapObserver = function(player, view) {
  /**
   * Player the target chunk view is associated with.
   * @private
   * @type {!blk.game.server.ServerPlayer}
   */
  this.player_ = player;

  /**
   * Chunk view this instance is observing.
   * @private
   * @type {!blk.env.ChunkView}
   */
  this.view_ = view;
};


/**
 * @override
 */
blk.game.server.ServerMapObserver.prototype.chunkLoaded = function(chunk) {
  this.player_.queueChunkSend(chunk);
};


/**
 * @override
 */
blk.game.server.ServerMapObserver.prototype.chunkEnteredView = function(chunk) {
  // Only send if already present, otherwise chunkLoaded will send it later
  if (chunk.state == blk.env.Chunk.State.LOADED) {
    this.player_.queueChunkSend(chunk);
  }
};


/**
 * @override
 */
blk.game.server.ServerMapObserver.prototype.chunkLeftView = function(chunk) {
  //
};


/**
 * @override
 */
blk.game.server.ServerMapObserver.prototype.invalidateBlock =
    function(x, y, z, priority) {
};


/**
 * @override
 */
blk.game.server.ServerMapObserver.prototype.invalidateBlockRegion =
    function(minX, minY, minZ, maxX, maxY, maxZ, priority) {
};
