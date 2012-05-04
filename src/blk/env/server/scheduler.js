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

goog.provide('blk.env.server.Scheduler');

goog.require('goog.Disposable');



/**
 * Update scheduling system.
 * Handles future chunk updates and scheduling.
 *
 * @constructor
 * @extends {goog.Disposable}
 */
blk.env.server.Scheduler = function() {
  goog.base(this);
};
goog.inherits(blk.env.server.Scheduler, goog.Disposable);


/**
 * Updates the scheduler and runs any required logic.
 * @param {!gf.UpdateFrame} frame Current update frame.
 */
blk.env.server.Scheduler.prototype.update = function(frame) {
};
