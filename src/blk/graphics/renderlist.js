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

goog.provide('blk.graphics.RenderList');

goog.require('goog.Disposable');
goog.require('goog.vec.Mat4');



/**
 * Optimized rendering command list.
 * Queues up mesh renders to enable sorted batching on draw.
 *
 * @constructor
 * @extends {goog.Disposable}
 * @param {!blk.graphics.RenderState} renderState Render state.
 */
blk.graphics.RenderList = function(renderState) {
  goog.base(this);

  /**
   * Render state.
   * @private
   * @type {!blk.graphics.RenderState}
   */
  this.renderState_ = renderState;

  // HACK: need to reuse/bucket/etc
  /**
   * @private
   * @type {!Array.<{
   *   instance: !gf.mdl.RenderInstance,
   *   transform: !goog.vec.Mat4.Float32
   * }>}
   */
  this.list_ = [];
};
goog.inherits(blk.graphics.RenderList, goog.Disposable);


/**
 * Adds a model instance to the render list.
 * @param {!gf.mdl.RenderInstance} instance Render instance.
 * @return {!goog.vec.Mat4.Float32} A matrix that should be populated
 *     with the instances world transform.
 */
blk.graphics.RenderList.prototype.drawModelInstance = function(instance) {
  // TODO(benvanik): cache and reuse - this is bad
  var transform = goog.vec.Mat4.createFloat32Identity();
  this.list_.push({
    instance: instance,
    transform: transform
  });
  return transform;
};


/**
 * Flushes all pending render commands.
 * @param {!gf.vec.Viewport} viewport Viewport.
 */
blk.graphics.RenderList.prototype.flush = function(viewport) {
  this.renderState_.beginModels(false);

  // Setup shared uniforms
  var gl = this.renderState_.graphicsContext.getGL();
  gl.uniformMatrix4fv(
      this.renderState_.modelProgram.u_viewProjMatrix, false,
      viewport.viewProjMatrix);
  var u_worldMatrix = this.renderState_.modelProgram.u_worldMatrix;

  // Render each instance
  for (var n = 0; n < this.list_.length; n++) {
    var command = this.list_[n];
    var instance = command.instance;
    var transform = command.transform;

    // HACK: this should be on the material, inside instance render
    gl.uniformMatrix4fv(u_worldMatrix, false, transform);

    instance.render(transform);
  }
  this.list_.length = 0;

  this.renderState_.endModels();
};
