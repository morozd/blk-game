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

goog.provide('blk.env.client.ChunkRenderData');
goog.provide('blk.env.client.ViewManager');

goog.require('blk.env.Chunk');
goog.require('blk.env.MapObserver');
goog.require('blk.env.UpdatePriority');
goog.require('blk.env.client.BuildQueue');
goog.require('blk.env.client.EntityRenderer');
goog.require('blk.env.client.SegmentCache');
goog.require('blk.env.client.SegmentRenderer');
goog.require('gf.vec.Containment');
goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.async.Deferred');


/**
 * Per-chunk render data.
 * @typedef {{
 *   segments: !Array.<blk.env.client.SegmentRenderer>
 * }}
 */
blk.env.client.ChunkRenderData;



/**
 * Map renderer.
 * Handles rendering chunks and entities in the world.
 *
 * @constructor
 * @extends {goog.Disposable}
 * @implements {blk.env.MapObserver}
 * @param {!blk.graphics.RenderState} renderState Render state manager.
 * @param {!blk.env.Map} map Map to render.
 * @param {!blk.env.ChunkView} view Active view.
 */
blk.env.client.ViewManager = function(renderState, map, view) {
  goog.base(this);

  /**
   * Graphics context.
   * @type {!gf.graphics.GraphicsContext}
   */
  this.graphicsContext = renderState.graphicsContext;

  /**
   * Render state manager.
   * @type {!blk.graphics.RenderState}
   */
  this.renderState = renderState;

  /**
   * Map to render.
   * @type {!blk.env.Map}
   */
  this.map = map;

  /**
   * Active render view.
   * @type {!blk.env.ChunkView}
   */
  this.view = view;

  /**
   * Whether to enable debug visuals.
   * @type {boolean}
   */
  this.debugVisuals = false;

  /**
   * Chunk renderer cache.
   * @private
   * @type {!blk.env.client.SegmentCache}
   */
  this.segmentCache_ = new blk.env.client.SegmentCache();
  this.registerDisposable(this.segmentCache_);

  /**
   * A queue of chunks to build.
   * @private
   * @type {!blk.env.client.BuildQueue}
   */
  this.buildQueue_ = new blk.env.client.BuildQueue();
  this.registerDisposable(this.buildQueue_);

  /**
   * A list of deferreds waiting for the build queue to go idle.
   * @private
   * @type {!Array.<!goog.async.Deferred>}
   */
  this.idleDeferreds_ = [];

  /**
   * Number of visible chunks during the last render.
   * @private
   * @type {number}
   */
  this.lastVisibleChunkCount_ = 0;

  /**
   * Number of visible segments during the last render, for statistics.
   * @private
   * @type {number}
   */
  this.lastVisibleSegmentCount_ = 0;

  /**
   * The last viewport used for rendering. Do not preserve across renders.
   * @private
   * @type {gf.vec.Viewport}
   */
  this.lastViewport_ = null;

  /**
   * A scratch list of visible chunks. Do not preserve across renders.
   * @private
   * @type {!Array.<blk.env.Chunk>}
   */
  this.visibleChunkList_ = new Array(512);

  /**
   * Scratch list.
   * @private
   * @type {!Array.<blk.env.client.SegmentRenderer>}
   */
  this.visibleSegmentsPass1_ = new Array(1024);

  /**
   * Scratch list count.
   * @private
   * @type {number}
   */
  this.lastVisibleSegmentPass1Count_ = 0;

  /**
   * Scratch list.
   * @private
   * @type {!Array.<blk.env.client.SegmentRenderer>}
   */
  this.visibleSegmentsPass2_ = new Array(1024);

  /**
   * Scratch list count.
   * @private
   * @type {number}
   */
  this.lastVisibleSegmentPass2Count_ = 0;

  /**
   * The last frame number when rendering.
   * @private
   * @type {number}
   */
  this.lastFrameNumber_ = 0;

  // Tie to view
  this.view.addObserver(this);
};
goog.inherits(blk.env.client.ViewManager, goog.Disposable);


/**
 * @override
 */
blk.env.client.ViewManager.prototype.disposeInternal = function() {
  this.view.removeObserver(this);
  goog.base(this, 'disposeInternal');
};


/**
 * Toggles the debug visuals.
 * @param {boolean} value New value.
 */
blk.env.client.ViewManager.prototype.setDebugVisuals = function(value) {
  if (this.debugVisuals == value) {
    return;
  }
  this.debugVisuals = value;
  for (var n = 0; n < this.segmentCache_.list.length; n++) {
    var segment = this.segmentCache_.list[n];
    segment.setDebugVisuals(value);
  }
  var entities = this.map.entities;
  for (var n = 0; n < entities.length; n++) {
    var entity = entities[n];
    var entityRenderer = /** @type {blk.env.client.EntityRenderer} */ (
        entity.renderData);
    if (entityRenderer) {
      entityRenderer.setDebugVisuals(value);
    }
  }
};


