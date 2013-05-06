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

goog.provide('blk.env.client.BuildQueue');

goog.require('blk.env.UpdatePriority');
goog.require('gf');
goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.reflect');
goog.require('goog.vec.Vec3');
goog.require('WTF.trace');



/**
 * Render chunk segment build queue.
 *
 * TODO(benvanik): use heaps for lists (priority = distance from user)
 * TODO(benvanik): offthread construction in worker? generate VB and pass back
 *                 once lit - requires mirror world data in other thread
 *
 * @constructor
 * @extends {goog.Disposable}
 */
blk.env.client.BuildQueue = function() {
  goog.base(this);

  /**
   * Whether the build queue is paused.
   * @private
   * @type {boolean}
   */
  this.paused_ = false;

  /**
   * Whether the lists should be forced sorted next build run.
   * @private
   * @type {boolean}
   */
  this.sortLists_ = true;

  /**
   * ACTION build queue.
   * @private
   * @type {!Array.<!blk.env.client.SegmentRenderer>}
   */
  this.actionList_ = [];

  /**
   * VISIBLE build queue.
   * @private
   * @type {!Array.<!blk.env.client.SegmentRenderer>}
   */
  this.visibleList_ = [];

  /**
   * UPDATE build queue.
   * @private
   * @type {!Array.<!blk.env.client.SegmentRenderer>}
   */
  this.updateList_ = [];

  /**
   * LOAD build queue.
   * @private
   * @type {!Array.<!blk.env.client.SegmentRenderer>}
   */
  this.loadList_ = [];

  /**
   * Lists, in priority order.
   * @type {!Array.<!Array.<!blk.env.client.SegmentRenderer>>}
   * @private
   */
  this.lists_ = [
    this.visibleList_,
    this.updateList_,
    this.loadList_
  ];

  /**
   * Total number of pending chunks.
   * @private
   * @type {number}
   */
  this.totalCount_ = 0;
};
goog.inherits(blk.env.client.BuildQueue, goog.Disposable);


/**
 * Maximum number of chunk builds per frame (excluding user actions).
 * @private
 * @const
 * @type {number}
 */
blk.env.client.BuildQueue.MAX_BUILDS_PER_FRAME_ = 20;


/**
 * Maximum amount of time per frame to spend building (excluding user actions),
 * in ms.
 * @private
 * @const
 * @type {number}
 */
blk.env.client.BuildQueue.MAX_BUILD_TIME_PER_FRAME_ = 6;


/**
 * Frequency of sorts of the load build list.
 * The sort isn't free, so it's best not to perform it every frame.
 * @private
 * @const
 * @type {number}
 */
blk.env.client.BuildQueue.LIST_SORT_FREQUENCY_ = 32;


/**
 * Pauses the build queue.
 */
blk.env.client.BuildQueue.prototype.pause = function() {
  this.paused_ = true;
};


/**
 * Resumes the build queue.
 */
blk.env.client.BuildQueue.prototype.resume = function() {
  this.paused_ = false;
};


/**
 * Gets the number of chunks queued for building.
 * @return {number} Chunk queue length.
 */
blk.env.client.BuildQueue.prototype.getCount = function() {
  return this.totalCount_;
};


/**
 * Queues a chunk for building at the given priority.
 * @param {!blk.env.client.SegmentRenderer} segmentRenderer Chunk renderer to
 *     build.
 * @param {blk.env.UpdatePriority} priority Update priority.
 */
blk.env.client.BuildQueue.prototype.enqueue = function(segmentRenderer,
    priority) {
  if (segmentRenderer.queuedForBuild) {
    // Already queued - priority adjust - remove from current queue and let the
    // logic below re-add
    switch (segmentRenderer.queuePriority) {
      case blk.env.UpdatePriority.ACTION:
        goog.array.remove(this.actionList_, segmentRenderer);
        break;
      case blk.env.UpdatePriority.VISIBLE:
        goog.array.remove(this.visibleList_, segmentRenderer);
        break;
      case blk.env.UpdatePriority.UPDATE:
        goog.array.remove(this.updateList_, segmentRenderer);
        break;
      case blk.env.UpdatePriority.LOAD:
      default:
        goog.array.remove(this.loadList_, segmentRenderer);
        break;
    }
  } else {
    segmentRenderer.queuedForBuild = true;
    this.totalCount_++;
  }

  segmentRenderer.queuePriority = priority;

  switch (priority) {
    case blk.env.UpdatePriority.ACTION:
      this.actionList_.push(segmentRenderer);
      break;
    case blk.env.UpdatePriority.VISIBLE:
      this.visibleList_.push(segmentRenderer);
      this.sortLists_ = true;
      break;
    case blk.env.UpdatePriority.UPDATE:
      this.updateList_.push(segmentRenderer);
      break;
    case blk.env.UpdatePriority.LOAD:
    default:
      this.loadList_.push(segmentRenderer);
      this.sortLists_ = true;
      break;
  }
};


/**
 * Cancels a chunk build request.
 * @param {!blk.env.client.SegmentRenderer} segmentRenderer Chunk to cancel.
 */
