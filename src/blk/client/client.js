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

goog.require('blk.client.ClientGame');
goog.require('blk.client.LaunchOptions');
goog.require('blk.game.client.UserSettings');
goog.require('blk.net.packets');
goog.require('blk.ui.Popup');
goog.require('blk.ui.popups.status');
goog.require('gf');
goog.require('gf.io');
goog.require('gf.io.FileSystemType');
goog.require('gf.log');
goog.require('gf.net');
goog.require('gf.net.AuthToken');
goog.require('gf.net.UserInfo');
goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('goog.dom.DomHelper');
goog.require('goog.uri.utils');
goog.require('goog.userAgent.product');


/**
 * Shared workers are harder to debug than dedicated workers - disable when
 * developing.
 * @private
 * @const
 * @type {boolean}
 */
blk.client.ENABLE_SHARED_WORKERS_ = false;


/**
 * Starts the game.
 * @param {string} uri Invoking URI.
 * @param {boolean} sourceMode True if running from source.
 * @param {!Document} doc Document.
 * @param {Object.<*>=} opt_args Key-value argument map.
 */
blk.client.start = function(uri, sourceMode, doc, opt_args) {
  goog.asserts.assert(!gf.SERVER);
  var dom = new goog.dom.DomHelper(doc);

  var launchOptions = new blk.client.LaunchOptions(uri, opt_args);
  var settings = new blk.game.client.UserSettings(dom);
  settings.load();

  //launchOptions.host = 'ws://127.0.0.1:1337';
  //launchOptions.host = 'local://blk-0';

  var authToken = new gf.net.AuthToken();
  var userInfo = new gf.net.UserInfo();
  // TODO(benvanik): setup userinfo/authtoken

  // Pull or query user info
  if (launchOptions.userName) {
    // Override settings (and save back)
    var userName = gf.net.UserInfo.sanitizeDisplayName(launchOptions.userName);
    settings.userName = userName;
    settings.save();
  }
  userInfo.displayName = gf.net.UserInfo.sanitizeDisplayName(settings.userName);

  // Show connecting dialog
  var connectDialog = blk.ui.Popup.show(blk.ui.popups.status.connecting, {
    server_name: launchOptions.host
  }, dom);

  var deferred = null;
  switch (goog.uri.utils.getScheme(launchOptions.host)) {
    case 'ws':
      deferred = gf.net.connect(
          /** @type {gf.net.Endpoint} */ (launchOptions.host),
          blk.net.packets.PROTOCOL_VERSION,
          authToken,
          userInfo);
      break;
    case 'local':
      // TODO(benvanik): pull from somewhere?
      var quotaSize = 1024 * 1024 * 1024;
      deferred = new goog.async.Deferred();
      gf.io.requestQuota(
          gf.io.FileSystemType.PERSISTENT, quotaSize).addCallbacks(
          function(grantedBytes) {
            if (grantedBytes < quotaSize) {
              deferred.errback(null);
            } else {
              blk.client.launchLocalServer_(
                  sourceMode,
                  launchOptions.host,
                  authToken,
                  userInfo).chainDeferred(/** @type {!goog.async.Deferred} */ (
                  deferred));
            }
          },
          function(arg) {
            gf.log.write('unable to get quota - no saving!');
            blk.client.launchLocalServer_(
                sourceMode,
                launchOptions.host,
                authToken,
                userInfo).chainDeferred(/** @type {!goog.async.Deferred} */ (
                deferred));
          });
      break;
    default:
      // Unsupported
      gf.log.write('unsupported protocol', launchOptions.host);
      break;
  }
  goog.asserts.assert(deferred);

  // Wait for the connection...
  deferred.addCallbacks(function(session) {
    connectDialog.cancel();

    // Create game
    var game = new blk.client.ClientGame(launchOptions, settings, dom, session);

    // HACK: debug root - useful for inspecting the game state
    if (goog.DEBUG) {
      goog.global['blk_client'] = game;
    }

    // Start the game
    game.startTicking();
  }, function(arg) {
    connectDialog.cancel();

    gf.log.write('error:', arg);

    var d = blk.ui.Popup.show(blk.ui.popups.status.connectionFailed, {
      reason: arg
    }, dom);
    d.addCallback(
        function(buttonId) {
          if (buttonId == 'reload') {
            window.location.reload(false);
          } else {
            window.location.href = 'http://google.com';
          }
        });
  });
};


/**
 * Launches a local server and establishes a connection.
 * @private
 * @param {boolean} sourceMode True if running from source.
 * @param {string} uri URI provided by options.
 * @param {!gf.net.AuthToken} authToken Authentication information.
 * @param {!gf.net.UserInfo} userInfo Client user information.
 * @return {!goog.async.Deferred} A deferred fulfilled when the server is ready
 *     for connections. If successful a {@see gf.net.ClientSession} will be
 *     passed as the only argument.
 */
blk.client.launchLocalServer_ = function(sourceMode, uri, authToken, userInfo) {
  var deferred = new goog.async.Deferred();
  goog.asserts.assert(!!goog.global.Worker);

  // TODO(benvanik): name servers so there can be multiple/etc
  var serverId = goog.uri.utils.getDomain(uri);
  var name = 'server-' + serverId + (sourceMode ? '-uncompiled' : '');

  // Launch worker
  // Attempt to create a shared worker if it's supported - otherwise go
  // dedicated so we at least work
  var workerUri = sourceMode ?
      'worker-server-uncompiled.js' :
      'worker-server.js';
  var worker;
  var port;
  // HACK: SharedWorker exists in WebKit, but is not working
  if (blk.client.ENABLE_SHARED_WORKERS_ &&
      goog.userAgent.product.CHROME &&
      goog.global['SharedWorker']) {
    worker = new SharedWorker(workerUri, name);
    port = worker.port;
  } else {
    worker = new Worker(workerUri);
    port = worker;
  }

  // Connect
  var connectDeferred = gf.net.connect(
      /** @type {gf.net.Endpoint} */ (port),
      blk.net.packets.PROTOCOL_VERSION,
      authToken,
      userInfo);
  connectDeferred.addCallbacks(function(session) {
    // Wait until here otherwise it will steal events from the session
    gf.log.installListener(port, '{server}');

    // TODO(benvanik): send server init

    deferred.callback(session);
  }, function(arg) {
    deferred.errback(arg);
  });

  return deferred;
};

goog.exportSymbol('blk.client.start', blk.client.start);
