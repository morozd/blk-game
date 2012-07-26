Before Release
================================================================================

* new sounds

* skip block building if any neighbors missing
* lighting

* first ServerPlayer send pass is not sorted, make lastTime negative?

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

* HTML location API
    * update ?host= when joining/leaving a game
    * update # with position (every once in awhile? focus loss?)

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

* networking
    * override format with serializer, use UNCOMPRESSED when running localhost
    * add the ability to define multiple sockets per User/ClientSession
        * used for bulk data (custom textures/chunks/etc)
    * reader/writer normalizedQuaternion - infer w from xx+yy+zz+ww=1
        * http://www.gamedev.net/topic/461253-compressed-quaternions/

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

* math hacks/fixes
    * http://physicsforgames.blogspot.com/2010/03/quaternion-tricks.html



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


Simulator Transition
====================

MapEntity:
- state:
    - seed #
    - block set
    - environment options
- server:
    - blk.env.ServerMap
- client:
    - blk.env.ClientMap

PositionedEntity:
- state:
    - position, orientation (PRED | INTERP | FREQ)
- shared:
    - bounding box
    - getChunk() ?
    - getTransform(mat, opt_relativeToParent)

ModelEntity[PositionedEntity]:
- state:
    - model
    - animation state?
    - color
- shared:
    -
- client:
    - blk.graphics.Model
    - animation info

ActorEntity[ModelEntity]:
- state:
    - controller
- shared:
    - viewport
- client:
    -

ToolEntity[ModelEntity]:
- state:
    -
-

ProjectileEntity[ModelEntity]:
- state:
    -
-

ControllerEntity:
- state:
    -
-

PlayerEntity[ControllerEntity]:
- state:
    - color
- shared:
    - blk.env.ChunkView


blk.sim.World
blk.sim.MusicDirector
blk.sim.Player
gf.sim.SpatialEntity
  blk.sim.Model
    blk.sim.Actor
    blk.sim.Tool
      blk.sim.tools.PickaxeTool
      blk.sim.tools.RocketLauncherTool
    blk.sim.Projectile
      blk.sim.tools.RocketProjectile
blk.sim.Controller
  blk.sim.controllers.FpsController


how does controller entity set pos/orientation on parent so pred/interp
entity parenting

// SIMDEPRECATED


blk.sim.Player:
    - user session id
    - skin info (color/etc)
    - controller ent id
    - actor ent id


move map into world
setupMap()
getMap()


- tool use
    - tool:
        - melee | use
        - toolFlags:
            - REPEATABLE
            -
        - repeatInterval
    - block tool:
        - blockType
        - use(): place block
        - local (!hasPredicted):
            - set block
            - play sound
        - server:
            - set block
            - broadcast on world SetBlockCommand


- Simulator::get|setRootEntity
    - blk.sim.Root:
        - world
        - players
        - client:
            - local player? (cached on entityAdded?)
            - getCamera
- Actor::getWorld
- Tool::getWorld

- make chunk views efficient, each controller gets one (AI too)
    - controller command, pass view down to tools

- interpolation
    - spawn random, interp rotation
- move (physics system?)
