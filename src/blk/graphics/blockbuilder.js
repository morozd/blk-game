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

goog.provide('blk.graphics.BlockBuilder');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.reflect');
goog.require('goog.vec.Mat4');
goog.require('goog.webgl');
goog.require('WTF.trace');



/**
 * Optimized block geometry buffer builder.
 *
 * TODO(benvanik): normals, texCoords as bytes (drastic reduction in face size)
 *
 * @constructor
 * @extends {goog.Disposable}
 * @param {!blk.graphics.RenderState} renderState Render state.
 */
blk.graphics.BlockBuilder = function(renderState) {
  goog.base(this);

  /**
   * Render state.
   * @type {!blk.graphics.RenderState}
   */
  this.renderState = renderState;

  /**
   * Graphics context.
   * @type {!gf.graphics.GraphicsContext}
   */
  this.graphicsContext = renderState.graphicsContext;

  /**
   * Current capacity, in number of faces.
   * @private
   * @type {number}
   */
  this.faceCapacity_ = 4096 * 6;

  /**
   * Data array buffer.
   * @private
   * @type {!ArrayBuffer}
   */
  this.data_ = new ArrayBuffer(
      this.faceCapacity_ * blk.graphics.BlockBuilder.BYTES_PER_FACE_);

  /**
   * Int8 accessor into data.
   * @private
   * @type {!Int8Array}
   */
  this.int8Data_ = new Int8Array(this.data_);

  /**
   * Uint8 accessor into data.
   * @private
   * @type {!Uint8Array}
   */
  this.uint8Data_ = new Uint8Array(this.data_);

  /**
   * Current face index in the data buffer.
   * @private
   * @type {number}
   */
  this.faceIndex_ = 0;
};
goog.inherits(blk.graphics.BlockBuilder, goog.Disposable);


/**
 * Scalar on number of faces to expand the data by when required.
 * TODO(benvanik): tune this value, or find a way to measure waste
 * @private
 * @const
 * @type {number}
 */
blk.graphics.BlockBuilder.CAPACITY_GROWTH_RATE_ = 2;


/**
 * Number of indices per face.
 * @private
 * @const
 * @type {number}
 */
blk.graphics.BlockBuilder.INDICES_PER_FACE_ = 6;


/**
 * Total number of bytes per vertex.
 * @private
 * @const
 * @type {number}
 */
blk.graphics.BlockBuilder.BYTES_PER_VERTEX_ =
    3 * 1 +
    3 * 1 +
    4 * 1;


/**
 * Total number of vertices per face.
 * @private
 * @const
 * @type {number}
 */
blk.graphics.BlockBuilder.VERTICES_PER_FACE_ = 4;


/**
 * Total number of bytes per face.
 * @private
 * @const
 * @type {number}
 */
blk.graphics.BlockBuilder.BYTES_PER_FACE_ =
    blk.graphics.BlockBuilder.VERTICES_PER_FACE_ *
    blk.graphics.BlockBuilder.BYTES_PER_VERTEX_;


/**
 * Byte offset of the position vertex attribute.
 * @private
 * @const
 * @type {number}
 */
blk.graphics.BlockBuilder.POSITION_ATTRIB_OFFSET_ = 0;


/**
 * Byte offset of the normal vertex attribute.
 * @private
 * @const
 * @type {number}
 */
blk.graphics.BlockBuilder.NORMAL_ATTRIB_OFFSET_ = 3 * 1;


/**
 * Byte offset of the texCoord vertex attribute.
 * @private
 * @const
 * @type {number}
 */
blk.graphics.BlockBuilder.TEX_INFO_ATTRIB_OFFSET_ = 3 * 1 + 3 * 1;


/**
 * Vertices used in the faces of a block, all in [0-1].
 * [position, normal, texCoords, 0, 0]
 * @private
 * @type {!Int8Array}
 */
