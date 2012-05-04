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

goog.provide('blk.env.BlockSet');

goog.require('goog.asserts');



/**
 * Block set.
 *
 * @constructor
 */
blk.env.BlockSet = function() {
  /**
   * List of all blocks, by block ID.
   * @private
   * @type {!Array.<!blk.env.Block>}
   */
  this.list_ = new Array(256);
};


/**
 * Registers a block in the block list.
 * @param {!blk.env.Block} block Block to register.
 */
blk.env.BlockSet.prototype.registerBlock = function(block) {
  goog.asserts.assert(block.id != 0);
  goog.asserts.assert(block.id <= 255);

  goog.asserts.assert(!this.list_[block.id]);
  this.list_[block.id] = block;
};


/**
 * Gets a block by ID.
 * @param {number} id Block ID.
 * @return {!blk.env.Block} Block with the given ID.
 */
blk.env.BlockSet.prototype.get = function(id) {
  var block = this.list_[id];
  goog.asserts.assert(block);
  return block;
};


/**
 * Checks to see if a block type is defined.
 * @param {number} id Block ID.
 * @return {boolean} True if the block type exists.
 */
blk.env.BlockSet.prototype.has = function(id) {
  return !!this.list_[id];
};
