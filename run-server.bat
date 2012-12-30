@ECHO OFF

REM Copyright 2012 Google Inc. All Rights Reserved.

REM blk-game compiled server run script

SET DIR=%~dp0
IF NOT EXIST %DIR%\node_modules\blk-server\server\ GOTO NOT_NPM_INSTALL
DIR=%DIR%\node_modules\blk-server\
:NOT_NPM_INSTALL

# Populate these values with those given to you by the browser admin
BROWSER_URL="http://gf-browser.appspot.com/"
SERVER_ID=""
SERVER_KEY=""

# TCP port the server will be listening on
PORT=1338
# Name for the server in the browser
SERVER_NAME="Server #1"
# Maximum number of users allowed at any given time - limit based on CPU/RAM
USERS=8

# Path to store maps/temp data
FILESYSTEM=fs\
# Map file
MAP_PATH=maps\map01\

node %DIR%\server\server.js ^
    --browserUrl=%BROWSER_URL% ^
    --serverId=%SERVER_ID% ^
    --serverKey=%SERVER_KEY% ^
    --port=%PORT% ^
    --serverName=%SERVER_NAME% ^
    --users=%USERS% ^
    --filesystem=%FILESYSTEM% ^
    --map=%MAP_PATH% ^
    %*
