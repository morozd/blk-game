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

goog.provide('blk.env.Chunk');

goog.require('blk.env.BlockIntersection');
goog.require('gf.vec.BoundingBox');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.vec.Vec3');



/**
 * A chunk of blocks in the map.
 * Chunks start unloaded and must be loaded before they can be used.
 *
 * @constructor
 * @param {!blk.env.Map} map Map.
 * @param {number} x World X.
 * @param {number} y World Y.
 * @param {number} z World Z.
 */
blk.env.Chunk = function(map, x, y, z) {
  /**
   * Map.
   * @type {!blk.env.Map}
   */
  this.map = map;

  /**
   * Chunk X, in world units.
   * @type {number}
   */
  this.x = x;

  /**
   * Chunk Y, in world units.
   * @type {number}
   */
  this.y = y;

  /**
   * Chunk Z, in world units.
   * @type {number}
   */
  this.z = z;

  /**
   * Axis-aligned bounding box of the chunk.
   * @type {!gf.vec.BoundingBox}
   */
  this.boundingBox = gf.vec.BoundingBox.createFromValues(
      x, y, z,
      x + blk.env.Chunk.SIZE_XZ,
      y + blk.env.Chunk.SIZE_Y,
      z + blk.env.Chunk.SIZE_XZ);

  /**
   * Chunk state.
   * @type {blk.env.Chunk.State}
   */
  this.state = blk.env.Chunk.State.UNLOADED;

  /**
   * Whether the chunk has been modified since it was last saved.
   * @private
   * @type {boolean}
   */
  this.dirty_ = true;

  /**
   * The number of chunk views referencing this chunk.
   * @private
   * @type {number}
   */
  this.referenceCount_ = 0;

  /**
   * Version number.
   * @type {number}
   */
  this.version = 0;

  /**
   * Block data.
   * A tightly packed 3 dimensional array of uniform size.
   * Layout is x, z, y, which means it's faster to traverse xz
   *
   * Each block is of the format:
   * - byte: index into block set (0 is air)
   * - byte: block attributes (blk.env.BlockAttr)
   *
   * @type {!Uint16Array}
   */
  this.blockData = new Uint16Array(blk.env.Chunk.TOTAL_BLOCKS);

  /**
   * Serialized data of the chunk.
   * This is a cache - the server will keep the serialized form here
   * to send out to clients or write to disk.
   * This should be cleared when the chunk is modified.
   * @type {ArrayBuffer}
   */
  this.serializedData = null;

  /**
   * Render data stash.
   * @type {Object}
   */
  this.renderData = null;
};


/**
 * Chunk state.
 * @enum {number}
 */
blk.env.Chunk.State = {
  /**
   * Chunk is not currently loaded.
   * No chunk data should be used - this chunk is just a placeholder.
   */
  UNLOADED: 0,

  /**
   * Chunk is loading.
   * The chunk has either been requested from the server or generator and will
   * be populated soon. Don't use the data yet.
   */
  LOADING: 1,

  /**
   * Chunk is loaded.
   */
  LOADED: 2
};


/**
 * Number of blocks per chunk along the x and z dimensions.
 * Must be a power of two.
 * @const
 * @type {number}
 */
blk.env.Chunk.SIZE_XZ = 16;


/**
 * Bit shift for XZ.
 * @const
 * @type {number}
 */
blk.env.Chunk.SHIFT_XZ = 4;


/**
 * Bit mask for XZ.
 * @const
 * @type {number}
 */
blk.env.Chunk.MASK_XZ = 0xF;


/**
 * Number of blocks per chunk along the y dimension.
 * Must be a power of two.
 * @const
 * @type {number}
 */
blk.env.Chunk.SIZE_Y = 128;


/**
 * Bit shift for Y.
 * @const
 * @type {number}
 */
blk.env.Chunk.SHIFT_Y = 7;


/**
 * Bit mask for Y.
 * @const
 * @type {number}
 */
