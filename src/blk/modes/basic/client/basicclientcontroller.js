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
goog.require('goog.vec.Mat4');
goog.require('goog.vec.Quaternion');



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
blk.modes.basic.client.BasicClientController.prototype.update =
    function(frame) {
  goog.base(this, 'update', frame);

  // Update views
  //this.localView.update(frame, this.viewport.position);
};


/**
 * @override
 */
blk.modes.basic.client.BasicClientController.prototype.processPhysics =
    function(frame) {
  goog.base(this, 'processPhysics', frame);

  // // Handle movement
  // this.movement_.update(frame, viewport, this.inputData);
  // if (this.movement_.hasDied) {
  //   this.handleError('Movement predictor backup, network too slow/broken');
  //   return;
  // }

  // // Compute updated view matrix based on user entity
  // var localEntity = this.getLocalEntity();
  // if (localEntity) {
  //   // Run client-side prediction
  //   this.movement_.predictMovement(frame);

  //   var state = localEntity.state;
  //   var vm = viewport.viewMatrix;
  //   goog.vec.Quaternion.toRotationMatrix4(state.rotation, vm);
  //   goog.vec.Mat4.transpose(vm, vm);
  //   goog.vec.Mat4.translate(vm,
  //       -state.position[0], -state.position[1], -state.position[2]);
  // }

  // // Update viewport matrices/etc now that the controller logic has been applied
  // viewport.calculate();
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


