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

goog.provide('blk.modes.basic.client.BasicClientController');

goog.require('blk.game.client.ClientController');
goog.require('blk.ui.Menubar');
goog.require('blk.ui.PlayerListing');



/**
 * Basic game mode.
 * Can be subclassed or used on its own.
 * @constructor
 * @extends {blk.game.client.ClientController}
 */
blk.modes.basic.client.BasicClientController = function(game, session) {
  goog.base(this, game, session);

  /**
   * Player listing.
   * @private
   * @type {!blk.ui.PlayerListing}
   */
  this.playerListing_ = new blk.ui.PlayerListing(this);
  this.addWidget(this.playerListing_);
  if (this.session.isLocal()) {
    this.playerListing_.setVisible(false);
  }

  /**
   * Menubar.
   * @private
   * @type {!blk.ui.Menubar}
   */
  this.menubar_ = new blk.ui.Menubar(this.game);
  this.addWidget(this.menubar_);

  // /**
  //  * Toolbar.
  //  * @private
  //  * @type {!blk.ui.Toolbar}
  //  */
  // this.toolbar_ = new blk.ui.Toolbar(this);
  // this.addWidget(this.toolbar_);
};
goog.inherits(blk.modes.basic.client.BasicClientController,
    blk.game.client.ClientController);


/**
 * @override
 */
blk.modes.basic.client.BasicClientController.prototype.handlePlayersChanged =
    function() {
  goog.base(this, 'handlePlayersChanged');

  this.playerListing_.refresh();
};


/**
 * @override
 */
blk.modes.basic.client.BasicClientController.prototype.update =
    function(frame) {
  goog.base(this, 'update', frame);
};


/**
 * @override
 */
blk.modes.basic.client.BasicClientController.prototype.processPhysics =
    function(frame) {
  goog.base(this, 'processPhysics', frame);
};


/**
 * @override
 */
blk.modes.basic.client.BasicClientController.prototype.processInput =
    function(frame, inputData) {
  goog.base(this, 'processInput', frame, inputData);

  //
};


/**
 * @override
 */
blk.modes.basic.client.BasicClientController.prototype.beginDrawing =
    function(frame) {
  goog.base(this, 'beginDrawing', frame);

  // Reset render state
  var renderState = this.game.getRenderState();
  //renderState.reset(this.viewport, map.environment.skyColor, true);
};


/**
 * @override
 */
blk.modes.basic.client.BasicClientController.prototype.drawWorld =
    function(frame) {
  goog.base(this, 'drawWorld', frame);

  // Render the map and entities
  //this.viewManager.render(frame, viewport, this.localPlayer);
};


/**
 * @override
 */
blk.modes.basic.client.BasicClientController.prototype.drawOverlays =
    function(frame) {
  goog.base(this, 'drawOverlays', frame);

  // Draw UI
  // this.drawInputUI_(frame);
  // this.drawBlockTypes_(frame);
};
