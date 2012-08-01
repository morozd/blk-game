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

goog.provide('blk.assets.models.BaseRenderLibrary');

goog.require('blk.assets.models.pumpkin');
goog.require('blk.assets.models.renderpumpkin');
goog.require('gf.mdl.RenderLibrary');



/**
 * Base model render library.
 *
 * @constructor
 * @extends {gf.mdl.RenderLibrary}
 * @param {!gf.assets.AssetManager} assetManager Asset manager.
 * @param {!gf.graphics.GraphicsContext} graphicsContext Graphics context.
 */
blk.assets.models.BaseRenderLibrary = function(assetManager, graphicsContext) {
  goog.base(this, assetManager, graphicsContext);

  this.registerModelType(
      blk.assets.models.pumpkin.ID,
      blk.assets.models.renderpumpkin.create);
};
goog.inherits(blk.assets.models.BaseRenderLibrary, gf.mdl.RenderLibrary);
