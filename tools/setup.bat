@ECHO OFF

REM Copyright 2012 Google Inc. All Rights Reserved.
REM
REM blk-game Windows setup script
REM
REM This script sets up the repository and dependencies.
REM The dependencies are all global.

ECHO.
REM ============================================================================
REM Pull in GF
REM ============================================================================
ECHO Grabbing third_party/...

git submodule init
git submodule update

ECHO.
REM ============================================================================
REM Get the dependencies in GF too
REM ============================================================================
ECHO Grabbing games-framework third_party/...

cd third_party\games-framework\
git submodule init
git submodule update
cd ..\..

ECHO.
REM ============================================================================
REM GF setup (checks for python/easy_install/installs dependencies/etc)
REM ============================================================================
ECHO Running games-framework setup.sh...

third_party\games-framework\tools\setup.bat

ECHO.
