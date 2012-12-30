#!/bin/bash

# Copyright 2012 Google Inc. All Rights Reserved.

# This script is only to be used by contributors.
# This will build everything, check out the latest blk-game gh-pages
# branch, update everything, and prepare a commit.

# This must currently run from the root of the repo
# TODO(benvanik): make this runnable from anywhere (find git directory?)
if [ ! -d ".git" ]; then
  echo "This script must be run from the root of the repository (the folder containing .git)"
  exit 1
fi

GIT_USERNAME=`git config user.name`
GIT_USEREMAIL=`git config user.email`

# =============================================================================
# Build everything
# =============================================================================
echo "Building everything..."

# Do a full build so no old extra files make their way in.
rm -rf build-bin/gh-pages/
./third_party/games-framework/third_party/anvil-build/anvil-local.sh \
    deploy -j1 -o build-bin/gh-pages/ :gh-pages
SRC_PATH=$PWD/build-bin/gh-pages/

echo ""
# =============================================================================
# Look for sibling path or create
# =============================================================================

cd ..
if [ ! -d "blk-game-gh-pages" ]; then
  # Not found - create and clone
  echo "Creating blk-game-gh-pages..."
  git clone git@github.com:benvanik/blk-game.git blk-game-gh-pages
  cd blk-game-gh-pages
  git checkout gh-pages
else
  # Reset hard to the current version
  echo "Resetting blk-game-gh-pages..."
  cd blk-game-gh-pages
  git reset --hard
  git pull
  git merge origin/gh-pages
fi

# Be sure to reset username/email to the owner of the source repo
git config user.name "$GIT_USERNAME"
git config user.email "$GIT_USEREMAIL"

echo ""
# =============================================================================
# Copy bin/
# =============================================================================
echo "Updating..."

# Delete all the old contents and recreate
if [ -d "assets" ]; then
  rm -rf assets/
  rm -rf client/
  rm *.js *.css *.html
fi

# Copy bin contents
cp -R $SRC_PATH/* .

echo ""
# =============================================================================
# Stage all changes
# =============================================================================
echo "Staging changes..."

git add --all .
git commit -m "Updating to the latest version."

echo ""
# =============================================================================
# Push!
# =============================================================================
echo "Pushing changes..."

git push origin gh-pages

echo ""
