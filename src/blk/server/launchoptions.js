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

goog.provide('blk.server.LaunchOptions');

goog.require('gf.LaunchOptions');
goog.require('goog.string');



/**
 * Client aunch options utility.
 *
 * @constructor
 * @extends {gf.LaunchOptions}
 * @param {string} uri Source app URI string.
 * @param {string} mapPath Map path.
 * @param {?string} browserUrl Server browser URL.
 * @param {?string} serverId Server UUID.
 * @param {?string} serverKey Server private key.
 * @param {?string} serverName Server name.
 * @param {number} userCount Maximum number of simultaneous users.
 */
blk.server.LaunchOptions = function(uri,
    mapPath, browserUrl, serverId, serverKey, serverName, userCount) {
  goog.base(this, uri);

  /**
   * Map path.
   * @type {string}
   */
  this.mapPath = mapPath || '/maps/map01/';

  /**
   * Server browser URL.
   * @type {string}
   */
  this.browserUrl = browserUrl || blk.server.LaunchOptions.DEFAULT_BROWSER_URL_;

  /**
   * Server UUID.
   * @type {?string}
   */
  this.serverId = !goog.string.isEmptySafe(serverId) ? serverId : null;

  /**
   * Server private key.
   * @type {?string}
   */
  this.serverKey = !goog.string.isEmptySafe(serverKey) ? serverKey : null;

  /**
   * Server name.
   * @type {?string}
   */
  this.serverName = !goog.string.isEmptySafe(serverName) ? serverName : null;

  /**
   * Maximum simultaneous user count.
   * @type {number}
   */
  this.userCount = userCount || blk.server.LaunchOptions.DEFAULT_USER_COUNT_;
};
goog.inherits(blk.server.LaunchOptions, gf.LaunchOptions);


/**
 * Default server browser URL.
 * @private
 * @const
 * @type {string}
 */
blk.server.LaunchOptions.DEFAULT_BROWSER_URL_ =
    'http://something/';


/**
 * Default number of users allowed to connect.
 * @private
 * @const
 * @type {number}
 */
blk.server.LaunchOptions.DEFAULT_USER_COUNT_ = 8;
