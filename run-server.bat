@ECHO OFF

REM Copyright 2012 Google Inc. All Rights Reserved.

REM blk-game compiled server run script

SET DIR=%~dp0
IF NOT EXIST %DIR%\node_modules\blk-server\server\ GOTO NOT_NPM_INSTALL
SET DIR=%DIR%\node_modules\blk-server\
:NOT_NPM_INSTALL

REM Populate these values with those given to you by the browser admin
SET BROWSER_URL="http://gf-browser.appspot.com/"
SET SERVER_ID=""
SET SERVER_KEY=""

REM TCP port the server will be listening on
SET LISTEN_PORT=1338
REM Name for the server in the browser
SET SERVER_NAME="Server #1"
REM Maximum number of users allowed at any given time - limit based on CPU/RAM
SET USER_COUNT=8

REM Path to store maps/temp data
SET FILESYSTEM=fs\
REM Map file
SET MAP_PATH=maps\map01\

node %DIR%\server\server.js ^
    --browserUrl=%BROWSER_URL% ^
    --serverId=%SERVER_ID% ^
    --serverKey=%SERVER_KEY% ^
    --listenPort=%LISTEN_PORT% ^
    --serverName=%SERVER_NAME% ^
    --userCount=%USER_COUNT% ^
    --filesystem=%FILESYSTEM% ^
    --map=%MAP_PATH% ^
    %*
