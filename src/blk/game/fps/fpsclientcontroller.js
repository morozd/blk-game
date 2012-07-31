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

goog.provide('blk.game.fps.FpsClientController');

goog.require('blk.assets.audio.Music');
goog.require('blk.env.client.ViewRenderer');
goog.require('blk.game.client.ClientController');
goog.require('blk.sim.Camera');
goog.require('blk.sim.World');
goog.require('blk.ui.Menubar');
goog.require('blk.ui.PlayerListing');
goog.require('gf.vec.Viewport');
goog.require('goog.events.KeyCodes');
goog.require('goog.vec.Mat4');
goog.require('goog.vec.Vec4');



/**
 * Simple FPS game mode.
 * Can be subclassed or used on its own.
 * @constructor
 * @extends {blk.game.client.ClientController}
 * @param {!blk.game.client.ClientGame} game Client game.
 * @param {!gf.net.ClientSession} session Network session.
 */
blk.game.fps.FpsClientController = function(game, session) {
  goog.base(this, game, session);

  var renderState = this.game.getRenderState();

  // TODO(benvanik): remove this as better ways of adding UI are done
  /**
   * Sprite buffer used for UI drawing.
   * @private
   * @type {!gf.graphics.SpriteBuffer}
   */
  this.spriteBuffer_ = renderState.createSpriteBuffer();
  this.registerDisposable(this.spriteBuffer_);
  this.spriteBuffer_.restore();

  /**
   * Player listing.
   * @private
   * @type {!blk.ui.PlayerListing}
   */
  this.playerListing_ = new blk.ui.PlayerListing(this);
  this.addWidget(this.playerListing_);
  if (this.session.isLocal()) {
    this.playerListing_.setVisible(false);
  }

  /**
   * Menubar.
   * @private
   * @type {!blk.ui.Menubar}
   */
  this.menubar_ = new blk.ui.Menubar(this.game);
  this.addWidget(this.menubar_);

  // /**
  //  * Toolbar.
  //  * @private
  //  * @type {!blk.ui.Toolbar}
  //  */
  // this.toolbar_ = new blk.ui.Toolbar(this.game);
  // this.addWidget(this.toolbar_);

  /**
   * Background music track list.
   * @private
   * @type {!gf.audio.TrackList}
   */
  this.musicTrackList_ = blk.assets.audio.Music.create(
      this.game.getAssetManager(), this.game.getAudioManager().context);
  this.registerDisposable(this.musicTrackList_);

  // Setup music
  var musicController = this.game.getMusicController();
  musicController.setTrackList(this.musicTrackList_);

  /**
   * World entity, containing the map and renderable entities (players/etc).
   * Initialized when the entity is replicated.
   * @private
   * @type {blk.sim.World}
   */
  this.world_ = null;

  /**
   * Players current viewport.
   * @private
   * @type {!gf.vec.Viewport}
   */
  this.playerViewport_ = new gf.vec.Viewport();

  // TODO(benvanik): move to client camera?
  /**
   * Map view renderer.
   * @private
   * @type {blk.env.client.ViewRenderer}
   */
  this.viewRenderer_ = null;
};
goog.inherits(blk.game.fps.FpsClientController,
    blk.game.client.ClientController);


/**
 * @override
 */
blk.game.fps.FpsClientController.prototype.entityAdded =
    function(entity) {
  goog.base(this, 'entityAdded', entity);

  if (entity instanceof blk.sim.World) {
    // Setup world
    // This binds the map and the world together
    this.world_ = entity;
    this.world_.setMap(this.getMap());
  } else if (entity instanceof blk.sim.Camera) {
    if (entity.getOwner() == this.session.getLocalUser()) {
      entity.setMap(this.getMap());

      // Setup view manager
      this.viewRenderer_ = new blk.env.client.ViewRenderer(
          this.game.getRenderState(), this.getMap(), entity.getView());
      this.registerDisposable(this.viewRenderer_);
    }
  }
};


/**
 * @override
 */
blk.game.fps.FpsClientController.prototype.entityRemoved =
    function(entity) {
  goog.base(this, 'entityRemoved', entity);
};


/**
 * @override
 */
blk.game.fps.FpsClientController.prototype.handlePlayersChanged =
    function() {
  goog.base(this, 'handlePlayersChanged');

  this.playerListing_.refresh();
};


/**
 * @override
 */
blk.game.fps.FpsClientController.prototype.update =
    function(frame) {
  goog.base(this, 'update', frame);
};


/**
 * @override
 */