blk.graphics.BlockBuilder.faceTemplate_ = new Int8Array([
  // Front face (+Z)
  0, 0, 1, 0, 0, 1, 1, 1, 0, 0,
  1, 0, 1, 0, 0, 1, 0, 1, 0, 0,
  1, 1, 1, 0, 0, 1, 0, 0, 0, 0,
  0, 1, 1, 0, 0, 1, 1, 0, 0, 0,
  // Back face (-Z)
  0, 0, 0, 0, 0, -1, 0, 1, 0, 0,
  0, 1, 0, 0, 0, -1, 0, 0, 0, 0,
  1, 1, 0, 0, 0, -1, 1, 0, 0, 0,
  1, 0, 0, 0, 0, -1, 1, 1, 0, 0,
  // Top face (+Y)
  0, 1, 0, 0, 1, 0, 1, 0, 0, 0,
  0, 1, 1, 0, 1, 0, 1, 1, 0, 0,
  1, 1, 1, 0, 1, 0, 0, 1, 0, 0,
  1, 1, 0, 0, 1, 0, 0, 0, 0, 0,
  // Bottom face (-Y)
  0, 0, 0, 0, -1, 0, 0, 0, 0, 0,
  1, 0, 0, 0, -1, 0, 1, 0, 0, 0,
  1, 0, 1, 0, -1, 0, 1, 1, 0, 0,
  0, 0, 1, 0, -1, 0, 0, 1, 0, 0,
  // Right face (+X)
  1, 0, 0, 1, 0, 0, 0, 1, 0, 0,
  1, 1, 0, 1, 0, 0, 0, 0, 0, 0,
  1, 1, 1, 1, 0, 0, 1, 0, 0, 0,
  1, 0, 1, 1, 0, 0, 1, 1, 0, 0,
  // Left face (-X)
  0, 0, 0, -1, 0, 0, 1, 1, 0, 0,
  0, 0, 1, -1, 0, 0, 0, 1, 0, 0,
  0, 1, 1, -1, 0, 0, 0, 0, 0, 0,
  0, 1, 0, -1, 0, 0, 1, 0, 0, 0
]);


/**
 * Creates a shared index buffer used when drawing faces.
 * @param {!WebGLRenderingContext} gl Target context.
 * @return {WebGLBuffer} Index buffer.
 */
blk.graphics.BlockBuilder.createIndexBuffer = function(gl) {
  var buffer = gl.createBuffer();
  goog.asserts.assert(buffer);

  // Maximum number of faces that will fit
  // TODO(benvanik): maybe smaller? probably not all needed...
  var maxFaceCount = Math.floor(
      0xFFFF / blk.graphics.BlockBuilder.INDICES_PER_FACE_);

  // Total number of indices in the buffer
  var indexCount = maxFaceCount * blk.graphics.BlockBuilder.INDICES_PER_FACE_;
  goog.asserts.assert(indexCount <= 0xFFFF);

  // Create data
  var baseIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);
  var indexData = new Uint16Array(indexCount);
  for (var n = 0, i = 0, v = 0; n < maxFaceCount; n++) {
    for (var m = 0; m < baseIndices.length; m++) {
      indexData[i + m] = baseIndices[m] + v;
    }
    i += baseIndices.length;
    v += blk.graphics.BlockBuilder.VERTICES_PER_FACE_;
  }

  // Uplaod data
  gl.bindBuffer(goog.webgl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(goog.webgl.ELEMENT_ARRAY_BUFFER, indexData,
      goog.webgl.STATIC_DRAW);
  gl.bindBuffer(goog.webgl.ELEMENT_ARRAY_BUFFER, null);

  return buffer;
};


/**
 * Ensures that there are at least the given number of faces available, and
 * expands the pool for them.
 * Using this can make things more efficient when adding large numbers of
 * items to the pool.
 * @param {number} newFaceCount Number of new faces being added.
 * @return {boolean} True if the expansion succeeded.
 */
