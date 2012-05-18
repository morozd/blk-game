blk-game
========

This is NOT Minecraft! It's a 20% project I've been hacking on to push the bounds of native JavaScript gaming. It is in no way related to the awesome work of [Mojang](www.mojang.com). It's also not a real game (despite the name), but more of a tech demo for many technologies.


## Tech

### Game Library

Underlying this demo is a highly modularized library that sits atop
<a href="http://code.google.com/closure/">Google Closure</a>, using the
Closure Library as a base and the Closure Compiler to build the tiny
output Javascript files. Designed to be a set of tools to enable rapid
high-quality games, it's not an engine (like Unity) or scene graph (like
three.js), but more like XNA or SDL. Pick what you need, get started
quickly, and spend timing writing game code vs. platform abstractions.

### Game Library Features

* Runtime
** Robust game loop management
** Idle state/hidden tab tracking
* Audio
** 3D positional sound via <a href="https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html">Web Audio API</a>
** Efficient sound bank representation (single file transfer) + tools for creation
** Efficient music playback
* Graphics
** Display supporting orientation changes, fullscreen mode, etc
** WebGL context loss/restore handling
** Texture atlases and sprite batch rendering
** WebGL shader program abstraction
** Bitmap fonts with kerning and layout
* Input abstraction layer
** <a href="http://dvcs.w3.org/hg/webevents/raw-file/default/mouse-lock.html">Mouse Lock</a> support
** (coming soon) on-screen dpad and accelerometer
** (coming soon) <a href="http://dvcs.w3.org/hg/webevents/raw-file/default/gamepad.html">gamepad</a> support
** (coming soon) input action map/normalization
* Multiplayer networking
** Client/server session management
** Full client-side input prediction and entity interpolation
** Synchronized clocks
** Localhost server via Web Workers
** SharedWorker for multi-tab local networking
** node.js server via WebSockets (100% shared code)
** Efficient network binary representation
** (coming soon) authentication via ID providers
* Math and Utilities
** Axis-aligned bounding box
** Octree
** Quaternion, ray, vec enhancements
** Seedable PRNG


### Why Closure?

* Closure Compiler generates some of the smallest Javascript out there
* Off-the-shelf dependency tracking and build system
* Compiler inlining can drastically help performance (and can only get better)
* Native Javascript - no plugins or extensions required to get the functionality
* Closure Library contains a lot of useful functionality
** Localization/i18n
** Array, object, and string extensions
** Data structures
** DOM/CSS/etc templating and abstractions
** Rich and efficient vector math library (one of the fastest!)
** Well tested and maintained


Credits
-------

Everything not listed below was authored by [Ben Vanik](http://noxa.org).

#### Audio

Clicking sound: [S_Dij](http://www.freesound.org/people/S_Dij/)

#### Fonts

Bitmap font used in game: [Lord Nightmare/IBM's EGA Font](http://dwarffortresswiki.org/images/a/ae/LN_EGA8x8.png) (from [The Dwarf Fortress Wiki](http://dwarffortresswiki.org/index.php/Tileset_repository))

TTF font used in UI/etc: [Volter (Goldfish)](http://www.dafont.com/volter-goldfish.font)

#### Music
[Knuck Beatz](http://soundcloud.com/casesensative/knuck-beatz-so-many-blocks-so) So Many Blocks, So Little Time (Minecraft Soundtrack)

#### Textures
[The Painterly Pack](http://painterlypack.net)

