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

goog.provide('blk.graphics.LineBuffer');

goog.require('gf.graphics.GeometryPool');
goog.require('goog.vec.Mat4');
goog.require('goog.webgl');



/**
 * Specialized resource for drawing lines.
 * Manages graphics data associated with lines and efficiently draws them.
 *
 * TODO(benvanik): remove()
 * TODO(benvanik): clear() should shrink the buffer
 *
 * @constructor
 * @extends {gf.graphics.GeometryPool}
 * @param {!gf.graphics.GraphicsContext} graphicsContext Graphics context.
 */
blk.graphics.LineBuffer = function(graphicsContext) {
  goog.base(this, graphicsContext,
      blk.graphics.LineBuffer.BYTES_PER_LINE_);

  /**
   * Float32 accessor into line data.
   * @private
   * @type {!Float32Array}
   */
  this.floatData_ = new Float32Array(this.slotData);

  /**
   * Uint32 accessor into line data.
   * @private
   * @type {!Uint32Array}
   */
  this.uint32Data_ = new Uint32Array(this.slotData);

  // Initial setup
  // TODO(benvanik): defer to first use?
  this.restore();
};
goog.inherits(blk.graphics.LineBuffer, gf.graphics.GeometryPool);


/**
 * Total number of bytes per vertex.
 * @private
 * @const
 * @type {number}
 */
blk.graphics.LineBuffer.BYTES_PER_VERTEX_ =
    3 * 4 +
    1 * 4;


/**
 * Total number of bytes per line.
 * @private
 * @const
 * @type {number}
 */
blk.graphics.LineBuffer.BYTES_PER_LINE_ =
    2 * blk.graphics.LineBuffer.BYTES_PER_VERTEX_;


/**
 * Byte offset of the position vertex attribute.
 * @private
 * @const
 * @type {number}
 */
blk.graphics.LineBuffer.POSITION_ATTRIB_OFFSET_ = 0;


/**
 * Byte offset of the color vertex attribute.
 * @private
 * @const
 * @type {number}
 */
blk.graphics.LineBuffer.COLOR_ATTRIB_OFFSET_ = 3 * 4;


/**
 * @override
 */
blk.graphics.LineBuffer.prototype.dataBufferChanged = function() {
  this.floatData_ = new Float32Array(this.slotData);
  this.uint32Data_ = new Uint32Array(this.slotData);
};


/**
 * Adds a line segment.
 * @param {number} pt0x Point 0 X.
 * @param {number} pt0y Point 0 Y.
 * @param {number} pt0z Point 0 Z.
 * @param {number} color0 Color 0, 32-bit ABGR.
 * @param {number} pt1x Point 1 X.
 * @param {number} pt1y Point 1 Y.
 * @param {number} pt1z Point 1 Z.
 * @param {number} color1 Color 1, 32-bit ABGR.
 */
blk.graphics.LineBuffer.prototype.addSegmentFromValues =
    function(pt0x, pt0y, pt0z, color0, pt1x, pt1y, pt1z, color1) {
  // Allocate a new segment, expanding if required
  var slot = this.allocateSlot();
  if (slot == gf.graphics.GeometryPool.INVALID_SLOT) {
    return;
  }

  // Write vertices
  var floatData = this.floatData_;
  var uint32Data = this.uint32Data_;
  var o = slot * this.slotSize / 4;
  floatData[o + 0] = pt0x;
  floatData[o + 1] = pt0y;
  floatData[o + 2] = pt0z;
  uint32Data[o + 3] = color0;
  floatData[o + 4] = pt1x;
  floatData[o + 5] = pt1y;
  floatData[o + 6] = pt1z;
  uint32Data[o + 7] = color1;
};


/**
 * Adds a line segment.
 * @param {!goog.vec.Vec3.Type} pt0 Point 0.
 * @param {number} color0 Color 0, 32-bit ABGR.
 * @param {!goog.vec.Vec3.Type} pt1 Point 1.
 * @param {number} color1 Color 1, 32-bit ABGR.
 */
