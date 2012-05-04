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

goog.provide('blk.env.MapObserver');



/**
 * Interface for map observers.
 * Observers will receive frequent notifications when certain events occur on
 * the map.
 *
 * @interface
 */
blk.env.MapObserver = function() {
};


// TODO(benvanik): entities add/remove/update


/**
 * Signals that a chunk has completed loading.
 * @param {!blk.env.Chunk} chunk Chunk that loaded.
 */
blk.env.MapObserver.prototype.chunkLoaded = goog.nullFunction;


/**
 * Signals that a chunk has entered the active view.
 * @param {!blk.env.Chunk} chunk Chunk that loaded.
 */
blk.env.MapObserver.prototype.chunkEnteredView = goog.nullFunction;


/**
 * Signals that a chunk has left the active view.
 * @param {!blk.env.Chunk} chunk Chunk that loaded.
 */
blk.env.MapObserver.prototype.chunkLeftView = goog.nullFunction;


/**
 * Signals that a single block (and its neighbors) need invalidation.
 * @param {number} x Block X, in world coordinates.
 * @param {number} y Block Y, in world coordinates.
 * @param {number} z Block Z, in world coordinates.
 * @param {blk.env.UpdatePriority} priority Update priority.
 */
blk.env.MapObserver.prototype.invalidateBlock = goog.nullFunction;


/**
 * Signals that a region of blocks needs invalidation.
 * @param {number} minX Minimum block X, in world coordinates.
 * @param {number} minY Minimum block Y, in world coordinates.
 * @param {number} minZ Minimum block Z, in world coordinates.
 * @param {number} maxX Maximum block X, in world coordinates.
 * @param {number} maxY Maximum block Y, in world coordinates.
 * @param {number} maxZ Maximum block Z, in world coordinates.
 * @param {blk.env.UpdatePriority} priority Update priority.
 */
blk.env.MapObserver.prototype.invalidateBlockRegion = goog.nullFunction;
