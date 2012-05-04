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

goog.provide('blk.env.client.BaseRenderer');

goog.require('blk.graphics.LineBuffer');
goog.require('gf.graphics.Resource');
goog.require('gf.vec.BoundingBox');



/**
 * Base renderer type.
 *
 * @constructor
 * @extends {gf.graphics.Resource}
 * @param {!blk.graphics.RenderState} renderState Render state manager.
 */
blk.env.client.BaseRenderer = function(renderState) {
  goog.base(this, renderState.graphicsContext);

  /**
   * Render state manager.
   * @type {!blk.graphics.RenderState}
   */
  this.renderState = renderState;

  /**
   * Bounding box.
   * @type {!gf.vec.BoundingBox}
   */
  this.boundingBox = gf.vec.BoundingBox.create();

  /**
   * Estimated number of bytes used by the renderer.
   * @type {number}
   */
  this.estimatedSize = 0;

  /**
   * Whether to enable debug visuals.
   * @private
   * @type {boolean}
   */
  this.debugVisuals_ = false;

  /**
   * Debug line buffer. Only initialzed in debug mode.
   * @protected
   * @type {blk.graphics.LineBuffer}
   */
  this.debugLineBuffer = null;

  /**
   * The last frame number that the renderer was visible in the viewport.
   * @type {number}
   */
  this.lastFrameInViewport = 0;
};
goog.inherits(blk.env.client.BaseRenderer, gf.graphics.Resource);


/**
 * @override
 */
blk.env.client.BaseRenderer.prototype.disposeInternal = function() {
  this.setDebugVisuals(false);

  goog.base(this, 'disposeInternal');
};


/**
 * @override
 */
blk.env.client.BaseRenderer.prototype.discard = function() {
  if (this.debugLineBuffer) {
    goog.dispose(this.debugLineBuffer);
    this.debugLineBuffer = null;
  }
};


/**
 * @override
 */
blk.env.client.BaseRenderer.prototype.restore = function() {
  if (this.debugVisuals_) {
    this.setDebugVisuals(false);
    this.setDebugVisuals(true);
  }
};


/**
 * Toggles the debug visuals.
 * @param {boolean} value New value.
 */
blk.env.client.BaseRenderer.prototype.setDebugVisuals = function(value) {
  if (this.debugVisuals_ == value) {
    return;
  }
  this.debugVisuals_ = value;
  if (value) {
    // Create
    this.debugLineBuffer = new blk.graphics.LineBuffer(
        this.graphicsContext);
    this.addDebugVisuals(this.debugLineBuffer);
  } else {
    // Drop
    goog.dispose(this.debugLineBuffer);
    this.debugLineBuffer = null;
  }
};


/**
 * Adds debug visuals to the line buffer.
 * @protected
 * @param {!blk.graphics.LineBuffer} buffer Line buffer.
 */
blk.env.client.BaseRenderer.prototype.addDebugVisuals = goog.nullFunction;


/**
 * Renders the item, if needed.
 * @param {!gf.RenderFrame} frame Current render frame.
 * @param {!gf.vec.Viewport} viewport Current viewport.
 */
blk.env.client.BaseRenderer.prototype.render = goog.abstractMethod;


/**
 * Renders debug visuals.
 * @param {!gf.RenderFrame} frame Current render frame.
 * @param {!gf.vec.Viewport} viewport Current viewport.
 */
blk.env.client.BaseRenderer.prototype.renderDebug = goog.nullFunction;
