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

goog.provide('blk.io.ChunkSerializer');

goog.require('blk.env.Chunk');
goog.require('blk.io.CompressionFormat');
goog.require('blk.io.rle');
goog.require('gf.net.PacketReader');
goog.require('gf.net.PacketWriter');
goog.require('goog.asserts');



/**
 * Optimized chunk serializer and deserializer.
 * Maintains buffers used across serialization/deserialization to reduce
 * allocation overhead.
 *
 * @constructor
 */
blk.io.ChunkSerializer = function() {
  /**
   * @private
   * @type {!gf.net.PacketReader}
   */
  this.reader_ = new gf.net.PacketReader();

  /**
   * @private
   * @type {!gf.net.PacketWriter}
   */
  this.writer_ = new gf.net.PacketWriter();
};


/**
 * Current chunk serialization version.
 * @private
 * @const
 * @type {number}
 */
blk.io.ChunkSerializer.CURRENT_VERSION_ = 1;


/**
 * Default compression format when serializing chunks.
 * @private
 * @const
 * @type {blk.io.CompressionFormat}
 */
blk.io.ChunkSerializer.COMPRESSION_FORMAT_ =
    blk.io.CompressionFormat.RLE;


/**
 * Serializes the give chunk and returns a data blob.
 * @param {!blk.env.Chunk} chunk Chunk to serialize.
 * @return {ArrayBuffer} Serialized chunk data, if successful.
 */
blk.io.ChunkSerializer.prototype.serialize = function(chunk) {
  var writer = this.writer_;
  if (this.serializeToWriter(chunk, writer)) {
    return writer.finish();
  } else {
    writer.drop();
    return null;
  }
};


/**
 * Serializes the give chunk and returns a data blob.
 * @param {!blk.env.Chunk} chunk Chunk to serialize.
 * @param {!gf.net.PacketWriter} writer Packet writer.
 * @return {boolean} True if the data was successfully serialized.
 */
blk.io.ChunkSerializer.prototype.serializeToWriter = function(chunk, writer) {
  switch (blk.io.ChunkSerializer.CURRENT_VERSION_) {
    case 1:
      writer.writeUint8(1);
      return this.serializeV1_(chunk, writer);
    default:
      return false;
  }
};


/**
 * Serializes the give chunk and returns a data blob in the V1 format.
 * @private
 * @param {!blk.env.Chunk} chunk Chunk to serialize.
 * @param {!gf.net.PacketWriter} writer Packet writer.
 * @return {boolean} True if the data was successfully serialized.
 */
blk.io.ChunkSerializer.prototype.serializeV1_ = function(chunk, writer) {
  // Chunk coordinates
  writer.writeInt32(chunk.x);
  writer.writeInt32(chunk.y);
  writer.writeInt32(chunk.z);

  // Chunk block data
  writer.writeUint8(blk.io.ChunkSerializer.COMPRESSION_FORMAT_);
  switch (blk.io.ChunkSerializer.COMPRESSION_FORMAT_) {
    default:
    case blk.io.CompressionFormat.UNCOMPRESSED:
      writer.writeUint8Array(new Uint8Array(chunk.blockData.buffer));
      break;
    case blk.io.CompressionFormat.RLE:
      var writerScratch = writer.beginWriteUint8Array(
          blk.env.Chunk.TOTAL_BLOCKS * 2 + 128);
      var actualWritten =
          blk.io.rle.encodeUint16(chunk.blockData, writerScratch);
      if (actualWritten < 0) {
        return false;
      }
      writer.endWriteUint8Array(actualWritten);
      break;
    case blk.io.CompressionFormat.DEFLATE:
      goog.asserts.fail('deflate not yet implemented');
      return false;
  }

  return true;
};


/**
 * Deserializes the given data into an existing chunk.
 * @param {!blk.env.Chunk} chunk Chunk to deserialize.
 * @param {!ArrayBuffer|!Uint8Array} data Previously serialized chunk data.
 * @return {boolean} True if the data was successfully deserialized.
 */
blk.io.ChunkSerializer.prototype.deserialize = function(chunk, data) {
  var reader = this.reader_;
  reader.begin(data, 0);
  return this.deserializeFromReader(chunk, reader);
};


/**
 * Deserializes the given data into an existing chunk.
 * @param {!blk.env.Chunk} chunk Chunk to deserialize.
 * @param {!gf.net.PacketReader} reader Packet reader referencing previously
 *     serialized chunk data.
 * @return {boolean} True if the data was successfully deserialized.
 */
blk.io.ChunkSerializer.prototype.deserializeFromReader = function(chunk,
    reader) {
  var version = reader.readUint8();
  switch (version) {
    case 1:
      return this.deserializeV1_(chunk, reader);
    default:
      // Unsupported version
      return false;
  }
};


/**
 * Deserializes the given data into an existing chunk using the V1 format.
 * @private
 * @param {!blk.env.Chunk} chunk Chunk to deserialize.
 * @param {!gf.net.PacketReader} reader Packet reader referencing previously
 *     serialized chunk data.
 * @return {boolean} True if the data was successfully deserialized.
 */
blk.io.ChunkSerializer.prototype.deserializeV1_ = function(chunk, reader) {
  // Chunk coordinates
  var x = reader.readInt32();
  var y = reader.readInt32();
  var z = reader.readInt32();
  chunk.beginLoad(x, y, z);

  // Chunk block data
  var dataFormat = /** @type {blk.io.CompressionFormat} */ (reader.readUint8());
  var rawBlockData = reader.subsetUint8Array();
  var blockData = chunk.blockData;
  switch (dataFormat) {
    default:
    case blk.io.CompressionFormat.UNCOMPRESSED:
      for (var n = 0, m = 0; n < blk.env.Chunk.TOTAL_BLOCKS; n++, m += 2) {
        blockData[n] = (rawBlockData[m + 1] << 8) | rawBlockData[m];
      }
      break;
    case blk.io.CompressionFormat.RLE:
      blk.io.rle.decodeUint16(rawBlockData, blockData);
      break;
    case blk.io.CompressionFormat.DEFLATE:
      goog.asserts.fail('deflate not yet implemented');
      return false;
  }

  chunk.endLoad();
  return true;
};
