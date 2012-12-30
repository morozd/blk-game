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



/**
 * Server launch options utility.
 *
 * @constructor
 * @extends {gf.LaunchOptions}
 * @param {string} uri Source app URI string.
 * @param {Object.<*>=} opt_args Key-value argument map.
 */
blk.server.LaunchOptions = function(uri, opt_args) {
  goog.base(this, blk.server.LaunchOptions.getArgumentInfo(), uri, opt_args);

  /**
   * Port to use for game connections.
   * @type {number}
   */
  this.listenPort = this.getNumberAlways('listenPort');

  /**
   * File system root path.
   * @type {string}
   */
  this.fileSystem = this.getStringAlways('fileSystem');

  /**
   * Map path.
   * @type {string}
   */
  this.mapPath = this.getStringAlways('mapPath');

  /**
   * Server browser URL.
   * @type {string}
   */
  this.browserUrl = this.getStringAlways('browserUrl');

  /**
   * Server UUID.
   * @type {?string}
   */
  this.serverId = this.getString('serverId');

  /**
   * Server private key.
   * @type {?string}
   */
  this.serverKey = this.getString('serverKey');

  /**
   * Server name.
   * @type {?string}
   */
  this.serverName = this.getString('serverName');

  /**
   * Maximum simultaneous user count.
   * @type {number}
   */
  this.userCount = this.getNumberAlways('userCount');
};
goog.inherits(blk.server.LaunchOptions, gf.LaunchOptions);


/**
 * Gets argument information for the BLK server launch option arguments.
 * @return {!Object.<!gf.LaunchOptions.ArgumentInfo>} Argument information.
 */
blk.server.LaunchOptions.getArgumentInfo = function() {
  return {
    'listenPort': {
      'help': 'Port to use for game connections.',
      'type': Number,
      'defaultValue': 1337
    },
    'fileSystem': {
      'help': 'File system root path.',
      'type': String,
      'defaultValue': '/tmp/blk/'
    },
    'mapPath': {
      'help': 'Map path.',
      'type': String,
      'defaultValue': '/maps/map01/'
    },
    'browserUrl': {
      'help': 'Server browser base API URL.',
      'type': String,
      'defaultValue': 'http://localhost:8081/'
    },
    'serverId': {
      'help': 'Server registration UUID.',
      'type': String,
      'defaultValue': null
    },
    'serverKey': {
      'help': 'Server private key.',
      'type': String,
      'defaultValue': null
    },
    'serverName': {
      'help': 'Human-readable server name.',
      'type': String,
      'defaultValue': null
    },
    'userCount': {
      'help': 'Maximum simultaneous user count.',
      'type': Number,
      'defaultValue': 8
    }
  };
};
