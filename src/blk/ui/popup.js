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

goog.provide('blk.ui.Popup');

goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.async.Deferred');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventType');
goog.require('goog.soy');



/**
 * A simple popup dialog.
 *
 * TODO(benvanik): key input override to support esc/enter/etc
 *
 * @constructor
 * @extends {goog.Disposable}
 * @param {Function} template The Soy template defining the element's content.
 * @param {Object=} opt_templateData The data for the template.
 * @param {goog.dom.DomHelper=} opt_domHelper The DOM helper used to
 *     create DOM nodes; defaults to {@code goog.dom.getDomHelper}.
 * @param {Element=} opt_parent Parent DOM element to render into.
 */
blk.ui.Popup = function(template, opt_templateData, opt_domHelper, opt_parent) {
  goog.base(this);

  /**
   * @protected
   * @type {!goog.dom.DomHelper}
   */
  this.dom = opt_domHelper || goog.dom.getDomHelper();

  /**
   * Parent DOM element to render into.
   * @protected
   * @type {Element}
   */
  this.parentElement = opt_parent || this.dom.getDocument().body;

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
  this.deferred = new goog.async.Deferred(this.canceller_, this);
};
goog.inherits(blk.ui.Popup, goog.Disposable);


/**
 * @override
 */
blk.ui.Popup.prototype.disposeInternal = function() {
  this.exitDocument();
  goog.base(this, 'disposeInternal');
};


/**
 * Handles deferred cancellation requests.
 * @private
 */
blk.ui.Popup.prototype.canceller_ = function() {
  goog.dispose(this);
};


/**
 * Adds the popup to the DOM.
 * @protected
 */
blk.ui.Popup.prototype.enterDocument = function() {
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
        this.eh.listen(buttonEl, goog.events.EventType.CLICK,
            function() {
              this.beforeClose(buttonId);
              goog.dispose(this);
              this.deferred.callback(buttonId);
            });
      }, this);
};


/**
 * Removes the popup from the DOM.
 * @protected
 */
blk.ui.Popup.prototype.exitDocument = function() {
  this.eh.removeAll();
  this.dom.removeNode(this.root);
  this.dom.removeNode(this.inputMask_);
  this.root = null;
};


/**
 * Handles any pre-close action.
 * @protected
 * @param {string} buttonId Button ID.
 */
blk.ui.Popup.prototype.beforeClose = goog.nullFunction;


/**
 * Shows a popup with the given template and data and returns a deferred that
 * is signalled when the popup closes.
 *
 * @param {Function} template The Soy template defining the element's content.
 * @param {Object=} opt_templateData The data for the template.
 * @param {goog.dom.DomHelper=} opt_domHelper The DOM helper used to
 *     create DOM nodes; defaults to {@code goog.dom.getDomHelper}.
 * @param {Element=} opt_parent Parent DOM element to render into.
 * @return {!goog.async.Deferred} A deferred fulfilled when the dialog has
 *     closed. Successful callbacks receive the ID of the button as their only
 *     parameter.
 */
blk.ui.Popup.show = function(template, opt_templateData, opt_domHelper,
    opt_parent) {
  var popup = new blk.ui.Popup(template, opt_templateData, opt_domHelper,
      opt_parent);
  popup.enterDocument();
  return popup.deferred;
};