blk.env.client.BuildQueue.prototype.cancel = function(segmentRenderer) {
  if (segmentRenderer.queuedForBuild) {
    switch (segmentRenderer.queuePriority) {
      case blk.env.UpdatePriority.ACTION:
        goog.array.remove(this.actionList_, segmentRenderer);
        break;
      case blk.env.UpdatePriority.VISIBLE:
        goog.array.remove(this.visibleList_, segmentRenderer);
        break;
      case blk.env.UpdatePriority.UPDATE:
        goog.array.remove(this.updateList_, segmentRenderer);
        break;
      case blk.env.UpdatePriority.LOAD:
      default:
        goog.array.remove(this.loadList_, segmentRenderer);
        break;
    }
    this.totalCount_--;
  }
};


/**
 * Sorts render chunks by distance to the viewport descending, with special
 * casing for chunks that are no longer in the viewport.
 * @private
 * @param {!blk.env.client.SegmentRenderer} a First chunk.
 * @param {!blk.env.client.SegmentRenderer} b Second chunk.
 * @return {number} Sort result.
 */
blk.env.client.BuildQueue.visibleSort_ = function(a, b) {
  return a.sortKey - b.sortKey;
};


/**
 * Processes some entries in the build queue.
 * @param {!gf.RenderFrame} frame Render frame.
 * @param {!gf.vec.Viewport} viewport Current viewport.
 * @return {number} Total delta bytes of the chunks.
 */
blk.env.client.BuildQueue.prototype.update = function(frame, viewport) {
  if (this.paused_) {
    return 0;
  }
  if (!this.totalCount_) {
    return 0;
  }

  // Throttle the number of chunks that are rebuilt each frame
  // TODO(benvanik): throttle better (dynamically?)
  var segmentsRemaining = blk.env.client.BuildQueue.MAX_BUILDS_PER_FRAME_;
  var startTime = gf.now();
  var frameNumber = frame.frameNumber;
  var totalSizeDelta = 0;

  // Always process chunks in the ACTION category
  var actionList = this.actionList_;
  if (actionList.length) {
    for (var n = 0; n < actionList.length; n++) {
      totalSizeDelta += actionList[n].build();
      actionList[n].queuedForBuild = false;
    }
    this.totalCount_ -= actionList.length;
    segmentsRemaining -= actionList.length;
    actionList.length = 0;
  }
  if (segmentsRemaining <= 0) {
    return totalSizeDelta;
  }

  // Sort the build queue by distance from the viewer to ensure that closer
  // chunks are built first
  if (this.sortLists_ ||
      !(frameNumber % blk.env.client.BuildQueue.LIST_SORT_FREQUENCY_)) {
    if (this.visibleList_.length) {
      this.sortListByDistance_(frame, viewport, this.visibleList_);
    }
    if (this.loadList_.length) {
      this.sortListByDistance_(frame, viewport, this.loadList_);
    }
    this.sortLists_ = false;
  }

  for (var n = 0; n < this.lists_.length; n++) {
    var list = this.lists_[n];
    while (segmentsRemaining && list.length) {
      var elapsed = gf.now() - startTime;
      if (elapsed > blk.env.client.BuildQueue.MAX_BUILD_TIME_PER_FRAME_) {
        return totalSizeDelta;
      }

      var segmentRenderer = list.shift();
      totalSizeDelta += segmentRenderer.build();
      segmentRenderer.queuedForBuild = false;
      this.totalCount_--;
      segmentsRemaining--;
    }
  }

  return totalSizeDelta;
};


/**
 * Sorts a chunk list by distance to the viewer.
 * @private
 * @param {!gf.RenderFrame} frame Render frame.
 * @param {!gf.vec.Viewport} viewport Current viewport.
 * @param {!Array.<!blk.env.client.SegmentRenderer>} list Chunk list.
 */
blk.env.client.BuildQueue.prototype.sortListByDistance_ =
    function(frame, viewport, list) {
  // TODO(benvanik): more efficient sort
  WTF.trace.appendScopeData('length', list.length);

  // Compute distances
  var frameNumber = frame.frameNumber;
  var vp = viewport.position;
  for (var n = 0; n < list.length; n++) {
    var segmentRenderer = list[n];
    var sp = segmentRenderer.centerCoordinates;
    var x = vp[0] - sp[0];
    var y = vp[1] - sp[1];
    var z = vp[2] - sp[2];
    segmentRenderer =
        (segmentRenderer.lastFrameInViewport == frameNumber) ? 0 : 10000 +
        (x * x + y * y + z * z);
  }

  // Sort - split between those in viewport and those out
  goog.array.sort(list, blk.env.client.BuildQueue.visibleSort_);
};


blk.env.client.BuildQueue = WTF.trace.instrumentType(
    blk.env.client.BuildQueue, 'blk.env.client.BuildQueue',
    goog.reflect.object(blk.env.client.BuildQueue, {
      update: 'update',
      sortListByDistance_: 'sortListByDistance_'
    }));
