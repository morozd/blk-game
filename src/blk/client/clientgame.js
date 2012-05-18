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

goog.provide('blk.client.ClientGame');

goog.require('blk.GameState');
goog.require('blk.Player');
goog.require('blk.assets.audio.Bank1');
goog.require('blk.assets.audio.Music');
goog.require('blk.client.ClientNetService');
goog.require('blk.env');
goog.require('blk.env.ChunkView');
goog.require('blk.env.Entity');
goog.require('blk.env.blocks.BlockID');
goog.require('blk.env.client.ClientMap');
goog.require('blk.env.client.ViewManager');
goog.require('blk.graphics.RenderState');
goog.require('blk.net.packets.SetBlock');
goog.require('blk.physics.ClientMovement');
goog.require('blk.ui.Console');
goog.require('blk.ui.PlayerListing');
goog.require('blk.ui.Popup');
goog.require('blk.ui.Settings');
goog.require('blk.ui.alerts');
goog.require('gf.Game');
goog.require('gf.assets.AssetManager');
goog.require('gf.audio.AudioManager');
goog.require('gf.dom.Display');
goog.require('gf.graphics.GraphicsContext');
goog.require('gf.graphics.SpriteBuffer');
goog.require('gf.input.Data');
goog.require('gf.input.InputManager');
goog.require('gf.input.MouseButton');
goog.require('gf.log');
goog.require('gf.net.DisconnectReason');
goog.require('gf.net.SessionState');
goog.require('gf.net.chat.ClientChatService');
goog.require('gf.vec.Viewport');
goog.require('goog.asserts');
goog.require('goog.events.KeyCodes');
goog.require('goog.vec.Mat4');
goog.require('goog.vec.Quaternion');
goog.require('goog.vec.Vec3');
goog.require('goog.vec.Vec4');



/**
 * Test game client instance.
 *
 * @constructor
 * @extends {gf.Game}
 * @param {!blk.client.LaunchOptions} launchOptions Launch options.
 * @param {!blk.client.UserSettings} settings User settings.
 * @param {!goog.dom.DomHelper} dom DOM helper.
 * @param {!gf.net.ClientSession} session Client session.
 */
