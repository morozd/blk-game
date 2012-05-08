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
 */
blk.ui.Popup = function(template, data, opt_domHelper) {
  goog.base(this);

  /**
   * @private
   * @type {!goog.dom.DomHelper}
   */
  this.dom_ = opt_domHelper || goog.dom.getDomHelper();

  /**
   * @private
   * @type {!goog.events.EventHandler}
   */
  this.eh_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eh_);

  /**
   * Root rendered document fragment.
   * @private
   * @type {Node}
   */
  this.root_ = goog.soy.renderAsFragment(
      template, data, undefined, this.dom_);

  /**
   * A deferred fulfilled when the dialog has closed.
   * Succesful callbacks receive the button ID as their only argument.
   * @type {!goog.async.Deferred}
   */
  this.deferred = new goog.async.Deferred();

  this.enterDocument_();
};
goog.inherits(blk.ui.Popup, goog.Disposable);


/**
 * @override
 */
blk.ui.Popup.prototype.disposeInternal = function() {
  this.exitDocument_();
  goog.base(this, 'disposeInternal');
};


/**
 * Adds the popup to the DOM.
 * @private
 */
blk.ui.Popup.prototype.enterDocument_ = function() {
  var body = this.dom_.getDocument().body;
  this.dom_.appendChild(body, this.root_);

  var buttonEls = this.dom_.getElementsByClass(
      goog.getCssName('blkAlertButton'), this.root_);
  goog.array.forEach(buttonEls,
      function(buttonEl) {
        var buttonId = buttonEl.getAttribute('data-id');
        var isDefault = goog.dom.classes.has(
            buttonEl, goog.getCssName('blkAlertButtonDefault'));

        // TODO(benvanik): save off buttons for key input/etc

        // Focus the default button
        if (isDefault) {
          buttonEl.focus();
        }

        // Bind events/make clickable/etc
        this.eh_.listen(buttonEl, goog.events.EventType.CLICK,
            function() {
              goog.dispose(this);
              this.deferred.callback(buttonId);
            });
      }, this);
};


/**
 * Removes the popup from the DOM.
 * @private
 */
blk.ui.Popup.prototype.exitDocument_ = function() {
  this.eh_.removeAll();
  this.dom_.removeNode(this.root_);
  this.root_ = null;
};


/**
 * Shows a popup with the given template and data and returns a deferred that
 * is signalled when the popup closes.
 *
 * @param {Function} template The Soy template defining the element's content.
 * @param {Object=} opt_templateData The data for the template.
 * @param {goog.dom.DomHelper=} opt_domHelper The DOM helper used to
 *     create DOM nodes; defaults to {@code goog.dom.getDomHelper}.
 * @return {!goog.async.Deferred} A deferred fulfilled when the dialog has
 *     closed. If the dialog is cancelled the deferred fails, otherwise success
 *     is called with a value of the button pressed.
 */
blk.ui.Popup.show = function(template, data, opt_domHelper) {
  var popup = new blk.ui.Popup(template, data, opt_domHelper);
  return popup.deferred;
};
