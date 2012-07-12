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

goog.provide('blk.ui.screens.GameScreen');

goog.require('blk.modes.basic.client.BasicClientController');
goog.require('gf.ui.Screen');



/**
 * Game screen.
 * @constructor
 * @extends {gf.ui.Screen}
 * @param {!blk.game.client.ClientGame} game Client game.
 * @param {!gf.net.ClientSession} session Connected network session.
 */
blk.ui.screens.GameScreen = function(game, session) {
  // TODO(benvanik): game string
  var hashToken = 'game-' + 'url';
  goog.base(this,
      hashToken,
      gf.ui.Screen.Flags.COVERS_DISPLAY |
      gf.ui.Screen.Flags.OPAQUE |
      gf.ui.Screen.Flags.MODAL_INPUT);

  // TODO(benvanik): pull from options? etc
  var controllerCtor = blk.modes.basic.client.BasicClientController;

  /**
   * @private
   * @type {!blk.game.client.ClientGame}
   */
  this.game_ = game;

  /**
   * @private
   * @type {!gf.dom.Display}
   */
  this.display_ = game.getDisplay();

  /**
   * Client controller instance.
   * @private
   * @type {!blk.game.client.ClientController}
   */
  this.controller_ = new controllerCtor(game, session);
  this.registerDisposable(this.controller_);
};
goog.inherits(blk.ui.screens.GameScreen, gf.ui.Screen);


/**
 * @override
 */
blk.ui.screens.GameScreen.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  // Load the game and start when ready
  var deferred = this.controller_.load();
  deferred.addCallbacks(
      function() {
        // Show the (already created) main display
        this.display_.setVisible(true);

        // Start the game
        this.game_.startTicking();
      }, function(arg) {
        // Throw?
      }, this);
};


/**
 * @override
 */
blk.ui.screens.GameScreen.prototype.exitDocument = function() {
  // Hide the main display - we don't remove/kill it here
  this.display_.setVisible(false);

  // Stop ticking
  this.game_.stopTicking();

  goog.base(this, 'exitDocument');
};


/**
 * @override
 */
blk.ui.screens.GameScreen.prototype.update = function(frame) {
  goog.base(this, 'update', frame);
  this.controller_.update(frame);
};


/**
 * @override
 */
blk.ui.screens.GameScreen.prototype.render = function(frame) {
  goog.base(this, 'render', frame);
  this.controller_.render(frame);
};
