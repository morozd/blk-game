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

goog.provide('blk.env.ChunkView');

goog.require('blk.env.Chunk');
goog.require('blk.env.UpdatePriority');
goog.require('gf.vec.BoundingBox');
goog.require('gf.vec.Containment');
/** @suppress {extraRequire} */
goog.require('gf.vec.Viewport');
goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.math');
goog.require('goog.reflect');
goog.require('goog.vec.Vec3');
goog.require('WTF.trace');



/**
 * A view into the map.
 * Efficiently represents a region of chunks in the map and provides operators
 * to act against them. All viewports into the map receive a view, and the view
 * is maintained as a cubic region around them extending to their view range.
 *
 * @constructor
 * @extends {goog.Disposable}
 * @param {!blk.env.Map} map Parent map.
 * @param {number} chunkRadiusXZ Number of chunks on either side of the player.
 */
blk.env.ChunkView = function(map, chunkRadiusXZ) {
  goog.base(this);

  /**
   * Parent map.
   * @type {!blk.env.Map}
   */
  this.map = map;

  /**
   * Number of chunks on either side of the player, for XZ.
   * This value directly affects the amount of memory used by both client and
   * server per view/user. Try to keep it small.
   * Must be a power of two.
   * @private
   * @type {number}
   */
  this.chunkRadiusXZ_ = goog.math.clamp(
      Math.floor(chunkRadiusXZ),
      blk.env.ChunkView.MIN_CHUNK_RADIUS_XZ,
      blk.env.ChunkView.MAX_CHUNK_RADIUS_XZ);

  /**
   * Number of chunks on each side of the view cube.
   * This number should be odd such that the center point can always have
   * an equal number of chunks on either side of it.
   * @private
   * @type {number}
   */
  this.sizeXZ_ = this.chunkRadiusXZ_ * 2 + 1;

  /**
   * A cube of chunks.
   * All chunks in the cube are always initialized, however they may not always
   * be loaded.
   *
   * Chunks are addressed using
   *
   * @private
   * @type {!Array.<!blk.env.Chunk>}
   */
  this.chunks_ = new Array(
      this.sizeXZ_ * blk.env.ChunkView.SIZE_Y_ * this.sizeXZ_);

  /**
   * Current world offset of the center point of the view, in fractional
   * world coordinates. This is usually the eye position of the camera. It will
   * update frequently (every frame if moving) and is used to derive the
   * view offset.
   *
   * @type {!goog.vec.Vec3.Float32}
   */
  this.center = goog.vec.Vec3.createFloat32();

  /**
   * Current world offset of the center point of the view, in chunk coordinates.
   * These are world coordinates >> 4. All indexing into the chunk cube should
   * be based off of these values.
   *
   * @private
   * @type {!Int32Array}
   */
  this.chunkOffset_ = new Int32Array(3);

  /**
   * Axis-aligned bounding box representing the entire view cube, in world
   * coordinates.
   * @private
   * @type {!gf.vec.BoundingBox}
   */
  this.boundingBox_ = gf.vec.BoundingBox.createFromValues(
      this.center[0] - this.chunkRadiusXZ_ * blk.env.Chunk.SIZE_XZ,
      0,
      this.center[2] - this.chunkRadiusXZ_ * blk.env.Chunk.SIZE_XZ,
      this.center[0] + this.chunkRadiusXZ_ * blk.env.Chunk.SIZE_XZ,
      blk.env.Chunk.SIZE_Y,
      this.center[2] + this.chunkRadiusXZ_ * blk.env.Chunk.SIZE_XZ);

  /**
   * Chunk view observers.
   * @private
   * @type {!Array.<!blk.env.MapObserver>}
   */
  this.observers_ = [];

  /**
   * Whether the cube has been initialized.
   * @private
   * @type {boolean}
   */
  this.hasInitialized_ = false;
};
goog.inherits(blk.env.ChunkView, goog.Disposable);


/**
 * Low draw distance chunk radius.
 * @const
 * @type {number}
 */
blk.env.ChunkView.LOW_CHUNK_RADIUS_XZ = 8;


/**
 * High draw distance chunk radius.
 * Consumes a lot of memory.
 * @const
 * @type {number}
 */
blk.env.ChunkView.HIGH_CHUNK_RADIUS_XZ = 16;


/**
 * Minimum number of chunks on either side of the player, for XZ.
 * @const
 * @type {number}
 */