blk.client.ClientGame = function(launchOptions, settings, dom, session) {
  goog.base(this, launchOptions, session.clock);

  /**
   * DOM helper.
   * @type {!goog.dom.DomHelper}
   */
  this.dom = dom;

  /**
   * User settings.
   * @type {!blk.client.UserSettings}
   */
  this.settings = settings;

  /**
   * Client session.
   * @type {!gf.net.ClientSession}
   */
  this.session = session;

  /**
   * Client net service.
   * @type {!blk.client.ClientNetService}
   */
  this.netService = new blk.client.ClientNetService(this);
  this.session.registerService(this.netService);

  /**
   * Chat client.
   * @type {!gf.net.chat.ClientChatService}
   */
  this.chat = new gf.net.chat.ClientChatService(session);
  this.session.registerService(this.chat);

  /**
   * Asset manager.
   * @type {!gf.assets.AssetManager}
   */
  this.assetManager = new gf.assets.AssetManager(this, dom);
  this.registerDisposable(this.assetManager);

  /**
   * Game display window.
   * @type {!gf.dom.Display}
   */
  this.display = new gf.dom.Display(this.dom);
  this.registerDisposable(this.display);

  var attributes = /** @type {!WebGLContextAttributes} */ ({
    alpha: false,
    // TODO(benvanik): make configurable - right now makes things ugly and
    //     and slow as hell on OSX (Air)
    antialias: false
  });
  var graphicsContext = new gf.graphics.GraphicsContext(
      this.dom, this.display.canvas.el);
  var graphicsDeferred = graphicsContext.setup(attributes);
  graphicsDeferred.addCallbacks(function() {
    // Graphics ready
  }, function(arg) {
    // Graphics failed
    goog.global.alert('Unable to initialize WebGL');
  }, this);

  /**
   * Graphics context.
   * @type {!gf.graphics.GraphicsContext}
   */
  this.graphicsContext = graphicsContext;
  this.registerDisposable(this.graphicsContext);

  /**
   * Current viewport.
   * @type {!gf.vec.Viewport}
   */
  this.viewport = new gf.vec.Viewport();

  /**
   * Current render state tracker.
   * @type {!blk.graphics.RenderState}
   */
  this.renderState = new blk.graphics.RenderState(
      this, this.assetManager, this.graphicsContext);
  this.registerDisposable(this.renderState);

  /**
   * Map.
   * @type {!blk.env.client.ClientMap}
   */
  this.map = new blk.env.client.ClientMap();
  this.registerDisposable(this.map);

  /**
   * Current game state.
   * @type {!blk.GameState}
   */
  this.state = new blk.GameState(this, session, this.map);
  this.registerDisposable(this.state);

  // Add all players currently in the session
  for (var n = 0; n < session.users.length; n++) {
    var user = session.users[n];
    var player = new blk.Player(user);
    this.state.addPlayer(player);
  }

  /**
   * Local chunk view.
   * @type {!blk.env.ChunkView}
   */
  this.localView = new blk.env.ChunkView(this.map, this.settings.viewDistance);
  this.map.addChunkView(this.localView);

  /**
   * Map view renderer.
   * @type {!blk.env.client.ViewManager}
   */
  this.viewManager = new blk.env.client.ViewManager(
      this.renderState, this.map, this.localView);
  this.registerDisposable(this.viewManager);
  this.localView.addObserver(this.viewManager);

  this.localView.initialize(goog.vec.Vec3.createFloat32());

  /**
   * Input manager.
   * @type {!gf.input.InputManager}
   */
  this.input = new gf.input.InputManager(this,
      this.display.getInputElement());
  this.registerDisposable(this.input);
  this.addComponent(this.input);
  this.input.mouse.setSensitivity(this.settings.mouseSensitivity);
  this.input.keyboard.setFullScreenHandler(goog.bind(function() {
    var goingFullScreen = !this.display.isFullScreen;
    this.display.toggleFullScreen();
    if (goingFullScreen && this.input.mouse.supportsLocking) {
      this.input.mouse.lock();
    }
  }, this));

  /**
   * Input data storage.
   * @type {!gf.input.Data}
   */
  this.inputData = new gf.input.Data(this.input);

  /**
   * Audio manager.
   * @type {!gf.audio.AudioManager}
   */
  this.audio = new gf.audio.AudioManager(this, this.dom);
  this.registerDisposable(this.audio);
  this.addComponent(this.audio);
  this.audio.setMuted(this.settings.audioMuted);

  /**
   * Sound bank for game sounds.
   * @type {!gf.audio.SoundBank}
   */
  this.sounds = blk.assets.audio.Bank1.create(
      this.assetManager, this.audio.context);
  this.audio.loadSoundBank(this.sounds);

  /**
   * Background sound track list.
   * @private
   * @type {!gf.audio.TrackList}
   */
  this.backgroundTracks_ = blk.assets.audio.Music.create(
      this.assetManager, this.audio.context);
  this.audio.loadTrackList(this.backgroundTracks_);

  /**
   * True if music is playing.
   * @private
   * @type {boolean}
   */
  this.playingMusic_ = false;

  /**
   * Sprite buffer used for UI drawing.
   * @private
   * @type {!gf.graphics.SpriteBuffer}
   */
  this.spriteBuffer_ = new gf.graphics.SpriteBuffer(graphicsContext);
  this.registerDisposable(this.spriteBuffer_);

  /**
   * Console.
   * @type {!blk.ui.Console}
   */
  this.console = new blk.ui.Console(this);
  this.registerDisposable(this.console);

  /**
   * Player listing.
   * @type {!blk.ui.PlayerListing}
   */
  this.playerListing = new blk.ui.PlayerListing(graphicsContext,
      this.renderState, this.state);
  this.registerDisposable(this.playerListing);

  /**
   * Local player.
   * @type {blk.Player}
   */
  this.localPlayer = null;

  /**
   * God mode toggle.
   * @type {boolean}
   */
  this.godMode = true;

  /**
   * Movement controller.
   * @private
   * @type {!blk.physics.ClientMovement}
   */
  this.movement_ = new blk.physics.ClientMovement(this.localView, this.session);

  /**
   * Accumulated mouse movement delta.
   * @private
   * @type {number}
   */
  this.dragDelta_ = 0;

  /**
   * Last time an action was repeated.
   * @private
   * @type {number}
   */
  this.repeatTime_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.blockIndex_ = 0;

  /**
   * @private
   * @type {!Array.<!blk.env.Block>}
   */
  this.blockTypes_ = [
    this.map.blockSet.get(blk.env.blocks.BlockID.DIRT),
    this.map.blockSet.get(blk.env.blocks.BlockID.STONE),
    this.map.blockSet.get(blk.env.blocks.BlockID.BRICK),
    this.map.blockSet.get(blk.env.blocks.BlockID.WOOD),
    this.map.blockSet.get(blk.env.blocks.BlockID.GLASS)
  ];

  // Say hi
  this.console.log('wsad / click drag to move');
  this.console.log('left click to place blocks');
  this.console.log('ctrl-left / right click to remove blocks');
  this.console.log('alt-enter for fullscreen/mouse lock');
  this.console.log('t to chat');
  this.console.log('o for options');
  this.console.log('don\'t be an ass!');

  // Simulated latency
  this.session.socket.simulatedLatency = launchOptions.simulatedLatency;
};
goog.inherits(blk.client.ClientGame, gf.Game);


