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

goog.provide('blk.game.client.ClientController');

goog.require('blk.env.client.ClientMap');
goog.require('blk.game.client.ClientNetService');
goog.require('blk.game.client.ClientPlayer');
goog.require('blk.ui.Console');
goog.require('blk.ui.screens.StatusScreen');
goog.require('gf.input.Data');
goog.require('gf.log');
goog.require('gf.net.DisconnectReason');
goog.require('gf.net.SessionState');
goog.require('gf.net.chat.ClientChatService');
goog.require('goog.Disposable');
goog.require('goog.async.Deferred');



/**
 * Abstract client game controller.
 * @constructor
 * @extends {goog.Disposable}
 * @param {!blk.game.client.ClientGame} game Client game.
 * @param {!gf.net.ClientSession} session Network session.
 */
blk.game.client.ClientController = function(game, session) {
  goog.base(this);

  /**
   * Client game this instance is controlling.
   * @protected
   * @type {!blk.game.client.ClientGame}
   */
  this.game = game;

  /**
   * Network session.
   * @type {!gf.net.ClientSession}
   */
  this.session = session;

  /**
   * Client net service.
   * @private
   * @type {!blk.game.client.ClientNetService}
   */
  this.netService_ = new blk.game.client.ClientNetService(this);
  this.session.registerService(this.netService_);

  /**
   * Chat client.
   * @type {!gf.net.chat.ClientChatService}
   */
  this.chatService_ = new gf.net.chat.ClientChatService(this.session);
  this.session.registerService(this.chatService_);

  /**
   * Game map.
   * @private
   * @type {!blk.env.client.ClientMap}
   */
  this.map_ = new blk.env.client.ClientMap();
  this.registerDisposable(this.map_);

  /**
   * Player listing.
   * @private
   * @type {!Array.<!blk.game.client.ClientPlayer>}
   */
  this.players_ = [];

  // Add all players currently in the session
  this.addInitialPlayers_();

  /**
   * Input data storage.
   * @private
   * @type {!gf.input.Data}
   */
  this.inputData_ = new gf.input.Data(this.game.getInputManager());

  /**
   * UI widgets.
   * @private
   * @type {!Array.<!blk.ui.Widget>}
   */
  this.widgets_ = [];

  /**
   * Console.
   * @type {!blk.ui.Console}
   */
  this.console_ = new blk.ui.Console(this.game, this.chatService_);
  this.registerDisposable(this.console_);
  //this.addWidget(this.console_);

  // Simulated latency
  var launchOptions = this.game.launchOptions;
  this.session.socket.simulatedLatency = launchOptions.simulatedLatency;
};
goog.inherits(blk.game.client.ClientController, goog.Disposable);


/**
 * @return {!blk.env.client.ClientMap} Game map.
 */
blk.game.client.ClientController.prototype.getMap = function() {
  return this.map_;
};


/**
 * Adds all players initially in the session.
 * @private
 */
blk.game.client.ClientController.prototype.addInitialPlayers_ = function() {
  for (var n = 0; n < this.session.users.length; n++) {
    var user = this.session.users[n];
    var player = new blk.game.client.ClientPlayer(this, user);
    user.data = player;
    this.players_.push(player);
  }
};


/**
 * Gets a list of all currently connected players.
 * Do not modify the results. The results may change at any time.
 * @return {!Array.<!blk.game.client.ClientPlayer>} A list of players.
 */
blk.game.client.ClientController.prototype.getPlayerList = function() {
  return this.players_;
};


/**
 * Gets a player by session ID.
 * @param {string} sessionId User session ID.
 * @return {blk.game.client.ClientPlayer} Player, if found.
 */
blk.game.client.ClientController.prototype.getPlayerBySessionId =
    function(sessionId) {
  var user = this.session.getUserBySessionId(sessionId);
  if (user) {
    return /** @type {blk.game.client.ClientPlayer} */ (user.data);
  }
  return null;
};


/**
 * Gets a player by wire ID.
 * @param {number} wireId User wire ID.
 * @return {blk.game.client.ClientPlayer} Player, if found.
 */
