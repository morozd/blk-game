#!/usr/bin/env node
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

var nopt = require('nopt');
var path = require('path');

// Parse options
var opts = nopt({
  // Port to listen on for game connections
  'port': [Number, null],
  // Port to listen on for info connections
  'info_port': [Number, null],
  // Filesystem root path
  'filesystem': [String, '/tmp/blk/'],
  // Map path in the file system
  'map': [String, 'maps/map_dev/']
}, {
  'p': '--port',
  'f': '--filesystem',
  'm': '--map'
}, process.argv, 2);

// Load compiled code
global.require = require;
var compiledLibrary = require('../blk_node_js_compiled');
for (var key in compiledLibrary) {
  global[key] = compiledLibrary[key]
}

// Options
var port = opts['port'] || 1337;
var infoPort = opts['info_port'] || null;
var fileSystemPath = opts['filesystem'] || '/tmp/blk/';
var mapPath = opts['map'] || 'maps/map_dev/';

// TODO(benvanik): some sensible URI from command line args
var uri = 'http://127.0.0.1:' + port + '/node/';

// Start the server
blk.server.start(uri, {
  port: port,
  mapPath: mapPath,
  persistentRoot: path.join(fileSystemPath, 'persistent/'),
  temporaryRoot: path.join(fileSystemPath, 'temporary/')
});
