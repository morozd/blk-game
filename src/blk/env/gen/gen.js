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

goog.provide('blk.env.gen');

goog.require('blk.env.gen.FlatGenerator');
goog.require('blk.env.gen.ImprovedGenerator');
goog.require('blk.env.gen.NoiseGenerator');


/**
 * Generators, by name.
 * @type {!Object.<function(new:blk.env.gen.Generator,
 *     blk.env.MapParameters, !blk.env.BlockSet)>}
 * @private
 */
blk.env.gen.generators_ = {
  'flat': blk.env.gen.FlatGenerator,
  'noise': blk.env.gen.NoiseGenerator,
  'improved': blk.env.gen.ImprovedGenerator
};


/**
 * Creates a generator with the given name, if it can be found.
 * If the given generator is not found a flat generator is returned.
 * @param {!blk.env.MapParameters} mapParams Map parameters.
 * @param {!blk.env.BlockSet} blockSet Block set.
 * @return {!blk.env.gen.Generator} Map generator.
 */
blk.env.gen.createGenerator = function(mapParams, blockSet) {
  var type = blk.env.gen.generators_[mapParams.generator];
  if (!type) {
    // Fallback.
    type = blk.env.gen.generators_['flat'];
  }
  return new type(mapParams, blockSet);
};
