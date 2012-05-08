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

goog.provide('blk.env.client.EntityRenderer');

goog.require('blk.env.Face');
goog.require('blk.env.client.BaseRenderer');
goog.require('gf.graphics.SpriteBuffer');
goog.require('goog.vec.Mat4');
goog.require('goog.vec.Quaternion');
goog.require('goog.vec.Vec3');
goog.require('goog.vec.Vec4');



/**
 * Handles entity rendering.
 *
 * TODO(benvanik): subclasses for various entity types
 * TODO(benvanik): generic geometry builder vs. blockbuilder
 *
 * @constructor
 * @extends {blk.env.client.BaseRenderer}
 * @param {!blk.graphics.RenderState} renderState Render state manager.
 * @param {!blk.env.Entity} entity Entity to render.
 */
blk.env.client.EntityRenderer = function(renderState, entity) {
  goog.base(this, renderState);

  /**
   * Entity to render.
   * @type {!blk.env.Entity}
   */
  this.entity = entity;

  /**
   * Shared block builder.
   * @private
   * @type {!blk.graphics.BlockBuilder}
   */
  this.blockBuilder_ = renderState.blockBuilder;

  /**
   * Current face buffer generated with the block builder.
   * @private
   * @type {WebGLBuffer}
   */
  this.faceBuffer_ = null;

  /**
   * Number of elements in the current face buffer.
   * @private
   * @type {number}
   */
  this.faceBufferElementCount_ = 0;

  /**
   * Bytes used by the face buffer.
   * @private
   * @type {number}
   */
  this.faceBufferSize_ = 0;

  /**
   * Sprite buffer, for adorners/text/etc.
   * @private
   * @type {!gf.graphics.SpriteBuffer}
   */
  this.spriteBuffer_ = new gf.graphics.SpriteBuffer(
      renderState.graphicsContext);
  this.registerDisposable(this.spriteBuffer_);

  if (entity.title) {
    var font = this.renderState.font;
    var wh = font.measureString(entity.title);
    font.prepareString(this.spriteBuffer_, entity.title, 0xFFFFFFFF,
        -wh[0] / 2 , 0);
  }

  // Entangle with entity
  entity.renderData = this;

  this.restore();
  this.spriteBuffer_.restore();
};
goog.inherits(blk.env.client.EntityRenderer, blk.env.client.BaseRenderer);


/**
 * @override
 */
