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

goog.provide('blk.GameState');

goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.asserts');



/**
 * State information about the game and its players.
 *
 * @constructor
 * @extends {goog.Disposable}
 * @param {!gf.Runtime} runtime Runtime.
 * @param {!gf.net.Session} session Network session.
 * @param {!blk.env.Map} map Game map, unowned.
 */
blk.GameState = function(runtime, session, map) {
  /**
   * Runtime.
   * @type {!gf.Runtime}
   */
  this.runtime = runtime;
  this.registerDisposable(this.runtime);

  /**
   * Network session.
   * @type {!gf.net.Session}
   */
  this.session = session;
  this.registerDisposable(this.session);

  /**
   * Game map, unowned.
   * @type {!blk.env.Map}
   */
  this.map = map;

  /**
   * Player listing.
   * @type {!Array.<!blk.game.Player>}
   */
  this.players = [];
};
goog.inherits(blk.GameState, goog.Disposable);


/**
 * Adds a new player for the given user.
 * @param {!blk.game.Player} player New player.
 */
blk.GameState.prototype.addPlayer = function(player) {
  this.players.push(player);
};


/**
 * Removes the player of the given user.
 * @param {!gf.net.User} user User to remove.
 */
blk.GameState.prototype.removePlayer = function(user) {
  var player = /** @type {blk.game.Player} */ (user.data);
  goog.asserts.assert(player);
  if (!player) {
    return;
  }

  // Remove from listing
  user.data = null;
  goog.array.remove(this.players, player);
};


/**
 * Gets a player by session ID.
 * @param {string} sessionId User session ID.
 * @return {blk.game.Player} Player, if found.
 */
blk.GameState.prototype.getPlayerBySessionId = function(sessionId) {
  var user = this.session.getUserBySessionId(sessionId);
  if (user) {
    return /** @type {blk.game.Player} */ (user.data);
  }
  return null;
};


/**
 * Gets a player by wire ID.
 * @param {number} wireId User wire ID.
 * @return {blk.game.Player} Player, if found.
 */
blk.GameState.prototype.getPlayerByWireId = function(wireId) {
  var user = this.session.getUserByWireId(wireId);
  if (user) {
    return /** @type {blk.game.Player} */ (user.data);
  }
  return null;
};


/**
 * Updates the game state.
 * @param {!gf.UpdateFrame} frame Current update frame.
 */
blk.GameState.prototype.update = function(frame) {
  // Update map (and entities)
  this.map.update(frame);
};
