/**
 * Copyright 2012 Google Inc. All Rights Reserved.
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

/**
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('blk.game.server.SimulationObserver');

goog.require('gf.sim.SimulationObserver');



/**
 * Simulation observer.
 *
 * @constructor
 * @extends {gf.sim.Observer}
 * @param {!gf.net.ServerSession} session Network session.
 * @param {!gf.net.User} user User this observer is representing.
 */
blk.game.server.SimulationObserver = function(session, user) {
  goog.base(this, session, user);
};
goog.inherits(blk.game.server.SimulationObserver, gf.sim.SimulationObserver);


/**
 * @override
 */
blk.game.server.SimulationObserver.prototype.isEntityChangeRelevant =
    function(entity) {
  // TODO(benvanik): distance from entity to user player, etc
  return true;
};