/**
 * Interpolation delay time, in seconds.
 * Higher values will cause greater time shifting beheavior but help to smooth
 * out laggy players.
 * @private
 * @const
 * @type {number}
 */
blk.client.ClientGame.INTERPOLATION_DELAY_ = 300 / 1000;


/**
 * @override
 */
blk.client.ClientGame.prototype.disposeInternal = function() {
  // Cleanup view
  this.map.removeChunkView(this.localView);
  goog.dispose(this.localView);

  goog.base(this, 'disposeInternal');
};


/**
 * Gets the entity representing the local player.
 * HACK: this will be removed soon
 * @return {blk.env.Entity} Entity, if any.
 */
blk.client.ClientGame.prototype.getLocalEntity = function() {
  return this.localPlayer ? this.localPlayer.entity : null;
};


/**
 * Signals that the game is in a good state and can be started.
 */
blk.client.ClientGame.prototype.makeReady = function() {
  // Grab local player
  var player = this.state.getPlayerBySessionId(this.session.id);
  goog.asserts.assert(player);
  this.localPlayer = player;

  // Bind view to player
  player.view = this.localView;

  // Setup movement
  var localEntity = this.getLocalEntity();
  if (localEntity) {
    this.movement_.attach(localEntity);
  }
};


/**
 * @override
 */
blk.client.ClientGame.prototype.update = function(frame) {
  // Networking
  this.session.poll();

  // Only update state if still connected
  if (this.session.state != gf.net.SessionState.DISCONNECTED) {
    // State updates
    this.state.update(frame);
  } else {
    // Done! Die!
    // TODO(benvanik): disconnection
    gf.log.write('disconnected');
    this.console.log('disconnected!');

    this.sounds.playAmbient('player_leave');
    this.stopTicking();

    var d = blk.ui.Popup.show(blk.ui.alerts.disconnected, {
      reason: this.session.disconnectReason
    }, this.dom, this.display.mainFrame);
    d.addCallback(
        function(buttonId) {
          if (buttonId == 'reload') {
            window.location.reload(false);
          } else {
            window.location.href = 'http://google.com';
          }
        });
  }

  // Update UI bits
  this.console.update(frame);
  this.playerListing.update(frame);

  // Update views
  this.localView.update(frame, this.viewport.position);
};


/**
 * Handles a user connect event.
 * @param {!gf.net.User} user User.
 */
blk.client.ClientGame.prototype.handleUserConnect = function(user) {
  // Create player
  var player = new blk.Player(user);
  this.state.addPlayer(player);

  // TODO(benvanik): join/leave sound
  this.sounds.playAmbient('player_join');

  gf.log.write('client connected',
      user.sessionId, user.info.displayName, user.agent);

  this.console.log(
      user.info.displayName + ' (' + user.sessionId + ') connected on ' +
      user.agent.toString());
};


