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

const PROTOCOL_VERSION = 5;


/**
 * Request a new map created with the given parameters.
 * Only supported on localhost servers. The server will wait for a create
 * request before proceeding with generation.
 */
message MapCreate = 65 {
};


/**
 * Map information. Usually sent on connect before any chunk data.
 */
message MapInfo = 70 {
};


/**
 * A chunk request entry.
 */
message ChunkRequestEntry {
  int32 x;
  int32 y;
  int32 z;
};


/**
 * Requests the given chunk data be sent.
 */
message RequestChunkData = 71 {
  array.<ChunkRequestEntry> entries;
};


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


message EntityDelete = 81 {
  uint32 id;
};


message EntityState(blk.env.EntityState) {
  uint32 entityId;
  uint32 time;
  uint8 flags;
  vec3 position;
  vec4 rotation;
  vec3 velocity;
};


message EntityPosition = 82 {
  uint32 sequence;
  array.<EntityState> states;
};


message MoveCommand(blk.physics.MoveCommand) {
  uint32 sequence;
  uint32 time;
  uint32 timeDelta;
  vec4 viewRotation;
  uint8 translation;
  uint32 actions;
};


message Move = 90 {
  array.<MoveCommand> commands;
};