blk.graphics.BlockBuilder.prototype.ensureCapacity = function(newFaceCount) {
  var newCapacity =
      Math.max(this.faceCapacity_, this.faceIndex_ + newFaceCount);
  if (newCapacity > this.faceCapacity_) {
    return this.expand_(newCapacity);
  } else {
    return true;
  }
};


/**
 * Expands the face buffer to support more faces.
 * @private
 * @param {number=} opt_newCapacity New capacity, in faces.
 * @return {boolean} True if the expansion succeeded.
 */
blk.graphics.BlockBuilder.prototype.expand_ = function(opt_newCapacity) {
  var newCapacity = Math.ceil(opt_newCapacity ||
      (this.faceCapacity_ * blk.graphics.BlockBuilder.CAPACITY_GROWTH_RATE_));
  if (newCapacity >= 0xFFFF / blk.graphics.BlockBuilder.INDICES_PER_FACE_) {
    return false;
  }

  var newData = new ArrayBuffer(
      newCapacity * blk.graphics.BlockBuilder.BYTES_PER_FACE_);

  // Ghetto clone
  // TODO(benvanik): optimize somehow?
  var byteWrapper = new Uint8Array(newData);
  byteWrapper.set(new Uint8Array(this.data_));

  this.faceCapacity_ = newCapacity;
  this.data_ = newData;
  this.int8Data_ = new Int8Array(this.data_);
  this.uint8Data_ = new Uint8Array(this.data_);

  return true;
};


/**
 * Adds a new axis-aligned face.
 * @param {blk.env.Face} face Face ordinal.
 * @param {number} x Chunk-relative block X.
 * @param {number} y Chunk-relative block Y.
 * @param {number} z Chunk-relative block Z.
 * @param {!goog.vec.Vec4.Float32} texCoords Texture coordinates.
 * @return {boolean} True if the face was added.
 */
blk.graphics.BlockBuilder.prototype.addFace = function(face, x, y, z,
    texCoords) {
  var index = this.faceIndex_++;
  while (index >= this.faceCapacity_) {
    if (!this.expand_()) {
      return false;
    }
  }

  // Face template data
  var template = blk.graphics.BlockBuilder.faceTemplate_;
  var f = face * 4 * 10;

  // Write vertex data
  var int8Data = this.int8Data_;
  var uint8Data = this.uint8Data_;
  var o = index * blk.graphics.BlockBuilder.BYTES_PER_FACE_;
  for (var n = 0, v = 0; n < blk.graphics.BlockBuilder.VERTICES_PER_FACE_;
      n++, v += 10) {
    int8Data[o + v + 0] = template[f + v + 0] + x;
    int8Data[o + v + 1] = template[f + v + 1] + y;
    int8Data[o + v + 2] = template[f + v + 2] + z;
    int8Data[o + v + 3] = template[f + v + 3];
    int8Data[o + v + 4] = template[f + v + 4];
    int8Data[o + v + 5] = template[f + v + 5];
    uint8Data[o + v + 6] = template[f + v + 6] ?
        texCoords[2] * 255 : texCoords[0] * 255;
    uint8Data[o + v + 7] = template[f + v + 7] ?
        texCoords[3] * 255 : texCoords[1] * 255;
    uint8Data[o + v + 8] = template[f + v + 8];
    uint8Data[o + v + 9] = template[f + v + 9];
  }

  return true;
};


/**
 * Finishes the build and returns the results.
 * @param {WebGLBuffer=} opt_existingBuffer Existing GL buffer to reuse.
 * @return {!{
 *   buffer: WebGLBuffer,
 *   elementCount: number,
 *   bytesUsed: number
 * }}
 */
