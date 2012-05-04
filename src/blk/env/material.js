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

goog.provide('blk.env.Material');
goog.provide('blk.env.MaterialFlags');

goog.require('goog.vec.Vec4');


/**
 * Material flags, used in the material flag bitmask.
 * @enum {number}
 */
blk.env.MaterialFlags = {
  /**
   * Solid.
   * Use solid block physics (float suspended forever).
   * Block abuts the block boundary (full block) - as opposed to flowers.
   */
  SOLID: 0x00000001,

  /**
   * Liquid.
   * Use liquid block physics (tick update for movement).
   */
  LIQUID: 0x00000002,

  /**
   * Block is opaque and lets no light through.
   */
  OPAQUE: 0x00000010,

  /**
   * Block is semi-transparent and lets some light through.
   */
  TRANSLUCENT: 0x00000020,

  /**
   * Adjacent blocks merge together (like water/grass).
   * Prevents interior faces from rendering.
   */
  MERGE: 0x00000040,

  /**
   * Block emits light.
   */
  EMISSIVE: 0x00000080
};



/**
 * Material information.
 * Materials are shared among many block types, and define the properties used
 * for effects, lighting, and other attributes.
 *
 * @constructor
 * @param {number} flags Bitmask of flags from {@see blk.env.MaterialFlags}.
 * @param {string=} opt_actionCue Sound cue to play when modifying.
 * @param {string=} opt_stepCue Sound cue to play when stepped on.
 * @param {goog.vec.Vec4.Type=} opt_color Emission color.
 */
blk.env.Material = function(flags, opt_actionCue, opt_stepCue, opt_color) {
  /**
   * Flags bitmask, from {@see blk.env.MaterialFlags}.
   * @type {number}
   */
  this.flags = flags;

  /**
   * Name of the sound cue to play when modified, if any.
   * @type {string?}
   */
  this.actionCue = opt_actionCue || null;

  /**
   * Name of the sound cue to play when stepped on, if any.
   * @type {string?}
   */
  this.stepCue = opt_stepCue || null;

  /**
   * Emission color, if the material is emissive.
   * @type {!goog.vec.Vec4.Type}
   */
  this.color = opt_color || goog.vec.Vec4.createFloat32();
};