/**
 * Handles a user disconnect event.
 * @param {!gf.net.User} user User.
 */
blk.client.ClientGame.prototype.handleUserDisconnect = function(user) {
  var player = /** @type {blk.Player} */ (user.data);
  goog.asserts.assert(player);
  if (!player) {
    return;
  }

  // Remove from roster
  this.state.removePlayer(user);
  goog.dispose(player);

  // TODO(benvanik): join/leave sound
  this.sounds.playAmbient('player_leave');

  gf.log.write('client disconnected',
      user.sessionId, user.disconnectReason);

  this.console.log(
      user.info.displayName + ' (' + user.sessionId + ') disconnected:',
      gf.net.DisconnectReason.toString(user.disconnectReason));
};


/**
 * Sets a block and plays sound if required.
 * Note that the block specified may have originated from the network and as
 * such it may not be in our view but may be in the cache. Because of this, we
 * must pass the change off to the map, which will try to update the chunk.
 *
 * @param {number} x Block X.
 * @param {number} y Block Y.
 * @param {number} z Block Z.
 * @param {number} blockData Block Data.
 */
blk.client.ClientGame.prototype.setBlock = function(x, y, z, blockData) {
  var map = this.state.map;
  var oldData = 0;
  if (!blockData) {
    oldData = map.getBlock(x, y, z);
  }
  var changed = map.setBlock(x, y, z, blockData);

  // Play block sound, if any and only if needed
  if (changed) {
    var soundData = blockData ? blockData : oldData;
    if (soundData >> 8) {
      var block = map.blockSet.get(soundData >> 8);
      var cue = block ? block.material.actionCue : null;
      if (cue) {
        var viewport = this.viewport;
        var soundPosition = goog.vec.Vec3.createFloat32FromValues(x, y, z);
        var distance = goog.vec.Vec3.distance(viewport.position, soundPosition);
        if (distance < blk.env.MAX_SOUND_DISTANCE) {
          this.sounds.playPoint(cue, soundPosition);
        }
      }
    }
  }
};


/**
 * Creates an entity.
 * @param {number} entityId Entity ID.
 * @param {number} userId Wire ID of the user the entity represents, or 0xFF.
 * @return {blk.env.Entity} New entity.
 */
blk.client.ClientGame.prototype.createEntity = function(entityId, userId) {
  var entity = new blk.env.Entity(entityId);

  var localUser = this.session.getLocalUser();
  if (userId == localUser.wireId) {
    // Self
    gf.log.write('self create', entityId);
    // Bind entity and player
    entity.player = /** @type {!blk.Player} */ (localUser.data);
    entity.player.entity = entity;
  } else {
    // Others
    gf.log.write('other create', entityId, userId);
    var player = this.state.getPlayerByWireId(userId);
    if (player) {
      player.entity = entity;
      entity.player = player;
    }
  }

  if (entity) {
    this.state.map.addEntity(entity);

    entity.title = entity.player ? entity.player.user.info.displayName : null;

    if (entity == this.getLocalEntity()) {
      entity.confirmedState = entity.state.clone();
    }
  }

  return entity;
};


/**
 * Deletes an entity.
 * @param {number} entityId Entity ID.
 */
blk.client.ClientGame.prototype.deleteEntity = function(entityId) {
  gf.log.write('entity delete', entityId);
  var entity = this.state.map.getEntity(entityId);
  if (entity) {
    this.state.map.removeEntity(entity);
  }
};


/**
 * Updates an entities position.
 * @param {number} sequence Confirmed movement sequence number.
 * @param {!Array.<!blk.env.EntityState>} entityStates Entity states.
 */
blk.client.ClientGame.prototype.updateEntityPosition = function(
    sequence, entityStates) {
  // Confirm user commands
  this.movement_.confirmCommands(sequence);

  var localEntity = this.getLocalEntity();
  for (var n = 0; n < entityStates.length; n++) {
    var entityState = entityStates[n];
    if (localEntity && localEntity.id == entityState.entityId) {
      // Self
      //gf.log.write('self update', entityPositionData);
      localEntity.confirmedState = entityState.clone();
    } else {
      // Others
      //gf.log.write('other update', entityPositionData);
      // TODO(benvanik): lerp
      var entity = this.state.map.getEntity(entityState.entityId);
      if (entity) {
        entity.updateState(entityState);
      }
    }
  }
};


