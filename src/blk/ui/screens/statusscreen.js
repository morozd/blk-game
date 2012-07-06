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

goog.provide('blk.ui.screens.StatusScreen');

goog.require('blk.ui.PopupScreen');
goog.require('blk.ui.screens.statusscreen');



/**
 * Temporary popup status screen.
 * @constructor
 * @extends {blk.ui.PopupScreen}
 * @param {!goog.dom.DomHelper} domHelper DOM helper used to create DOM nodes.
 * @param {!Element} parentElement Parent DOM element to render into.
 * @param {!Function} template The Soy template defining the element's content.
 * @param {Object=} opt_templateData The data for the template.
 */
blk.ui.screens.StatusScreen =
    function(dom, parentElement, template, opt_templateData) {
  goog.base(this, dom, parentElement, template, opt_templateData);
};
goog.inherits(blk.ui.screens.StatusScreen, blk.ui.PopupScreen);


/**
 * Shows an error popup.
 * @param {!gf.ui.ScreenManager} screenManager Screen manager.
 * @param {!Element} parentElement Parement DOM element to render into.
 * @param {string} location Location the error occurred ('setup', 'networking').
 * @param {string} message Error message.
 * @param {*=} opt_arg Optional argument from a deferred callback.
 * @return {!goog.async.Deferred} A deferred fulfilled when the popup closes.
 *     Cancel to close the popup.
 */
blk.ui.screens.StatusScreen.showError =
    function(screenManager, parentElement, location, message, opt_arg) {
  var screen = new blk.ui.screens.StatusScreen(screenManager.dom, parentElement,
      blk.ui.screens.statusscreen.error, {
        location: location,
        message: message,
        arg: opt_arg
      });
  screenManager.pushScreen(screen);
  return screen.deferred;
};


/**
 * Shows a 'connecting' popup.
 * @param {!gf.ui.ScreenManager} screenManager Screen manager.
 * @param {!Element} parentElement Parement DOM element to render into.
 * @param {string} serverName Server host name the user is connecting to.
 * @return {!goog.async.Deferred} A deferred fulfilled when the popup closes.
 *     Cancel to close the popup.
 */
blk.ui.screens.StatusScreen.showConnecting =
    function(screenManager, parentElement, serverName) {
  var screen = new blk.ui.screens.StatusScreen(screenManager.dom, parentElement,
      blk.ui.screens.statusscreen.connecting, {
        server_name: serverName
      });
  screenManager.pushScreen(screen);
  return screen.deferred;
};


/**
 * Shows a 'connection failed' popup.
 * @param {!gf.ui.ScreenManager} screenManager Screen manager.
 * @param {!Element} parentElement Parement DOM element to render into.
 * @param {gf.net.DisconnectReason} reason Reason code.
 * @return {!goog.async.Deferred} A deferred fulfilled when the popup closes.
 *     Cancel to close the popup.
 */
blk.ui.screens.StatusScreen.showConnectionFailed =
    function(screenManager, parentElement, reason) {
  var screen = new blk.ui.screens.StatusScreen(screenManager.dom, parentElement,
      blk.ui.screens.statusscreen.connectionFailed, {
        reason: reason
      });
  screenManager.pushScreen(screen);
  return screen.deferred;
};


/**
 * Shows a 'disconnected' popup.
 * @param {!gf.ui.ScreenManager} screenManager Screen manager.
 * @param {!Element} parentElement Parement DOM element to render into.
 * @param {gf.net.DisconnectReason} reason Reason code.
 * @return {!goog.async.Deferred} A deferred fulfilled when the popup closes.
 *     Cancel to close the popup.
 */
blk.ui.screens.StatusScreen.showDisconnected =
    function(screenManager, parentElement, reason) {
  var screen = new blk.ui.screens.StatusScreen(screenManager.dom, parentElement,
      blk.ui.screens.statusscreen.disconnected, {
        reason: reason
      });
  screenManager.pushScreen(screen);
  return screen.deferred;
};
