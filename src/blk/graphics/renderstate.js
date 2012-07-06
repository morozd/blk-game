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

goog.provide('blk.graphics.RenderState');

goog.require('blk.assets.blocksets.simple');
goog.require('blk.assets.fonts.MonospaceFont');
goog.require('blk.assets.programs.FaceProgram');
goog.require('blk.assets.programs.LineProgram');
goog.require('blk.assets.programs.SpriteProgram');
goog.require('blk.assets.textures.ui');
goog.require('blk.graphics.BlockBuilder');
goog.require('gf.graphics.BlendState');
goog.require('gf.graphics.DepthState');
goog.require('gf.graphics.ProgramCache');
goog.require('gf.graphics.RasterizerState');
goog.require('gf.graphics.Resource');
goog.require('gf.graphics.SpriteBuffer');
goog.require('goog.asserts');
goog.require('goog.async.DeferredList');
goog.require('goog.vec.Vec3');
goog.require('goog.webgl');



/**
 * Graphics rendering state.
 *
 * TODO(benvanik): I don't like this - lines/sprites should be with their
 * buffers, not here where apps need to think about them... may need to move
 * some of render state down into gf...
 *
 * @constructor
 * @extends {gf.graphics.Resource}
 * @param {!gf.Runtime} runtime Current runtime.
 * @param {!gf.assets.AssetManager} assetManager Asset manager.
 * @param {!gf.graphics.GraphicsContext} graphicsContext Graphics context.
 */
blk.graphics.RenderState = function(runtime, assetManager, graphicsContext) {
  goog.base(this, graphicsContext);

  /**
   * Current mode.
   * @type {blk.graphics.RenderState.Mode}
   */
  this.mode = blk.graphics.RenderState.Mode.UNKNOWN;

  /**
   * Scene lighting information utility.
   * @type {!blk.graphics.RenderState.LightingInfo}
   */
  this.lightingInfo = new blk.graphics.RenderState.LightingInfo();

  /**
   * Program cache.
   * @private
   * @type {!gf.graphics.ProgramCache}
   */
  this.programCache_ = new gf.graphics.ProgramCache(graphicsContext);
  this.registerDisposable(this.programCache_);

  /**
   * Line program.
   * @type {!blk.assets.programs.LineProgram}
   */
  this.lineProgram = blk.assets.programs.LineProgram.create(
      assetManager, graphicsContext);
  this.programCache_.register(this.lineProgram);

  /**
   * Sprite program.
   * @type {!blk.assets.programs.SpriteProgram}
   */
  this.spriteProgram = blk.assets.programs.SpriteProgram.create(
      assetManager, graphicsContext);
  this.programCache_.register(this.spriteProgram);

  /**
   * Program used to render faces.
   * @type {!blk.assets.programs.FaceProgram}
   */
  this.faceProgram = blk.assets.programs.FaceProgram.create(
      assetManager, graphicsContext);
  this.programCache_.register(this.faceProgram);

  /**
   * Font.
   * @type {!blk.assets.fonts.MonospaceFont}
   */
  this.font = new blk.assets.fonts.MonospaceFont(
      runtime, assetManager, graphicsContext);
  this.registerDisposable(this.font);

  /**
   * Block texture atlas.
   * @type {!gf.graphics.Texture}
   */
  this.blockAtlas = blk.assets.blocksets.simple.create(
      assetManager, graphicsContext);
  this.registerDisposable(this.blockAtlas);
  this.blockAtlas.setFilteringMode(goog.webgl.NEAREST, goog.webgl.NEAREST);

  /**
   * UI texture atlas.
   * @type {!gf.graphics.Texture}
   */
  this.uiAtlas = blk.assets.textures.ui.create(
      assetManager, graphicsContext);
  this.uiAtlas.setFilteringMode(goog.webgl.NEAREST, goog.webgl.NEAREST);
  this.registerDisposable(this.uiAtlas);

  /**
   * Shared index buffer used for drawing sprites.
   * @private
   * @type {WebGLBuffer}
   */
  this.spriteIndexBuffer_ = null;

  /**
   * Shared index buffer used for drawing blocks.
   * @private
   * @type {WebGLBuffer}
   */
  this.blockIndexBuffer_ = null;

  /**
   * Shared block builder.
   * @type {!blk.graphics.BlockBuilder}
   */
  this.blockBuilder = new blk.graphics.BlockBuilder(this);
  this.registerDisposable(this.blockBuilder);
};
goog.inherits(blk.graphics.RenderState, gf.graphics.Resource);


