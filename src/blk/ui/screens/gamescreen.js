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

goog.provide('blk.ui.screens.GameScreen');

goog.require('gf.ui.Screen');



/**
 * Game screen.
 * @constructor
 * @extends {gf.ui.Screen}
 * @param {!goog.dom.DomHelper} domHelper DOM helper used to create DOM nodes.
 * @param {!gf.dom.Display} display Display. Not retained.
 */
blk.ui.screens.GameScreen = function(dom, parentElement, display) {
  goog.base(this,
      gf.ui.Screen.Flags.COVERS_DISPLAY |
      gf.ui.Screen.Flags.OPAQUE |
      gf.ui.Screen.Flags.MODAL_INPUT);

  /**
   * @private
   * @type {!goog.dom.DomHelper}
   */
  this.dom_ = dom;

  /**
   * Display.
   * Not disposed on screen close.
   * @private
   * @type {!gf.dom.Display}
   */
  this.display_ = display;
};
goog.inherits(blk.ui.screens.GameScreen, gf.ui.Screen);