/**
 * @override
 */
blk.client.ClientGame.prototype.render = function(frame) {
  if (this.session.state == gf.net.SessionState.DISCONNECTED) {
    return;
  }

  var graphicsContext = this.graphicsContext;
  var renderState = this.renderState;
  var map = this.state.map;
  var viewport = this.viewport;

  viewport.far = this.localView.getDrawDistance();
  viewport.reset(this.display.getSize());

  // Grab input
  this.inputData.poll();

  // Process user input if required, and update viewport matrices
  // NOTE: this is done without the interpolation delay applied so that real
  // times get used
  this.movement_.update(frame, viewport, this.inputData);
  if (this.movement_.hasDied) {
    gf.log.write('network failure - movement backup');
    this.console.log('network failure');
    this.session.disconnect();
    this.stopTicking();
    return;
  }

  // Compute updated view matrix based on user entity
  var localEntity = this.getLocalEntity();
  if (localEntity) {
    // Run client-side prediction
    this.movement_.predictMovement(frame);

    var state = localEntity.state;
    var vm = viewport.viewMatrix;
    goog.vec.Quaternion.toRotationMatrix4(state.rotation, vm);
    goog.vec.Mat4.transpose(vm, vm);
    goog.vec.Mat4.translate(vm,
        -state.position[0], -state.position[1], -state.position[2]);
  }

  // Update viewport matrices/etc now that the controller logic has been applied
  viewport.calculate();

  // Handle input
  if (!this.console.processInput(frame, this.inputData)) {
    this.handleInput_(frame);
  }

  // Update audio - must be done after the viewport is updated
  this.audio.listener.update(viewport.inverseViewMatrix);

  // Timeshift by interpolation delay
  frame.time -= blk.client.ClientGame.INTERPOLATION_DELAY_;

  // Render the game
  if (graphicsContext.begin()) {
    // Reset render state
    renderState.reset(viewport, map.environment.skyColor, true);

    // Render the map and entities
    this.viewManager.render(frame, viewport, this.localPlayer);

    // Draw UI
    var mapStats = this.map.getStatisticsString();
    var renderStats = this.viewManager.getStatisticsString();
    var movement = this.localPlayer ? [
      this.localPlayer.entity.state.velocity[0].toFixed(8),
      this.localPlayer.entity.state.velocity[1].toFixed(8),
      this.localPlayer.entity.state.velocity[2].toFixed(8)].join(',') : '';
    this.console.render(frame, viewport, mapStats, renderStats, movement);
    this.playerListing.render(frame, viewport);
    this.drawInputUI_(frame);
    this.drawBlockTypes_(frame);

    graphicsContext.end();
  }

  this.inputData.reset();
};


/**
 * Draws the input UI.
 * @private
 * @param {!gf.RenderFrame} frame Current frame.
 */
blk.client.ClientGame.prototype.drawInputUI_ = function(frame) {
  var viewport = this.viewport;
  var uiAtlas = this.renderState.uiAtlas;

  var spriteBuffer = this.spriteBuffer_;
  spriteBuffer.clear();

  var slotCoords = blk.client.ClientGame.tmpVec4_;

  // If using mouse lock, draw a crosshair in the center of the screen
  if (this.inputData.mouse.isLocked) {
    var x = viewport.width / 2 / 2 - 8;
    var y = viewport.height / 2 / 2 - 8;
    uiAtlas.getSlotCoords(11, slotCoords);
    spriteBuffer.add(
        slotCoords[0], slotCoords[1],
        slotCoords[2] - slotCoords[0], slotCoords[3] - slotCoords[1],
        0xFFFFFFFF,
        x, y, 16, 16);
  }

  // TODO(benvanik): draw onscreen dpad/etc for touch

  var worldMatrix = blk.client.ClientGame.tmpMat4_;
  goog.vec.Mat4.setFromValues(worldMatrix,
      2, 0, 0, 0,
      0, 2, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1);

  this.renderState.beginSprites(uiAtlas, false);
  this.spriteBuffer_.draw(viewport.orthoMatrix, worldMatrix);
};


