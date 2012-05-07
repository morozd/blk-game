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

goog.provide('blk.env.server.ChunkProvider');

goog.require('blk.env.Chunk');
goog.require('blk.env.gen.ChunkBuilder');
goog.require('gf.math.Random');
goog.require('goog.Disposable');
goog.require('goog.asserts');



/**
 * Chunk provider system.
 * Handles the generation or loading of chunks, as well as queued lazy storage.
 *
 * @constructor
 * @extends {goog.Disposable}
 * @param {!blk.env.server.ServerMap} map Map.
 * @param {!blk.env.gen.Generator} generator Map generator.
 * @param {!blk.io.MapStore} mapStore Map storage provider.
 */
blk.env.server.ChunkProvider = function(map, generator, mapStore) {
  goog.base(this);

  /**
   * Map generator.
   * @private
   * @type {!blk.env.gen.Generator}
   */
  this.generator_ = generator;

  /**
   * Map storage provider.
   * @private
   * @type {!blk.io.MapStore}
   */
  this.mapStore_ = mapStore;

  /**
   * A list of chunks pending generation.
   * TODO(benvanik): handle dispose?
   * @private
   * @type {!Array.<blk.env.Chunk>}
   */
  this.generationQueue_ = [];

  /**
   * Whether the generator processing queue is running.
   * @private
   * @type {boolean}
   */
  this.processingRunning_ = false;

  /**
   * Timer ID of the processing queue, if it is running.
   * @private
   * @type {number?}
   */
  this.processingQueueId_ = null;

  /**
   * Cached chunk builder.
   * @private
   * @type {!blk.env.gen.ChunkBuilder}
   */
  this.chunkBuilder_ = new blk.env.gen.ChunkBuilder();
};
goog.inherits(blk.env.server.ChunkProvider, goog.Disposable);


/**
 * Interval, in ms, between generation queue processing execution steps.
 * @private
 * @const
 * @type {number}
 */
blk.env.server.ChunkProvider.GENERATION_INTERVAL_ = 10;


/**
 * Maximum time, in ms, the generator can run.
 * Note that this is merely to throttle requests - generation will not be
 * pre-empted if it runs over this time.
 * @private
 * @const
 * @type {number}
 */
blk.env.server.ChunkProvider.MAX_GENERATION_TIME_ = 16;


/**
 * @override
 */
blk.env.server.ChunkProvider.prototype.disposeInternal = function() {
  // Cancel the processing queue so it doesn't fire once we are gone
  if (this.processingRunning_) {
    this.processingRunning_ = false;
    goog.global.clearTimeout(this.processingQueueId_);
    this.processingQueueId_ = null;
  }

  goog.base(this, 'disposeInternal');
};


/**
 * Updates the chunk provider, processing any pending items.
 * @param {!gf.UpdateFrame} frame Current update frame.
 */
blk.env.server.ChunkProvider.prototype.update = function(frame) {
};


/**
 * Request a chunk be loaded/generated.
 * @param {!blk.env.Chunk} chunk Requested unloaded chunk.
 */
blk.env.server.ChunkProvider.prototype.requestChunk = function(chunk) {
  //gf.log.write('requesting chunk', chunk.x, chunk.y, chunk.z);

  goog.asserts.assert(chunk.state == blk.env.Chunk.State.UNLOADED);
  chunk.state = blk.env.Chunk.State.LOADING;

  // First attempt to load from disk - if it fails, generate
  var deferred = this.mapStore_.readChunk(chunk);
  deferred.addCallbacks(
      /**
       * @this {!blk.env.server.ChunkProvider}
       */
      function() {
        // Succeeded - nothing to do!
      },
      /**
       * @this {!blk.env.server.ChunkProvider}
       * @param {Object} arg Error argument.
       */
      function(arg) {
        // Chunk not found - generate
        // TODO(benvanik): differentiate load failure from presence check
        this.queueChunkGeneration_(chunk);
      }, this);
};


/**
 * Queues a chunk for generation.
 * @private
 * @param {!blk.env.Chunk} chunk Chunk to be generated.
 */
blk.env.server.ChunkProvider.prototype.queueChunkGeneration_ =
    function(chunk) {
  this.generationQueue_.push(chunk);

  // Start up queue if needed
  if (!this.processingRunning_) {
    this.processingRunning_ = true;
    this.processingQueueId_ = goog.global.setTimeout(
        goog.bind(this.processGenerationQueue_, this),
        blk.env.server.ChunkProvider.GENERATION_INTERVAL_);
  }
};


/**
 * Processes entries in the generation queue
 * @private
 */
blk.env.server.ChunkProvider.prototype.processGenerationQueue_ = function() {
  // TODO(benvanik): out of process/offthread generation
  // Can use node-webworker (https://github.com/pgriess/node-webworker) to
  // support the same code on both web clients and node
  var startTime = goog.now();
  while (this.generationQueue_.length) {
    var chunk = this.generationQueue_.shift();

    // TODO(benvanik): create a PRNG based on map seed and chunk ID
    var random = new gf.math.Random(this.generator_.mapParams.seed);

    // Fill the chunk
    this.chunkBuilder_.begin();
    this.generator_.fillChunk(
        random,
        chunk.x, chunk.y, chunk.z,
        this.chunkBuilder_);
    chunk.fill(this.chunkBuilder_.end());

    // TODO(benvanik): queue for population (needs to happen from view?)

    // Stop generating if over time limit
    if (goog.now() - startTime >
        blk.env.server.ChunkProvider.MAX_GENERATION_TIME_) {
      break;
    }
  }

  if (this.generationQueue_.length) {
    this.processingRunning_ = true;
    this.processingQueueId_ = goog.global.setTimeout(
        goog.bind(this.processGenerationQueue_, this),
        blk.env.server.ChunkProvider.GENERATION_INTERVAL_);
  } else {
    this.processingRunning_ = false;
    this.processingQueueId_ = null;
  }
};
