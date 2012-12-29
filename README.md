blk-game
========

THIS IS NOT MINECRAFT. This is my 20% project attempt at creating a fully
modifiable multiplayer voxel world in JS that can run efficiently in the
browser and learning what the pain points are in doing a project of this scale.
It's just a tech demo of a high-fidelity 100% JavaScript game. Enjoy it for what it is!

I wanted to do something productive with my 20% time at Google. I've been
preaching that the web is finally ready for real games, so I figured I'd
try to make one. This is the result. Heavy inspiration comes from Mojang,
of course: Minecraft is cool, but more importantly it's technically
difficult to get running well, especially in the browser.

All of the code for this project, including the voxel world client and server,
the game framework, and the build system used to produce the final output are
all open sourced. I'll be continuing to develop the game framework and build
system, and if I have time throw some more features into this demo (like real
gameplay, for example). Feel free to fork! Have fun!

## Tech

This project uses [anvil-build](https://github.com/benvanik/anvil-build) as a build system and builds atop the low-level
web game framework [games-framework](https://github.com/benvanik/games-framework).

Underlying this demo is a highly modularized library I wrote for this project,
[games-framework](https://github.com/benvanik/games-framework), that sits atop
[Google Closure](http://code.google.com/closure/), using the Closure Library as a base and the Closure Compiler to build
the tiny output Javascript files. Designed to be a set of tools to enable rapid high-quality games, it's not an engine
(like Unity) or scene graph (like three.js), but more like XNA or SDL. Pick what you need, get started quickly, and
spend timing writing game code vs. platform abstractions.

The server portions of the demo are written such that they share code with the client and can run both on node.js and
in the browser. This enables a great deal of code reuse and the ability to do things like a local game server when
running offline or multiplayer over the network using node. The Closure Compiler ensures that code that's used
exclusively on the server isn't included in the code sent for the client and works great in all environments.

## Setup

Wanna play around?

```
# Ensure you have python, pip - on OSX, get homebrew or macports!
git clone https://github.com/benvanik/blk-game.git
cd blk-game/
# Tun the setup script to initialize the repo and dependencies
./scripts/setup.sh

# This must be run each session:
source blkrc

# Build debug - do this when changing soy/gss/glsl/etc, but js is edit-reload
anvil build -j1 :debug
# Start a web server, open http://localhost:8080/client/index.html?dev
anvil serve &
# Start a debug node game server
NODE_PATH=$NODE_PATH:third_party/games-framework/third_party node server/server-uncompiled.js

# Deploy a release build
anvil deploy -j1 -o /tmp/blk-release/ :release
```

NOTE: you *must* pass -j1 to anvil when building. I'll fix this eventually.

## Contributing

Have a fix or feature? Submit a pull request - I love them!
Note that I do keep to the [style_guide](https://github.com/benvanik/games-framework/blob/master/docs/style_guide.md),
so please check it out first!

As this is a Google project, you *must* first e-sign the
[Google Contributor License Agreement](http://code.google.com/legal/individual-cla-v1.0.html) before I can accept any
code. It takes only a second and basically just says you won't sue us or claim copyright of your submitted code.

## License

All code except dependencies under third_party/ is licensed under the permissive Apache 2.0 license.
Feel free to fork/rip/etc and use as you wish!

## Credits

Code by [Ben Vanik](http://noxa.org). See [AUTHORS](https://github.com/benvanik/games-framework/blob/master/AUTHORS) for additional contributors.

#### Audio

Sound effects: [Sean Dunn](https://twitter.com/somenotes)

Music: [Knuck Beatz](http://soundcloud.com/casesensative/knuck-beatz-so-many-blocks-so) So Many Blocks, So Little Time (Minecraft Soundtrack)

#### Fonts

Bitmap font used in game: [Lord Nightmare/IBM's EGA Font](http://dwarffortresswiki.org/images/a/ae/LN_EGA8x8.png) (from [The Dwarf Fortress Wiki](http://dwarffortresswiki.org/index.php/Tileset_repository))

TTF font used in UI/etc: [Volter (Goldfish)](http://www.dafont.com/volter-goldfish.font)

#### Textures

[The Painterly Pack](http://painterlypack.net)