/**
 * Draws block type UI.
 * @private
 * @param {!gf.RenderFrame} frame Current frame.
 */
blk.client.ClientGame.prototype.drawBlockTypes_ = function(frame) {
  var viewport = this.viewport;
  var blockAtlas = this.renderState.blockAtlas;

  var spriteBuffer = this.spriteBuffer_;
  spriteBuffer.clear();

  // TODO(benvanik): add block types
  var x = 0;
  var width = this.blockTypes_.length * (16 + 1);
  var height = 16;
  var texCoords = blk.client.ClientGame.tmpVec4_;
  for (var n = 0; n < this.blockTypes_.length; n++) {
    var block = this.blockTypes_[n];
    blockAtlas.getSlotCoords(block.atlasSlot, texCoords);
    spriteBuffer.add(
        texCoords[0], texCoords[1],
        texCoords[2] - texCoords[0], texCoords[3] - texCoords[1],
        this.blockIndex_ == n ? 0xFFFFFFFF : 0xFF777777,
        x, 0, 16, 16);
    x += 16 + 1;
  }

  var worldMatrix = blk.client.ClientGame.tmpMat4_;
  goog.vec.Mat4.setFromValues(worldMatrix,
      2, 0, 0, 0,
      0, 2, 0, 0,
      0, 0, 1, 0,
      viewport.width / 2 - width, viewport.height - height * 2 - 2, 0, 1);

  this.renderState.beginSprites(blockAtlas, false);
  this.spriteBuffer_.draw(viewport.orthoMatrix, worldMatrix);
};


/**
 * Hit tests the block type UI.
 * @private
 * @param {!gf.input.MouseData} mouseData Mouse input data.
 * @return {number|undefined} Block index selected or undefined if non clicked.
 */
blk.client.ClientGame.prototype.hitTestBlockTypes_ = function(mouseData) {
  var scale = 2;
  var itemSize = (16 + 1) * scale;
  var width = this.blockTypes_.length * itemSize;
  var height = 16 * scale;
  if (mouseData.clientY >= this.viewport.height - height - 2) {
    var left = this.viewport.width / 2 - width / 2;
    var right = this.viewport.width / 2 + width / 2;
    if (mouseData.clientX >= left && mouseData.clientX <= right) {
      return Math.floor((mouseData.clientX - left) / itemSize);
    }
  }
  return undefined;
};


/**
 * Shows the settings dialog.
 * @private
 */
blk.client.ClientGame.prototype.showSettings_ = function() {
  this.input.setEnabled(false);

  // TODO(benvanik): proper dynamic view adjustment
  var oldViewDistance = this.settings.viewDistance;

  var d = blk.ui.Settings.show(this, this.dom, this.display.mainFrame);
  d.addCallback(
      function(buttonId) {
        if (buttonId == 'save') {
          // HACK: reload with new settings if view distance changed
          if (this.settings.viewDistance != oldViewDistance) {
            window.location.reload();
            return;
          }

          var user = this.session.getLocalUser();
          goog.asserts.assert(user);
          var userInfo = user.info.clone();
          userInfo.displayName = this.settings.userName;
          this.session.updateUserInfo(userInfo);

          this.input.mouse.setSensitivity(this.settings.mouseSensitivity);
          this.audio.setMuted(this.settings.audioMuted);
        }

        this.input.setEnabled(true);
      }, this);
};


/**
 * Handles local user input.
 * @private
 * @param {!gf.RenderFrame} frame Current frame.
 */
