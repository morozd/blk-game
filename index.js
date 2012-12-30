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


var hasLocalSaving = false;


function setupIndexPage() {
  setupSupportList();
  setupUserName();

  var localLink = document.getElementById('local-link');
  localLink.onclick = function(e) {
    e.preventDefault();

    if (!hasLocalSaving) {
      alert('NOTE: your browser does not support the File System API or IndexedDB: your map will not be saved!');
    }

    connectToServer('local://blk-server-0');
  };

  var joinLink = document.getElementById('server-connect-join');
  joinLink.onclick = function(e) {
    e.preventDefault();
    var address = document.getElementById('server-connect-input');
    if (!address.value.length) {
      return;
    }
    connectToServer(address.value);
  };

  window.setInterval(function() {
    updateServers();
  }, 30 * 1000);
  updateServers();
};


/**
 * Generates a list of supported features and warnings.
 */
function setupSupportList() {
  var isChrome = window.navigator.userAgent.indexOf('Chrome') != -1;
  var isFirefox = window.navigator.userAgent.indexOf('Firefox') != -1;

  function testWebGL() {
    var canvas = document.createElement('canvas');
    if (canvas) {
      var names = ['webgl', 'experimental-webgl'];
      for (var n = 0; n < names.length; n++) {
        var gl = canvas.getContext(names[n]);
        if (gl) {
          return true;
        }
      }
    }
    return false;
  }
  function testWebAudio() {
    return !!window.webkitAudioContext || !!window.AudioContext;
  }
  function testMouseLock() {
    return (
        document.pointerLockElement !== undefined ||
        document.mozPointerLockElement !== undefined ||
        document.webkitPointerLockElement !== undefined);
  }
  function testWebSockets() {
    return !!window.WebSocket;
  }
  function testFileSystem() {
    return !!window.webkitStorageInfo && !!window.webkitRequestFileSystem;
  }
  function testIndexedDb() {
    var indexedDB =
        window.indexedDB ||
        window.mozIndexedDB ||
        window.webkitIndexedDB ||
        window.msIndexedDB;
    if (isFirefox) {
      // Not supported in workers yet.
      return false;
    }
    return !!indexedDB;
  }
  function testWebWorker() {
    return !!window.Worker;
  }
  function testSharedWorker() {
    // Only supported in Chrome
    if (isChrome) {
      return !!window.SharedWorker;
    }
    return false;
  }

  function addStatusLine(ul, feature, critical, supportFunc,
      failureInfo, successInfo) {
    var supported = false;
    try {
      supported = supportFunc();
    } catch (e) {
      if (window.console) {
        window.console.log(e);
      }
    }

    var li = document.createElement('li');
    li.appendChild(document.createTextNode(feature + ': '));
    var statusSpan = document.createElement('span');
    if (supported) {
      statusSpan.className = 'status-info';
      statusSpan.appendChild(document.createTextNode('supported'));
      li.appendChild(statusSpan);
      if (successInfo) {
        var infoSpan = document.createElement('span');
        infoSpan.className = 'info';
        infoSpan.appendChild(document.createTextNode(
            ' (' + successInfo + ')'));
        li.appendChild(infoSpan);
      }
    } else {
      if (critical) {
        var statusSpan = document.createElement('span');
        statusSpan.className = 'status-error';
      statusSpan.appendChild(document.createTextNode('unsupported'));
        li.appendChild(statusSpan);
      } else {
        var statusSpan = document.createElement('span');
        statusSpan.className = 'status-warning';
        statusSpan.appendChild(document.createTextNode('unsupported'));
        li.appendChild(statusSpan);
      }
      if (failureInfo) {
        var infoSpan = document.createElement('span');
        infoSpan.className = 'info';
        infoSpan.appendChild(document.createTextNode(
            ' (' + failureInfo + ')'));
        li.appendChild(infoSpan);
      }
    }
    ul.appendChild(li);
  }

  var parentElement = document.getElementById('supportList');
  var ul = document.createElement('ul');
  parentElement.appendChild(ul);

  addStatusLine(ul,
      'WebGL', true,
      testWebGL,
      'nothing will work!');
  addStatusLine(ul,
      'WebSockets', false,
      testWebSockets,
      'no multiplayer');
  addStatusLine(ul,
      'Web Workers', false,
      testWebWorker,
      'no local play');
  addStatusLine(ul,
      'SharedWorker', false,
      testSharedWorker,
      'no local multiplayer');
  if (testIndexedDb()) {
    addStatusLine(ul,
        'IndexedDB', false,
        testIndexedDb,
        'no local saving');
    hasLocalSaving = true;
  } else if (testFileSystem()) {
    addStatusLine(ul,
        'File System', false,
        testFileSystem,
        'no local saving');
    hasLocalSaving = true;
  } else if (isFirefox) {
    // https://bugzilla.mozilla.org/show_bug.cgi?id=701634
    addStatusLine(ul,
        'IndexedDB', false,
        testIndexedDb,
        'no local saving');
  } else {
    addStatusLine(ul,
        'FileSystem/IndexedDB', false,
        function() { return false; },
        'no local saving');
  }
  addStatusLine(ul,
      'Web Audio API', false,
      testWebAudio,
      'no sounds');
  addStatusLine(ul,
      'Mouse Lock', false,
      testMouseLock,
      undefined,
      document.mozPointerLockElement !== undefined ?
          'fullscreen only' : null);
}


