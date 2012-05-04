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

goog.provide('blk.Player');

goog.require('goog.Disposable');
goog.require('goog.asserts');



/**
 * A block world player.
 *
 * @constructor
 * @extends {goog.Disposable}
 * @param {!gf.net.User} user Net user.
 */
blk.Player = function(user) {
  goog.base(this);

  /**
   * Net user.
   * @type {!gf.net.User}
   */
  this.user = user;

  /**
   * Chunk view.
   * @type {blk.env.ChunkView}
   */
  this.view = null;

  /**
   * Player color/skin.
   * @type {number}
   */
  this.color = 0xFFFFFFFF;

  /**
   * Entity assigned to this player, if any.
   * @type {blk.env.Entity}
   */
  this.entity = null;

  // Entangle us with the user
  goog.asserts.assert(!user.data);
  user.data = this;
};
goog.inherits(blk.Player, goog.Disposable);