blk.env.Chunk.MASK_Y = 0x7F;


/**
 * SIZE squared.
 * @const
 * @type {number}
 */
blk.env.Chunk.SIZE_SQ =
    blk.env.Chunk.SIZE_XZ * blk.env.Chunk.SIZE_XZ;


/**
 * Stride of XZ, in blocks.
 * @const
 * @type {number}
 */
blk.env.Chunk.STRIDE_Y = blk.env.Chunk.SIZE_XZ * blk.env.Chunk.SIZE_XZ;


/**
 * Stride of Z, in blocks.
 * @const
 * @type {number}
 */
blk.env.Chunk.STRIDE_Z = blk.env.Chunk.SIZE_XZ;


/**
 * Total number of blocks in a chunk (SIZE ^ 3).
 * @const
 * @type {number}
 */
blk.env.Chunk.TOTAL_BLOCKS =
    blk.env.Chunk.SIZE_XZ * blk.env.Chunk.SIZE_Y * blk.env.Chunk.SIZE_XZ;


/**
 * Estimated size, in bytes, of a chunk.
 * @const
 * @type {number}
 */
blk.env.Chunk.ESTIMATED_SIZE =
    blk.env.Chunk.TOTAL_BLOCKS * 2 + 256;


/**
 * Adds a reference to the chunk when it is in use.
 */
blk.env.Chunk.prototype.addReference = function() {
  if (!this.referenceCount_) {
    this.map.markChunkUsed(this);
  }
  this.referenceCount_++;
};


/**
 * Removes a reference to the chunk when it is no longer in use.
 */
blk.env.Chunk.prototype.removeReference = function() {
  goog.asserts.assert(this.referenceCount_);
  this.referenceCount_--;
  if (!this.referenceCount_) {
    this.map.markChunkUnused(this);
  }
};


/**
 * @return {boolean} True if the chunk has references.
 */
blk.env.Chunk.prototype.hasReferences = function() {
  return this.referenceCount_ > 0;
};


/**
 * @return {boolean} True if the chunk has loaded.
 */
blk.env.Chunk.prototype.hasLoaded = function() {
  return this.state == blk.env.Chunk.State.LOADED;
};


/**
 * Whether the chunk has been modified since last being saved.
 * @return {boolean} True if the chunk is dirty.
 */
blk.env.Chunk.prototype.isDirty = function() {
  return this.dirty_;
};


/**
 * Marks the chunk as dirty and requiring a save.
 */
blk.env.Chunk.prototype.markDirty = function() {
  var wasDirty = this.dirty_;
  this.dirty_ = true;
  this.serializedData = null;
  if (!wasDirty) {
    // Newly dirty
    this.map.addDirtyChunk(this);
  }
};


/**
 * Clears the dirty flag of the chunk.
 */
blk.env.Chunk.prototype.clearDirty = function() {
  this.dirty_ = false;
};


/**
 * Fills a chunk with the given block data from a generator and fires events.
 * @param {!Uint16Array} blockData Block data. Copied in and not modified.
 */
blk.env.Chunk.prototype.fill = function(blockData) {
  for (var n = 0; n < blk.env.Chunk.TOTAL_BLOCKS; n++) {
    this.blockData[n] = blockData[n];
  }

  // Setup state
  this.dirty_ = true;
  this.state = blk.env.Chunk.State.LOADED;
  this.map.notifyChunkLoaded(this);
  this.map.addDirtyChunk(this);
};


/**
 * Begins the chunk load operation.
 * @param {number} x Chunk X, in world coordinates.
 * @param {number} y Chunk Y, in world coordinates.
 * @param {number} z Chunk Z, in world coordinates.
 */
blk.env.Chunk.prototype.beginLoad = function(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
  gf.vec.BoundingBox.setFromValues(this.boundingBox,
      x, y, z,
      x + blk.env.Chunk.SIZE_XZ,
      y + blk.env.Chunk.SIZE_Y,
      z + blk.env.Chunk.SIZE_XZ);
};