/**
 * Get a statistics string to display.
 * @return {string} A string to display on the screen.
 */
blk.env.client.ViewManager.prototype.getStatisticsString = function() {
  var str = 'Render: ';
  str += this.segmentCache_.getCount() + ' cached (';
  str += Math.floor(this.segmentCache_.getSize() / 1000) + 'K), ';
  str += this.lastVisibleSegmentCount_ + ' visible, ';
  str += this.buildQueue_.getCount() + ' req';
  return str;
};


/**
 * @override
 */
blk.env.client.ViewManager.prototype.chunkLoaded = function(chunk) {
  this.ensureChunkRenderData_(chunk, blk.env.UpdatePriority.LOAD);
};


/**
 * @override
 */
blk.env.client.ViewManager.prototype.chunkEnteredView = function(chunk) {
  this.ensureChunkRenderData_(chunk, blk.env.UpdatePriority.LOAD);
};


/**
 * @override
 */
blk.env.client.ViewManager.prototype.chunkLeftView = function(chunk) {
  this.dropChunkRenderData_(chunk);
};


/**
 * Gets the render data for a chunk, creating if required.
 * @private
 * @param {!blk.env.Chunk} chunk Chunk.
 * @param {boolean=} opt_dontCreate Don't create if not present.
 * @return {blk.env.client.ChunkRenderData} Chunk render data.
 */
blk.env.client.ViewManager.prototype.getChunkRenderData_ = function(chunk,
    opt_dontCreate) {
  var renderData = /** @type {blk.env.client.ChunkRenderData} */ (
      chunk.renderData);
  if (!renderData && !opt_dontCreate) {
    renderData = {
      segments: new Array(blk.env.client.SegmentRenderer.SEGMENTS_Y)
    };
    chunk.renderData = renderData;
  }
  return renderData;
};


/**
 * Drops a chunk renderer and cancels any in-progress builds.
 * @private
 * @param {!blk.env.Chunk} chunk Chunk.
 */
blk.env.client.ViewManager.prototype.dropChunkRenderData_ = function(chunk) {
  var renderData = this.getChunkRenderData_(chunk, false);
  if (renderData) {
    for (var sy = 0; sy < renderData.segments.length; sy++) {
      var segment = renderData.segments[sy];
      if (segment) {
        if (segment.queuedForBuild) {
          this.buildQueue_.cancel(segment);
        }
        this.segmentCache_.remove(segment);
        goog.dispose(segment);
      }
    }
    chunk.renderData = null;
  }
};


/**
 * Ensures a chunk has a renderer and that it's up to date.
 * @private
 * @param {!blk.env.Chunk} chunk Chunk.
 * @param {blk.env.UpdatePriority} priority Load priority.
 */
blk.env.client.ViewManager.prototype.ensureChunkRenderData_ = function(chunk,
    priority) {
  if (!chunk.hasLoaded()) {
    return;
  }

  var renderData = this.getChunkRenderData_(chunk);
  goog.asserts.assert(renderData);
  for (var sy = 0; sy < renderData.segments.length; sy++) {
    var segment = renderData.segments[sy];
    if (!segment) {
      segment = new blk.env.client.SegmentRenderer(
          this, this.renderState, chunk,
          sy * blk.env.client.SegmentRenderer.SIZE);
      segment.setDebugVisuals(this.debugVisuals);
      renderData.segments[sy] = segment;
      this.segmentCache_.add(segment);
      this.buildQueue_.enqueue(segment, priority);
    }
  }
};


/**
 * @override
 */
blk.env.client.ViewManager.prototype.invalidateBlock =
    function(x, y, z, priority) {
  this.invalidateBlockRegion(x, y, z, x, y, z, priority);
};


/**
 * @override
 */
blk.env.client.ViewManager.prototype.invalidateBlockRegion =
    function(minX, minY, minZ, maxX, maxY, maxZ, priority) {
  // Adjust for neighbors
  minX--;
  minY--;
  minZ--;
  maxX++;
  maxY++;
  maxZ++;
  minX >>= blk.env.Chunk.SHIFT_XZ;
  minZ >>= blk.env.Chunk.SHIFT_XZ;
  maxX >>= blk.env.Chunk.SHIFT_XZ;
  maxZ >>= blk.env.Chunk.SHIFT_XZ;
  minY >>= blk.env.client.SegmentRenderer.SHIFT_Y;
  maxY >>= blk.env.client.SegmentRenderer.SHIFT_Y;
  for (var x = minX; x <= maxX; x++) {
    for (var z = minZ; z <= maxZ; z++) {
      for (var y = minY; y <= maxY; y++) {
        this.invalidateSegment(
            x << blk.env.Chunk.SHIFT_XZ,
            y << blk.env.client.SegmentRenderer.SHIFT_Y,
            z << blk.env.Chunk.SHIFT_XZ,
            priority);
      }
    }
  }
};


