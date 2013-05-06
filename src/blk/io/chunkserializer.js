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
goog.require('gf');
goog.require('gf.net.PacketReader');
goog.require('gf.net.PacketWriter');
goog.require('goog.asserts');
goog.require('goog.reflect');
goog.require('WTF.trace');



/**
 * Optimized chunk serializer and deserializer.
 * Maintains buffers used across serialization/deserialization to reduce
 * allocation overhead.
 *
 * @constructor
 * @param {blk.io.CompressionFormat=} opt_compressionFormat Compression format
 *     used when serializing chunks.
 */
blk.io.ChunkSerializer = function(opt_compressionFormat) {
  /**
   * Compression format when serializing chunks.
   * @private
   * @type {blk.io.CompressionFormat}
   */
  this.compressionFormat_ = goog.isDef(opt_compressionFormat) ?
      opt_compressionFormat : blk.io.CompressionFormat.RLE;
};


/**
 * Current chunk serialization version.
 * @private
 * @const
 * @type {number}
 */
blk.io.ChunkSerializer.CURRENT_VERSION_ = 1;


/**
 * Serializes the give chunk and returns a data blob.
 * @param {!blk.env.Chunk} chunk Chunk to serialize.
 * @return {ArrayBuffer} Serialized chunk data, if successful.
 */
blk.io.ChunkSerializer.prototype.serialize = function(chunk) {
  var writer = gf.net.PacketWriter.getSharedWriter();
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
  writer.writeUint8(this.compressionFormat_);
  switch (this.compressionFormat_) {
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
  var reader = gf.net.PacketReader.getSharedReader();
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

  // HACK(benvanik): poking directly into the reader - this could break
  // Unfortunately typedarray subarray is really slow, and doing this improves
  // perf of large chunk transfers quite a bit
  // var rawBlockData = reader.subsetUint8Array();

  // Chunk block data
  var dataFormat = /** @type {blk.io.CompressionFormat} */ (reader.readUint8());
  var blockData = chunk.blockData;
  switch (dataFormat) {
    default:
    case blk.io.CompressionFormat.UNCOMPRESSED:
      reader.readUint32();
      for (var n = 0, m = reader.offset;
          n < blk.env.Chunk.TOTAL_BLOCKS; n++, m += 2) {
        blockData[n] = (reader.buffer[m + 1] << 8) | reader.buffer[m];
      }
      break;
    case blk.io.CompressionFormat.RLE:
      var dataLength = reader.readUint32();
      blk.io.rle.decodeUint16(
          reader.buffer, blockData, reader.offset, dataLength);
      break;
    case blk.io.CompressionFormat.DEFLATE:
      goog.asserts.fail('deflate not yet implemented');
      return false;
  }

  chunk.endLoad();
  return true;
};


/**
 * Shared chunk serializer singleton.
 * Initialized on first access of {@see #getSharedSerializer}.
 * @private
 * @type {blk.io.ChunkSerializer}
 */
blk.io.ChunkSerializer.sharedSerializer_ = null;


/**
 * Gets a shared chunk serializer singleton.
 * @return {!blk.io.ChunkSerializer} A shared serializer.
 */
blk.io.ChunkSerializer.getSharedSerializer = function() {
  if (!blk.io.ChunkSerializer.sharedSerializer_) {
    var compressionFormat = gf.SERVER && !gf.NODE ?
        blk.io.CompressionFormat.UNCOMPRESSED :
        blk.io.CompressionFormat.RLE;
    blk.io.ChunkSerializer.sharedSerializer_ = new blk.io.ChunkSerializer(
        compressionFormat);
  }
  return blk.io.ChunkSerializer.sharedSerializer_;
};


blk.io.ChunkSerializer = WTF.trace.instrumentType(
    blk.io.ChunkSerializer, 'blk.io.ChunkSerializer',
    goog.reflect.object(blk.io.ChunkSerializer, {
      serializeToWriter: 'serializeToWriter',
      deserializeFromReader: 'deserializeFromReader'
    }));