/**
 * Ends the chunk load operation, signalling any observers.
 */
blk.env.Chunk.prototype.endLoad = function() {
  this.dirty_ = false;
  this.state = blk.env.Chunk.State.LOADED;
  this.map.notifyChunkLoaded(this);
};


/**
 * Gets the full 2-byte block data value for the given world coordinates.
 * @param {number} x Block X, in world coordinates.
 * @param {number} y Block Y, in world coordinates.
 * @param {number} z Block Z, in world coordinates.
 * @return {number} Raw 2-byte block data.
 */
blk.env.Chunk.prototype.getBlock = function(x, y, z) {
  var bx = x & blk.env.Chunk.MASK_XZ;
  var by = y & blk.env.Chunk.MASK_Y;
  var bz = z & blk.env.Chunk.MASK_XZ;
  var bo = bx + bz * blk.env.Chunk.STRIDE_Z + by * blk.env.Chunk.STRIDE_Y;
  return this.state == blk.env.Chunk.State.LOADED ? this.blockData[bo] : 0;
};


/**
 * Sets the full 2-byte block data value for the given world coordinates.
 * @param {number} x Block X, in world coordinates.
 * @param {number} y Block Y, in world coordinates.
 * @param {number} z Block Z, in world coordinates.
 * @param {number} value Raw 2-byte block data.
 * @return {number} Existing raw block data.
 */
blk.env.Chunk.prototype.setBlock = function(x, y, z, value) {
  goog.asserts.assert(this.state == blk.env.Chunk.State.LOADED);

  var bx = x & blk.env.Chunk.MASK_XZ;
  var by = y & blk.env.Chunk.MASK_Y;
  var bz = z & blk.env.Chunk.MASK_XZ;
  var bo = bx + bz * blk.env.Chunk.STRIDE_Z + by * blk.env.Chunk.STRIDE_Y;
  var oldValue = this.blockData[bo];
  var oldBlockId = oldValue >> 8;
  var newBlockId = value >> 8;
  this.blockData[bo] = value;
  var changed = oldValue != value;
  if (changed && !this.dirty_) {
    this.markDirty();
  }
  return oldValue;
};


/**
 * Casts a ray in the chunk and finds the first block that it intersects.
 * @param {!gf.vec.Ray.Type} ray Ray being cast.
 * @return {blk.env.BlockIntersection} Information about the intersection with
 *     the first block intersected, if one was found.
 */
