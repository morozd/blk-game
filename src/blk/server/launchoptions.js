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
 * Client aunch options utility.
 *
 * @constructor
 * @extends {gf.LaunchOptions}
 * @param {string} uri Source app URI string.
 * @param {string} mapPath Map path.
 * @param {number} userCount Maximum number of simultaneous users.
 */
blk.server.LaunchOptions = function(uri, mapPath, userCount) {
  goog.base(this, uri);

  /**
   * Map path.
   * @type {string}
   */
  this.mapPath = mapPath || '/maps/map01/';

  /**
   * Maximum simultaneous user count.
   * @type {number}
   */
  this.userCount = userCount || blk.server.LaunchOptions.DEFAULT_USER_COUNT_;
};
goog.inherits(blk.server.LaunchOptions, gf.LaunchOptions);


/**
 * Default number of users allowed to connect.
 * @private
 * @const
 * @type {number}
 */
blk.server.LaunchOptions.DEFAULT_USER_COUNT_ = 8;
