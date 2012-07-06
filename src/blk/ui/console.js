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

goog.provide('blk.ui.Console');

goog.require('gf.log');
goog.require('gf.net.chat.EventType');
goog.require('goog.Disposable');
goog.require('goog.dom.TagName');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventType');
goog.require('goog.events.KeyCodes');
goog.require('goog.string');
goog.require('goog.style');
goog.require('goog.vec.Mat4');
goog.require('goog.vec.Vec4');



/**
 * Simple console with basic input.
 *
 * @constructor
 * @extends {goog.Disposable}
 * @param {!blk.game.client.ClientGame} game Game.
 * @param {!gf.net.chat.ClientChatService} chatService Chat service.
 */
blk.ui.Console = function(game, chatService) {
  goog.base(this);

  /**
   * Chat service.
   * @private
   * @type {!gf.net.chat.ClientChatService}
   */
  this.chatService_ = chatService;

  /**
   * Input manager
   * @type {!gf.input.InputManager}
   */
  this.inputManager_ = game.getInputManager();

  /**
   * Graphics context.
   * @private
   * @type {!gf.graphics.GraphicsContext}
   */
  this.graphicsContext_ = game.getGraphicsContext();

  /**
   * Render state.
   * @private
   * @type {!blk.graphics.RenderState}
   */
  this.renderState_ = game.getRenderState();

  /**
   * Sprite buffer used for text drawing.
   * @private
   * @type {!gf.graphics.SpriteBuffer}
   */
  this.textBuffer_ = this.renderState_.createSpriteBuffer();
  this.registerDisposable(this.textBuffer_);

  /**
   * Whether the console has input focus.
   * @type {boolean}
   */
  this.hasFocus = false;

  /**
   * Entries.
   * @private
   * @type {!Array.<!blk.ui.Console.Entry_>}
   */
  this.entries_ = [];

  var dom = game.dom;
  var inputEl = dom.createElement(goog.dom.TagName.DIV);
  goog.style.setStyle(inputEl, {
    'position': 'absolute',
    'left': '10px',
    'bottom': '10px',
    'width': '50%',
    'display': 'none'
  });

  var textBox = /** @type {!HTMLInputElement} */ (
      dom.createElement(goog.dom.TagName.INPUT));
  textBox.type = 'text';
  goog.style.setStyle(textBox, {
    'font-family': 'monospace-8bit',
    'font-size': '1em',
    'border': '1px solid black',
    'background-color': '#EEE',
    'color': '#000',
    'width': '100%',
    'padding': '3px'
  });
  inputEl.appendChild(textBox);

  var rootEl = game.getDisplay().getInputElement();
  rootEl.parentNode.appendChild(inputEl);

  /**
   * Input text box container element.
   * @private
   * @type {!Element}
   */
  this.inputEl_ = inputEl;

  /**
   * Input text box input element.
   * @private
   * @type {!HTMLInputElement}
   */
  this.textBox_ = textBox;

  /**
   * Event handler.
   * @private
   * @type {!goog.events.EventHandler}
   */
  this.eh_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eh_);

  this.eh_.listen(textBox, goog.events.EventType.KEYDOWN, this.handleKeyDown_);
};
goog.inherits(blk.ui.Console, goog.Disposable);


/**
 * Spacing between each line in the console.
 * @private
 * @const
 * @type {number}
 */
blk.ui.Console.LINE_SPACING_ = 2;


/**
 * Time to leave entries on the screen before they expire, in seconds.
 * @private
 * @const
 * @type {number}
 */
blk.ui.Console.ENTRY_TIMEOUT_ = 15;


/**
 * Handles key down events.
 * @private
 * @param {!goog.events.BrowserEvent} e Event.
 */
blk.ui.Console.prototype.handleKeyDown_ = function(e) {
  switch (e.keyCode) {
    case goog.events.KeyCodes.ESC:
      // Cancel
      this.hideInputBox_();
      e.preventDefault();
      e.stopPropagation();
      break;
    case goog.events.KeyCodes.ENTER:
      // Commit
      var message = goog.string.normalizeSpaces(goog.string.normalizeWhitespace(
          goog.string.trim(this.textBox_.value)));
      if (message.length) {
        this.chatService_.postMessage('main', message);
      }
      this.hideInputBox_();
      e.preventDefault();
      e.stopPropagation();
      break;
  }
};


/**
 * Shows the input text box, if it's not up.
 * @private
 */
blk.ui.Console.prototype.showInputBox_ = function() {
  //this.session.chat.postMessage('main', 'hello world!');
  goog.style.setStyle(this.inputEl_, {
    'display': ''
  });

  // Disable input system, for now
  this.inputManager_.setEnabled(false);

  // Focus
  goog.global.setTimeout(goog.bind(function() {
    this.textBox_.focus();
  }, this), 10);
};


/**
 * Hides the input text box, if it's up.
 * @private
 */
blk.ui.Console.prototype.hideInputBox_ = function() {
  this.textBox_.value = '';
  this.textBox_.blur();

  goog.style.setStyle(this.inputEl_, {
    'display': 'none'
  });

  // Re-enable input system
  this.inputManager_.setEnabled(true);

  // Re-focus the input element
  this.inputManager_.inputElement.focus();
};


/**
 * Processes a new frame of input.
 * @param {!gf.RenderFrame} frame Current render frame.
 * @param {!gf.input.Data} inputData Up-to-date input data.
 * @return {boolean} True if the input was handled and should be ignored by the
 *     application.
 */
