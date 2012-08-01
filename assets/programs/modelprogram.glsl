/**
 * Copyright 2012 Google, Inc All Rights Reserved.
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

//#name ModelProgram
//#description Unskinned model program

//! NAMESPACE=blk.assets.programs
//! CLASS=ModelProgram
//! INCLUDE blk_precision.glsllib
//! INCLUDE blk_common.glsllib
//! INCLUDE blk_fog.glsllib
//! INCLUDE blk_model.glsllib


//! COMMON


varying vec2 v_uv;


//! VERTEX


attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_uv;


void main() {
  gl_Position = calculatePositionStatic(a_position);
  v_uv = a_uv;
}


//! FRAGMENT


uniform sampler2D u_texSampler;


void main() {
  vec4 texColor = texture2D(u_texSampler, v_uv);
  if (texColor.a == 0.0) {
    discard;
  }
  gl_FragColor = mixFog(texColor);
}
