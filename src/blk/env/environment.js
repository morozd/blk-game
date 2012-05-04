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

goog.provide('blk.env.Environment');

goog.require('goog.Disposable');
goog.require('goog.vec.Vec3');



/**
 * Environmental support, including skyboxes/etc.
 *
 * @constructor
 * @extends {goog.Disposable}
 */
blk.env.Environment = function() {
  goog.base(this);

  /**
   * Current color of the sky.
   * @type {!goog.vec.Vec3.Type}
   */
  this.skyColor = goog.vec.Vec3.createFloat32FromValues(
      0, 191 / 255, 255 / 255);

  /**
   * Ambient lighting color.
   * @type {!goog.vec.Vec3.Type}
   */
  this.ambientLightColor = goog.vec.Vec3.createFloat32FromValues(
      110 / 255, 110 / 255, 110 / 255);

  /**
   * Normalized sun lighting direction vector.
   * @type {!goog.vec.Vec3.Type}
   */
  this.sunLightDirection = goog.vec.Vec3.createFloat32FromValues(1, 1, -0.5);

  /**
   * Sun lighting color.
   * @type {!goog.vec.Vec3.Type}
   */
  this.sunLightColor = goog.vec.Vec3.createFloat32FromValues(
      130 / 255, 130 / 255, 130 / 255);

  /**
   * Fog color.
   * @type {!goog.vec.Vec3.Type}
   */
  this.fogColor = goog.vec.Vec3.createFloat32FromValues(
      255 / 255, 255 / 255, 255 / 255);
  goog.vec.Vec3.setFromArray(this.fogColor, this.skyColor);
};
goog.inherits(blk.env.Environment, goog.Disposable);


/**
 * Updates the environment.
 * @param {!gf.UpdateFrame} frame Current update frame.
 */
blk.env.Environment.prototype.update = function(frame) {
};