blk.ui.Console.prototype.processInput = function(frame, inputData) {
  var keyboardData = inputData.keyboard;
  if (keyboardData.didKeyGoDown(goog.events.KeyCodes.T)) {
    this.showInputBox_();
    if (this.inputManager_.keyboard) {
      this.inputManager_.keyboard.reset();
    }
    return true;
  }

  return false;
};


/**
 * Updates the console state.
 * @param {!gf.UpdateFrame} frame Current update frame.
 */
blk.ui.Console.prototype.update = function(frame) {
  // TODO(benvanik): expire messages, etc

  // Poll messages from chat dispatch
  var events = this.chatService_.poll();
  if (events) {
    for (var n = 0; n < events.length; n++) {
      var e = events[n];
      switch (e.type) {
        case gf.net.chat.EventType.USER_JOIN:
          break;
        case gf.net.chat.EventType.USER_LEAVE:
          break;
        case gf.net.chat.EventType.USER_MESSAGE:
          this.log(e.userName + ': ' + e.value);
          break;
      }
    }
  }
};


/**
 * Renders the console.
 * @param {!gf.RenderFrame} frame Current render frame.
 * @param {!gf.vec.Viewport} viewport Current viewport.
 * @param {...string} var_args Header strings.
 */
blk.ui.Console.prototype.render = function(frame, viewport, var_args) {
  var font = this.renderState_.font;

  var buffer = this.textBuffer_;
  buffer.clear();

  // Scrub dead entries
  for (var n = 0; n < this.entries_.length; n++) {
    var entry = this.entries_[n];
    if (entry.timestamp == 0) {
      entry.timestamp = frame.time;
    } else {
      var age = frame.time - entry.timestamp;
      if (age > blk.ui.Console.ENTRY_TIMEOUT_) {
        // Dead - remove
        this.entries_.splice(n, 1);
        n--;
        continue;
      }
    }
  }

  var x = 0;
  var y = 0;

  for (var n = 2; n < arguments.length; n++) {
    var wh = font.prepareString(buffer, arguments[n], 0xFFFFFFFF, x, y);
    y += wh[1] + blk.ui.Console.LINE_SPACING_;
  }

  var start = 0;
  var end = this.entries_.length;
  for (var n = start; n < end; n++) {
    var entry = this.entries_[n];
    var wh = font.prepareString(buffer, entry.value, entry.color,
        x, y);
    y += wh[1] + blk.ui.Console.LINE_SPACING_;
  }

  var worldMatrix = blk.ui.Console.tmpMat4_;
  goog.vec.Mat4.setFromValues(worldMatrix,
      2, 0, 0, 0,
      0, 2, 0, 0,
      0, 0, 1, 0,
      10, 40, 0, 1);

  this.renderState_.beginSprites(font.atlas, false);

  // Draw shadow
  worldMatrix[12] += 2;
  worldMatrix[13] += 2;
  buffer.draw(viewport.orthoMatrix, worldMatrix, blk.ui.Console.shadowColor_);
  worldMatrix[12] -= 2;
  worldMatrix[13] -= 2;

  // Draw base text
  buffer.draw(viewport.orthoMatrix, worldMatrix);
};


/**
 * Logs a message to the console.
 * @param {...} var_args Values to log.
 */
blk.ui.Console.prototype.log = function(var_args) {
  var dateTime = new Date();
  var h = String(dateTime.getHours());
  if (h.length < 2) {
    h = '0' + h;
  }
  var m = String(dateTime.getMinutes());
  if (m.length < 2) {
    m = '0' + m;
  }
  var s = String(dateTime.getSeconds());
  if (s.length < 2) {
    s = '0' + s;
  }
  var message = '[' + [h, m, s].join(':') + '] ';
  for (var n = 0; n < arguments.length; n++) {
    message += arguments[n];
    if (n < arguments.length - 1) {
      message += ' ';
    }
  }
  this.add(message);
  gf.log.write(message);
};


/**
 * Adds a new entry to the console.
 * @param {string} value String value.
 * @param {number=} opt_color 32-bit ABGR color.
 */
blk.ui.Console.prototype.add = function(value, opt_color) {
  var entry = new blk.ui.Console.Entry_(value, opt_color || 0xFFFFFFFF);
  this.entries_.push(entry);
};


/**
 * Temp mat4 for math.
 * @private
 * @type {!goog.vec.Mat4.Type}
 */
blk.ui.Console.tmpMat4_ = goog.vec.Mat4.createFloat32();


/**
 * Shadow color modulator.
 * @private
 * @type {!goog.vec.Vec4.Float32}
 */
blk.ui.Console.shadowColor_ =
    goog.vec.Vec4.createFloat32FromValues(0.5, 0.5, 0.5, 1);



/**
 * An individual entry in the console.
 *
 * @private
 * @constructor
 * @param {string} value String value.
 * @param {number} color 32-bit ABGR color.
 */
blk.ui.Console.Entry_ = function(value, color) {
  /**
   * Time the entry was added, in seconds.
   * Initialized next frame.
   * @type {number}
   */
  this.timestamp = 0;

  /**
   * String value.
   * @type {string}
   */
  this.value = value;

  /**
   * 32-bit ABGR color.
   * @type {number}
   */
  this.color = color;
};
