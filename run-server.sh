#!/bin/bash

# Copyright 2012 Google Inc. All Rights Reserved.

# blk-game compiled server run script

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
FILESYSTEM=/tmp/blk/
# Map file
MAP_PATH=maps/map01/

NODE_PATH=build-out/:third_party/games-framework/third_party/:$NODE_PATH \
node server/server.js \
    --browserUrl=$BROWSER_URL \
    --serverId=$SERVER_ID \
    --serverKey=$SERVER_KEY \
    --port=$PORT \
    --serverName=$SERVER_NAME \
    --users=$USERS \
    --filesystem=$FILESYSTEM \
    --map=$MAP_PATH \
    $@