/**
 * Performs the initial setup of the render state.
 * @return {!goog.async.Deferred} A deferred fulfilled when all render state is
 *     ready for use.
 */
blk.graphics.RenderState.prototype.setup = function() {
  // TODO(benvanik): wait for other textures/etc?
  var deferreds = [
    this.programCache_.setup()
  ];
  return new goog.async.DeferredList(deferreds);
};


/**
 * Creates a sprite buffer.
 * The returned sprite buffer must be disposed by the caller.
 * @return {!gf.graphics.SpriteBuffer} A new sprite buffer.
 */
blk.graphics.RenderState.prototype.createSpriteBuffer = function() {
  return new gf.graphics.SpriteBuffer(
      this.graphicsContext,
      /** @type {!gf.graphics.SpriteProgram} */ (this.spriteProgram));
};


/**
 * Cached rasterizer state.
 * @private
 * @type {!gf.graphics.RasterizerState}
 */
blk.graphics.RenderState.RASTERIZER_STATE_ = (function() {
  var state = new gf.graphics.RasterizerState();
  state.cullFaceEnabled = true;
  return state;
})();


/**
 * Render state mode.
 * @enum {number}
 */
blk.graphics.RenderState.Mode = {
  /**
   * Clean state, no current mode.
   */
  UNKNOWN: 0,
  /**
   * Chunk pass 1, set by {@see blk.graphics.RenderState#beginChunkPass1}.
   */
  CHUNK_PASS1: 2,
  /**
   * Chunk pass 2, set by {@see blk.graphics.RenderState#beginChunkPass2}.
   */
  CHUNK_PASS2: 3,
  /**
   * Line drawing mode, set by {@see blk.graphics.RenderState#beginLines}.
   */
  LINES: 4,
  /**
   * 2D sprites.
   */
  SPRITES: 5
};


/**
 * Cached blend state used for {@see blk.graphics.RenderState.Mode#CHUNK_PASS1}.
 * @private
 * @type {!gf.graphics.BlendState}
 */
blk.graphics.RenderState.BLEND_CHUNK_PASS1_ = (function() {
  var state = new gf.graphics.BlendState();
  return state;
})();


/**
 * Cached depth state used for {@see blk.graphics.RenderState.Mode#CHUNK_PASS1}.
 * @private
 * @type {!gf.graphics.DepthState}
 */
blk.graphics.RenderState.DEPTH_CHUNK_PASS1_ = (function() {
  var state = new gf.graphics.DepthState();
  state.depthTestEnabled = true;
  state.depthFunc = goog.webgl.LEQUAL;
  return state;
})();


/**
 * Cached blend state used for {@see blk.graphics.RenderState.Mode#CHUNK_PASS2}.
 * @private
 * @type {!gf.graphics.BlendState}
 */
blk.graphics.RenderState.BLEND_CHUNK_PASS2_ = (function() {
  var state = new gf.graphics.BlendState();
  return state;
})();


/**
 * Cached depth state used for {@see blk.graphics.RenderState.Mode#CHUNK_PASS2}.
 * @private
 * @type {!gf.graphics.DepthState}
 */
blk.graphics.RenderState.DEPTH_CHUNK_PASS2_ = (function() {
  var state = new gf.graphics.DepthState();
  state.depthTestEnabled = true;
  state.depthFunc = goog.webgl.LEQUAL;
  return state;
})();


/**
 * Cached blend state used for {@see blk.graphics.RenderState.Mode#LINES}.
 * @private
 * @type {!gf.graphics.BlendState}
 */
blk.graphics.RenderState.BLEND_LINES_ = (function() {
  var state = new gf.graphics.BlendState();
  return state;
})();


/**
 * Cached depth state used for {@see blk.graphics.RenderState.Mode#LINES}.
 * @private
 * @type {!gf.graphics.DepthState}
 */