/**
 * Sets up the user name box.
 */
function setupUserName() {
  // This will ensure that the name is valid and clear bad cookies.
  loadUserName();
  saveUserName();

  // Save on change.
  var nameBox = document.getElementById('name');
  nameBox.addEventListener('change', function() {
    saveUserName();
  }, false);
};


/**
 * Loads teh user name from the cookie.
 */
function loadUserName() {
  var nameBox = document.getElementById('name');

  var value = null;
  var parts = document.cookie.split(';');
  for (var n = 0; n < parts.length; n++) {
    var part = parts[n];
    part = part.replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
    if (part.indexOf('s_un=') == 0) {
      value = part.substr(part.indexOf('=') + 1);
      value = decodeURIComponent(value.replace(/\+/g, ' '));
      break;
    }
  }
  if (value && value.length) {
    nameBox.value = value;
  } else {
    nameBox.value = 'Some Player ' + Math.floor(Math.random() * 100);
  }
}


/**
 * Saves the user name to the cookie.
 */
function saveUserName() {
  var nameBox = document.getElementById('name');

  // Not very strong verification here - the game will do it.
  var value = nameBox.value;
  if (!value || !value.length) {
    value = 'User';
  }
  var maxAge = 60 * 60 * 24 * 30 * 12;
  var futureDate = new Date(+(new Date()) + maxAge * 1000);
  document.cookie =
      's_un=' + encodeURIComponent(value) +
      '; path=/; expires=' + futureDate.toUTCString() + ';';
}


/**
 * Resets the local filesystem for the current domain, clearing the maps.
 */
function resetLocalStorage() {
  // Clear IndexedDB.
  var indexedDB =
      window.indexedDB ||
      window.mozIndexedDB ||
      window.webkitIndexedDB ||
      window.msIndexedDB;
  if (indexedDB) {
    // Always hardcoded.
    indexedDB.deleteDatabase('/maps/map01/');
  }

  // Clear filesystem.
  function resetFS(fs) {
    var reader = fs.root.createReader();
    function removeMore(entries) {
      for (var n = 0; n < entries.length; n++) {
        var entry = entries[n];
        if (entry.isDirectory) {
          entry.removeRecursively(function() {});
        }
      }
      if (entries.length) {
        reader.readEntries(removeMore);
      } else {
        alert('Done!');
      }
    };
    reader.readEntries(removeMore);
  };
  var requestFileSystem =
      window.requestFileSystem || window.webkitRequestFileSystem;
  if (requestFileSystem) {
    requestFileSystem.call(
        window, window.PERSISTENT, 1, resetFS);
  }
}


/**
 * Updates the server list.
 */
function updateServers() {
  var serverList = document.getElementById('server-list');
  var xhr = new XMLHttpRequest();
  xhr.addEventListener('readystatechange', function() {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        // Succeeded
        while (serverList.firstChild) {
          serverList.removeChild(serverList.firstChild);
        }
        var table = document.createElement('table');
        var json = JSON.parse(xhr.responseText);
        if (DEV_MODE) {
          addServerRow(table, {
            'endpoint': 'ws://localhost:1337',
            'server_name': '&lt;localhost&gt;',
            'user_count': '?',
            'user_max': '?'
          });
        }
        for (var n = 0; n < json.length; n++) {
          var result = json[n];
          var serverInfo = result['server_info'];
          addServerRow(table, serverInfo);
        }
        if (!json.length) {
          serverList.innerText = '\nNo public servers online! Try again later!'//' or ';
          // var startLink = document.createElement('a');
          // startLink.href = 'a';
          // startLink.innerText = 'start your own!';
          // serverList.appendChild(startLink);
        } else {
          serverList.appendChild(table);
        }
      } else {
        // Failed
        serverList.innerText = '\nUnable to fetch server list!'
      }
    }
  }, true);
  xhr.open('GET', SERVER_QUERY_URL);
  xhr.send();

  function addServerRow(table, serverInfo) {
    var endpoint = serverInfo['endpoint'];
    var row = document.createElement('tr');
    var c1 = document.createElement('td');
    c1.innerHTML = '<li><a href="" target="_blank">' + serverInfo['server_name'] + '</a>';
    row.appendChild(c1);
    var c2 = document.createElement('td');
    c2.innerText = serverInfo['user_count'] + '/' + serverInfo['user_max'];
    row.appendChild(c2);
    // // TODO(benvanik): flag
    // var c3 = document.createElement('td');
    // c3.innerText = serverInfo['server_location'];
    // row.appendChild(c3);
    table.appendChild(row);

    c1.firstChild.onclick = function(e) {
      e.preventDefault();

      // Disclaimer
      alert('Warning! This server is not run by or affiliated with Google and may contain scary things like trolls!');

      connectToServer(endpoint);
    };
  }
}


/**
 * Launches the game by connecting to the given server.
 * @param {string} address Server IP.
 */
function connectToServer(address) {
  var url = GAME_URL + '?host=' + address;
  window.open(url, '_blank');
}