/**
 * Invalidates the chunk segment at the given coordinates.
 * @param {number} x Segment X, in world coordinates.
 * @param {number} y Segment Y, in world coordinates.
 * @param {number} z Segment Z, in world coordinates.
 * @param {blk.env.UpdatePriority} priority Update priority.
 */
blk.env.client.ViewManager.prototype.invalidateSegment = function(x, y, z,
    priority) {
  // TODO(benvanik): simple one chunk cache slot? most of these come in large
  // batches it seems
  var chunk = this.view.getChunk(x, y, z);
  if (!chunk) {
    return;
  }

  var renderData = this.getChunkRenderData_(chunk);
  var sy = y >> blk.env.client.SegmentRenderer.SHIFT_Y;
  goog.asserts.assert(
      sy >= 0 && sy < blk.env.client.SegmentRenderer.SEGMENTS_Y);

  // Create a renderer if needed
  var segment = renderData.segments[sy];
  if (!segment) {
    segment = new blk.env.client.SegmentRenderer(
        this, this.renderState, chunk,
        sy * blk.env.client.SegmentRenderer.SIZE);
    segment.setDebugVisuals(this.debugVisuals);
    renderData.segments[sy] = segment;
    this.segmentCache_.add(segment);
    this.buildQueue_.enqueue(segment, priority);
  }

  // Bump priority/dirty/queue for build
  if (!segment.dirty || segment.queuePriority != priority) {
    segment.invalidate();
    this.buildQueue_.enqueue(segment, priority);
  }
};


/**
 * Processes some entries in the build queue.
 * @private
 * @param {!gf.RenderFrame} frame Render frame.
 * @param {!gf.vec.Viewport} viewport Current viewport.
 */
blk.env.client.ViewManager.prototype.buildChunks_ = function(frame, viewport) {
  // Run the build queue logic
  var totalSizeDelta = this.buildQueue_.update(frame, viewport);

  // Ensure the cache size estimation stays up to date
  this.segmentCache_.adjustSize(totalSizeDelta);
};


/**
 * Returns a deferred that will fire when the build queue is idle.
 * @return {!goog.async.Deferred} Deferred fulfilled when the build queue is
 *     idle.
 */
blk.env.client.ViewManager.prototype.waitForBuildIdle = function() {
  var deferred = new goog.async.Deferred();
  this.idleDeferreds_.push(deferred);
  return deferred;
};


/**
 * Rebuild all chunks.
 */
blk.env.client.ViewManager.prototype.rebuildAll = function() {
  this.segmentCache_.resetSize();
  var segments = this.segmentCache_.list;
  for (var n = 0; n < segments.length; n++) {
    var segment = segments[n];
    segment.discard();
    segment.restore();
  }
};


/**
 * Renders the map.
 * @param {!gf.RenderFrame} frame Render frame.
 * @param {!gf.vec.Viewport} viewport Current viewport.
 * @param {blk.game.Player=} opt_localPlayer Local player, to prevent rendering.
 */