blk.graphics.BlockBuilder.prototype.finish = function(opt_existingBuffer) {
  var gl = this.graphicsContext.gl;

  var bytesUsed =
      this.faceIndex_ * blk.graphics.BlockBuilder.BYTES_PER_FACE_;
  var indicesUsed =
      this.faceIndex_ * blk.graphics.BlockBuilder.INDICES_PER_FACE_;
  if (!bytesUsed) {
    if (opt_existingBuffer) {
      gl.deleteBuffer(opt_existingBuffer);
    }
    return {
      buffer: null,
      elementCount: 0,
      bytesUsed: 0
    };
  }

  var buffer = opt_existingBuffer || gl.createBuffer();
  gl.bindBuffer(goog.webgl.ARRAY_BUFFER, buffer);

  // NOTE: only the used portion of the buffer is uploaded
  // It is not a copy (in theory), so it should be fast
  var subBuffer = this.uint8Data_.subarray(0, bytesUsed);
  gl.bufferData(goog.webgl.ARRAY_BUFFER, subBuffer, goog.webgl.DYNAMIC_DRAW);

  var result = {
    buffer: buffer,
    elementCount: indicesUsed,
    bytesUsed: bytesUsed
  };

  this.faceIndex_ = 0;

  return result;
};


/**
 * Draws the faces in the buffer.
 * @param {!gf.vec.Viewport} viewport Current viewport.
 * @param {!goog.vec.Mat4.Type} worldMatrix World matrix.
 * @param {WebGLBuffer} buffer GL buffer.
 * @param {number} elementCount Number of elements to render.
 */
blk.graphics.BlockBuilder.prototype.draw = function(viewport, worldMatrix,
    buffer, elementCount) {
  var gl = this.graphicsContext.gl;
  var program = this.renderState.faceProgram;

  // Early exit if no faces
  if (!elementCount) {
    return;
  }

  // Set uniforms
  // TODO(benvanik): evaluate if faster to do in the shaders
  var tmpMat4 = blk.graphics.BlockBuilder.tmpMat4_;
  goog.vec.Mat4.multMat(
      viewport.viewProjMatrix,
      worldMatrix,
      tmpMat4);
  gl.uniformMatrix4fv(program.u_worldViewProjMatrix, false, tmpMat4);

  // Prepare for drawing
  gl.bindBuffer(goog.webgl.ARRAY_BUFFER, buffer);

  // Setup buffers
  // TODO(benvanik): VAOs
  gl.vertexAttribPointer(
      program.a_position,
      3,
      goog.webgl.BYTE,
      false,
      blk.graphics.BlockBuilder.BYTES_PER_VERTEX_,
      blk.graphics.BlockBuilder.POSITION_ATTRIB_OFFSET_);
  gl.vertexAttribPointer(
      program.a_normal,
      3,
      goog.webgl.BYTE,
      false,
      blk.graphics.BlockBuilder.BYTES_PER_VERTEX_,
      blk.graphics.BlockBuilder.NORMAL_ATTRIB_OFFSET_);
  gl.vertexAttribPointer(
      program.a_texInfo,
      4,
      goog.webgl.UNSIGNED_BYTE,
      false,
      blk.graphics.BlockBuilder.BYTES_PER_VERTEX_,
      blk.graphics.BlockBuilder.TEX_INFO_ATTRIB_OFFSET_);

  // Draw!
  gl.drawElements(
      goog.webgl.TRIANGLES,
      elementCount,
      goog.webgl.UNSIGNED_SHORT,
      0);
};


/**
 * Temporary mat4.
 * @private
 * @type {!goog.vec.Mat4.Type}
 */
blk.graphics.BlockBuilder.tmpMat4_ = goog.vec.Mat4.createFloat32();


blk.graphics.BlockBuilder = WTF.trace.instrumentType(
    blk.graphics.BlockBuilder, 'blk.graphics.BlockBuilder',
    goog.reflect.object(blk.graphics.BlockBuilder, {
      createIndexBuffer: 'createIndexBuffer',
      expand_: 'expand_',
      finish: 'finish'
      //draw: 'draw'
    }));
