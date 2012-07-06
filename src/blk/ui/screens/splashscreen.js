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

goog.provide('blk.ui.screens.SplashScreen');

goog.require('blk.ui.PopupScreen');
goog.require('blk.ui.screens.splashscreen');



/**
 * Simple splash screen.
 * This screen could be nice for showing a fancy logo/credits/etc.
 * Ideally, it would hide the latency of loading all of the extra resources.
 * @constructor
 * @extends {blk.ui.PopupScreen}
 * @param {!goog.dom.DomHelper} dom DOM helper used to create DOM nodes.
 * @param {!Element} parentElement Parent DOM element to render into.
 */
blk.ui.screens.SplashScreen = function(dom, parentElement) {
  goog.base(this, dom, parentElement, blk.ui.screens.splashscreen.content, {
  });
};
goog.inherits(blk.ui.screens.SplashScreen, blk.ui.PopupScreen);
