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

goog.provide('blk.modes.fps.server.FpsServerController');

goog.require('blk.game.server.ServerController');



/**
 * @constructor
 * @extends {blk.game.server.ServerController}
 * @param {!blk.game.server.ServerGame} game Server game.
 * @param {!gf.net.ServerSession} session Network session.
 * @param {!blk.io.MapStore} mapStore Map storage provider, ownership
 *     transferred.
 */
blk.modes.fps.server.FpsServerController = function(game, session, mapStore) {
  goog.base(this, game, session, mapStore);
};
goog.inherits(blk.modes.fps.server.FpsServerController,
    blk.game.server.ServerController);