blk.env.ChunkView.MIN_CHUNK_RADIUS_XZ = 1;


/**
 * Maximum number of chunks on either side of the player, for XZ.
 * @const
 * @type {number}
 */
blk.env.ChunkView.MAX_CHUNK_RADIUS_XZ = 16;


/**
 * Number of chunks on each side of the view cube.
 * @private
 * @const
 * @type {number}
 */
blk.env.ChunkView.SIZE_Y_ = 1;


/**
 * @override
 */
blk.env.ChunkView.prototype.disposeInternal = function() {
  goog.disposeAll(this.observers_);
  goog.base(this, 'disposeInternal');
};


/**
 * Calculates an estimated draw distance, in world units.
 * @return {number} Draw distance.
 */
blk.env.ChunkView.prototype.getDrawDistance = function() {
  // TODO(benvanik): I'm sure there's a tighter approximation here
  return this.chunkRadiusXZ_ * blk.env.Chunk.SIZE_XZ + 16;
};


/**
 * Attaches an observer.
 * Observers will receive events pertaining to map changes.
 * @param {!blk.env.MapObserver} observer Observer to add.
 */
blk.env.ChunkView.prototype.addObserver = function(observer) {
  this.observers_.push(observer);
};


/**
 * Removes an observer.
 * The observer will not be disposed by this method.
 * @param {!blk.env.MapObserver} observer Observer to remove.
 */
blk.env.ChunkView.prototype.removeObserver = function(observer) {
  goog.array.remove(this.observers_, observer);
};


/**
 * Initializes the view at startup.
 * This must be called after observers are registered and before any other
 * methods are called.
 * @param {!goog.vec.Vec3.Float32} viewPosition Eye position, in
 *     world coordinates.
 */
blk.env.ChunkView.prototype.initialize = function(viewPosition) {
  goog.asserts.assert(!this.hasInitialized_);

  goog.vec.Vec3.setFromArray(this.center, viewPosition);

  this.rebuildCube_();

  this.hasInitialized_ = true;
};


/**
 * Updates the view and its contents.
 * @param {!goog.vec.Vec3.Float32} viewPosition Eye position, in
 *     world coordinates.
 */
blk.env.ChunkView.prototype.update = function(viewPosition) {
  goog.asserts.assert(this.hasInitialized_);

  // Update position, possibly rotating the chunk cube
  goog.vec.Vec3.setFromArray(this.center, viewPosition);
  var cx = viewPosition[0] >> blk.env.Chunk.SHIFT_XZ;
  var cz = viewPosition[2] >> blk.env.Chunk.SHIFT_XZ;
  var dx = cx - this.chunkOffset_[0];
  var dz = cz - this.chunkOffset_[2];
  if (dx || dz) {
    // Update bounding box
    var x = cx << blk.env.Chunk.SHIFT_XZ;
    var z = cz << blk.env.Chunk.SHIFT_XZ;
    gf.vec.BoundingBox.setFromValues(
        this.boundingBox_,
        x - this.chunkRadiusXZ_ * blk.env.Chunk.SIZE_XZ,
        0,
        z - this.chunkRadiusXZ_ * blk.env.Chunk.SIZE_XZ,
        x + this.chunkRadiusXZ_ * blk.env.Chunk.SIZE_XZ,
        0,
        z + this.chunkRadiusXZ_ * blk.env.Chunk.SIZE_XZ);
    this.boundingBox_.max[0] += blk.env.Chunk.SIZE_XZ;
    this.boundingBox_.max[1] += blk.env.Chunk.SIZE_Y;
    this.boundingBox_.max[2] += blk.env.Chunk.SIZE_XZ;

    // Rotate
    this.rotateCube_(dx, 0, dz);
  }
};


/**
 * Completely rebuilds the chunk cube.
 * @private
 */
blk.env.ChunkView.prototype.rebuildCube_ = function() {
  this.chunkOffset_[0] = this.center[0] >> blk.env.Chunk.SHIFT_XZ;
  this.chunkOffset_[1] = 0;
  this.chunkOffset_[2] = this.center[2] >> blk.env.Chunk.SHIFT_XZ;
  this.pullChunks_(
      this.chunkOffset_[0] - this.chunkRadiusXZ_,
      0,
      this.chunkOffset_[2] - this.chunkRadiusXZ_,
      this.sizeXZ_,
      blk.env.ChunkView.SIZE_Y_,
      this.sizeXZ_);
};