blk.game.client.ClientController.prototype.getPlayerByWireId =
    function(wireId) {
  var user = this.session.getUserByWireId(wireId);
  if (user) {
    return /** @type {blk.game.client.ClientPlayer} */ (user.data);
  }
  return null;
};


/**
 * Adds a widget to the game screen.
 * @protected
 * @param {!blk.ui.Widget} widget Widget to add.
 */
blk.game.client.ClientController.prototype.addWidget = function(widget) {
  // TODO(benvanik): add more logic around widget lifetimes/etc
  this.widgets_.push(widget);
  this.registerDisposable(widget);
  widget.enterDocument();
};


/**
 * Loads any resources required by the controller before the game can start.
 * @return {!goog.async.Deferred} A deferred fulfilled when the client is ready.
 */
blk.game.client.ClientController.prototype.load = function() {
  var deferred = new goog.async.Deferred();
  // TODO(benvanik): wait on initial asset load?
  deferred.callback();
  return deferred;
};


/**
 * Handles connection events.
 * When this is called the user is fully connected and ready to interact with
 * the server.
 */
blk.game.client.ClientController.prototype.handleConnected = function() {
};


/**
 * Handles disconnection events.
 * This may occur either by user choice or some other reason. Once it is called
 * the server should be considered unreachable.
 * @param {gf.net.DisconnectReason} reason Disconnect reason.
 */
blk.game.client.ClientController.prototype.handleDisconnect = function(reason) {
  var message = 'Disconnected: ' + gf.net.DisconnectReason.toString(reason);
  this.console_.log(message);

  // Stop the game
  this.game.playPlayerLeave();
  this.stopTicking();

  // TODO(benvanik): cleanup players/etc?

  // Display disconnection dialog
  blk.ui.screens.StatusScreen.showDisconnected(
      this.game.getScreenManager(), this.game.getDisplay().getDomElement(),
      reason).addCallback(function(buttonId) {
    // TODO(benvanik): make the dialog go to the main menu instead
    if (buttonId == 'reload') {
      window.location.reload(false);
    } else {
      window.location.href = 'http://google.com';
    }
  });
};


/**
 * Handles game-ending errors.
 * @protected
 * @param {string} message Error message.
 * @param {*=} opt_arg Optional argument.
 */
blk.game.client.ClientController.prototype.handleError =
    function(message, opt_arg) {
  // Log the error
  gf.log.write('Error: ' + message, opt_arg);
  this.console_.log('Error: ' + message, opt_arg);

  // Graceful disconnect
  // TODO(benvanik): log with server?
  this.session.disconnect(gf.net.DisconnectReason.USER);

  // Stop the game
  this.game.playPlayerLeave();
  this.stopTicking();

  // Display error dialog
  blk.ui.screens.StatusScreen.showDisconnected(
      this.game.getScreenManager(), this.game.getDisplay().getDomElement(),
      message, opt_arg).addCallback(function(buttonId) {
    // TODO(benvanik): make the dialog go to the main menu instead
    if (buttonId == 'reload') {
      window.location.reload(false);
    } else {
      window.location.href = 'http://google.com';
    }
  });
};


/**
 * Maximum amount of time, in ms, the network poll is allowed to take.
 * @private
 * @const
 * @type {number}
 */
blk.game.client.ClientController.MAX_NETWORK_POLL_TIME_ = 2;


/**
 * Updates the game contents.
 * @param {!gf.UpdateFrame} frame Current update frame.
 */
blk.game.client.ClientController.prototype.update = function(frame) {
  // Ignore updating when disconnected/stopped
  if (this.session.state == gf.net.SessionState.DISCONNECTED) {
    return;
  }

  // Poll for network activity
  this.session.poll(blk.game.client.ClientController.MAX_NETWORK_POLL_TIME_);

  // Check for new disconnection
  if (this.session.state == gf.net.SessionState.DISCONNECTED) {
    this.handleDisconnect(this.session.disconnectReason);
    return;
  }

  // Update game state
  this.map_.update(frame);

  // Update UI bits
  this.console_.update(frame);
};


