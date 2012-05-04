
  // Periodically save the map
  /**
   * A deferred tracking the current save. Null if no save is in progress.
   * @private
   * @type {goog.async.Deferred}
   */
  this.savingDeferred_ = null;
  goog.global.setInterval(goog.bind(function() {
    // Ignore if already saving
    if (this.savingDeferred_) {
      return;
    }
    // Start save
    this.savingDeferred_ = this.saveMap_();
  }, this), blk.server.ServerGame.SAVE_INTERVAL_);

  // Save on exit
  if (gf.NODE) {
    // NOTE: node on Windows doesn't support SIGINT yet, but may in the future
    try {
      process.on('SIGINT', goog.bind(function() {
        gf.log.write('ctrl-c received, preparing to shut down...');
        if (!this.savingDeferred_) {
          this.saveMap_();
        }
        if (this.savingDeferred_) {
          this.savingDeferred_.addCallbacks(function() {
            gf.log.write('shutdown successful');
            process.exit(0);
          }, function(arg) {
            gf.log.write('save failed: ', arg);
            process.exit(-1);
          }, this);
        }
      }, this));
    } catch (e) {

    }
  } else {
    // TODO(benvanik): save on exit in HTML5
  }


/**
 * Frequency of map saves.
 * @private
 * @const
 * @type {number}
 */
blk.server.ServerGame.SAVE_INTERVAL_ = 10000;


/**
 * Resets the map to the default state.
 * @param {boolean} empty Whether to make the map empty (one block).
 */
blk.server.ServerGame.prototype.setupMap = function(empty) {
  var map = this.state.map;
  var blockSet = map.blockSet;

  // Ignore if already created
  if (this.hasSetupMap_) {
    return;
  }

  // Reset the map
  map.removeAllChunks();

  var seed = 0;
  // var generator = new blk.env.gen.FlatGenerator(
  //     map.blockSet);
  var generator = new blk.env.gen.NoiseGenerator(
      map.blockSet,
      seed);
  map.generator = generator;

  if (empty) {
    // Single block at the origin
    var blockData = blk.env.blocks.BlockID.DIRT << 8;
    blockData |= 1;
    map.setBlock(0, 0, 0, blockData);
  } else {
    // TODO(benvanik): move map setup elsewhere
    var ws = 64;
    var wh = 16 * 3;
    // map.fillBlocks(0, 0, 0, 1, 1, 1, grassBlock);
    // map.fillBlocks(-ws, 0, -ws, ws * 2, 1, ws * 2, grassBlock);
    // map.fillBlocks(0, wh, 0, ws, 1, ws, grassBlock);
    // map.fillBlocks(0, 0, 0, ws, wh, 1, grassBlock);
    // map.fillBlocks(0, 0, 0, 1, wh, ws, grassBlock);
    // map.fillBlocks(ws, 0, 0, 1, wh, ws, grassBlock);
    // map.fillBlocks(0, 0, ws, ws, wh, 1, grassBlock);
    for (var y = -wh; y <= 0; y += blk.env.Chunk.SIZE) {
      for (var x = -ws; x < ws; x += blk.env.Chunk.SIZE) {
        for (var z = -ws; z < ws; z += blk.env.Chunk.SIZE) {
          var chunk = new blk.env.Chunk(map, x, y, z);
          chunk.state = blk.env.Chunk.State.LOADED;
          map.generator.fillChunk(chunk);
          map.addChunk(chunk, blk.env.UpdatePriority.LOAD);
        }
      }
    }
  }

  this.hasSetupMap_ = true;

  // Broadcast all chunks
  this.sendMap_(this.session.users);

  // Signal player ready
  this.session.send(blk.net.packets.ReadyPlayer.createData());
};


/**
 * Loads the map from local storage.
 * @param {Uint8Array=} opt_buffer Map data buffer.
 * @return {goog.async.Deferred} A deferred fulfilled when the map has loaded,
 *     or {@code null} if the map does not exist.
 */
