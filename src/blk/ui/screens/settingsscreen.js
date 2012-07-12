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

goog.provide('blk.ui.screens.SettingsScreen');

goog.require('blk.env.ChunkView');
goog.require('blk.ui.PopupScreen');
goog.require('blk.ui.screens.settingsscreen');
goog.require('gf.net.UserInfo');
goog.require('goog.asserts');
goog.require('goog.events.EventType');
goog.require('goog.string');
goog.require('goog.style');



/**
 * Settings popup dialog.
 * @constructor
 * @extends {blk.ui.PopupScreen}
 * @param {!goog.dom.DomHelper} dom DOM helper used to create DOM nodes.
 * @param {!Element} parentElement Parent DOM element to render into.
 * @param {!blk.game.client.UserSettings} settings User settings.
 */
blk.ui.screens.SettingsScreen = function(dom, parentElement, settings) {
  goog.base(this, 'settings', dom, parentElement,
      blk.ui.screens.settingsscreen.content, {
      });

  /**
   * User settings.
   * @private
   * @type {!blk.game.client.UserSettings}
   */
  this.settings_ = settings;
};
goog.inherits(blk.ui.screens.SettingsScreen, blk.ui.PopupScreen);


/**
 * @override
 */
blk.ui.screens.SettingsScreen.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  var settings = this.settings_;

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
blk.ui.screens.SettingsScreen.prototype.setupSlider_ = function(
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
blk.ui.screens.SettingsScreen.prototype.getSliderValue_ = function(className) {
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
blk.ui.screens.SettingsScreen.prototype.setupCheckbox_ = function(
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
blk.ui.screens.SettingsScreen.prototype.getCheckboxValue_ = function(
    className) {
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
blk.ui.screens.SettingsScreen.prototype.beforeClose = function(buttonId) {
  if (buttonId != 'save') {
    return;
  }

  var settings = this.settings_;

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