blk.graphics.RenderState.DEPTH_LINES_ = (function() {
  var state = new gf.graphics.DepthState();
  state.depthTestEnabled = true;
  state.depthFunc = goog.webgl.LEQUAL;
  return state;
})();


/**
 * Cached blend state used for {@see blk.graphics.RenderState.Mode#SPRITES}.
 * @private
 * @type {!gf.graphics.BlendState}
 */
blk.graphics.RenderState.BLEND_SPRITES_ = (function() {
  var state = new gf.graphics.BlendState();
  return state;
})();


/**
 * Cached depth state used for {@see blk.graphics.RenderState.Mode#SPRITES}
 * when depth testing is enabled.
 * @private
 * @type {!gf.graphics.DepthState}
 */
blk.graphics.RenderState.DEPTH_ENABLED_SPRITES_ = (function() {
  var state = new gf.graphics.DepthState();
  state.depthTestEnabled = true;
  state.depthFunc = goog.webgl.LEQUAL;
  return state;
})();


/**
 * Cached depth state used for {@see blk.graphics.RenderState.Mode#SPRITES}
 * when depth testing is enabled.
 * @private
 * @type {!gf.graphics.DepthState}
 */
blk.graphics.RenderState.DEPTH_DISABLED_SPRITES_ = (function() {
  var state = new gf.graphics.DepthState();
  state.depthTestEnabled = false;
  state.depthFunc = goog.webgl.LEQUAL;
  return state;
})();


/**
 * @override
 */
blk.graphics.RenderState.prototype.discard = function() {
  var gl = this.graphicsContext.gl;

  gl.deleteBuffer(this.spriteIndexBuffer_);
  this.spriteIndexBuffer_ = null;

  gl.deleteBuffer(this.blockIndexBuffer_);
  this.blockIndexBuffer_ = null;
};


/**
 * @override
 */
blk.graphics.RenderState.prototype.restore = function() {
  var gl = this.graphicsContext.gl;
  goog.asserts.assert(gl);

  // Sprite indices
  goog.asserts.assert(!this.spriteIndexBuffer_);
  this.spriteIndexBuffer_ = gf.graphics.SpriteBuffer.createIndexBuffer(gl);

  // Face indices
  goog.asserts.assert(!this.blockIndexBuffer_);
  this.blockIndexBuffer_ = blk.graphics.BlockBuilder.createIndexBuffer(gl);
};


/**
 * Resets all render state, such at the beginning of a frame.
 * @param {!gf.vec.Viewport} viewport Viewport instance.
 * @param {!goog.vec.Vec4.Float32} clearColor RGBA color.
 * @param {boolean} clear True to clear the color buffer.
 */
blk.graphics.RenderState.prototype.reset = function(
    viewport, clearColor, clear) {
  var ctx = this.graphicsContext;
  var gl = ctx.getGL();

  ctx.setRasterizerState(blk.graphics.RenderState.RASTERIZER_STATE_);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
  gl.clearDepth(1);
  gl.clear(
      (clear ? goog.webgl.COLOR_BUFFER_BIT : 0) | goog.webgl.DEPTH_BUFFER_BIT);

  this.mode = blk.graphics.RenderState.Mode.UNKNOWN;
};


/**
 * Begins the chunk drawing pass 1 mode.
 */
blk.graphics.RenderState.prototype.beginChunkPass1 = function() {
  if (this.mode == blk.graphics.RenderState.Mode.CHUNK_PASS1) {
    return;
  }
  this.mode = blk.graphics.RenderState.Mode.CHUNK_PASS1;

  var ctx = this.graphicsContext;
  var gl = ctx.getGL();

  ctx.setBlendState(blk.graphics.RenderState.BLEND_CHUNK_PASS1_);
  ctx.setDepthState(blk.graphics.RenderState.DEPTH_CHUNK_PASS1_);

  ctx.setProgram(this.faceProgram);
  this.lightingInfo.setFaceUniforms(gl, this.faceProgram);

  // Texture atlas
  ctx.setTexture(0, this.blockAtlas);
  gl.uniform2f(this.faceProgram.u_texSize,
      this.blockAtlas.width, this.blockAtlas.height);

  // Index buffer used by face buffers
  gl.bindBuffer(goog.webgl.ELEMENT_ARRAY_BUFFER, this.blockIndexBuffer_);

  // TODO(benvanik): VAO
  gl.enableVertexAttribArray(0);
  gl.enableVertexAttribArray(1);
  gl.enableVertexAttribArray(2);
};


