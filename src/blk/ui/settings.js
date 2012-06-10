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

goog.provide('blk.ui.Settings');

goog.require('blk.env.ChunkView');
goog.require('blk.ui.Popup');
goog.require('blk.ui.alerts');
goog.require('gf.net.UserInfo');
goog.require('goog.asserts');
goog.require('goog.events.EventType');
goog.require('goog.string');
goog.require('goog.style');



/**
 * A simple popup dialog.
 *
 * TODO(benvanik): key input override to support esc/enter/etc
 *
 * @constructor
 * @extends {blk.ui.Popup}
 * @param {!blk.client.ClientGame} game Client game.
 * @param {goog.dom.DomHelper=} opt_domHelper The DOM helper used to
 *     create DOM nodes; defaults to {@code goog.dom.getDomHelper}.
 * @param {Element=} opt_parent Parent DOM element to render into.
 */
blk.ui.Settings = function(game, opt_domHelper, opt_parent) {
  var launchOptions = /** @type {!blk.client.LaunchOptions} */ (
      game.launchOptions);
  goog.base(this, blk.ui.alerts.settings, {
    server_name: launchOptions.host
  }, opt_domHelper, opt_parent);

  /**
   * Client game.
   * @private
   * @type {!blk.client.ClientGame}
   */
  this.game_ = game;
};
goog.inherits(blk.ui.Settings, blk.ui.Popup);


/**
 * @override
 */
blk.ui.Settings.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  var settings = this.game_.settings;

  var userNameInput = /** @type {HTMLInputElement} */ (
      this.dom.getElementByClass(
          goog.getCssName('blkSettingsNameValue'), this.root));
  goog.asserts.assert(userNameInput);
  userNameInput.value = settings.userName;

  this.setupSlider_(
      goog.getCssName('blkSettingsSensitivitySlider'),
      1, 100, 50, settings.mouseSensitivity * 50,
      function(sliderValue) {
        return goog.string.padNumber(sliderValue / 50, 1, 2);
      });
  this.setupCheckbox_(
      goog.getCssName('blkSettingsMouseLock'),
      settings.mouseLock);

  this.setupSlider_(
      goog.getCssName('blkSettingsDistanceSlider'),
      blk.env.ChunkView.MIN_CHUNK_RADIUS_XZ,
      blk.env.ChunkView.MAX_CHUNK_RADIUS_XZ,
      blk.env.ChunkView.LOW_CHUNK_RADIUS_XZ,
      settings.viewDistance,
      function(sliderValue) {
        return goog.string.padNumber(sliderValue, 1);
      });

  this.setupCheckbox_(
      goog.getCssName('blkSettingsSoundFx'),
      !settings.soundFxMuted);
  this.setupCheckbox_(
      goog.getCssName('blkSettingsMusic'),
      !settings.musicMuted);
};


/**
 * Sets up a slider group for control/updating.
 * @private
 * @param {string} className Slider root CSS class name.
 * @param {number} minValue Minimum value.
 * @param {number} maxValue Maximum value.
 * @param {number} defaultValue Default value.
 * @param {number} initialValue Initial value.
 * @param {(function(number):string)} toStringCallback Function that converts
 *     a slider value into a string for display.
 */
blk.ui.Settings.prototype.setupSlider_ = function(
    className,
    minValue, maxValue, defaultValue, initialValue,
    toStringCallback) {
  var root = this.dom.getElementByClass(className);
  if (!root) {
    return;
  }

  var slider = /** @type {HTMLInputElement} */ (this.dom.getElementByClass(
      goog.getCssName('blkSettingsSlider'), root));
  if (!slider) {
    return;
  }

  slider.min = String(minValue);
  slider.max = String(maxValue);
  slider.value = String(initialValue);

  var label = this.dom.getElementByClass(
      goog.getCssName('blkSettingsSliderLabel'), root);
  goog.asserts.assert(label);

  function updateLabel() {
    label.innerHTML = toStringCallback(Number(slider.value));
  };
  updateLabel();
  this.eh.listen(slider, goog.events.EventType.CHANGE, updateLabel);

  var reset = this.dom.getElementByClass(
      goog.getCssName('blkSettingsSliderReset'), root);
  goog.asserts.assert(reset);
  this.eh.listen(reset, goog.events.EventType.CLICK,
      function() {
        slider.value = String(defaultValue);
        updateLabel();
      });
};


