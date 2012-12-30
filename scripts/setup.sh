#!/bin/bash

# Copyright 2012 Google Inc. All Rights Reserved.

# blk-game unix setup script

# This script sets up the repository and dependencies.

# Ensure running as root (or on Cygwin, where it doesn't matter)
if [ "$(id -u)" -eq 0 ]; then
  if [ ! -e "/Cygwin.bat" ]; then
    echo "This script should not be run as root!"
    echo "Run without sudo!"
    exit 1
  fi
fi

# This must currently run from the root of the repo
# TODO(benvanik): make this runnable from anywhere (find git directory?)
if [ ! -d ".git" ]; then
  echo "This script must be run from the root of the repository (the folder containing .git)"
  exit 1
fi

# ==============================================================================
# Pull in GF
# ==============================================================================
echo "Grabbing third_party/..."

git submodule update --init --recursive

echo ""
# =============================================================================
# Node modules
# =============================================================================
echo "Installing node modules..."

npm install

echo ""
# ==============================================================================
# GF setup (checks for python/easy_install/installs dependencies/etc)
# ==============================================================================
echo "Running games-framework setup.sh..."

./third_party/games-framework/scripts/setup.sh

echo ""
