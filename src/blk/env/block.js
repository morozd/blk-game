/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

goog.provide('blk.env.Block');
goog.provide('blk.env.BlockAttrs');
goog.provide('blk.env.BlockFlags');
goog.provide('blk.env.BlockLight');


/**
 * Block attributes.
 * 2 bytes, block-type dependent. Can be used to pass information from the
 * generator to the blocks for rendering changes (such as varying textures)
 * or the state of a block (on/off for switches, etc).
 *
 * @typedef {number}
 */
blk.env.BlockAttrs;


/**
 * Block lighting data.
 * 1 byte, split in two:
 * - 4-bits (0-15) used for sky light
 * - 4-bits (0-15) used for block light
 *
 * @typedef {number}
 */
blk.env.BlockLight;


/**
 * Block flags, used in the block type flags bitmask.
 * @enum {number}
 */
blk.env.BlockFlags = {
  /**
   * Block is breakable.
   */
  BREAKABLE: 0x00000001,

  /**
   * Block cannot be broken/removed.
   */
  UNBREAKABLE: 0x00000002,

  /**
   * Block cannot be broken/removed on by admins.
   */
  ADMIN_UNBREAKABLE: 0x00000004,

  /**
   * Physics entities can collide with this block.
   */
  COLLIDABLE: 0x00000010
};



/**
 * A block descriptor.
 *
 * @constructor
 * @param {number} id Static block ID.
 * @param {string} name Human-friendly name.
 * @param {!blk.env.Material} material Material.
 * @param {number} flags Bitmask of flags from {@see blk.env.BlockFlags}.
 * @param {number} atlasSlot Texture atlas slot index.
 */
blk.env.Block = function(id, name, material, flags, atlasSlot) {
  /**
   * Static block ID.
   * @type {number}
   */
  this.id = id;

  /**
   * Human-friendly name.
   * @type {string}
   */
  this.name = name;

  /**
   * Material.
   * @type {!blk.env.Material}
   */
  this.material = material;

  /**
   * Flags bitmask, from {@see blk.env.BlockFlags}.
   * @type {number}
   */
  this.flags = flags;

  /**
   * Strength of the block.
   * MAX_VALUE means it is indestructable.
   * @type {number}
   */
  this.strength = 0;

  /**
   * Friction coefficient.
   * @type {number}
   */
  this.friction = 1;

  /**
   * When updating, the number of ticks between updates.
   * @type {number}
   */
  this.tickRate = 0;

  /**
   * Default texture atlas slot index.
   * @type {number}
   */
  this.atlasSlot = atlasSlot;
};


/**
 * Gets the slot index of the
 * @param {number} x Block X.
 * @param {number} y Block Y.
 * @param {number} z Block Z.
 * @param {blk.env.Face} face Face to get.
 * @param {blk.env.BlockLight} light Block light data.
 * @param {blk.env.BlockAttrs} attrs Block attribute bitmask.
 * @return {number} Texture atlas slot index.
 */
blk.env.Block.prototype.getFaceSlot = function(x, y, z, face, light, attrs) {
  return this.atlasSlot;
};


// blk.env.Block.prototype.handleAdded;
// blk.env.Block.prototype.handleRemoved;
// blk.env.Block.prototype.handleAdjacentChange;
// blk.env.Block.prototype.handleTick;