blk.client.ClientGame.prototype.handleInput_ = function(frame) {
  var viewport = this.viewport;
  var map = this.state.map;
  var keyboardData = this.inputData.keyboard;
  var mouseData = this.inputData.mouse;

  // TODO(benvanik): track goog.events.KeyCodes.PAUSE to pause update loop

  // Show settings
  if (keyboardData.didKeyGoDown(goog.events.KeyCodes.O)) {
    this.showSettings_();
    return;
  }

  // Block switching
  var didSwitchBlock = false;
  if (mouseData.dz) {
    didSwitchBlock = true;
    // TODO(benvanik): mac touchpad scroll
    var dz = mouseData.dz > 0 ? 1 : -1;
    this.blockIndex_ = (this.blockIndex_ + dz) % this.blockTypes_.length;
    if (this.blockIndex_ < 0) {
      this.blockIndex_ = this.blockTypes_.length - 1;
    }
  }
  if (keyboardData.didKeyGoDown(goog.events.KeyCodes.ONE)) {
    didSwitchBlock = true;
    this.blockIndex_ = 0;
  } else if (keyboardData.didKeyGoDown(goog.events.KeyCodes.TWO)) {
    didSwitchBlock = true;
    this.blockIndex_ = 1;
  } else if (keyboardData.didKeyGoDown(goog.events.KeyCodes.THREE)) {
    didSwitchBlock = true;
    this.blockIndex_ = 2;
  } else if (keyboardData.didKeyGoDown(goog.events.KeyCodes.FOUR)) {
    didSwitchBlock = true;
    this.blockIndex_ = 3;
  } else if (keyboardData.didKeyGoDown(goog.events.KeyCodes.FIVE)) {
    didSwitchBlock = true;
    this.blockIndex_ = 4;
  }
  if (mouseData.buttonsUp & gf.input.MouseButton.LEFT) {
    var clickedIndex = this.hitTestBlockTypes_(mouseData);
    if (goog.isDef(clickedIndex)) {
      didSwitchBlock = true;
      this.blockIndex_ = clickedIndex;
    }
  }
  if (didSwitchBlock) {
    this.sounds.playAmbient('click');
  }

  if (keyboardData.didKeyGoDown(goog.events.KeyCodes.M)) {
    if (this.playingMusic_) {
      this.backgroundTracks_.stopAll();
    } else {
      this.backgroundTracks_.play('track1');
    }
    this.playingMusic_ = !this.playingMusic_;
  }

  // Chunk rebuild
  if (keyboardData.didKeyGoDown(goog.events.KeyCodes.BACKSPACE)) {
    this.viewManager.rebuildAll();
  }

  // Debug visuals
  if (keyboardData.didKeyGoDown(goog.events.KeyCodes.V)) {
    this.viewManager.setDebugVisuals(!this.viewManager.debugVisuals);
  }

  // Actions - only if no other input event has eaten the input
  if (!didSwitchBlock) {
    if (this.getLocalEntity()) {
      this.handleInputActions_(frame);
    }
  }
};


/**
 * Seconds between action repeats when buttons are held.
 * @private
 * @const
 * @type {number}
 */
blk.client.ClientGame.ACTION_REPEAT_INTERVAL_ = (250 / 1000);


/**
 * Handles local user input for performing actions.
 * @private
 * @param {!gf.RenderFrame} frame Current frame.
 */