/**
 * Gets the index in the chunk list for the given chunk.
 * @private
 * @param {number} cx Chunk coordinate X.
 * @param {number} cy Chunk coordinate Y.
 * @param {number} cz Chunk coordinate Z.
 * @return {number} Index in the chunk cube.
 */
blk.env.ChunkView.prototype.getChunkIndex_ = function(cx, cy, cz) {
  goog.asserts.assert(cy == 0);

  // TODO(benvanik): faster math
  var cxm = (cx % this.sizeXZ_);
  var czm = (cz % this.sizeXZ_);
  if (cxm < 0) {
    cxm = this.sizeXZ_ + cxm;
  }
  if (czm < 0) {
    czm = this.sizeXZ_ + czm;
  }
  return cxm + czm * this.sizeXZ_;
};


/**
 * Sets a chunk to the latest value from the cache, replacing any old value if
 * required.
 * @private
 * @param {number} cx Chunk coordinate X.
 * @param {number} cy Chunk coordinate Y.
 * @param {number} cz Chunk coordinate Z.
 */
blk.env.ChunkView.prototype.pullChunk_ = function(cx, cy, cz) {
  var co = this.getChunkIndex_(cx, cy, cz);
  if (co < 0 || co > this.chunks_.length) {
    goog.asserts.fail('no!');
    return;
  }

  // Grab the new chunk first
  var chunk = this.map.getChunk(
      cx << blk.env.Chunk.SHIFT_XZ,
      cy << blk.env.Chunk.SHIFT_Y,
      cz << blk.env.Chunk.SHIFT_XZ);
  if (chunk == this.chunks_[co]) {
    // No change
    return;
  }

  // Unreference any old chunk
  var oldChunk = this.chunks_[co];
  if (oldChunk) {
    // Notify listeners
    for (var n = 0; n < this.observers_.length; n++) {
      this.observers_[n].chunkLeftView(oldChunk);
    }
    oldChunk.removeReference();
  }

  // Set
  chunk.addReference();
  this.chunks_[co] = chunk;

  // Notify listeners
  for (var n = 0; n < this.observers_.length; n++) {
    this.observers_[n].chunkEnteredView(chunk);
  }
};


/**
 * Sets all chunk values to the latest values from the cache.
 * @private
 * @param {number} cx Chunk coordinate X.
 * @param {number} cy Chunk coordinate Y.
 * @param {number} cz Chunk coordinate Z.
 * @param {number} dx Chunk coordinate delta X (number of chunks along X).
 * @param {number} dy Chunk coordinate delta Y (number of chunks along Y).
 * @param {number} dz Chunk coordinate delta Z (number of chunks along Z).
 */
blk.env.ChunkView.prototype.pullChunks_ = function(cx, cy, cz, dx, dy, dz) {
  for (var ix = cx; ix < cx + dx; ix++) {
    for (var iz = cz; iz < cz + dz; iz++) {
      this.pullChunk_(ix, 0, iz);
    }
  }
};


/**
 * Rotates the cube by updating the chunk offset and filling in the newly
 * exposed chunks.
 * @private
 * @param {number} dx Chunk coordinate delta X.
 * @param {number} dy Chunk coordinate delta Y.
 * @param {number} dz Chunk coordinate delta Z.
 */
blk.env.ChunkView.prototype.rotateCube_ = function(dx, dy, dz) {
  this.chunkOffset_[0] += dx;
  this.chunkOffset_[1] += dy;
  this.chunkOffset_[2] += dz;

  // TODO(benvanik): pullChunks_ on newly exposed regions
  this.rebuildCube_();
  // if (dx > 0) {
  //   // +x
  // } else if (dx < 0) {
  //   // -x
  // }
};


/**
 * Checks whether the given chunk is in the view.
 * @param {!blk.env.Chunk} chunk Chunk to check.
 * @return {boolean} True if the chunk is in the view.
 */
blk.env.ChunkView.prototype.containsChunk = function(chunk) {
  return gf.vec.BoundingBox.containsBoundingBox(
      this.boundingBox_, chunk.boundingBox) != gf.vec.Containment.OUTSIDE;
};


/**
 * Handles chunk load notifications.
 * @param {!blk.env.Chunk} chunk Chunk that loaded.
 */
