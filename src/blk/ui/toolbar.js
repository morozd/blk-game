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

goog.provide('blk.ui.Toolbar');

goog.require('blk.ui.Widget');
goog.require('blk.ui.toolbar');
goog.require('goog.array');
goog.require('goog.events.EventType');
goog.require('goog.style');



/**
 * Toolbar overlay.
 *
 * @constructor
 * @extends {blk.ui.Widget}
 * @param {!blk.client.ClientGame} game Client game.
 */
blk.ui.Toolbar = function(game) {
  goog.base(this, game, blk.ui.toolbar.bar, {
  });

  goog.style.setUnselectable(this.root, true);
};
goog.inherits(blk.ui.Toolbar, blk.ui.Widget);


/**
 * @override
 */
blk.ui.Toolbar.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  // TODO(benvanik): add block elements, wire up events, etc
};