blk.env.Chunk.prototype.intersectBlock = function(ray) {
  // Find ray intersection with chunk bounding box - use this as origin instead
  // of ray origin
  // TODO(benvanik): have this in the octree already, pass it down
  var origin = blk.env.Chunk.tmpVec3_[0];
  gf.vec.BoundingBox.intersectsRay(this.boundingBox, ray, origin);

  // 3D DDA for voxel search
  var x = Math.floor(origin[0]);
  var y = Math.floor(origin[1]);
  var z = Math.floor(origin[2]);
  var stepX = ray[3] == 0 ? 0 : (ray[3] < 0 ? -1 : 1);
  var stepY = ray[4] == 0 ? 0 : (ray[4] < 0 ? -1 : 1);
  var stepZ = ray[5] == 0 ? 0 : (ray[5] < 0 ? -1 : 1);
  var tMaxX = ((x + (stepX > 0 ? 1 : 0)) - origin[0]) / ray[3];
  var tMaxY = ((y + (stepY > 0 ? 1 : 0)) - origin[1]) / ray[4];
  var tMaxZ = ((z + (stepZ > 0 ? 1 : 0)) - origin[2]) / ray[5];
  if (isNaN(tMaxX)) { tMaxX = Number.POSITIVE_INFINITY; }
  if (isNaN(tMaxY)) { tMaxY = Number.POSITIVE_INFINITY; }
  if (isNaN(tMaxZ)) { tMaxZ = Number.POSITIVE_INFINITY; }
  var tDeltaX = stepX / ray[3];
  var tDeltaY = stepY / ray[4];
  var tDeltaZ = stepZ / ray[5];
  if (isNaN(tDeltaX)) { tDeltaX = Number.POSITIVE_INFINITY; }
  if (isNaN(tDeltaY)) { tDeltaY = Number.POSITIVE_INFINITY; }
  if (isNaN(tDeltaZ)) { tDeltaZ = Number.POSITIVE_INFINITY; }

  // TODO(benvanik): do the DDA in chunk coordinates instead of offsetting
  //     Because we are not chunk relative, we may do weird things like run
  //     way past the bounds of the chunk on the other end of the ray
  //     Could probably calculate a ray maxT and end after that's hit...
  var blockData = this.blockData;
  var matchData = 0;
  var maxDepth = blk.env.Chunk.SIZE_SQ;
  for (var n = 0; n < maxDepth; n++) {
    var bx = x - this.x;
    var by = y - this.y;
    var bz = z - this.z;
    // NOTE: must be sure that we are in bounds!
    if (bx >= 0 && bx < blk.env.Chunk.SIZE_XZ &&
        by >= 0 && by < blk.env.Chunk.SIZE_Y &&
        bz >= 0 && bz < blk.env.Chunk.SIZE_XZ) {
      var bo = bx + bz * blk.env.Chunk.STRIDE_Z + by * blk.env.Chunk.STRIDE_Y;
      matchData = blockData[bo];
      if (matchData >> 8) {
        // Match!
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

  if (matchData) {
    // Re-intersect to get the intersection point/distance
    var bb = blk.env.Chunk.tmpAabb_;
    gf.vec.BoundingBox.setFromValues(bb, x, y, z, x + 1, y + 1, z + 1);
    var point = goog.vec.Vec3.createFloat32();
    var intersects = gf.vec.BoundingBox.intersectsRay(bb, ray, point);
    goog.asserts.assert(intersects);

    var distance = goog.vec.Vec3.distance(ray, point);

    return new blk.env.BlockIntersection(
        this, x, y, z, matchData, distance, point);
  }

  return null;
};


/**
 * Sorts a list of chunks by distance from the given point.
 * @param {!Array.<!blk.env.Chunk>} list Chunk list.
 * @param {!goog.vec.Vec3.Float32} point Point.
 */
blk.env.Chunk.sortByDistanceFromPoint = function(list, point) {
  var chunkCenter = blk.env.Chunk.tmpVec3_[0];
  goog.array.sort(list,
      /**
       * @param {!blk.env.Chunk} a First chunk.
       * @param {!blk.env.Chunk} b Second chunk.
       * @return {number} Sort order.
       */
      function(a, b) {
        goog.vec.Vec3.setFromValues(chunkCenter,
            a.x + blk.env.Chunk.SIZE_XZ / 2,
            point[1],
            a.z + blk.env.Chunk.SIZE_XZ / 2);
        var da = goog.vec.Vec3.distanceSquared(point, chunkCenter);
        goog.vec.Vec3.setFromValues(chunkCenter,
            b.x + blk.env.Chunk.SIZE_XZ / 2,
            point[1],
            b.z + blk.env.Chunk.SIZE_XZ / 2);
        var db = goog.vec.Vec3.distanceSquared(point, chunkCenter);
        return da - db;
      });
};


/**
 * Temp vec3s for math.
 * @private
 * @type {!Array.<!goog.vec.Vec3.Float32>}
 */
blk.env.Chunk.tmpVec3_ = [
  goog.vec.Vec3.createFloat32(),
  goog.vec.Vec3.createFloat32()
];


/**
 * Temp AABB for math.
 * @private
 * @type {!gf.vec.BoundingBox}
 */
blk.env.Chunk.tmpAabb_ = gf.vec.BoundingBox.create();
