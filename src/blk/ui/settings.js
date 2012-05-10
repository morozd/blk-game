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

goog.provide('blk.ui.Settings');

goog.require('blk.ui.Popup');
goog.require('blk.ui.alerts');
goog.require('goog.asserts');



/**
 * A simple popup dialog.
 *
 * TODO(benvanik): key input override to support esc/enter/etc
 *
 * @constructor
 * @extends {goog.Disposable}
 * @param {!blk.client.ClientGame} game Client game.
 * @param {goog.dom.DomHelper=} opt_domHelper The DOM helper used to
 *     create DOM nodes; defaults to {@code goog.dom.getDomHelper}.
 * @param {Element=} opt_parent Parent DOM element to render into.
 */
blk.ui.Settings = function(game, opt_domHelper, opt_parent) {
  var launchOptions = /** @type {!blk.client.LaunchOptions} */ (
      game.launchOptions);
  goog.base(this, blk.ui.alerts.settings, {
    server_name: launchOptions.host
  }, opt_domHelper, opt_parent);

  /**
   * Client game.
   * @private
   * @type {!blk.client.ClientGame}
   */
  this.game_ = game;
};
goog.inherits(blk.ui.Settings, blk.ui.Popup);


/**
 * @override
 */
blk.ui.Settings.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  var settings = this.game_.settings;

  var userNameInput = /** @type {HTMLInputElement} */ (
      this.dom.getElementByClass(
          goog.getCssName('blkSettingsNameValue'), this.root));
  goog.asserts.assert(userNameInput);
  userNameInput.value = settings.userName;

  // var buttonEls = this.dom_.getElementsByClass(
  //     goog.getCssName('blkAlertButton'), this.root_);
  // goog.array.forEach(buttonEls,
  //     function(buttonEl) {
  //       var buttonId = buttonEl.getAttribute('data-id');
  //       var isDefault = goog.dom.classes.has(
  //           buttonEl, goog.getCssName('blkAlertButtonDefault'));

  //       // TODO(benvanik): save off buttons for key input/etc

  //       // Focus the default button
  //       if (isDefault) {
  //         buttonEl.focus();
  //       }

  //       // Bind events/make clickable/etc
  //       this.eh_.listen(buttonEl, goog.events.EventType.CLICK,
  //           function() {
  //             goog.dispose(this);
  //             this.deferred.callback(buttonId);
  //           });
  //     }, this);
};


/**
 * Shows the settings dialog and returns a deferred that is signalled when the
 * popup closes.
 *
 * @param {!blk.client.ClientGame} game Client game.
 * @param {goog.dom.DomHelper=} opt_domHelper The DOM helper used to
 *     create DOM nodes; defaults to {@code goog.dom.getDomHelper}.
 * @param {Element=} opt_parent Parent DOM element to render into.
 * @return {!goog.async.Deferred} A deferred fulfilled when the dialog has
 *     closed. Successful callbacks receive the ID of the button as their only
 *     parameter.
 */
blk.ui.Settings.show = function(game, opt_domHelper, opt_parent) {
  var popup = new blk.ui.Settings(game, opt_domHelper, opt_parent);
  popup.enterDocument();
  return popup.deferred;
};
