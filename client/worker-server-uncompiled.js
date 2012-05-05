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

var global = this;

global.CLOSURE_BASE_PATH = '../third_party/games-framework/third_party/closure-library/closure/goog/';

global.importScripts(global.CLOSURE_BASE_PATH + 'bootstrap/webworkers.js');
global.importScripts(global.CLOSURE_BASE_PATH + 'base.js');

global.importScripts('../blk_js_uncompiled-deps.js');

global.gf = {
  SERVER: true,
  NODE: false
};
goog.require('blk.server.start');

blk.server.start(goog.global.location.toString(), {
  // TODO(benvanik): options
});
