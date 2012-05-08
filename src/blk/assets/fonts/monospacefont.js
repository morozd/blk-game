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

goog.provide('blk.assets.fonts.MonospaceFont');

goog.require('gf');
goog.require('gf.assets.DataSource');
goog.require('gf.graphics.BitmapFont');
goog.require('gf.graphics.ImageInfo');
goog.require('gf.graphics.LoadableTexture');
goog.require('goog.webgl');



/**
 * Monospace font.
 *
 * TODO(benvanik): font content pipeline tasks, code-gen this.
 *
 * @constructor
 * @extends {gf.graphics.BitmapFont}
 * @param {!gf.Runtime} runtime Current runtime.
 * @param {!gf.assets.AssetManager} assetManager Asset manager.
 * @param {!gf.graphics.GraphicsContext} context Graphics context.
 */
blk.assets.fonts.MonospaceFont = function(runtime, assetManager, context) {
  // Setup atlas
  var imageInfo = new gf.graphics.ImageInfo(128, 128, 15, [[
    new gf.assets.DataSource(
        'image/png',
        'monospace.png',
        1256)]]);
  var atlas = new gf.graphics.LoadableTexture(
      assetManager,
      context,
      gf.BIN_PATH + 'assets/fonts',
      'monospace',
      imageInfo);
  atlas.setupUniformSlots(8, 8);
  atlas.setFilteringMode(goog.webgl.NEAREST, goog.webgl.NEAREST);
  atlas.load();

  // Really prepare the font
  goog.base(this, context, atlas, 8,
      blk.assets.fonts.MonospaceFont.glyphs_);

  this.registerDisposable(atlas);
};
goog.inherits(blk.assets.fonts.MonospaceFont, gf.graphics.BitmapFont);


/**
 * Font glyph data.
 * @private
 * @type {!Array.<number|string>}
 */
