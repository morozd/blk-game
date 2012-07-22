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

const PROTOCOL_VERSION = 7;


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
