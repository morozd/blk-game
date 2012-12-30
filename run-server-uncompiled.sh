#!/bin/bash

# Copyright 2012 Google Inc. All Rights Reserved.

# blk-game uncompiled server run script

# Populate these values with those given to you by the browser admin
BROWSER_URL="http://localhost:8081/"
SERVER_ID=""
SERVER_KEY=""

# TCP port the server will be listening on
LISTEN_PORT=1337
# Name for the server in the browser
SERVER_NAME="Dev Server"
# Maximum number of users allowed at any given time - limit based on CPU/RAM
USER_COUNT=8

# Path to store maps/temp data
FILESYSTEM=fs/debug/
# Map file
MAP_PATH=maps/map_dev/

node server/server-uncompiled.js \
    --browserUrl=$BROWSER_URL \
    --serverId=$SERVER_ID \
    --serverKey=$SERVER_KEY \
    --listenPort=$LISTEN_PORT \
    --serverName=$SERVER_NAME \
    --userCount=$USER_COUNT \
    --filesystem=$FILESYSTEM \
    --map=$MAP_PATH \
    $@
