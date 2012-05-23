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

goog.provide('blk.ui.PlayerListing');

goog.require('gf.graphics.SpriteBuffer');
goog.require('goog.Disposable');
goog.require('goog.vec.Mat4');
goog.require('goog.vec.Vec4');



/**
 * Player listing overlay.
 *
 * @constructor
 * @extends {goog.Disposable}
 * @param {!gf.graphics.GraphicsContext} graphicsContext Graphics context.
 * @param {!blk.graphics.RenderState} renderState Render state.
 * @param {!blk.GameState} gameState Game state.
 */
blk.ui.PlayerListing = function(graphicsContext, renderState, gameState) {
  goog.base(this);

  /**
   * Graphics context.
   * @type {!gf.graphics.GraphicsContext}
   */
  this.graphicsContext = graphicsContext;

  /**
   * Render state.
   * @type {!blk.graphics.RenderState}
   */
  this.renderState = renderState;

  /**
   * Font.
   * @type {!gf.graphics.BitmapFont}
   */
  this.font = this.renderState.font;

  /**
   * UI texture atlas.
   * @type {!gf.graphics.Texture}
   */
  this.uiAtlas = this.renderState.uiAtlas;

  /**
   * Game state.
   * @type {!blk.GameState}
   */
  this.gameState = gameState;

  /**
   * Sprite buffer used for text drawing.
   * @private
   * @type {!gf.graphics.SpriteBuffer}
   */
  this.textBuffer_ = this.renderState.createSpriteBuffer();
  this.registerDisposable(this.textBuffer_);

  /**
   * Sprite buffer used for UI drawing.
   * @private
   * @type {!gf.graphics.SpriteBuffer}
   */
  this.spriteBuffer_ = this.renderState.createSpriteBuffer();
  this.registerDisposable(this.spriteBuffer_);
};
goog.inherits(blk.ui.PlayerListing, goog.Disposable);


/**
 * Spacing between each line in the console.
 * @private
 * @const
 * @type {number}
 */
blk.ui.PlayerListing.LINE_SPACING_ = 2;


/**
 * Updates the console gameState.
 * @param {!gf.UpdateFrame} frame Current update frame.
 */
blk.ui.PlayerListing.prototype.update = function(frame) {
  // TODO(benvanik): expire messages, etc
};


/**
 * Renders the console.
 * @param {!gf.RenderFrame} frame Current render frame.
 * @param {!gf.vec.Viewport} viewport Current viewport.
 */
blk.ui.PlayerListing.prototype.render = function(frame, viewport) {
  var textBuffer = this.textBuffer_;
  textBuffer.clear();
  var spriteBuffer = this.spriteBuffer_;
  spriteBuffer.clear();

  var x = 0;
  var y = 0;

  var slotCoords = blk.ui.PlayerListing.tmpVec4_;

  for (var n = 0; n < this.gameState.players.length; n++) {
    var player = this.gameState.players[n];
    var userInfo = player.user.info;
    var name = userInfo.displayName + ' (' + player.user.sessionId + ')';
    var latency = player.user.statistics.averageLatency;

    // Name
    var wh = this.font.prepareString(textBuffer, name, player.color, x, y);

    // Lag meter
    // There are 5 meters, 0-4, with 0 being lowest and 4 being highest
    var lagSlot = 0;
    if (latency < 30) {
      lagSlot = 4;
    } else if (latency < 60) {
      lagSlot = 3;
    } else if (latency < 100) {
      lagSlot = 2;
    } else if (latency < 150) {
      lagSlot = 1;
    } else {
      lagSlot = 0;
    }
    this.uiAtlas.getSlotCoords(lagSlot, slotCoords);
    spriteBuffer.add(
        slotCoords[0], slotCoords[1],
        slotCoords[2] - slotCoords[0], slotCoords[3] - slotCoords[1],
        0xFFFFFFFF,
        x - 16, y, 16, 16);

    y += wh[1] + blk.ui.PlayerListing.LINE_SPACING_;
  }

  var worldMatrix = blk.ui.PlayerListing.tmpMat4_;
  goog.vec.Mat4.setFromValues(worldMatrix,
      2, 0, 0, 0,
      0, 2, 0, 0,
      0, 0, 1, 0,
      42, viewport.height - 60 - y, 0, 1);

  this.renderState.beginSprites(this.uiAtlas, false);
  spriteBuffer.draw(viewport.orthoMatrix, worldMatrix);

  this.renderState.beginSprites(this.font.atlas, false);

  // Draw shadow
  worldMatrix[12] += 2;
  worldMatrix[13] += 2;
  textBuffer.draw(viewport.orthoMatrix, worldMatrix,
      blk.ui.PlayerListing.shadowColor_);
  worldMatrix[12] -= 2;
  worldMatrix[13] -= 2;

  // Draw base text
  textBuffer.draw(viewport.orthoMatrix, worldMatrix);
};


/**
 * Temp vec4 for math.
 * @private
 * @type {!goog.vec.Vec4.Float32}
 */
blk.ui.PlayerListing.tmpVec4_ = goog.vec.Vec4.createFloat32();


/**
 * Temp mat4 for math.
 * @private
 * @type {!goog.vec.Mat4.Type}
 */
blk.ui.PlayerListing.tmpMat4_ = goog.vec.Mat4.createFloat32();


/**
 * Shadow color modulator.
 * @private
 * @type {!goog.vec.Vec4.Float32}
 */
blk.ui.PlayerListing.shadowColor_ =
    goog.vec.Vec4.createFloat32FromValues(0.5, 0.5, 0.5, 1);
