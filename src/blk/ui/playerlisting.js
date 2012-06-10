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

goog.provide('blk.ui.PlayerListing');

goog.require('blk.ui.Widget');
goog.require('blk.ui.playerlisting');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.soy');
goog.require('goog.string');
goog.require('goog.style');



/**
 * Player listing overlay.
 *
 * @constructor
 * @extends {blk.ui.Widget}
 * @param {!blk.client.ClientGame} game Client game.
 */
blk.ui.PlayerListing = function(game) {
  goog.base(this, game, blk.ui.playerlisting.listing, {
  });

  goog.style.setUnselectable(this.root);

  /**
   * @private
   * @type {!Element}
   */
  this.bodyEl_ = this.dom.getElementByClass(
      goog.getCssName('blkPlayerListingBody'), this.root);

  /**
   * Refresh interval ID.
   * @private
   * @type {number}
   */
  this.intervalId_ = goog.global.setInterval(goog.bind(function() {
    this.refresh();
  }, this), blk.ui.PlayerListing.REFRESH_INTERVAL_);

  // Initial update
  this.refresh();
};
goog.inherits(blk.ui.PlayerListing, blk.ui.Widget);


/**
 * Refresh interval, in ms.
 * @private
 * @const
 * @type {number}
 */
blk.ui.PlayerListing.REFRESH_INTERVAL_ = 3 * 1000;


/**
 * @override
 */
blk.ui.PlayerListing.prototype.disposeInternal = function() {
  goog.global.clearInterval(this.intervalId_);

  goog.base(this, 'disposeInternal');
};


/**
 * Refreshes the player listing.
 * Should be called whenever something interesting changes.
 */
blk.ui.PlayerListing.prototype.refresh = function() {
  // TODO(benvanik): could probably make this more efficient, but that'd require
  // tracking dirty state of the DOM elements
  // Hopefully this is infrequent enough that it doesn't really matter
  goog.dom.removeChildren(this.bodyEl_);

  // Sort players by name
  var players = this.game.state.players;
  goog.array.stableSort(players, function(a, b) {
    return goog.string.caseInsensitiveCompare(
        a.user.info.displayName,
        b.user.info.displayName);
  });

  for (var n = 0; n < players.length; n++) {
    var player = players[n];
    var playerEl = /** @type {Element} */ (goog.soy.renderAsFragment(
        blk.ui.playerlisting.player, {
          sessionId: player.user.sessionId,
          displayName: player.user.info.displayName,
          latency: player.user.statistics.averageLatency
        }, undefined, this.dom));
    goog.dom.appendChild(this.bodyEl_, playerEl);
  }
};
