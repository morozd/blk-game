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

//#name FaceProgram
//#description Block face program

//! NAMESPACE=blk.assets.programs
//! CLASS=FaceProgram
//! INCLUDE blk_precision.glsllib
//! INCLUDE blk_common.glsllib
//! INCLUDE blk_fog.glsllib
//! INCLUDE blk_lighting.glsllib


//! COMMON

varying vec4 v_texInfo;


//! VERTEX

attribute vec3 a_position;
attribute vec4 a_texInfo;

void main() {
  gl_Position = u_worldViewProjMatrix * vec4(a_position, 1.0);
  v_texInfo = a_texInfo;
  calculateLightingAA();
}


//! FRAGMENT

uniform sampler2D u_texSampler;
uniform vec2 u_texSize;

void main() {
  vec2 texCoords = (v_texInfo.xy + 1.0) / u_texSize;
  vec4 texColor = texture2D(u_texSampler, texCoords);
  if (texColor.a == 0.0) {
    discard;
  }
  // TODO(benvanik): factor in v_info lighting info/etc
  vec4 fragColor = texColor + v_texInfo.z;
  gl_FragColor = mixFog(mixLighting(fragColor));
}