blk.env.ChunkView.prototype.notifyChunkLoaded = function(chunk) {
  // Notify listeners
  for (var n = 0; n < this.observers_.length; n++) {
    // TODO(benvanik): only send one or the other?
    this.observers_[n].chunkLoaded(chunk);
    this.observers_[n].invalidateBlockRegion(
        chunk.x,
        chunk.y,
        chunk.z,
        chunk.x + blk.env.Chunk.SIZE_XZ - 1,
        chunk.y + blk.env.Chunk.SIZE_Y - 1,
        chunk.z + blk.env.Chunk.SIZE_XZ - 1,
        blk.env.UpdatePriority.LOAD);
  }
};


/**
 * Handles block change notifications.
 * @param {number} x World X.
 * @param {number} y World Y.
 * @param {number} z World Z.
 */
blk.env.ChunkView.prototype.notifyBlockChanged = function(x, y, z) {
  for (var n = 0; n < this.observers_.length; n++) {
    this.observers_[n].invalidateBlock(x, y, z, blk.env.UpdatePriority.ACTION);
  }
};


/**
 * Gets the chunk containing the given world position.
 * Note that the returned chunk may not be loaded yet, or if out of bounds will
 * be null.
 * @param {number} x World X.
 * @param {number} y World Y.
 * @param {number} z World Z.
 * @return {blk.env.Chunk} The chunk containing the position, if found.
 */
blk.env.ChunkView.prototype.getChunk = function(x, y, z) {
  if (y < 0 || y >= blk.env.Chunk.SIZE_Y) {
    return null;
  }
  var cx = x >> blk.env.Chunk.SHIFT_XZ;
  var cy = y >> blk.env.Chunk.SHIFT_Y;
  var cz = z >> blk.env.Chunk.SHIFT_XZ;
  goog.asserts.assert(cy == 0);
  var dx = Math.abs(cx - this.chunkOffset_[0]);
  var dz = Math.abs(cz - this.chunkOffset_[2]);
  if (dx > this.chunkRadiusXZ_ ||
      cy != 0 ||
      dz > this.chunkRadiusXZ_) {
    // Out of bounds
    return null;
  }

  var co = this.getChunkIndex_(cx, cy, cz);
  if (co < 0 || co > this.chunks_.length) {
    // Out of bounds
    return null;
  }
  var chunk = this.chunks_[co];
  goog.asserts.assert(
      chunk.x == cx << blk.env.Chunk.SHIFT_XZ &&
      chunk.y == cy << blk.env.Chunk.SHIFT_Y &&
      chunk.z == cz << blk.env.Chunk.SHIFT_XZ);

  return chunk;
};


/**
 * Enumerates all of the chunks in the view.
 * @param {!function(!blk.env.Chunk):void} fn Callback function.
 * @param {Object=} opt_obj Scope for the callback function.
 */
blk.env.ChunkView.prototype.forEachChunk = function(fn, opt_obj) {
  goog.array.forEach(this.chunks_, fn, opt_obj);
};


/**
 * Enumerates all of the chunks in the viewport.
 * @param {!gf.vec.Viewport} viewport Viewport.
 * @param {!function(!blk.env.Chunk):void} fn Callback function.
 * @param {Object=} opt_obj Scope for the callback function.
 */
blk.env.ChunkView.prototype.forEachInViewport =
    function(viewport, fn, opt_obj) {
  // TODO(benvanik): find something potentially more efficent - perhaps a
  //     3DDDA-esque approach?
  // Could use raycasting + some extra flags on chunks to do occlusion queries
  this.forEachInViewportRecursive_(
      viewport,
      this.chunkOffset_[0] - this.chunkRadiusXZ_,
      this.chunkOffset_[2] - this.chunkRadiusXZ_,
      this.sizeXZ_,
      fn, opt_obj);

  // This code is slow, but works
  // var aabb = blk.env.ChunkView.tmpAabb_;
  // var cx = this.chunkOffset_[0] - this.chunkRadiusXZ_;
  // var cz = this.chunkOffset_[2] - this.chunkRadiusXZ_;
  // gf.vec.BoundingBox.setFromValues(aabb,
  //     cx * blk.env.Chunk.SIZE_XZ,
  //     0,
  //     cz * blk.env.Chunk.SIZE_XZ,
  //     (cx + this.sizeXZ_) * blk.env.Chunk.SIZE_XZ,
  //     blk.env.Chunk.SIZE_Y,
  //     (cz + this.sizeXZ_) * blk.env.Chunk.SIZE_XZ);
  // this.forEachInBoundingBox(aabb, fn, opt_obj);
};


