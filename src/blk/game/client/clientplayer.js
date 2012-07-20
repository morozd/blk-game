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

goog.provide('blk.game.client.ClientPlayer');

goog.require('goog.Disposable');



/**
 * Client-side player.
 *
 * @constructor
 * @extends {goog.Disposable}
 * @param {!gf.net.User} user Net user.
 */
blk.game.client.ClientPlayer = function(user) {
  goog.base(this);

  /**
   * Net user.
   * @protected
   * @type {!gf.net.User}
   */
  this.user = user;

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
};
goog.inherits(blk.game.client.ClientPlayer, goog.Disposable);


/**
 * @return {!gf.net.User} The net user the player is associated with.
 */
blk.game.client.ClientPlayer.prototype.getUser = function() {
  return this.user;
};


/**
 * Attaches an entity to a player.
 * @param {!blk.env.Entity} entity Player entity.
 */
blk.game.client.ClientPlayer.prototype.attachEntity = function(entity) {
  // Bind
  this.entity = entity;
  entity.player = this;

  // Update the entity title if it is bound to a user
  var user = this.getUser();
  entity.title = user.info.displayName;
};


/**
 * Updates the player-related logic.
 * @param {!gf.UpdateFrame} frame Current frame.
 */
blk.game.client.ClientPlayer.prototype.update = function(frame) {
};
