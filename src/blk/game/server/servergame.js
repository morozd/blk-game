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

goog.provide('blk.game.server.ServerGame');

goog.require('blk.game.fps.FpsServerController');
goog.require('gf.Game');
goog.require('gf.assets.AssetManager');
goog.require('gf.log');
goog.require('gf.net.SessionType');
goog.require('gf.net.browser.BrowserClient');
goog.require('goog.reflect');
goog.require('WTF.trace');



/**
 * Test game server instance.
 *
 * @constructor
 * @extends {gf.Game}
 * @param {!blk.server.LaunchOptions} launchOptions Launch options.
 * @param {!gf.net.ServerSession} session Client session.
 * @param {!blk.io.MapStore} mapStore Map storage provider, ownership
 *     transferred.
 */
blk.game.server.ServerGame = function(launchOptions, session, mapStore) {
  goog.base(this, launchOptions, session.clock);

  /**
   * Asset manager.
   * @private
   * @type {!gf.assets.AssetManager}
   */
  this.assetManager_ = new gf.assets.AssetManager(this);
  this.registerDisposable(this.assetManager_);
  this.addComponent(this.assetManager_);

  // TODO(benvanik): pull from options? etc
  var controllerCtor = blk.game.fps.FpsServerController;

  /**
   * Server controller instance.
   * @private
   * @type {!blk.game.server.ServerController}
   */
  this.controller_ = new controllerCtor(this, session, mapStore);
  this.registerDisposable(this.controller_);

  /**
   * Server browser client.
   * Registers the game with the browser (if non-local) and keeps it updated.
   * @private
   * @type {gf.net.browser.BrowserClient}
   */
  this.browserClient_ = null;
  if (session.type == gf.net.SessionType.REMOTE &&
      launchOptions.browserUrl &&
      launchOptions.serverId && launchOptions.serverKey) {
    this.browserClient_ = new gf.net.browser.BrowserClient(
        launchOptions.browserUrl,
        launchOptions.serverId, launchOptions.serverKey);
    this.registerDisposable(this.browserClient_);
  }

  /**
   * Timer ID of the server browser update, if it is running.
   * @private
   * @type {number?}
   */
  this.browserUpdateId_ = null;
};
goog.inherits(blk.game.server.ServerGame, gf.Game);


/**
 * @override
 */
blk.game.server.ServerGame.prototype.disposeInternal = function() {
  if (this.browserUpdateId_) {
    goog.global.clearTimeout(this.browserUpdateId_);
    this.browserUpdateId_ = null;
  }
  if (this.browserClient_) {
    this.browserClient_.unregisterServer();
  }

  goog.base(this, 'disposeInternal');
};


/**
 * @return {!gf.assets.AssetManager} Asset manager.
 */
blk.game.server.ServerGame.prototype.getAssetManager = function() {
  return this.assetManager_;
};


/**
 * Updates the server browser with the current user info.
 * @private
 */
blk.game.server.ServerGame.prototype.updateBrowser_ = function() {
  if (!this.browserClient_) {
    return;
  }

  // Build user infos
  var session = this.controller_.session;
  var userInfos = [];
  for (var n = 0; n < session.users.length; n++) {
    var user = session.users[n];
    userInfos.push(user.info);
  }

  this.browserClient_.updateServer(userInfos).addBoth(
      function() {
        // Call again
        this.browserUpdateId_ = goog.global.setTimeout(
            goog.bind(this.updateBrowser_, this),
            gf.net.browser.BrowserClient.UPDATE_FREQUENCY * 1000);
      }, this);
};


/**
 * Loads any resources required by the controller before the game can start.
 * @return {!goog.async.Deferred} A deferred fulfilled when the server is ready.
 */
blk.game.server.ServerGame.prototype.load = function() {
  // Start server browser
  if (this.browserClient_) {
    var session = this.controller_.session;
    var launchOptions =
        /** @type {!blk.server.LaunchOptions} */ (this.launchOptions);
    this.browserClient_.registerServer(session.serverInfo).addCallbacks(
        function() {
          gf.log.write('Registered with server browser at ' +
              launchOptions.browserUrl);
          this.updateBrowser_();
        },
        function(arg) {
          gf.log.write('Unable to register with server browser: ', arg);
        }, this);
  }

  // Load the game logic
  return this.controller_.load();
};


/**
 * @override
 */
blk.game.server.ServerGame.prototype.update = function(frame) {
  this.controller_.update(frame);
};


/**
 * @override
 */
blk.game.server.ServerGame.prototype.render = function(frame) {
  this.controller_.render(frame);
};


blk.game.server.ServerGame = WTF.trace.instrumentType(
    blk.game.server.ServerGame, 'blk.game.server.ServerGame',
    goog.reflect.object(blk.game.server.ServerGame, {
      update: 'update',
      render: 'render'
    }));
