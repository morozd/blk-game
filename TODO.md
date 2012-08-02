Before Release
================================================================================

* new sounds

* skip block building if any neighbors missing
* lighting

* first ServerPlayer send pass is not sorted, make lastTime negative?

* RenderList/drawModelInstance needs to cache

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

- interpolation
    - spawn random, interp rotation

- move (physics system?)
    - Actor -> blk.sim.PhysicsEntity <- SpatialEntity
    - run physics without updates
    - every server update, need to process?

- title adorner

- inventory
    -

- tools:
    - toolFlags:
        - REPEATABLE
    - repeatInterval
    - maxUsageDistance
    - preview?

- make chunk views efficient, each controller gets one (AI too)
    - controller command, pass view down to tools


- remove warnings:
    - register entities different on client/server to avoid clientfpscontroller

- check for entity leaks/etc (deleting on disconnect, etc)



// TODO(benvanik): magic with time to place the user command at the time it
// was executed relative to the current sim time
// This is needed to ensure collision detection and actions occur in the
// proper state
//
// I'm not sure how to do this yet without keeping a sliding window of
// previous block states (old -> new) so that the world state can be
// rewound
//
// This logic only needs to happen on the server side, and if we rewind the
// world to the time of the first cmd in `commands` we can play through
// at the same rate.
// So we need:
// - MapEvent[]
//   - time
//   - xyz
//   - type: set block, action (changing state, etc?)
//   - old/new block data, etc
//
// Then we can find the time of the commands in the array w/ binary search
// and step through the array as we step through commands:
// -- world is in server state (up to date)
// var eventIndex = bsearch(history, first_command.time)
// for eventIndex to 0 in history as e:
//    unapply e
// for each command:
//     while !event.time < command.time as e:
//        apply e
//     execute command
//        if action:
//          queue history event to scratch list
// for each remaining event e:
//    apply e
// sorted insert scratch list in history
// -- world should now match what it did at the start (up to date, plus
//    any deltas made by the user commands)
//
// History actions will need to take user actions into account - for example
// if the user has an action that modifies a block from A to B, if there is
// a later history event that is supposed to modify it from A to C, some
// conflict resolution must occur. Either the block could be always forced
// to C (last-actor in simulation time wins), or some more complex logic
// could be used.
//
// All modifications to the world need to go through the history, including
// server-side modifications such as scheduled updates (grass growing/etc).
// The 'history' should probably live outside of blk.physics and in
// the ServerMap instance.