/**
 * Interpolation delay time, in seconds.
 * Higher values will cause greater time shifting beheavior but help to smooth
 * out laggy players.
 * TODO(benvanik): pull from config
 * @private
 * @const
 * @type {number}
 */
blk.game.client.ClientController.INTERPOLATION_DELAY_ = 300 / 1000;


/**
 * Renders the screen contents.
 * @param {!gf.RenderFrame} frame Current render frame.
 */
blk.game.client.ClientController.prototype.render = function(frame) {
  // Ignore rendering when disconnected/stopped
  if (this.session.state == gf.net.SessionState.DISCONNECTED) {
    return;
  }

  // var viewport = this.viewport;
  // viewport.far = this.localView.getDrawDistance();
  // viewport.reset(this.display.getSize());

  // Grab latest input data as early in the frame as possible
  this.inputData_.poll();

  // Process physics (and user input)
  // NOTE: this is done without the interpolation delay so real times get used
  this.processPhysics(frame);
  // TODO(benvanik): handle input backup?

  // Handle user input (for UI/actions/etc)
  // Let the console eat the data first, if it wants to
  if (!this.console_.processInput(frame, this.inputData_)) {
    this.processInput(frame, this.inputData_);
  }

  // Update audio listener with the latest viewport
  // var audioManager = this.game.getAudioManager();
  // audioManager.listener.update(viewport.inverseViewMatrix);

  // Timeshift by interpolation delay
  // This ensures we render at the time we should be
  // (I think ;)
  var originalFrameTime = frame.time;
  frame.time -= blk.game.client.ClientController.INTERPOLATION_DELAY_;

  // Render the game
  var graphicsContext = this.game.getGraphicsContext();
  if (graphicsContext.begin()) {
    // Draw the frame
    this.beginDrawing(frame);
    this.drawWorld(frame);
    this.drawOverlays(frame);
    this.endDrawing(frame);

    graphicsContext.end();
  }

  // Restore time
  frame.time = originalFrameTime;

  // Reset input data cache
  this.inputData_.reset();
};


/**
 * Processes physics and movement.
 * @protected
 * @param {!gf.RenderFrame} frame Current render frame.
 */
blk.game.client.ClientController.prototype.processPhysics = function(frame) {
};


/**
 * Processes new input data.
 * @protected
 * @param {!gf.RenderFrame} frame Current render frame.
 * @param {!gf.input.Data} inputData Updated input data.
 */
blk.game.client.ClientController.prototype.processInput =
    function(frame, inputData) {
};


/**
 * Begins drawing the game.
 * Called immediately after the render state has been reset.
 * @protected
 * @param {!gf.RenderFrame} frame Current render frame.
 */
blk.game.client.ClientController.prototype.beginDrawing = function(frame) {
};


/**
 * Draws the map and entities to the screen.
 * @protected
 * @param {!gf.RenderFrame} frame Current render frame.
 */
blk.game.client.ClientController.prototype.drawWorld = function(frame) {
  //this.viewManager.render(frame, this.viewport, this.localPlayer);
};


/**
 * Draws any overlays and UI to the screen.
 * @param {!gf.RenderFrame} frame Current render frame.
 */
blk.game.client.ClientController.prototype.drawOverlays = function(frame) {
  var mapStats = this.map_.getStatisticsString();
  var renderStats = '';//this.viewManager.getStatisticsString();
  // var movement = this.localPlayer ? [
  //   this.localPlayer.entity.state.velocity[0].toFixed(8),
  //   this.localPlayer.entity.state.velocity[1].toFixed(8),
  //   this.localPlayer.entity.state.velocity[2].toFixed(8)].join(',') : '';
  //this.console_.render(frame, viewport, mapStats, renderStats);//, movement);
};


/**
 * Ends drawing the game.
 * Called immediately before ending the graphics context.
 * @param {!gf.RenderFrame} frame Current render frame.
 */
blk.game.client.ClientController.prototype.endDrawing = function(frame) {
};
