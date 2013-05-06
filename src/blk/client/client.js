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

goog.provide('blk.client.start');

goog.require('blk.client.LaunchOptions');
goog.require('blk.game.client.ClientGame');
goog.require('blk.game.client.UserSettings');
goog.require('gf');
goog.require('goog.asserts');
/** @suppress {extraRequire} */
goog.require('goog.debug.ErrorHandler');
goog.require('goog.dom.DomHelper');
goog.require('WTF.trace');


/**
 * Starts the game.
 * @param {!Document} doc Document.
 * @param {boolean} sourceMode True if running from source.
 * @param {string} uri Invoking URI.
 * @param {Object.<*>=} opt_args Key-value argument map.
 */
blk.client.start = WTF.trace.instrument(function(
    doc, sourceMode, uri, opt_args) {
      goog.asserts.assert(!gf.SERVER);
      var dom = new goog.dom.DomHelper(doc);

      // Parse options and load user settings
      var launchOptions = new blk.client.LaunchOptions(uri, opt_args);
      var settings = new blk.game.client.UserSettings(dom);
      settings.load();

      // Create the game
      var game = new blk.game.client.ClientGame(dom, launchOptions, settings);

      // HACK: debug root - useful for inspecting the game state
      if (goog.DEBUG) {
        goog.global['blk_client'] = game;
      }

      // Start the game - it will decide what to do based on launchOptions/etc
      game.start();
    }, 'blk.client.start');

goog.exportSymbol('blk.client.start', blk.client.start);
