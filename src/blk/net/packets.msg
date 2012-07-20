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

namespace blk.net.packets;

const PROTOCOL_VERSION = 6;


/**
 * Chunk data blob.
 */
message ChunkData = 73 {
  int32 x;
  int32 y;
  int32 z;
  // TODO(benvanik): some nice way of denoting extended data to be left in
  //     the reader instance?
  // binary blockData;
};


/**
 * Sent to clients to indicate that no more chunks will be sent and they should
 * start playing.
 */
message ReadyPlayer = 74 {
};


// SIMDEPRECATED
/**
 * Sets a block to the given data as a request if from the client or update if
 * from the server.
 */
message SetBlock = 75 {
  int32 x;
  int32 y;
  int32 z;
  uint32 blockData;
};


// SIMDEPRECATED
message EntityCreate = 80 {
  uint32 id;
  uint32 flags;
  // TODO(benvanik): type info/etc
  // TODO(benvanik): move to separate AssociateEntity command?
  uint8 playerWireId;
  vec3 position;
  vec4 rotation;
  vec3 velocity;
};


// SIMDEPRECATED
message EntityDelete = 81 {
  uint32 id;
};


// SIMDEPRECATED
message EntityState(blk.env.EntityState) {
  uint32 entityId;
  uint32 time;
  uint8 flags;
  vec3 position;
  vec4 rotation;
  vec3 velocity;
};


// SIMDEPRECATED
message EntityPosition = 82 {
  uint32 sequence;
  array.<EntityState> states;
};


// SIMDEPRECATED
message MoveCommand(blk.physics.MoveCommand) {
  uint32 sequence;
  uint32 time;
  uint32 timeDelta;
  vec4 viewRotation;
  uint8 translation;
  uint32 actions;
};


// SIMDEPRECATED
message Move = 90 {
  array.<MoveCommand> commands;
};
