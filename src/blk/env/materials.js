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

goog.provide('blk.env.materials');

goog.require('blk.env.Material');
goog.require('blk.env.MaterialFlags');
goog.require('goog.vec.Vec4');


/**
 * Material used for ground blocks, such as dirt and rock.
 * @type {!blk.env.Material}
 */
blk.env.materials.ground = new blk.env.Material(
    blk.env.MaterialFlags.SOLID | blk.env.MaterialFlags.OPAQUE,
    'block_gravel', undefined,
    goog.vec.Vec4.createFloat32FromValues(0, 0, 0, 0));


/**
 * Material used for stone-like blocks, such as stone and brick.
 * @type {!blk.env.Material}
 */
blk.env.materials.stone = new blk.env.Material(
    blk.env.MaterialFlags.SOLID | blk.env.MaterialFlags.OPAQUE,
    'block_stone', undefined,
    goog.vec.Vec4.createFloat32FromValues(0, 0, 0, 0));


/**
 * Material used for wood-like blocks, such as wood.
 * @type {!blk.env.Material}
 */
blk.env.materials.wood = new blk.env.Material(
    blk.env.MaterialFlags.SOLID | blk.env.MaterialFlags.OPAQUE,
    'block_wood', undefined,
    goog.vec.Vec4.createFloat32FromValues(0, 0, 0, 0));


/**
 * Material used for glass-like blocks, such as glass.
 * @type {!blk.env.Material}
 */
blk.env.materials.glass = new blk.env.Material(
    blk.env.MaterialFlags.SOLID | blk.env.MaterialFlags.TRANSLUCENT |
    blk.env.MaterialFlags.MERGE,
    'block_stone', undefined,
    goog.vec.Vec4.createFloat32FromValues(0, 0, 0, 0));


/**
 * Material used for cloth-like blocks.
 * @type {!blk.env.Material}
 */
blk.env.materials.cloth = new blk.env.Material(
    blk.env.MaterialFlags.SOLID | blk.env.MaterialFlags.OPAQUE,
    'block_cloth', undefined,
    goog.vec.Vec4.createFloat32FromValues(0, 0, 0, 0));
