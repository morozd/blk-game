Before Release
================================================================================

* new sounds

* skip block building if any neighbors missing
* lighting

M3: Replace UI with DOM
================================================================================

* replace custom UI with soy
    * console
    * block types
        * need a way to read block textures

* icons for menubar
    * fullscreen
    * settings
    * help

* hide menubar when in fullscreen mode

* remove bitmap font?
    * need rendering of names to canvas, uploading to texture
    * gf.graphics.Texture#drawText?

M4: Infinite Maps
================================================================================

* Map#setBlock - queue block sets until chunks load

* programmable views
    * packets for create/delete per player, attach to entity
        * change view distance is a delete/create/wait
    * waitForLoaded or something (before entering player into the world)

M5: Performance Tuning
================================================================================

* SegmentRenderer has a lot of Float32Array:
    * 2 for each bounding box (min/max)
    * boundingSphere
    * centerCoordinates
    * worldMatrix

* better error propagation
    * error types?

* store block counts per segment in chunk so can fast skip build queue work
    * helps on mba, where cost to scan can be heavy
    * needed for large view radii

* performance
    * forEachInViewport / viewport.containsBoundingBox is slowest method!
    * rotateCube_
    * BuildQueue sort optimization
    * SegmentCache list remove is expensive

* networking
    * override format with serializer, use UNCOMPRESSED when running localhost

* io
    * defer writes a bit (no write each modify)
    * gm.io updates for NODE:
        * concurrent writes
            * on HTML use a queue (chained deferreds)
        * optimized reader resets (just update extents)


M6: Physics
================================================================================

* fix entity system/generalize

* god mode toggle (fly, infinite placement distance, etc)

* move set block to command actions

* entity eye point/height/etc
* collision detect down needs to sweep (not eye center, but entire AABB base)
* jump latch

* collision detection
    * actor/block
    * actor/actor
        * r-tree? http://stackulator.com/rtree/
        * kd-tree (low memory)
        * nested spheres? (fast movement)

* gravity
    * jump command action
    * sound on landing
    * sound on moving on ground

M7: Weapons
================================================================================

* mesh/meshbuilder/etc to replace facebuffer for entities
* use vao
* entity rewrite
* inventory/etc

* actions in movement
* latency compensation on server (rewind players/previous states/etc)

Experiments
================================================================================

* fog rewrite
    * environment density setting
    * color based on whether above or below ground?
    * only take xz into effect (no fog when looking up/down)

* evaluate marching cubes for terrain - could have flag on blocks that indicate
  'natural' vs. things like brick
    * http://paulbourke.net/geometry/polygonise/

* lighting:
    * really needs off-thread chunk prep
    * http://dave.uesp.net/wiki/Block_Land_12

* environment
    * skybox (star field/etc)
    * time (sun/moon positioning, fog changes, etc)
    * display sun/moon

* ChunkBuilder enhancements
* simple cave terrain:
    * http://blog.zelimirfedoran.com/archives/cave-terrain-generator
* city world
    * http://dev.bukkit.org/server-mods/cityworld/
    * needs fill/populate model
* some grammar for map generation?
    * http://www.nuke24.net/projects/TMCMG/

* track cache/etc on server, don't send chunks if haven't changed
    * list of chunks sent this session?
    * client cache via mapstore
    * if setBlock on uncached chunk, load chunk, set
        * chunk should queue setBlocks when unloaded, apply when LOADED?

* investigate dtrace probes for server:
    http://mcavage.github.com/node-restify/#DTrace



Runtime config
==============

gf.config.Configuration()
    addListener(callback, opt_scope)
    removeListener(callback, opt_scope)
    registerVariable(variable)
    getVariables(opt_prefix) -> [variables]
    getVariableValue(name) -> res
    setVariableValue(name, str)
    registerCommand(command)
    getCommands(opt_prefix) -> [commands]
    callCommand(name, opt_args) -> res
    exec(str) -> res

gf.config.Variable()
    name, description
    type (string|bool|number)
    access (admin|debug|host|user|guest)
    getter, setter=

gf.config.Command()
    name, description
    args (CommandArg: name, type, optional)
    access
    callback

gf.config.net.ConfigService(session, config)
gf.config.net.ClientConfigService(session, config)
    send(str) -> deferred
    poll() -> [update config, dispatch query results]
gf.config.net.ServerConfigService(session, config)
    [config.addListener(this)] -> post


Game
====

blk.game.ServerGame
    game, netService, players
    createMap/loadMap
    createEntity/deleteEntity/updateEntity/moveEntity
blk.game.ClientGame
    game, netService, players


blk.game.Player:
    user
    color/skin/etc
    ?entity
    abstract createView/deleteView/updateView/moveView/bindView(entity)
    abstract update

blk.game.ServerPlayer:
    impls of view stuff
    send queue

blk.game.ClientPlayer:
    impls of view stuff


Move existing ClientGame/ServerGame logic to:
blk.game.building.ServerGameController|ClientGameController

blk.game.GameView:
    position, rotation
    boundEntity
    ChunkView
    update(): pull from boundEntity, if needed
    setBlock(s?)

ServerGameView|ClientGameView

ServerGameViewObserver(MapObserver):



Entity
======

* refactor:
    *