/**
 * Carefully constructed recursive walk, essentially treating the cube
 * like an octree. Reuses values and destroys the input.
 * @private
 * @param {!gf.vec.Viewport} viewport Viewport.
 * @param {number} cx Bounding min X, in chunks.
 * @param {number} cz Bounding min Z, in chunks.
 * @param {number} sizeXZ Bounding size, in chunks.
 * @param {!function(!blk.env.Chunk):void} fn Callback function.
 * @param {Object=} opt_obj Scope for the callback function.
 */
blk.env.ChunkView.prototype.forEachInViewportRecursive_ =
    function(viewport, cx, cz, sizeXZ, fn, opt_obj) {
  var aabb = blk.env.ChunkView.tmpAabb_;
  gf.vec.BoundingBox.setFromValues(aabb,
      cx * blk.env.Chunk.SIZE_XZ,
      0,
      cz * blk.env.Chunk.SIZE_XZ,
      (cx + sizeXZ) * blk.env.Chunk.SIZE_XZ,
      blk.env.Chunk.SIZE_Y,
      (cz + sizeXZ) * blk.env.Chunk.SIZE_XZ);
  var containment = viewport.containsBoundingBox(aabb);
  if (containment == gf.vec.Containment.INSIDE) {
    // AABB is entirely inside the view frustum, so draw all
    this.forEachInBoundingBox(aabb, fn, opt_obj);
  } else if (containment == gf.vec.Containment.PARTIAL) {
    // AABB partially intersects the view frustum, so keep dividing
    if (sizeXZ <= 1) {
      var chunk = this.getChunk(
          cx << blk.env.Chunk.SHIFT_XZ,
          0,
          cz << blk.env.Chunk.SHIFT_XZ);
      if (chunk) {
        fn.call(opt_obj, chunk);
      }
    } else {
      // For each octant, setup a new AABB and recurse
      var halfSizeXZ = (sizeXZ / 2) | 0;
      for (var z = 0; z <= 1; z++) {
        for (var x = 0; x <= 1; x++) {
          this.forEachInViewportRecursive_(
              viewport,
              cx + x * halfSizeXZ,
              cz + z * halfSizeXZ,
              halfSizeXZ,
              fn, opt_obj);
        }
      }
    }
  }
};


/**
 * Enumerates all of the chunks intersecting or contained within the given
 * bounding box.
 * @param {!gf.vec.BoundingBox} aabb Axis-aligned bounding box.
 * @param {!function(!blk.env.Chunk):void} fn Callback function.
 * @param {Object=} opt_obj Scope for the callback function.
 */
blk.env.ChunkView.prototype.forEachInBoundingBox = function(aabb, fn, opt_obj) {
  var minx = aabb.min[0] >> blk.env.Chunk.SHIFT_XZ;
  var maxx = aabb.max[0] >> blk.env.Chunk.SHIFT_XZ;
  var miny = aabb.min[1] >> blk.env.Chunk.SHIFT_Y;
  var maxy = aabb.max[1] >> blk.env.Chunk.SHIFT_Y;
  var minz = aabb.min[2] >> blk.env.Chunk.SHIFT_XZ;
  var maxz = aabb.max[2] >> blk.env.Chunk.SHIFT_XZ;
  for (var cz = minz; cz < maxz; cz++) {
    for (var cx = minx; cx < maxx; cx++) {
      var chunk = this.getChunk(
          cx << blk.env.Chunk.SHIFT_XZ,
          0,
          cz << blk.env.Chunk.SHIFT_XZ);
      if (chunk) {
        fn.call(opt_obj, chunk);
      }
    }
  }
};


/**
 * Casts a ray in the map and finds the first block that it intersects.
 * @param {!gf.vec.Ray.Type} ray Ray being cast.
 * @param {number} maxDistance Maximum search distance.
 * @return {blk.env.BlockIntersection} Information about the intersection, if
 *     one occurred.
 */