/**
 * Gets the current value of a slider.
 * @private
 * @param {string} className Slider root CSS class name.
 * @return {number|undefined} Slider value.
 */
blk.ui.Settings.prototype.getSliderValue_ = function(className) {
  var root = this.dom.getElementByClass(className);
  if (!root) {
    return undefined;
  }

  var slider = /** @type {HTMLInputElement} */ (this.dom.getElementByClass(
      goog.getCssName('blkSettingsSlider'), root));
  if (!slider) {
    return undefined;
  }

  return Number(slider.value);
};


/**
 * Sets up a checkbox group for control/updating.
 * @private
 * @param {string} className Checkbox root CSS class name.
 * @param {boolean} initialValue Initial value.
 */
blk.ui.Settings.prototype.setupCheckbox_ = function(
    className, initialValue) {
  var root = this.dom.getElementByClass(className);
  if (!root) {
    return;
  }

  var checkbox = /** @type {HTMLInputElement} */ (this.dom.getElementByClass(
      goog.getCssName('blkSettingsCheckboxInput'), root));
  if (!checkbox) {
    return;
  }

  goog.style.setUnselectable(root, true);

  checkbox.checked = initialValue;

  this.eh.listen(root, goog.events.EventType.CLICK,
      /**
       * @param {!goog.events.BrowserEvent} e Event.
       */
      function(e) {
        if (e.target != checkbox) {
          checkbox.checked = !checkbox.checked;
        }
      });
};


/**
 * Gets the current value of a checkbox.
 * @private
 * @param {string} className Checkbox root CSS class name.
 * @return {boolean|undefined} Checkbox value.
 */
blk.ui.Settings.prototype.getCheckboxValue_ = function(className) {
  var root = this.dom.getElementByClass(className);
  if (!root) {
    return undefined;
  }

  var checkbox = /** @type {HTMLInputElement} */ (this.dom.getElementByClass(
      goog.getCssName('blkSettingsCheckboxInput'), root));
  if (!checkbox) {
    return undefined;
  }

  return checkbox.checked;
};


/**
 * @override
 */
blk.ui.Settings.prototype.beforeClose = function(buttonId) {
  if (buttonId != 'save') {
    return;
  }

  var settings = this.game_.settings;

  var userNameInput = /** @type {HTMLInputElement} */ (
      this.dom.getElementByClass(
          goog.getCssName('blkSettingsNameValue'), this.root));
  goog.asserts.assert(userNameInput);
  var userName = userNameInput.value;
  userName = gf.net.UserInfo.sanitizeDisplayName(userName);
  settings.userName = userName;

  var sensitivity =
      this.getSliderValue_(goog.getCssName('blkSettingsSensitivitySlider'));
  if (goog.isDef(sensitivity)) {
    sensitivity = sensitivity / 50;
    settings.mouseSensitivity = sensitivity;
  }

  var mouseLock = this.getCheckboxValue_(
      goog.getCssName('blkSettingsMouseLock'));
  if (goog.isDef(mouseLock)) {
    settings.mouseLock = mouseLock;
  }

  var viewDistance =
      this.getSliderValue_(goog.getCssName('blkSettingsDistanceSlider'));
  if (goog.isDef(viewDistance)) {
    settings.viewDistance = viewDistance;
  }

  var enableSoundFx = this.getCheckboxValue_(
      goog.getCssName('blkSettingsSoundFx'));
  if (goog.isDef(enableSoundFx)) {
    settings.soundFxMuted = !enableSoundFx;
  }

  var enableMusic = this.getCheckboxValue_(
      goog.getCssName('blkSettingsMusic'));
  if (goog.isDef(enableMusic)) {
    settings.musicMuted = !enableMusic;
  }

  settings.save();
};


/**
 * Shows the settings dialog and returns a deferred that is signalled when the
 * popup closes.
 *
 * @param {!blk.client.ClientGame} game Client game.
 * @param {goog.dom.DomHelper=} opt_domHelper The DOM helper used to
 *     create DOM nodes; defaults to {@code goog.dom.getDomHelper}.
 * @param {Element=} opt_parent Parent DOM element to render into.
 * @return {!goog.async.Deferred} A deferred fulfilled when the dialog has
 *     closed. Successful callbacks receive the ID of the button as their only
 *     parameter.
 */
blk.ui.Settings.show = function(game, opt_domHelper, opt_parent) {
  var popup = new blk.ui.Settings(game, opt_domHelper, opt_parent);
  popup.enterDocument();
  return popup.deferred;
};
