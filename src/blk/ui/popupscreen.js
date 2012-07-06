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

goog.provide('blk.ui.PopupScreen');

goog.require('gf.ui.Screen');
goog.require('goog.array');
goog.require('goog.async.Deferred');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventType');
goog.require('goog.soy');



/**
 * Soy-based popup screen.
 * @constructor
 * @extends {gf.ui.Screen}
 * @param {!goog.dom.DomHelper} domHelper DOM helper used to create DOM nodes.
 * @param {!Element} parentElement Parent DOM element to render into.
 * @param {!Function} template The Soy template defining the element's content.
 * @param {Object=} opt_templateData The data for the template.
 */
blk.ui.PopupScreen = function(dom, parentElement, template, opt_templateData) {
  goog.base(this, gf.ui.Screen.Flags.MODAL_INPUT);

  /**
   * @protected
   * @type {!goog.dom.DomHelper}
   */
  this.dom = dom;

  /**
   * Parent DOM element to render into.
   * @protected
   * @type {!Element}
   */
  this.parentElement = parentElement;

  /**
   * @protected
   * @type {!goog.events.EventHandler}
   */
  this.eh = new goog.events.EventHandler(this);
  this.registerDisposable(this.eh);

  /**
   * @private
   * @type {!Element}
   */
  this.inputMask_ = this.dom.createElement(goog.dom.TagName.DIV);
  goog.dom.classes.set(this.inputMask_, goog.getCssName('blkInputMask'));

  /**
   * Root rendered document fragment.
   * @protected
   * @type {Element}
   */
  this.root = /** @type {Element} */ (goog.soy.renderAsFragment(
      template, opt_templateData, undefined, this.dom));

  /**
   * A deferred fulfilled when the dialog has closed.
   * Succesful callbacks receive the button ID as their only argument.
   * @type {!goog.async.Deferred}
   */
  this.deferred = new goog.async.Deferred(this.close, this);
};
goog.inherits(blk.ui.PopupScreen, gf.ui.Screen);


/**
 * @override
 */
blk.ui.PopupScreen.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  this.dom.appendChild(this.parentElement, this.inputMask_);
  this.dom.appendChild(this.parentElement, this.root);

  var buttonEls = this.dom.getElementsByClass(
      goog.getCssName('blkPopupButton'), this.root);
  goog.array.forEach(buttonEls,
      function(buttonEl) {
        var buttonId = buttonEl.getAttribute('data-id');
        var isDefault = goog.dom.classes.has(
            buttonEl, goog.getCssName('blkPopupButtonDefault'));

        // TODO(benvanik): save off buttons for key input/etc

        // Focus the default button
        if (isDefault) {
          buttonEl.focus();
        }

        // Bind events/make clickable/etc
        this.eh.listen(
            buttonEl,
            goog.events.EventType.CLICK,
            function() {
              this.beforeClose(buttonId);
              this.close();
              this.deferred.callback(buttonId);
            });
      }, this);
};


/**
 * @override
 */
blk.ui.PopupScreen.prototype.exitDocument = function() {
  this.eh.removeAll();
  this.dom.removeNode(this.root);
  this.dom.removeNode(this.inputMask_);
  this.root = null;

  goog.base(this, 'exitDocument');
};


/**
 * Handles any pre-close action.
 * @protected
 * @param {string} buttonId Button ID.
 */
blk.ui.PopupScreen.prototype.beforeClose = goog.nullFunction;