blk.env.ChunkView.prototype.intersectBlock = function(ray, maxDistance) {
  /** @type {blk.env.BlockIntersection} */
  var intersection = null;

  // 3D DDA for voxel search
  var x = Math.floor(ray[0]);
  var y = Math.floor(ray[1]);
  var z = Math.floor(ray[2]);
  var stepX = ray[3] == 0 ? 0 : (ray[3] < 0 ? -1 : 1);
  var stepY = ray[4] == 0 ? 0 : (ray[4] < 0 ? -1 : 1);
  var stepZ = ray[5] == 0 ? 0 : (ray[5] < 0 ? -1 : 1);
  var tMaxX = ((x + (stepX > 0 ? 1 : 0)) - ray[0]) / ray[3];
  var tMaxY = ((y + (stepY > 0 ? 1 : 0)) - ray[1]) / ray[4];
  var tMaxZ = ((z + (stepZ > 0 ? 1 : 0)) - ray[2]) / ray[5];
  if (isNaN(tMaxX)) { tMaxX = Number.POSITIVE_INFINITY; }
  if (isNaN(tMaxY)) { tMaxY = Number.POSITIVE_INFINITY; }
  if (isNaN(tMaxZ)) { tMaxZ = Number.POSITIVE_INFINITY; }
  var tDeltaX = stepX / ray[3];
  var tDeltaY = stepY / ray[4];
  var tDeltaZ = stepZ / ray[5];
  if (isNaN(tDeltaX)) { tDeltaX = Number.POSITIVE_INFINITY; }
  if (isNaN(tDeltaY)) { tDeltaY = Number.POSITIVE_INFINITY; }
  if (isNaN(tDeltaZ)) { tDeltaZ = Number.POSITIVE_INFINITY; }

  var maxDepth = Math.min(maxDistance, this.sizeXZ_ * blk.env.Chunk.SIZE_XZ);
  for (var n = 0; n < maxDepth; n++) {
    var chunk = this.getChunk(x, y, z);
    if (chunk) {
      intersection = chunk.intersectBlock(ray);
      if (intersection) {
        break;
      }
    }

    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      tMaxX += tDeltaX;
      x += stepX;
    } else if (tMaxY < tMaxZ) {
      tMaxY += tDeltaY;
      y += stepY;
    } else {
      tMaxZ += tDeltaZ;
      z += stepZ;
    }
  }

  if (intersection && intersection.distance > maxDistance) {
    return null;
  }
  return intersection;
};


/**
 * Gets the full 2-byte block data value for the given world coordinates.
 * @param {number} x Block X, in world coordinates.
 * @param {number} y Block Y, in world coordinates.
 * @param {number} z Block Z, in world coordinates.
 * @return {number} Raw 2-byte block data.
 */
blk.env.ChunkView.prototype.getBlock = function(x, y, z) {
  var chunk = this.getChunk(x, y, z);
  return chunk ? chunk.getBlock(x, y, z) : 0;
};


/**
 * Sets the full 2-byte block data value for the given world coordinates.
 * @param {number} x Block X, in world coordinates.
 * @param {number} y Block Y, in world coordinates.
 * @param {number} z Block Z, in world coordinates.
 * @param {number} value Raw 2-byte block data.
 * @return {boolean} True if the block data changed.
 */
blk.env.ChunkView.prototype.setBlock = function(x, y, z, value) {
  var chunk = this.getChunk(x, y, z);
  if (!chunk) {
    // This is technically a failure, it should be gracefully handled though
    return false;
  }

  if (!chunk.setBlock(x, y, z, value)) {
    return false;
  }

  // Notify listeners
  for (var n = 0; n < this.observers_.length; n++) {
    this.observers_[n].invalidateBlock(x, y, z, blk.env.UpdatePriority.ACTION);
  }
  return true;
};


/**
 * Fills or clears a region of blocks.
 *
 * TODO(benvanik): make this much faster - it's almost unusable
 *
 * @param {number} x World X.
 * @param {number} y World Y.
 * @param {number} z World Z.
 * @param {number} dx World fill width.
 * @param {number} dy World fill height.
 * @param {number} dz World fill depth.
 * @param {number} blockData Block data.
 */
blk.env.ChunkView.prototype.fillBlocks = function(x, y, z, dx, dy, dz,
    blockData) {
  // TODO(benvanik): massive optimizations to find subregions inside of chunks
  // and then fill from within the chunks
  for (var iy = y; iy < y + dy; iy++) {
    for (var ix = x; ix < x + dx; ix++) {
      for (var iz = z; iz < z + dz; iz++) {
        this.setBlock(ix, iy, iz, blockData);
      }
    }
  }
};


