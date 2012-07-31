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

goog.provide('blk.game.SoundBanks');


/**
 * Names for each sound bank in the core set.
 * Sound bank names are global in the client and fail gracefully if not found.
 *
 * It's ok to define custom sound bank names so long as they don't conflict
 * with any other names. To ensure this use
 * {@see blk.game.SoundBanks#getUniqueId} instead of hardcoding a name.
 *
 * @enum {string}
 */
blk.game.SoundBanks = {
  /**
   * Block material sounds.
   */
  BLOCKS: 'blocks'
};


/**
 * Next unique ID.
 * @private
 * @type {number}
 */
blk.game.SoundBanks.nextId_ = 0;


/**
 * Gets a unique sound bank name.
 * @param {string=} opt_baseName Base name, to aid in debugging.
 * @return {string} A unique bank name.
 */
blk.game.SoundBanks.getUniqueId = function(opt_baseName) {
  return (opt_baseName || 'bank') + blk.game.SoundBanks.nextId_++;
};
