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

goog.provide('blk.env.Face');


/**
 * Face values.
 * @enum {number}
 */
blk.env.Face = {
  /** Front face (+Z) */
  POS_Z: 0,
  /** Back face (-Z) */
  NEG_Z: 1,
  /** Top face (+Y) */
  POS_Y: 2,
  /** Bottom face (-Y) */
  NEG_Y: 3,
  /** Right face (+X) */
  POS_X: 4,
  /** Left face (-X) */
  NEG_X: 5
};