/**
 * Begins the chunk drawing pass 2 mode.
 */
blk.graphics.RenderState.prototype.beginChunkPass2 = function() {
  if (this.mode == blk.graphics.RenderState.Mode.CHUNK_PASS2) {
    return;
  }
  this.mode = blk.graphics.RenderState.Mode.CHUNK_PASS2;

  var ctx = this.graphicsContext;
  var gl = ctx.getGL();

  ctx.setBlendState(blk.graphics.RenderState.BLEND_CHUNK_PASS2_);
  ctx.setDepthState(blk.graphics.RenderState.DEPTH_CHUNK_PASS2_);

  ctx.setProgram(this.faceProgram);
  this.lightingInfo.setFaceUniforms(gl, this.faceProgram);

  // Texture atlas
  ctx.setTexture(0, this.blockAtlas);
  gl.uniform2f(this.faceProgram.u_texSize,
      this.blockAtlas.width, this.blockAtlas.height);

  // Index buffer used by face buffers
  gl.bindBuffer(goog.webgl.ELEMENT_ARRAY_BUFFER, this.blockIndexBuffer_);

  // TODO(benvanik): VAO
  gl.enableVertexAttribArray(0);
  gl.enableVertexAttribArray(1);
  gl.enableVertexAttribArray(2);
};


/**
 * Begins the line drawing mode.
 */
blk.graphics.RenderState.prototype.beginLines = function() {
  if (this.mode == blk.graphics.RenderState.Mode.LINES) {
    return;
  }
  this.mode = blk.graphics.RenderState.Mode.LINES;

  var ctx = this.graphicsContext;
  var gl = ctx.getGL();

  ctx.setBlendState(blk.graphics.RenderState.BLEND_LINES_);
  ctx.setDepthState(blk.graphics.RenderState.DEPTH_LINES_);

  ctx.setProgram(this.lineProgram);
  this.lightingInfo.setLineUniforms(gl, this.lineProgram);

  // TODO(benvanik): VAO
  gl.enableVertexAttribArray(0);
  gl.enableVertexAttribArray(1);
  gl.disableVertexAttribArray(2);
};


/**
 * Begins the sprite drawing mode.
 * @param {gf.graphics.Texture} atlas Texture atlas used for sprites.
 * @param {boolean} depthTest True to enable depth testing.
 */
blk.graphics.RenderState.prototype.beginSprites = function(atlas, depthTest) {
  this.mode = blk.graphics.RenderState.Mode.SPRITES;

  var ctx = this.graphicsContext;
  var gl = ctx.getGL();

  ctx.setBlendState(blk.graphics.RenderState.BLEND_SPRITES_);
  ctx.setDepthState(depthTest ?
      blk.graphics.RenderState.DEPTH_ENABLED_SPRITES_ :
      blk.graphics.RenderState.DEPTH_DISABLED_SPRITES_);

  ctx.setProgram(this.spriteProgram);

  // Texture atlas
  ctx.setTexture(0, atlas);

  // TODO(benvanik): VAO
  gl.bindBuffer(goog.webgl.ELEMENT_ARRAY_BUFFER, this.spriteIndexBuffer_);
  gl.enableVertexAttribArray(0);
  gl.enableVertexAttribArray(1);
  gl.enableVertexAttribArray(2);
};



/**
 * Lighting information.
 * @constructor
 */
blk.graphics.RenderState.LightingInfo = function() {
  /**
   * @type {!goog.vec.Vec3.Float32}
   */
  this.ambientLightColor = goog.vec.Vec3.createFloat32();

  /**
   * @type {!goog.vec.Vec3.Float32}
   */
  this.sunLightDirection = goog.vec.Vec3.createFloat32();

  /**
   * @type {!goog.vec.Vec3.Float32}
   */
  this.sunLightColor = goog.vec.Vec3.createFloat32();

  /**
   * @type {number}
   */
  this.fogNear = 0;

  /**
   * @type {number}
   */
  this.fogFar = 0;

  /**
   * @type {!goog.vec.Vec3.Float32}
   */
  this.fogColor = goog.vec.Vec3.createFloat32();

  /**
   * @private
   * @type {boolean}
   */
  this.lineUniformsDirty_ = true;

  /**
   * @private
   * @type {boolean}
   */
  this.faceUniformsDirty_ = true;
};