blk.client.ClientGame.prototype.handleInputActions_ = function(frame) {
  var viewport = this.viewport;
  var map = this.state.map;
  var view = this.localPlayer.view;
  goog.asserts.assert(view);

  var keyboardData = this.inputData.keyboard;
  var mouseData = this.inputData.mouse;

  var addButton = keyboardData.didKeyGoDown(goog.events.KeyCodes.E);
  var removeButton = false;

  if (!mouseData.isLocked) {
    // Drag mode
    if (mouseData.buttonsUp & gf.input.MouseButton.LEFT) {
      if (this.dragDelta_ < 4) {
        addButton = true;
      }
    }
    removeButton = mouseData.buttonsUp & gf.input.MouseButton.RIGHT;
    if (keyboardData.ctrlKey &&
        mouseData.buttonsUp & gf.input.MouseButton.LEFT) {
      removeButton = true;
      this.dragDelta_ = Number.MAX_VALUE;
    }
    if (mouseData.buttons) {
      this.dragDelta_ += Math.abs(mouseData.dx) + Math.abs(mouseData.dy);
    } else {
      this.dragDelta_ = 0;
    }
  } else {
    // Lock mode
    if (mouseData.buttonsDown & gf.input.MouseButton.LEFT) {
      this.repeatTime_ = frame.time;
      addButton |= true;
    } else if (mouseData.buttons & gf.input.MouseButton.LEFT) {
      var dt = frame.time - this.repeatTime_;
      if (dt > blk.client.ClientGame.ACTION_REPEAT_INTERVAL_) {
        addButton = true;
        this.repeatTime_ = frame.time;
      }
    } else if (mouseData.buttonsDown & gf.input.MouseButton.RIGHT) {
      this.repeatTime_ = frame.time;
      removeButton |= true;
    } else if (mouseData.buttons & gf.input.MouseButton.RIGHT) {
      var dt = frame.time - this.repeatTime_;
      if (dt > blk.client.ClientGame.ACTION_REPEAT_INTERVAL_) {
        removeButton = true;
        this.repeatTime_ = frame.time;
      }
    }
  }
  // If ctrl is held, turn adds into removes
  if (addButton && keyboardData.ctrlKey) {
    addButton = false;
    removeButton = true;
  }
  if (removeButton) {
    // Remove button takes priority
    addButton = false;
  }

  if (addButton || removeButton) {
    var mx = mouseData.clientX;
    var my = mouseData.clientY;
    if (mouseData.isLocked) {
      mx = viewport.width / 2;
      my = viewport.height / 2;
    }
    var ray = viewport.getRay(mx, my);
    var maxDistance = (this.godMode || keyboardData.shiftKey) ?
        blk.env.MAX_ACTION_DISTANCE_GOD : blk.env.MAX_ACTION_DISTANCE;
    var intersection = view.intersectBlock(ray, maxDistance);
    // TODO(benvanik): check on new add position, not existing position
    if (intersection && intersection.distance <= maxDistance) {
      // Find the block on the side we care about
      var wx = intersection.blockX;
      var wy = intersection.blockY;
      var wz = intersection.blockZ;
      if (addButton) {
        // Determine the face intersected and add the block there
        var dx = 0;
        var dy = 0;
        var dz = 0;
        var ipt = intersection.point;
        if (ipt[0] == wx) {
          dx--;
        } else if (ipt[0] == wx + 1) {
          dx++;
        }
        if (ipt[1] == wy) {
          dy--;
        } else if (ipt[1] == wy + 1) {
          dy++;
        }
        if (ipt[2] == wz) {
          dz--;
        } else if (ipt[2] == wz + 1) {
          dz++;
        }
        var nx = wx + dx;
        var ny = wy + dy;
        var nz = wz + dz;
        var block = this.blockTypes_[this.blockIndex_];

        // Client-side action
        this.setBlock(nx, ny, nz, block.id << 8);

        // Send to server
        this.session.send(blk.net.packets.SetBlock.createData(
            nx, ny, nz, block.id << 8));
      } else if (removeButton) {
        // Client-side action
        this.setBlock(wx, wy, wz, 0);

        // Send to server
        this.session.send(blk.net.packets.SetBlock.createData(
            wx, wy, wz, 0));
      }
    }
  }

  // This code will draw a block along a ray
  // var ray = viewport.getRay(mouseData.clientX, mouseData.clientY);
  // var maxDistance = blk.env.MAX_ACTION_DISTANCE_GOD;
  // var intersection = map.intersectBlock(ray, maxDistance);
  // // TODO(benvanik): check on new add position, not existing position
  // if (intersection && intersection.distance <= maxDistance) {
  //   var wx = intersection.blockX;
  //   var wy = intersection.blockY;
  //   var wz = intersection.blockZ;
  //   var block = this.blockTypes_[this.blockIndex_];
  //   map.drawBlocks(
  //       ray[0], ray[1], ray[2],
  //       wx, wy, wz,
  //       block.id << 8);
  //   if (block.material.actionCue) {
  //     this.sounds.playPoint(block.material.actionCue,
  //         goog.vec.Vec3.createFloat32FromValues(ray[0], ray[1], ray[2]));
  //   }
  // }
};


/**
 * Temp mat4 for math.
 * @private
 * @type {!goog.vec.Mat4.Type}
 */
blk.client.ClientGame.tmpMat4_ = goog.vec.Mat4.createFloat32();


/**
 * Temp vec4 for math.
 * @private
 * @type {!goog.vec.Vec4.Float32}
 */
blk.client.ClientGame.tmpVec4_ = goog.vec.Vec4.createFloat32();