blk.env.client.ViewManager.prototype.render = function(frame, viewport,
    opt_localPlayer) {
  var graphicsContext = this.graphicsContext;
  var renderState = this.renderState;
  var map = this.map;

  // Find all chunks in the viewport
  this.lastViewport_ = viewport;
  this.lastVisibleChunkCount_ = 0;
  this.lastVisibleSegmentCount_ = 0;
  this.lastVisibleSegmentPass1Count_ = 0;
  this.lastVisibleSegmentPass2Count_ = 0;
  this.lastFrameNumber_ = frame.frameNumber;
  this.view.forEachInViewport(viewport, this.handleVisibleChunk_, this);
  // var visibleChunks = this.visibleChunkList_;
  // var visibleChunkCount = this.lastVisibleChunkCount_;

  // TODO(benvanik): visible entities list
  var visibleEntities = map.entities;
  for (var n = 0; n < visibleEntities.length; n++) {
    var entity = visibleEntities[n];
    var entityRenderer = /** @type {blk.env.client.EntityRenderer} */ (
        entity.renderData);
    if (!entityRenderer) {
      // Create renderer
      entityRenderer = new blk.env.client.EntityRenderer(this.renderState,
          entity);
      entityRenderer.setDebugVisuals(this.debugVisuals);
      // TODO(benvanik): cache/etc
    }
    entityRenderer.lastFrameInViewport = frame.frameNumber;
  }

  // Process a bit of the build queue
  // Must occur after segment visibility has been checked
  this.buildChunks_(frame, viewport);

  // If there are no pending build chunks, fire idle deferreds
  if (!this.buildQueue_.getCount() && this.idleDeferreds_.length) {
    for (var n = 0; n < this.idleDeferreds_.length; n++) {
      var deferred = this.idleDeferreds_[n];
      deferred.callback(null);
    }
    this.idleDeferreds_.length = 0;
  }

  var viewportFar = viewport.far - 16;
  var fogNear = viewportFar * 0.5;
  var fogFar = viewportFar * 0.85;
  renderState.lightingInfo.update(
      map.environment.ambientLightColor,
      map.environment.sunLightDirection, map.environment.sunLightColor,
      fogNear, fogFar, map.environment.fogColor);

  // Draw debug visuals
  if (this.debugVisuals) {
    renderState.beginLines();

    // Draw chunk debug visuals
    for (var n = 0; n < this.lastVisibleSegmentPass1Count_; n++) {
      var segment = this.visibleSegmentsPass1_[n];
      segment.renderDebug(frame, viewport);
    }

    // Draw entity debug visuals
    for (var n = 0; n < visibleEntities.length; n++) {
      var entity = visibleEntities[n];
      var entityRenderer = /** @type {blk.env.client.EntityRenderer} */ (
          entity.renderData);
      entityRenderer.renderDebug(frame, viewport);
    }
  }

  // Draw map chunks (pass 1)
  // Note that we clear the segment list so that we don't retain them forever
  if (this.lastVisibleSegmentPass1Count_) {
    renderState.beginChunkPass1();
    for (var n = 0; n < this.lastVisibleSegmentPass1Count_; n++) {
      var segment = this.visibleSegmentsPass1_[n];
      segment.render(frame, viewport);
      this.visibleSegmentsPass1_[n] = null;
    }
  }

  // Draw map chunks (pass 2)
  if (this.lastVisibleSegmentPass2Count_) {
    renderState.beginChunkPass2();
    for (var n = 0; n < this.lastVisibleSegmentPass2Count_; n++) {
      var segment = this.visibleSegmentsPass2_[n];
      segment.render(frame, viewport);
      this.visibleSegmentsPass2_[n] = null;
    }
  }

  // Draw entities
  renderState.beginEntities();
  // TODO(benvanik): switch to player skin cache/etc
  for (var n = 0; n < visibleEntities.length; n++) {
    var entity = visibleEntities[n];
    if (entity.player == opt_localPlayer) {
      continue;
    }
    var entityRenderer = /** @type {blk.env.client.EntityRenderer} */ (
        entity.renderData);
    entityRenderer.render(frame, viewport);
  }

  // Draw entity adorners
  renderState.beginSprites(this.renderState.font.atlas, true);
  for (var n = 0; n < visibleEntities.length; n++) {
    var entity = visibleEntities[n];
    if (entity.player == opt_localPlayer) {
      continue;
    }
    var entityRenderer = /** @type {blk.env.client.EntityRenderer} */ (
        entity.renderData);
    entityRenderer.renderAdorners(frame, viewport);
  }
};


/**
 * Handles visible chunks by adding them to the active render list.
 * @private
 * @param {!blk.env.Chunk} chunk Chunk.
 */
blk.env.client.ViewManager.prototype.handleVisibleChunk_ = function(chunk) {
  this.visibleChunkList_[this.lastVisibleChunkCount_++] = chunk;

  var renderData = this.getChunkRenderData_(chunk);
  goog.asserts.assert(renderData);
  for (var sy = 0; sy < blk.env.client.SegmentRenderer.SEGMENTS_Y; sy++) {
    var segment = renderData.segments[sy];
    if (segment) {
      // Quick check - will include false positives, but shouldn't have false
      // negatives and be faster than AABB checks
      if (this.lastViewport_.containsBoundingSphere(segment.boundingSphere) ==
          gf.vec.Containment.OUTSIDE) {
        continue;
      }

      // Ignore if no contents
      if (!segment.hasData()) {
        continue;
      }

      // Promote segments that were at a lower priority
      if (segment.queuedForBuild &&
          segment.queuePriority > blk.env.UpdatePriority.VISIBLE) {
        this.buildQueue_.enqueue(segment, blk.env.UpdatePriority.VISIBLE);
      }

      segment.lastFrameInViewport = this.lastFrameNumber_;
      this.lastVisibleSegmentCount_++;
      this.visibleSegmentsPass1_[this.lastVisibleSegmentPass1Count_++] =
          segment;
      // this.visibleSegmentsPass2_[this.lastVisibleSegmentPass2Count_++] =
      //     segment;
    }
  }
};
