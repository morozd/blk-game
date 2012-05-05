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

//#name LineProgram
//#description Generic line program

//! NAMESPACE=blk.assets.programs
//! CLASS=LineProgram
//! INCLUDE blk_precision.glsllib
//! INCLUDE blk_common.glsllib
//! INCLUDE blk_fog.glsllib


//! COMMON

varying vec4 v_color;


//! VERTEX

attribute vec3 a_position;
attribute vec4 a_color;

void main() {
  gl_Position = u_worldViewProjMatrix * vec4(a_position, 1.0);
  v_color = a_color;
}


//! FRAGMENT

void main() {
  gl_FragColor = mixFog(v_color);
}