blk.server.ServerGame.prototype.loadMap = function(opt_buffer) {
  var map = this.state.map;
  if (!this.mapStore_) {
    return null;
  }

  // Check exists
  if (!this.mapStore_.exists()) {
    return null;
  }

  var deferred = new goog.async.Deferred();

  var infoDeferred = this.mapStore_.readInfo();
  infoDeferred.addCallbacks(
      /**
       * @this {blk.server.ServerGame}
       * @param {!ArrayBuffer} infoData Map info data.
       */
      function(infoData) {
        var reader = blk.server.ServerGame.packetReader_;
        var mapInfo = new blk.env.MapInfo();
        reader.begin(infoData, 0);
        mapInfo.deserialize(reader);

        var deferreds = [];
        for (var n = 0; n < mapInfo.chunkList.length; n++) {
          var coords = mapInfo.chunkList[n];
          deferreds.push(this.mapStore_.readChunk(
              coords[0], coords[1], coords[2]));
        }
        (new goog.async.DeferredList(deferreds)).addCallbacks(
            /**
             * @this {blk.server.ServerGame}
             * @param {!Array.<!ArrayBuffer>} chunkDatas Chunk data list.
             */
            function(chunkDatas) {
              var reader = blk.server.ServerGame.packetReader_;
              for (var n = 0; n < chunkDatas.length; n++) {
                var chunk = new blk.env.Chunk(map, 0, 0, 0);
                reader.begin(chunkDatas[n][1], 0);
                chunk.deserialize(reader);
                map.addChunk(chunk, blk.env.UpdatePriority.LOAD);
              }

              // Broadcast all chunks
              this.sendMap_(this.session.users);

              deferred.callback(null);
              this.hasSetupMap_ = true;
            }, function(arg) {
              deferred.errback(arg);
            }, this);
      }, function(arg) {
        deferred.errback(arg);
      }, this);

  return deferred;
};


/**
 * Saves the map to local storage.
 * @private
 */
blk.server.ServerGame.prototype.saveMap_ = function() {
  var map = this.state.map;
  if (!this.mapStore_) {
    return;
  }

  var deferred = new goog.async.Deferred();
  this.savingDeferred_ = deferred;

  gf.log.write('saving...');

  var deferreds = [];

  var mapInfo = new blk.env.MapInfo();
  map.forEachChunk(function(chunk) {
    mapInfo.chunkList.push(chunk.coord);
  });
  deferreds.push(this.mapStore_.writeInfo(mapInfo));

  map.forEachChunk(function(chunk) {
    if (chunk.dirty) {
      deferreds.push(this.mapStore_.writeChunk(chunk));
      chunk.dirty = false;
    }
  }, this);
  (new goog.async.DeferredList(deferreds)).addCallbacks(function() {
    gf.log.write('map save done');

    deferred.callback(null);
    this.savingDeferred_ = null;
  }, function(err) {
    gf.log.write('error saving: ', err);
  }, this);

  //   // Local - pass to clients... if we have any!
  //   if (!this.state.players.length) {
  //     gf.log.write('could not save map - no one connected');
  //     deferred.errback(null);
  //     this.savingDeferred_ = null;
  //     return;
  //   }
  //   var downloadData = blk.net.packets.MapDownload.createData(
  //       new Uint8Array(data));
  //   for (var n = 0; n < this.state.players.length; n++) {
  //     var player = this.state.players[n];
  //     this.session.send(downloadData, player.user);
  //   }
};


/**
 * Sends map data to the list of users.
 * @private
 * @param {!Array.<!gf.net.User>} users Users to send map data to.
 */
blk.server.ServerGame.prototype.sendMap_ = function(users) {
  var map = this.state.map;

  var mapInfoData = blk.net.packets.MapInfo.createData();
  var chunkDataPackets = [];
  var writer = blk.server.ServerGame.packetWriter_;
  map.forEachChunk(function(chunk) {
    chunk.serialize(writer);
    chunkDataPackets.push(blk.net.packets.ChunkData.createData(
        new Uint8Array(writer.finish())));
  }, this);

  for (var n = 0; n < users.length; n++) {
    var user = users[n];

    // Send info
    this.session.send(mapInfoData, user);

    // Send map chunks
    // TODO(benvanik): send only needed chunks
    for (var m = 0; m < chunkDataPackets.length; m++) {
      var packet = chunkDataPackets[m];
      this.session.send(packet, user);
    }
  }
};
