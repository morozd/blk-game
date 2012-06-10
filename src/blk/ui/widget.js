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

goog.provide('blk.ui.Widget');

goog.require('goog.Disposable');
goog.require('goog.dom');
goog.require('goog.events.EventHandler');
goog.require('goog.soy');
goog.require('goog.style');



/**
 * An on-screen widget for overlaying on the game display.
 *
 * @constructor
 * @extends {goog.Disposable}
 * @param {!blk.client.ClientGame} game Client game.
 * @param {Function} template The Soy template defining the element's content.
 * @param {Object=} opt_templateData The data for the template.
 */
blk.ui.Widget = function(game, template, opt_templateData) {
  goog.base(this);

  /**
   * @protected
   * @type {!blk.client.ClientGame}
   */
  this.game = game;

  /**
   * @protected
   * @type {!goog.dom.DomHelper}
   */
  this.dom = game.dom;

  /**
   * Parent DOM element to render into.
   * @protected
   * @type {Element}
   */
  this.parentElement =
      goog.dom.getParentElement(game.display.getInputElement());

  /**
   * @protected
   * @type {!goog.events.EventHandler}
   */
  this.eh = new goog.events.EventHandler(this);
  this.registerDisposable(this.eh);

  /**
   * Root rendered document fragment.
   * @protected
   * @type {Element}
   */
  this.root = /** @type {Element} */ (goog.soy.renderAsFragment(
      template, opt_templateData, undefined, this.dom));
};
goog.inherits(blk.ui.Widget, goog.Disposable);


/**
 * @override
 */
blk.ui.Widget.prototype.disposeInternal = function() {
  this.exitDocument();
  goog.base(this, 'disposeInternal');
};


/**
 * Adds the widget to the DOM.
 * @protected
 */
blk.ui.Widget.prototype.enterDocument = function() {
  this.dom.appendChild(this.parentElement, this.root);
};


/**
 * Removes the widget from the DOM.
 * @protected
 */
blk.ui.Widget.prototype.exitDocument = function() {
  this.eh.removeAll();
  this.dom.removeNode(this.root);
};


/**
 * Sets whether the widget is visible.
 * @param {boolean} value True to display the widget.
 */
blk.ui.Widget.prototype.setVisible = function(value) {
  goog.style.showElement(this.root, value);
};


/**
 * Toggles the visibility of the widget.
 */
blk.ui.Widget.prototype.toggleVisibility = function() {
  goog.style.showElement(this.root, !goog.style.isElementShown(this.root));
};
