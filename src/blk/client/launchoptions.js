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



/**
 * Client launch options utility.
 *
 * @constructor
 * @extends {gf.LaunchOptions}
 * @param {string} uri Source app URI string.
 * @param {Object.<*>=} opt_args Key-value argument map.
 */
blk.client.LaunchOptions = function(uri, opt_args) {
  goog.base(this, blk.client.LaunchOptions.getArgumentInfo(), uri, opt_args);

  /**
   * Extra latency, in ms, to add to send/recv.
   * @type {number}
   */
  this.simulatedLatency = this.getNumberAlways('simulatedLatency');

  /**
   * User name for multiplayer.
   * @type {string?}
   */
  this.userName = this.getString('userName');

  /**
   * Host endpoint for connections.
   * @type {string}
   */
  this.host = this.getStringAlways('host');
};
goog.inherits(blk.client.LaunchOptions, gf.LaunchOptions);


/**
 * Gets argument information for the BLK client launch option arguments.
 * @return {!Object.<!gf.LaunchOptions.ArgumentInfo>} Argument information.
 */
blk.client.LaunchOptions.getArgumentInfo = function() {
  // TODO(benvanik): info
  return {
    'simulatedLatency': {
      help: 'Extra latency, in ms, to add to send/recv.',
      type: Number,
      defaultValue: 0
    },
    'userName': {
      help: 'User name for multiplayer.',
      type: String,
      defaultValue: null
    },
    'host': {
      help: 'Host endpoint for connections.',
      type: String,
      defaultValue: 'local://blk-0'
    }
  };
};
