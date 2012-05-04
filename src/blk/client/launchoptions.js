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

goog.provide('blk.client.LaunchOptions');

goog.require('gf.LaunchOptions');
goog.require('goog.asserts');



/**
 * Client aunch options utility.
 *
 * @constructor
 * @extends {gf.LaunchOptions}
 * @param {string} uri Source app URI string.
 */
blk.client.LaunchOptions = function(uri) {
  goog.base(this, uri);

  /**
   * Extra latency, in ms, to add to send/recv.
   * @type {number}
   */
  this.simulatedLatency = this.getNumber('simulatedLatency', 0) || 0;

  /**
   * User name for multiplayer.
   * @type {string}
   */
  this.userName = this.getString('userName', null) || 'User';

  /**
   * Host endpoint for connections.
   * @type {string}
   */
  this.host;
  var host = this.getString('host', 'local://blk-0');
  goog.asserts.assert(host);
  this.host = host;
};
goog.inherits(blk.client.LaunchOptions, gf.LaunchOptions);
