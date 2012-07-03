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

// Load Closure base
global.require = require;
global.CLOSURE_BASE_PATH = './third_party/games-framework/third_party/closure-library/closure/goog/';
require('../third_party/games-framework/third_party/node-closure/closure').Closure(global);
goog.loadScript('./blk_js_uncompiled-deps.js');

// Pull in blk
global.gfdefines = {
  SERVER: true,
  NODE: true
};
goog.require('blk.server.start');

// Start the server
var uri = ('file://' + process.argv[1]).replace(/\\/g, '/');
var args = process.argv.slice(2);
blk.server.start(uri, args).addCallbacks(function(game) {
  console.log('server started');
}, function(arg) {
  console.log('unable to start server', arg);
});


/*
var http = require('http');
var url = require('url');

function setupInfoPage(game) {
  var session = game.session;

  function showInfo() {
    var sb = '';
    for (var n = 0; n < session.users.length; n++) {
      var user = session.users[n];
      sb += user.info.displayName + ' (' + user.sessionId + ')<br>';
      sb += ' - ' + user.agent.userAgentString + '<br>';
      sb += ' - ' + user.agent.toString() + '<br>';
      sb += '<a href="/' + user.sessionId + '/kick">kick</a><br>';
      sb += '<br>';
    }
    return sb;
  };

  function userKick(user) {
    var sb = 'kicking...';
    session.disconnectUser(user, gf.net.DisconnectReason.KICKED);
    return sb;
  };

  http.createServer(function(req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/html'
    });
    var sb = '';
    var reqUrl = url.parse(req.url);
    var path = reqUrl.pathname.split('/');
    if (path.length > 1) {
      if (path[1] == 'info') {
        sb = showInfo();
      } else if (path.length > 2) {
        var user = session.getUserBySessionId(path[1]);
        if (user) {
          switch (path[2]) {
            case 'kick':
              sb = userKick(user);
              break;
          }
        } else {
          sb = 'not found';
        }
      }
    }

    res.end(sb);
  }).listen(infoPort);
};
*/
