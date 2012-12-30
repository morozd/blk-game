#!/bin/bash

# Copyright 2012 Google Inc. All Rights Reserved.

# blk-game compiled server run script

DIR="$( cd "$( dirname "$0" )" && pwd )"
if [ -e "$DIR/node_modules/blk-server/server/server.js" ]; then
  DIR=$DIR/node_modules/blk-server/
fi

# Populate these values with those given to you by the browser admin
BROWSER_URL="http://gf-browser.appspot.com/"
SERVER_ID=""
SERVER_KEY=""

# TCP port the server will be listening on
LISTEN_PORT=1338
# Name for the server in the browser
SERVER_NAME="Server #1"
# Maximum number of users allowed at any given time - limit based on CPU/RAM
USER_COUNT=8

# Path to store maps/temp data
FILESYSTEM=fs/
# Map file
MAP_PATH=maps/map01/
# Map generator name; 'flat', 'noise', 'improved', or some custom value
MAP_GENERATOR="improved"
# Map random number generator seed
MAP_SEED=0

node $DIR/server/server.js \
    --browserUrl=$BROWSER_URL \
    --serverId=$SERVER_ID \
    --serverKey=$SERVER_KEY \
    --listenPort=$LISTEN_PORT \
    --serverName=$SERVER_NAME \
    --userCount=$USER_COUNT \
    --filesystem=$FILESYSTEM \
    --mapPath=$MAP_PATH \
    --mapGenerator=$MAP_GENERATOR \
    --mapSeed=$MAP_SEED \
    $@