blk.game.fps.FpsClientController.prototype.processInput =
    function(frame, inputData) {
  if (goog.base(this, 'processInput', frame, inputData)) {
    return true;
  }

  var keyboardData = inputData.keyboard;
  var mouseData = inputData.mouse;

  // TODO(benvanik): track goog.events.KeyCodes.PAUSE to pause update loop

  // Show settings/etc
  if (keyboardData.didKeyGoDown(goog.events.KeyCodes.O)) {
    this.game.playClick();
    this.game.showSettingsPopup();
    return true;
  } else if (keyboardData.didKeyGoDown(goog.events.KeyCodes.H)) {
    this.game.playClick();
    this.game.showHelpPopup();
    return true;
  } else if (keyboardData.didKeyGoDown(goog.events.KeyCodes.TAB)) {
    this.game.playClick();
    this.playerListing_.toggleVisibility();
    return true;
  }

  // Toggle audio
  if (keyboardData.didKeyGoDown(goog.events.KeyCodes.M)) {
    this.game.playClick();
    var musicController = this.game.getMusicController();
    musicController.togglePlayback();
  }

  // Block switching
  // TODO(benvanik): move to inventory system
  // var localPlayer = this.getLocalPlayer();
  // var didSwitchBlock = false;
  // if (mouseData.dz) {
  //   didSwitchBlock = true;
  //   // TODO(benvanik): mac touchpad scroll
  //   var dz = mouseData.dz > 0 ? 1 : -1;
  //   var blockTypeCount = localPlayer.blockTypes.length;
  //   localPlayer.blockIndex = (localPlayer.blockIndex + dz) % blockTypeCount;
  //   if (localPlayer.blockIndex < 0) {
  //     localPlayer.blockIndex = blockTypeCount - 1;
  //   }
  // }
  // if (keyboardData.didKeyGoDown(goog.events.KeyCodes.ONE)) {
  //   didSwitchBlock = true;
  //   localPlayer.blockIndex = 0;
  // } else if (keyboardData.didKeyGoDown(goog.events.KeyCodes.TWO)) {
  //   didSwitchBlock = true;
  //   localPlayer.blockIndex = 1;
  // } else if (keyboardData.didKeyGoDown(goog.events.KeyCodes.THREE)) {
  //   didSwitchBlock = true;
  //   localPlayer.blockIndex = 2;
  // } else if (keyboardData.didKeyGoDown(goog.events.KeyCodes.FOUR)) {
  //   didSwitchBlock = true;
  //   localPlayer.blockIndex = 3;
  // } else if (keyboardData.didKeyGoDown(goog.events.KeyCodes.FIVE)) {
  //   didSwitchBlock = true;
  //   localPlayer.blockIndex = 4;
  // }
  // if (didSwitchBlock) {
  //   this.game.playClick();
  // }
  // if (mouseData.buttonsUp & gf.input.MouseButton.LEFT) {
  //   var clickedIndex = this.hitTestBlockTypes_(mouseData);
  //   if (goog.isDef(clickedIndex)) {
  //     localPlayer.blockIndex = clickedIndex;
  //     this.game.playClick();
  //     return true;
  //   }
  // }

  // Always use the previous frames viewport for input processing
  // There's a very small chance it is incorrect (first frame rendered), but
  // by using the viewport that represents what the player clicked on it can
  // help reduce inconsistencies when moving fast
  var viewport = this.playerViewport_;

  // Process controller input
  // TODO(benvanik): cleanup
  var localPlayer = this.getLocalPlayer();
  if (localPlayer) {
    var camera = localPlayer.getCamera();
    camera.prepareFrame(viewport);

    var controller = localPlayer.getController();
    if (!controller.processInput(frame, inputData, viewport)) {
      // Failed for some reason - likely prediction errors
      this.handleError('Input backup');
      return true;
    }
  }
  return false;
};


/**
 * @override
 */
blk.game.fps.FpsClientController.prototype.processPhysics =
    function(frame) {
};


/**
 * @override
 */
blk.game.fps.FpsClientController.prototype.beginDrawing =
    function(frame) {
  goog.base(this, 'beginDrawing', frame);

  var renderState = this.game.getRenderState();

  // Reset render state
  var map = this.getMap();
  renderState.reset(map.environment.skyColor, true);
};


/**
 * @override
 */
blk.game.fps.FpsClientController.prototype.drawWorld =
    function(frame) {
  goog.base(this, 'drawWorld', frame);

  var renderState = this.game.getRenderState();
  var renderList = renderState.getRenderList();

  // Initialize viewport
  var viewport = this.playerViewport_;
  var display = this.game.getDisplay();
  var localPlayer = this.getLocalPlayer();
  if (localPlayer) {
    var camera = localPlayer.getCamera();
    viewport.setFar(camera.getView().getDrawDistance());
    viewport.setSize(display.getSize());
    camera.calculateViewport(viewport);
  } else {
    viewport.setFar(100);
    viewport.setSize(display.getSize());
    // ?
  }

  // Render map
  if (this.viewRenderer_) {
    this.viewRenderer_.render(frame, viewport);
  }

  // Render the simulation
  if (this.world_) {
    this.world_.render(frame, viewport, renderList);
  }
};


