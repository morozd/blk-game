# Map Generators

Map generators are implemented as subclasses of `blk.env.gen.Generator`.
The server creates a generator on load and calls `fillChunk` on it when needed
to setup new chunks.

The design of this API is very similar to the one used by Bukkit. There's a
`fillChunk` call that is designed to fill most block cells and a
`populateChunk` call that can add refinement (if needed). If possible all work
should be done in `fillChunk`.

Generators receive a `blk.env.MapParameters` object that (today) contains a
random seed that can be specified by the user. Any random number generators
should use this seed.

`fillChunk` uses a `blk.env.gen.ChunkBuilder` utility class to help set blocks
efficiently. It contains utility methods like `setBlock` and `setBlockColumn`
(and more should be added!).

## Using a Custom Generator

The options --mapGenerator=[name] and --mapSeed=# control the
`blk.env.MapParameters` values. Edit these values in your run script or on
the command line.

```
./server/server.js --mapGenerator=improved --mapSeed=123
```

## Adding a New Generator

* Copy one of the generators under `src/blk/env/gen/` and rename it.
* Edit `src/blk/env/gen/gen.js`:
  * Add a goog.require for your type.
  * Add an entry in the list with a chosen name.
* Implement your generator.
* Build (debug or release).
* Run your server with the --mapGenerator option set.

## Map Structure

Maps consist of chunks. In the future I'll add more stuff, such as environmental
settings (weather/etc).

### Player Spawn

Players are currently all spawned at (0, 80, 0). You shouldn't have them spawn
underground, if possible.

## Chunk Structure

Chunks are laid out in XYZ space. Currently, all chunks are in the XZ plane
and Y=0.

### Dimensions

Each chunk is 16x128x16, but instead of hardcoding this value you should always
use the constants `blk.env.Chunk.SIZE_XZ` and `blk.env.Chunk.SIZE_Y`. This
will enable chunks to be resized in the future.

### Block Data

Chunks are 3D matrices of 16bit entries, each representing a block.
The high 8 bits are a block type, a value 0-255 from the
`blk.env.blocks.BlockID` table. The low 8 bits are block attributes that can be
used by the block type implementations to vary the styling or behavior of the
block. In most cases the block will only have the type set and attributes
will be 0.

```
// Dirt block.
var blockData = (blk.env.blocks.BlockID.DIRT << 8) | 0;
// Dirt block with a grass top.
var blockData = (blk.env.blocks.BlockID.DIRT << 8) | 1;
```

## ChunkBuilder

The `blk.env.gen.ChunkBuilder` class is used for setting chunk data.

### Setting Blocks

```
// Set a single block:
var blockData = (blk.env.blocks.BlockID.GLASS) | 0;
chunkBuilder.setBlock(x, y, z, blockData);
```

```
// Set a column of blocks:
var blockData = (blk.env.blocks.BlockID.GLASS) | 0;
chunkBuilder.setBlockColumn(x, y0, y1, z, blockData);
```

### Raw Access

If you want total control over the block data for a chunk it's possible to
access the underlying Uint16Array with as `chunkBuilder.blockData`.

```
var blockData = chunkBuilder.blockData;
var x = ..., y = ..., z = ...;
var bx = x & blk.env.Chunk.MASK_XZ;
var by = y & blk.env.Chunk.MASK_Y;
var bz = z & blk.env.Chunk.MASK_XZ;
var bo = bx + bz * blk.env.Chunk.STRIDE_Z + by * blk.env.Chunk.STRIDE_Y;
blockData[bo] = blk.env.blocks.BlockID << 8;
```

If you find yourself doing a lot of these manual operations it's probably best
to add helpers to ChunkBuilder directly to let others share in the hard work.

## Math Utilities

There are a few (very slow/poorly implemented) utility classes in `gf.math` that
are useful for map generation. Look at their code for more information:

* `gf.math.Random`
* `gf.math.PerlinNoise`
* `gf.math.SimplexNoise`

You should always create these once per generator and reuse them - sometimes
setup can be expensive!