/**
 * Fills or clears a line of blocks.
 * @param {number} x0 Point 1 X.
 * @param {number} y0 Point 1 Y.
 * @param {number} z0 Point 1 Z.
 * @param {number} x1 Point 2 X.
 * @param {number} y1 Point 2 Y.
 * @param {number} z1 Point 2 Z.
 * @param {number} blockData Block data.
 */
blk.env.ChunkView.prototype.drawBlocks = function(x0, y0, z0, x1, y1, z1,
    blockData) {
  // http://www.xnawiki.com/index.php?title=Voxel_traversal

  var origin = goog.vec.Vec3.createFloat32FromValues(x0, y0, z0);
  var target = goog.vec.Vec3.createFloat32FromValues(x1, y1, z1);
  var maxDistance = goog.vec.Vec3.distance(origin, target);
  var dir = blk.env.ChunkView.tmpVec3_[0];
  goog.vec.Vec3.direction(origin, target, dir);
  var dirX = dir[0];
  var dirY = dir[1];
  var dirZ = dir[2];

  // Convert floats in block-space units
  var x = Math.floor(x0);
  var y = Math.floor(y0);
  var z = Math.floor(z0);

  // Direction
  var stepX = dirX == 0 ? 0 : (dirX < 0 ? -1 : 1);
  var stepY = dirY == 0 ? 0 : (dirY < 0 ? -1 : 1);
  var stepZ = dirZ == 0 ? 0 : (dirZ < 0 ? -1 : 1);

  // Calculate block boundary
  var boundX = x + (stepX > 0 ? 1 : 0);
  var boundY = y + (stepY > 0 ? 1 : 0);
  var boundZ = z + (stepZ > 0 ? 1 : 0);

  // Determine distance we can travel along the ray until a a boundary is hit
  var tMaxX = (boundX - x0) / dirX;
  var tMaxY = (boundY - y0) / dirY;
  var tMaxZ = (boundZ - z0) / dirZ;
  if (isNaN(tMaxX)) { tMaxX = Number.POSITIVE_INFINITY; }
  if (isNaN(tMaxY)) { tMaxY = Number.POSITIVE_INFINITY; }
  if (isNaN(tMaxZ)) { tMaxZ = Number.POSITIVE_INFINITY; }

  // Determine distance along the ray until in a new block
  var tDeltaX = stepX / dirX;
  var tDeltaY = stepY / dirY;
  var tDeltaZ = stepZ / dirZ;
  if (isNaN(tDeltaX)) { tDeltaX = Number.POSITIVE_INFINITY; }
  if (isNaN(tDeltaY)) { tDeltaY = Number.POSITIVE_INFINITY; }
  if (isNaN(tDeltaZ)) { tDeltaZ = Number.POSITIVE_INFINITY; }

  // Step, each time along the smallest distance
  var coord = blk.env.ChunkView.tmpVec3_[1];
  var maxDepth = this.sizeXZ_ * blk.env.Chunk.SIZE_XZ;
  for (var n = 0; n < maxDepth; n++) {
    // Emit at block location - all components should be integers
    this.setBlock(x, y, z, blockData);

    // See if we are past the end of the line and can stop drawing
    goog.vec.Vec3.setFromValues(coord, x, y, z);
    var distance = goog.vec.Vec3.distance(origin, coord);
    if (distance >= maxDistance) {
      break;
    }

    // Step
    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      x += stepX;
      tMaxX += tDeltaX;
    } else if (tMaxY < tMaxZ) {
      y += stepY;
      tMaxY += tDeltaY;
    } else {
      z += stepZ;
      tMaxZ += tDeltaZ;
    }
  }
};


/**
 * Temporary vec3s for math.
 * @private
 * @type {!Array.<!goog.vec.Vec3.Float32>}
 */
blk.env.ChunkView.tmpVec3_ = [
  goog.vec.Vec3.createFloat32(),
  goog.vec.Vec3.createFloat32()
];


/**
 * Temporary AABB for math.
 * @private
 * @type {!gf.vec.BoundingBox}
 */
blk.env.ChunkView.tmpAabb_ = gf.vec.BoundingBox.create();


blk.env.ChunkView = WTF.trace.instrumentType(
    blk.env.ChunkView, 'blk.env.ChunkView',
    goog.reflect.object(blk.env.ChunkView, {
      initialize: 'initialize',
      update: 'update',
      rebuildCube_: 'rebuildCube_',
      pullChunks_: 'pullChunks_',
      forEachChunk: 'forEachChunk',
      forEachInViewport: 'forEachInViewport'
    }));

