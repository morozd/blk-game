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

goog.provide('blk.ui.screens.MainMenuScreen');

goog.require('blk.ui.screens.mainmenuscreen');
goog.require('gf.ui.Screen');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventType');
goog.require('goog.soy');



/**
 * Main menu.
 * @constructor
 * @extends {gf.ui.Screen}
 * @param {!blk.game.client.ClientGame} game Client game.
 * @param {!Element} parentElement Parent DOM element to render into.
 */
blk.ui.screens.MainMenuScreen = function(game, parentElement) {
  goog.base(this, gf.ui.Screen.Flags.MODAL_INPUT);

  /**
   * @private
   * @type {!blk.game.client.ClientGame}
   */
  this.game_ = game;

  /**
   * @private
   * @type {!goog.dom.DomHelper}
   */
  this.dom_ = game.dom;

  /**
   * Parent DOM element to render into.
   * @private
   * @type {!Element}
   */
  this.parentElement_ = parentElement;

  /**
   * @private
   * @type {!goog.events.EventHandler}
   */
  this.eh_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eh_);

  /**
   * Root rendered document fragment.
   * @protected
   * @type {Element}
   */
  this.root_ = /** @type {Element} */ (goog.soy.renderAsFragment(
      blk.ui.screens.mainmenuscreen.content, {
      }, undefined, this.dom_));

  /**
   * Github badge.
   * @private
   * @type {!Element}
   */
  this.githubBadge_ = this.dom_.createElement(goog.dom.TagName.A);
  goog.dom.classes.set(this.githubBadge_, goog.getCssName('blkGithubBanner'));
  goog.dom.setTextContent(this.githubBadge_, 'View on GitHub');
  this.githubBadge_.href = 'http://github.com/benvanik/blk-game';
  this.githubBadge_.target = '_blank';
};
goog.inherits(blk.ui.screens.MainMenuScreen, gf.ui.Screen);


/**
 * Attaches a button click listener.
 * @private
 * @param {string} className CSS class name of the button element.
 * @param {!function():undefined} listener Callback function.
 * @param {Object=} opt_scope Scope to call the listener in.
 */
blk.ui.screens.MainMenuScreen.prototype.attachButtonListener_ =
    function(className, listener, opt_scope) {
  var el = this.dom_.getElementByClass(className, this.root_);
  goog.asserts.assert(el);
  this.eh_.listen(
      el, goog.events.EventType.CLICK, listener, false, opt_scope || this);
};


/**
 * @override
 */
blk.ui.screens.MainMenuScreen.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  // Add github badge to <body>
  var body = this.dom_.getDocument().body;
  body.appendChild(this.githubBadge_);

  // Add UI
  this.dom_.appendChild(this.parentElement_, this.root_);

  // Attach handlers
  this.attachButtonListener_(
      goog.getCssName('blkMainMenuSinglePlayerButton'),
      function() {
        this.game_.playClick();
        this.game_.pushSinglePlayerMenuScreen();
      });
  this.attachButtonListener_(
      goog.getCssName('blkMainMenuMultiPlayerButton'),
      function() {
        this.game_.playClick();
        this.game_.pushMultiPlayerMenuScreen();
      });
  this.attachButtonListener_(
      goog.getCssName('blkMainMenuSettingsButton'),
      function() {
        this.game_.playClick();
        this.game_.showSettingsPopup();
      });
  this.attachButtonListener_(
      goog.getCssName('blkMainMenuHelpButton'),
      function() {
        this.game_.playClick();
        this.game_.showHelpPopup();
      });
};


/**
 * @override
 */
blk.ui.screens.MainMenuScreen.prototype.exitDocument = function() {
  // Remove github badge
  this.dom_.removeNode(this.githubBadge_);

  // Cleanup UI
  this.eh_.removeAll();
  this.dom_.removeNode(this.root_);
  this.root_ = null;

  goog.base(this, 'exitDocument');
};