blk.graphics.LineBuffer.prototype.addSegment =
    function(pt0, color0, pt1, color1) {
  this.addSegmentFromValues(
      pt0[0], pt0[1], pt0[2], color0,
      pt1[0], pt1[1], pt1[2], color1);
};


/**
 * Adds lines outlining an axis-aligned cube.
 * @param {!goog.vec.Vec3.Type} min Minimum point.
 * @param {!goog.vec.Vec3.Type} max Maximum point.
 * @param {number} color Color, 32-bit ABGR.
 */
blk.graphics.LineBuffer.prototype.addCube = function(min, max, color) {
  this.addSegmentFromValues(
      min[0], min[1], min[2], color, max[0], min[1], min[2], color);
  this.addSegmentFromValues(
      min[0], min[1], min[2], color, min[0], max[1], min[2], color);
  this.addSegmentFromValues(
      min[0], min[1], min[2], color, min[0], min[1], max[2], color);
  this.addSegmentFromValues(
      max[0], min[1], max[2], color, min[0], min[1], max[2], color);
  this.addSegmentFromValues(
      max[0], min[1], max[2], color, max[0], min[1], min[2], color);
  this.addSegmentFromValues(
      max[0], min[1], max[2], color, max[0], max[1], max[2], color);
  this.addSegmentFromValues(
      max[0], min[1], min[2], color, max[0], max[1], min[2], color);
  this.addSegmentFromValues(
      min[0], min[1], max[2], color, min[0], max[1], max[2], color);
  this.addSegmentFromValues(
      min[0], max[1], min[2], color, max[0], max[1], min[2], color);
  this.addSegmentFromValues(
      min[0], max[1], min[2], color, min[0], max[1], max[2], color);
  this.addSegmentFromValues(
      max[0], max[1], max[2], color, max[0], max[1], min[2], color);
  this.addSegmentFromValues(
      max[0], max[1], max[2], color, min[0], max[1], max[2], color);
};


/**
 * Draws the line buffer.
 * @param {!blk.graphics.RenderState} renderState Render state.
 * @param {!gf.vec.Viewport} viewport Current viewport.
 * @param {!goog.vec.Mat4.Type} worldMatrix World matrix.
 */
blk.graphics.LineBuffer.prototype.draw = function(renderState,
    viewport, worldMatrix) {
  var gl = this.graphicsContext.gl;
  var program = renderState.lineProgram;

  // Early exit if no lines
  if (!this.slotMax) {
    return;
  }

  // Set uniforms
  // TODO(benvanik): evaluate if faster to do in the shaders
  var tmpMat4 = blk.graphics.LineBuffer.tmpMat4_;
  goog.vec.Mat4.multMat(
      viewport.viewProjMatrix,
      worldMatrix,
      tmpMat4);
  gl.uniformMatrix4fv(program.u_worldViewProjMatrix, false, tmpMat4);

  // Prepare for drawing
  this.prepareDraw();

  // Setup buffers
  // TODO(benvanik): VAOs
  gl.vertexAttribPointer(
      program.a_position,
      3,
      goog.webgl.FLOAT,
      false,
      blk.graphics.LineBuffer.BYTES_PER_VERTEX_,
      blk.graphics.LineBuffer.POSITION_ATTRIB_OFFSET_);
  gl.vertexAttribPointer(
      program.a_color,
      4,
      goog.webgl.UNSIGNED_BYTE,
      true,
      blk.graphics.LineBuffer.BYTES_PER_VERTEX_,
      blk.graphics.LineBuffer.COLOR_ATTRIB_OFFSET_);

  // Draw!
  gl.drawArrays(goog.webgl.LINES, 0, this.slotMax * 2);
};


/**
 * Temporary mat4.
 * @private
 * @type {!goog.vec.Mat4.Type}
 */
blk.graphics.LineBuffer.tmpMat4_ = goog.vec.Mat4.createFloat32();
