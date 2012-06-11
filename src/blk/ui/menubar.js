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

goog.provide('blk.ui.Menubar');

goog.require('blk.ui.Widget');
goog.require('blk.ui.menubar');
goog.require('goog.array');
goog.require('goog.events.EventType');
goog.require('goog.style');



/**
 * Menubar overlay.
 *
 * @constructor
 * @extends {blk.ui.Widget}
 * @param {!blk.client.ClientGame} game Client game.
 */
blk.ui.Menubar = function(game) {
  goog.base(this, game, blk.ui.menubar.bar, {
  });

  goog.style.setUnselectable(this.root, true);
};
goog.inherits(blk.ui.Menubar, blk.ui.Widget);


/**
 * @override
 */
blk.ui.Menubar.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  var buttonEls = this.dom.getElementsByClass(
      goog.getCssName('blkMenubarButton'), this.root);
  goog.array.forEach(buttonEls,
      function(buttonEl) {
        var buttonId = buttonEl.getAttribute('data-id');
        this.eh.listen(buttonEl, goog.events.EventType.CLICK,
            function() {
              switch (buttonId) {
                case 'fullscreen':
                  this.game.toggleFullscreen();
                  break;
                case 'settings':
                  this.game.showSettings();
                  break;
                case 'help':
                  this.game.showHelp();
                  break;
              }
            });
      }, this);
};