blk.env.client.EntityRenderer.prototype.disposeInternal = function() {
  // Untangle from entity
  this.entity.renderData = null;

  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
blk.env.client.EntityRenderer.prototype.discard = function() {
  var gl = this.graphicsContext.gl;

  // Delete buffer
  gl.deleteBuffer(this.faceBuffer_);
  this.faceBuffer_ = null;
  this.faceBufferElementCount_ = 0;
  this.faceBufferSize_ = 0;
  this.estimatedSize = 0;

  goog.base(this, 'discard');
};


/**
 * @override
 */
blk.env.client.EntityRenderer.prototype.restore = function() {
  // Begin build
  this.blockBuilder_.ensureCapacity(2);

  // Grab texture coordinates
  var sideTexCoords = goog.vec.Vec4.createFloat32();
  this.renderState.blockAtlas.getSlotCoords(118, sideTexCoords);
  var faceTexCoords = goog.vec.Vec4.createFloat32();
  this.renderState.blockAtlas.getSlotCoords(119, faceTexCoords);
  var topTexCoords = goog.vec.Vec4.createFloat32();
  this.renderState.blockAtlas.getSlotCoords(102, topTexCoords);

  // Add faces
  this.blockBuilder_.addFace(blk.env.Face.POS_Z, 0, 0, 0, sideTexCoords);
  this.blockBuilder_.addFace(blk.env.Face.NEG_Z, 0, 0, 0, faceTexCoords);
  this.blockBuilder_.addFace(blk.env.Face.POS_Y, 0, 0, 0, topTexCoords);
  this.blockBuilder_.addFace(blk.env.Face.NEG_Y, 0, 0, 0, sideTexCoords);
  this.blockBuilder_.addFace(blk.env.Face.POS_X, 0, 0, 0, sideTexCoords);
  this.blockBuilder_.addFace(blk.env.Face.NEG_X, 0, 0, 0, sideTexCoords);

  // Finish the build
  var results = this.blockBuilder_.finish();
  this.faceBuffer_ = results.buffer;
  this.faceBufferElementCount_ = results.elementCount;
  var oldSize = this.faceBufferSize_;
  this.faceBufferSize_ = results.bytesUsed;
  this.estimatedSize = this.faceBufferSize_;

  goog.base(this, 'restore');
};


/**
 * @override
 */
blk.env.client.EntityRenderer.prototype.addDebugVisuals = function(buffer) {
  buffer.addCube(
      goog.vec.Vec3.createFloat32FromValues(0, 0, 0),
      goog.vec.Vec3.createFloat32FromValues(1, 2, 1),
      0xFFFF0000);
};


/**
 * @override
 */
blk.env.client.EntityRenderer.prototype.render = function(frame, viewport) {
  // Handle interpolation
  this.entity.interpolate(frame.time);

  var state = this.entity.state;
  var wm = blk.env.client.EntityRenderer.tmpMat4_[0];
  goog.vec.Mat4.makeIdentity(wm);
  var rm = blk.env.client.EntityRenderer.tmpMat4_[1];
  goog.vec.Quaternion.toRotationMatrix4(state.rotation, rm);
  var tm = blk.env.client.EntityRenderer.tmpMat4_[2];
  goog.vec.Mat4.setFromValues(tm,
      1, 0, 0, 0,
      0, 2, 0, 0,
      0, 0, 1, 0,
      -0.5, -1.5, -0.5, 1);
  goog.vec.Mat4.multMat(rm, tm, rm);
  goog.vec.Mat4.translate(wm,
      state.position[0],
      state.position[1],
      state.position[2]);
  goog.vec.Mat4.multMat(wm, rm, wm);

  this.blockBuilder_.draw(viewport, wm,
      this.faceBuffer_, this.faceBufferElementCount_);
};


/**
 * @override
 */
blk.env.client.EntityRenderer.prototype.renderDebug =
    function(frame, viewport) {
  if (this.debugLineBuffer) {
    // Handle interpolation
    this.entity.interpolate(frame.time);

    var state = this.entity.state;
    var wm = blk.env.client.EntityRenderer.tmpMat4_[0];
    goog.vec.Mat4.makeIdentity(wm);
    var rm = blk.env.client.EntityRenderer.tmpMat4_[1];
    goog.vec.Quaternion.toRotationMatrix4(state.rotation, rm);
    var tm = blk.env.client.EntityRenderer.tmpMat4_[2];
    goog.vec.Mat4.setFromValues(tm,
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        -0.5, -1.5, -0.5, 1);
    goog.vec.Mat4.multMat(rm, tm, rm);
    goog.vec.Mat4.translate(wm,
        state.position[0],
        state.position[1],
        state.position[2]);
    goog.vec.Mat4.multMat(wm, rm, wm);
    this.debugLineBuffer.draw(this.renderState, viewport, wm);
  }
};


/**
 * Renders an entities adorners.
 * @param {!gf.RenderFrame} frame Current render frame.
 * @param {!gf.vec.Viewport} viewport Current viewport.
 */
blk.env.client.EntityRenderer.prototype.renderAdorners =
    function(frame, viewport) {
  var state = this.entity.state;
  var scale = 1 / 16;
  var scaleMatrix = blk.env.client.EntityRenderer.tmpMat4_[0];
  goog.vec.Mat4.makeScale(scaleMatrix, scale, -scale, 1);
  var worldMatrix = blk.env.client.EntityRenderer.tmpMat4_[1];
  viewport.makeBillboard(worldMatrix);
  goog.vec.Mat4.multMat(worldMatrix, scaleMatrix, worldMatrix);
  worldMatrix[12] = state.position[0];
  worldMatrix[13] = state.position[1] + 1.5;
  worldMatrix[14] = state.position[2];

  this.spriteBuffer_.draw(viewport.viewProjMatrix, worldMatrix);
};


/**
 * Temp mat4.
 * @private
 * @type {!Array.<!goog.vec.Mat4.Type>}
 */
blk.env.client.EntityRenderer.tmpMat4_ = [
  goog.vec.Mat4.createFloat32(),
  goog.vec.Mat4.createFloat32(),
  goog.vec.Mat4.createFloat32()
];