/**
 * Sets the lighting/fog parameters for the scene.
 * @param {!goog.vec.Vec3.Float32} ambientLightColor Ambient lighting color.
 * @param {!goog.vec.Vec3.Float32} sunLightDirection Normalized sun lighting
 *     direction vector.
 * @param {!goog.vec.Vec3.Float32} sunLightColor Sun lighting color.
 * @param {number} fogNear Fog near z value.
 * @param {number} fogFar Fog far z value.
 * @param {!goog.vec.Vec3.Float32} fogColor Fog color.
 */
blk.graphics.RenderState.LightingInfo.prototype.update = function(
    ambientLightColor,
    sunLightDirection, sunLightColor,
    fogNear, fogFar, fogColor) {
  var dirty = false;

  if (!goog.vec.Vec3.equals(this.ambientLightColor, ambientLightColor)) {
    goog.vec.Vec3.setFromArray(this.ambientLightColor, ambientLightColor);
    dirty = true;
  }

  if (!goog.vec.Vec3.equals(this.sunLightDirection, sunLightDirection) ||
      !goog.vec.Vec3.equals(this.sunLightColor, sunLightColor)) {
    goog.vec.Vec3.setFromArray(this.sunLightDirection, sunLightDirection);
    goog.vec.Vec3.setFromArray(this.sunLightColor, sunLightColor);
    dirty = true;
  }

  if (this.fogNear != fogNear ||
      this.fogFar != fogFar ||
      !goog.vec.Vec3.equals(this.fogColor, fogColor)) {
    this.fogNear = fogNear;
    this.fogFar = fogFar;
    goog.vec.Vec3.setFromArray(this.fogColor, fogColor);
    dirty = true;
  }

  if (dirty) {
    this.lineUniformsDirty_ = this.faceUniformsDirty_ = true;
  }
};


/**
 * Sets the uniforms on the line program, if required.
 * Assumes the program has already been set on the context.
 * @param {!WebGLRenderingContext} gl WebGL context.
 * @param {!blk.assets.programs.LineProgram} program Line program.
 */
blk.graphics.RenderState.LightingInfo.prototype.setLineUniforms =
    function(gl, program) {
  if (!this.lineUniformsDirty_) {
    return;
  }
  this.lineUniformsDirty_ = false;

  gl.uniform2f(
      program.u_fogInfo,
      this.fogNear,
      this.fogFar);
  gl.uniform3f(
      program.u_fogColor,
      this.fogColor[0],
      this.fogColor[1],
      this.fogColor[2]);
};


/**
 * Sets the uniforms on the face program, if required.
 * Assumes the program has already been set on the context.
 * @param {!WebGLRenderingContext} gl WebGL context.
 * @param {!blk.assets.programs.FaceProgram} program Face program.
 */
blk.graphics.RenderState.LightingInfo.prototype.setFaceUniforms =
    function(gl, program) {
  if (!this.faceUniformsDirty_) {
    return;
  }
  this.faceUniformsDirty_ = false;

  gl.uniform3f(
      program.u_ambientLightColor,
      this.ambientLightColor[0],
      this.ambientLightColor[1],
      this.ambientLightColor[2]);
  gl.uniform3f(
      program.u_sunLightDirection,
      this.sunLightDirection[0],
      this.sunLightDirection[1],
      this.sunLightDirection[2]);
  gl.uniform3f(
      program.u_sunLightColor,
      this.sunLightColor[0],
      this.sunLightColor[1],
      this.sunLightColor[2]);
  gl.uniform2f(
      program.u_fogInfo,
      this.fogNear,
      this.fogFar);
  gl.uniform3f(
      program.u_fogColor,
      this.fogColor[0],
      this.fogColor[1],
      this.fogColor[2]);
};