/**
 * @override
 */
blk.game.fps.FpsClientController.prototype.drawOverlays =
    function(frame, inputData) {
  goog.base(this, 'drawOverlays', frame, inputData);

  // Draw UI
  this.drawInputUI_(frame, inputData);
  this.drawBlockTypes_(frame);
};


/**
 * @override
 */
blk.game.fps.FpsClientController.prototype.getDebugInfo = function() {
  return this.viewRenderer_ ? this.viewRenderer_.getStatisticsString() : null;
};


/**
 * Draws the input UI.
 * @private
 * @param {!gf.RenderFrame} frame Current frame.
 * @param {!gf.input.Data} inputData Updated input data.
 */
blk.game.fps.FpsClientController.prototype.drawInputUI_ =
    function(frame, inputData) {
  var renderState = this.game.getRenderState();
  var viewport = this.getScreenViewport();

  var uiAtlas = renderState.uiAtlas;

  var spriteBuffer = this.spriteBuffer_;
  spriteBuffer.clear();

  var slotCoords = blk.game.fps.FpsClientController.tmpVec4_;

  // If using mouse lock, draw a crosshair in the center of the screen
  if (inputData.mouse.isLocked) {
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

  var worldMatrix = blk.game.fps.FpsClientController.tmpMat4_;
  goog.vec.Mat4.setFromValues(worldMatrix,
      2, 0, 0, 0,
      0, 2, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1);

  renderState.beginSprites(uiAtlas, false);
  spriteBuffer.draw(viewport.orthoMatrix, worldMatrix);
};


/**
 * Draws block type UI.
 * @private
 * @param {!gf.RenderFrame} frame Current frame.
 */
blk.game.fps.FpsClientController.prototype.drawBlockTypes_ =
    function(frame) {
  var renderState = this.game.getRenderState();
  var viewport = this.getScreenViewport();
  var blockAtlas = renderState.blockAtlas;

  var selectedIndex = 0;//localPlayer.blockIndex;
  var blockTypes = [];//localPlayer.blockTypes;

  var spriteBuffer = this.spriteBuffer_;
  spriteBuffer.clear();

  var x = 0;
  var width = blockTypes.length * (16 + 1);
  var height = 16;
  var texCoords = blk.game.fps.FpsClientController.tmpVec4_;
  for (var n = 0; n < blockTypes.length; n++) {
    var block = blockTypes[n];
    blockAtlas.getSlotCoords(block.atlasSlot, texCoords);
    spriteBuffer.add(
        texCoords[0], texCoords[1],
        texCoords[2] - texCoords[0], texCoords[3] - texCoords[1],
        selectedIndex == n ? 0xFFFFFFFF : 0xFF777777,
        x, 0, 16, 16);
    x += 16 + 1;
  }

  var worldMatrix = blk.game.fps.FpsClientController.tmpMat4_;
  goog.vec.Mat4.setFromValues(worldMatrix,
      2, 0, 0, 0,
      0, 2, 0, 0,
      0, 0, 1, 0,
      viewport.width / 2 - width, viewport.height - height * 2 - 2, 0, 1);

  renderState.beginSprites(blockAtlas, false);
  spriteBuffer.draw(viewport.orthoMatrix, worldMatrix);
};


/**
 * Hit tests the block type UI.
 * @private
 * @param {!gf.input.MouseData} mouseData Mouse input data.
 * @return {number|undefined} Block index selected or undefined if non clicked.
 */
blk.game.fps.FpsClientController.prototype.hitTestBlockTypes_ =
    function(mouseData) {
  var viewport = this.getScreenViewport();

  var blockTypes = [];//localPlayer.blockTypes;

  var scale = 2;
  var itemSize = (16 + 1) * scale;
  var width = blockTypes.length * itemSize;
  var height = 16 * scale;
  if (mouseData.clientY >= viewport.height - height - 2) {
    var left = viewport.width / 2 - width / 2;
    var right = viewport.width / 2 + width / 2;
    if (mouseData.clientX >= left && mouseData.clientX <= right) {
      return Math.floor((mouseData.clientX - left) / itemSize);
    }
  }
  return undefined;
};


/**
 * Temp mat4 for math.
 * @private
 * @type {!goog.vec.Mat4.Type}
 */
blk.game.fps.FpsClientController.tmpMat4_ =
    goog.vec.Mat4.createFloat32();


/**
 * Temp vec4 for math.
 * @private
 * @type {!goog.vec.Vec4.Float32}
 */
blk.game.fps.FpsClientController.tmpVec4_ =
    goog.vec.Vec4.createFloat32();
