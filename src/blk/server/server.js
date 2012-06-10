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

goog.provide('blk.server.start');

goog.require('blk.io.FileMapStore');
goog.require('blk.io.MemoryMapStore');
goog.require('blk.net.packets');
goog.require('blk.server.LaunchOptions');
goog.require('blk.server.ServerGame');
goog.require('gf');
goog.require('gf.io.node');
goog.require('gf.net');
goog.require('gf.net.AuthToken');
goog.require('gf.net.ServerInfo');
goog.require('goog.asserts');
goog.require('goog.async.Deferred');


/**
 * Starts the game server.
 * @param {string} uri Invoking URI.
 * @param {!Object.<string>} options Options.
 * @return {!goog.async.Deferred} A deferred fulfilled when the server is ready.
 */
blk.server.start = function(uri, options) {
  goog.asserts.assert(gf.SERVER);
  var deferred = new goog.async.Deferred();

  // Setup node filesystem roots
  if (gf.NODE) {
    gf.io.node.persistentRoot = options['persistentRoot'];
    gf.io.node.temporaryRoot = options['temporaryRoot'];
  }

  // TODO(benvanik): proper endpoint selection
  var endpoint;
  if (gf.NODE) {
    endpoint = /** @type {gf.net.Endpoint} */ (String(options['port']));
  } else {
    endpoint = /** @type {gf.net.Endpoint} */ (goog.global);
  }

  var launchOptions = new blk.server.LaunchOptions(uri,
      options['mapPath'], Number(options['userCount']));

  // TODO(benvanik): authtoken/serverinfo
  var authToken = new gf.net.AuthToken();
  var serverInfo = new gf.net.ServerInfo();
  // TODO(benvanik): give the server a name
  serverInfo.name = 'Server';
  serverInfo.gameType = goog.DEBUG ? 'blk-dev' : 'blk';
  serverInfo.gameVersion = '0.0.1';
  serverInfo.maximumUsers = launchOptions.userCount;

  var listenDeferred = gf.net.listen(
      endpoint,
      blk.net.packets.PROTOCOL_VERSION,
      authToken,
      serverInfo);
  listenDeferred.addCallbacks(function(session) {
    // Setup map store
    var mapPath = launchOptions.mapPath;
    var mapStore = new blk.io.FileMapStore(mapPath);
    mapStore.setup().addCallbacks(
        function() {
          blk.server.launchServer_(launchOptions, session, mapStore, deferred);
        },
        function(arg) {
          // Fallback to no storage
          mapStore = new blk.io.MemoryMapStore();
          mapStore.setup();
          blk.server.launchServer_(launchOptions, session, mapStore, deferred);
        });
  }, function(arg) {
    deferred.errback(arg);
  });

  return deferred;
};


/**
 * Launches a server game.
 * @private
 * @param {!blk.server.LaunchOptions} launchOptions Launch options.
 * @param {!gf.net.ServerSession} session Server session.
 * @param {!blk.io.MapStore} mapStore Map storage provider.
 * @param {!goog.async.Deferred} deferred Deferred to signal when ready.
 */
blk.server.launchServer_ = function(launchOptions, session, mapStore,
    deferred) {
  // Create game
  var game = new blk.server.ServerGame(launchOptions, session, mapStore);

  // HACK: debug root - useful for inspecting the game state
  if (goog.DEBUG) {
    goog.global['blk_server'] = game;
  }

  // Start ticking
  game.startTicking();

  // TODO(benvanik): wait until loaded, etc
  deferred.callback(game);
};


goog.exportSymbol('blk.server.start', blk.server.start);