blk.assets.fonts.MonospaceFont.glyphs_ = [
  0, 0, 8, 0,
  1, 0, 8, 0,
  2, 0, 8, 0,
  3, 0, 8, 0,
  4, 0, 8, 0,
  5, 0, 8, 0,
  6, 0, 8, 0,
  7, 0, 8, 0,
  8, 0, 8, 0,
  9, 0, 8, 0,
  10, 0, 8, 0,
  11, 0, 8, 0,
  12, 0, 8, 0,
  13, 0, 8, 0,
  14, 0, 8, 0,
  15, 0, 8, 0,
  16, 0, 8, 0,
  17, 0, 8, 0,
  18, 0, 8, 0,
  19, 0, 8, 0,
  20, 0, 8, 0,
  21, 0, 8, 0,
  22, 0, 8, 0,
  23, 0, 8, 0,
  24, 0, 8, 0,
  25, 0, 8, 0,
  26, 0, 8, 0,
  27, 0, 8, 0,
  28, 0, 8, 0,
  29, 0, 8, 0,
  30, 0, 8, 0,
  31, 0, 8, 0,
  ' ', 0, 8, 0,
  '!', 0, 8, 0,
  '"', 0, 8, 0,
  '#', 0, 8, 0,
  '$', 0, 8, 0,
  '%', 0, 8, 0,
  '&', 0, 8, 0,
  '\'', 0, 8, 0,
  '(', 0, 8, 0,
  ')', 0, 8, 0,
  '*', 0, 8, 0,
  '+', 0, 8, 0,
  ',', 0, 8, 0,
  '-', 0, 8, 0,
  '.', 0, 8, 0,
  '/', 0, 8, 0,
  '0', 0, 8, 0,
  '1', 0, 8, 0,
  '2', 0, 8, 0,
  '3', 0, 8, 0,
  '4', 0, 8, 0,
  '5', 0, 8, 0,
  '6', 0, 8, 0,
  '7', 0, 8, 0,
  '8', 0, 8, 0,
  '9', 0, 8, 0,
  ':', 0, 8, 0,
  ';', 0, 8, 0,
  '<', 0, 8, 0,
  '=', 0, 8, 0,
  '>', 0, 8, 0,
  '?', 0, 8, 0,
  '@', 0, 8, 0,
  'A', 0, 8, 0,
  'B', 0, 8, 0,
  'C', 0, 8, 0,
  'D', 0, 8, 0,
  'E', 0, 8, 0,
  'F', 0, 8, 0,
  'G', 0, 8, 0,
  'H', 0, 8, 0,
  'I', 0, 8, 0,
  'J', 0, 8, 0,
  'K', 0, 8, 0,
  'L', 0, 8, 0,
  'M', 0, 8, 0,
  'N', 0, 8, 0,
  'O', 0, 8, 0,
  'P', 0, 8, 0,
  'Q', 0, 8, 0,
  'R', 0, 8, 0,
  'S', 0, 8, 0,
  'T', 0, 8, 0,
  'U', 0, 8, 0,
  'V', 0, 8, 0,
  'W', 0, 8, 0,
  'X', 0, 8, 0,
  'Y', 0, 8, 0,
  'Z', 0, 8, 0,
  '[', 0, 8, 0,
  '\\', 0, 8, 0,
  ']', 0, 8, 0,
  '^', 0, 8, 0,
  '_', 0, 8, 0,
  '`', 0, 8, 0,
  'a', 0, 8, 0,
  'b', 0, 8, 0,
  'c', 0, 8, 0,
  'd', 0, 8, 0,
  'e', 0, 8, 0,
  'f', 0, 8, 0,
  'g', 0, 8, 0,
  'h', 0, 8, 0,
  'i', 0, 8, 0,
  'j', 0, 8, 0,
  'k', 0, 8, 0,
  'l', 0, 8, 0,
  'm', 0, 8, 0,
  'n', 0, 8, 0,
  'o', 0, 8, 0,
  'p', 0, 8, 0,
  'q', 0, 8, 0,
  'r', 0, 8, 0,
  's', 0, 8, 0,
  't', 0, 8, 0,
  'u', 0, 8, 0,
  'v', 0, 8, 0,
  'w', 0, 8, 0,
  'x', 0, 8, 0,
  'y', 0, 8, 0,
  'z', 0, 8, 0,
  '{', 0, 8, 0,
  '|', 0, 8, 0,
  '}', 0, 8, 0,
  '~', 0, 8, 0,
  '⌂', 0, 8, 0,
  'Ç', 0, 8, 0,
  'ü', 0, 8, 0,
  'é', 0, 8, 0,
  'â', 0, 8, 0,
  'ä', 0, 8, 0,
  'à', 0, 8, 0,
  'å', 0, 8, 0,
  'ç', 0, 8, 0,
  'ê', 0, 8, 0,
  'ë', 0, 8, 0,
  'è', 0, 8, 0,
  'ï', 0, 8, 0,
  'î', 0, 8, 0,
  'ì', 0, 8, 0,
  'Ä', 0, 8, 0,
  'Å', 0, 8, 0,
  'É', 0, 8, 0,
  'æ', 0, 8, 0,
  'Æ', 0, 8, 0,
  'ô', 0, 8, 0,
  'ö', 0, 8, 0,
  'ò', 0, 8, 0,
  'û', 0, 8, 0,
  'ù', 0, 8, 0,
  'ÿ', 0, 8, 0,
  'Ö', 0, 8, 0,
  'Ü', 0, 8, 0,
  'ø', 0, 8, 0,
  '£', 0, 8, 0,
  'Ø', 0, 8, 0,
  '×', 0, 8, 0,
  'ƒ', 0, 8, 0,
  'á', 0, 8, 0,
  'í', 0, 8, 0,
  'ó', 0, 8, 0,
  'ú', 0, 8, 0,
  'ñ', 0, 8, 0,
  'Ñ', 0, 8, 0,
  'ª', 0, 8, 0,
  'º', 0, 8, 0,
  '¿', 0, 8, 0,
  '®', 0, 8, 0,
  '¬', 0, 8, 0,
  '½', 0, 8, 0,
  '¼', 0, 8, 0,
  '¡', 0, 8, 0,
  '«', 0, 8, 0,
  '»', 0, 5, 0
];
