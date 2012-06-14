#!/bin/bash

# Copyright 2012 Google Inc. All Rights Reserved.

# blk-game unix setup script

# This script sets up the repository and dependencies.

# Ensure running as root (or on Cygwin, where it doesn't matter)
if [ "$(id -u)" -ne 0 ]; then
  if [ ! -e "/Cygwin.bat" ]; then
    echo "This script must be run as root to install Python and system packages"
    echo "Run with sudo!"
    exit 1
  fi
fi

# ==============================================================================
# Pull in GF
# ==============================================================================
echo "Grabbing third_party/..."

sudo -u "$SUDO_USER" git submodule init
sudo -u "$SUDO_USER" git submodule update

echo ""
# ==============================================================================
# Get the dependencies in GF too
# ==============================================================================
echo "Grabbing games-framework third_party/..."

cd third_party/games-framework/
sudo -u "$SUDO_USER" git submodule init
sudo -u "$SUDO_USER" git submodule update
cd ../..

echo ""
# ==============================================================================
# GF setup (checks for python/easy_install/installs dependencies/etc)
# ==============================================================================
echo "Running games-framework setup.sh..."

./third_party/games-framework/tools/setup.sh

echo ""
