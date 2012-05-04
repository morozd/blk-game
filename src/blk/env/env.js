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

goog.provide('blk.env');


/**
 * Maximum world units that an action can take place at.
 * @const
 * @type {number}
 */
blk.env.MAX_ACTION_DISTANCE = 10;


/**
 * Maximum world units that an action can take place at in god mode.
 * @const
 * @type {number}
 */
blk.env.MAX_ACTION_DISTANCE_GOD = 100;


/**
 * Maximum distance to play sounds - sounds further will be ignored.
 * @const
 * @type {number}
 */
blk.env.MAX_SOUND_DISTANCE = 100;
