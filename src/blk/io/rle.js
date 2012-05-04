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

goog.provide('blk.io.rle');


/**
 * Control code used to escape run counts or escaped characters with a 1 byte
 * count.
 * @const
 * @type {number}
 */
blk.io.rle.CONTROL_CODE_1B = 0xFE;


/**
 * Control code used to escape run counts or escaped characters with a 2 byte
 * count.
 * @const
 * @type {number}
 */
blk.io.rle.CONTROL_CODE_2B = 0xFF;


/**
 * Run length encodes a source Uint16 array to a target array.
 *
 * The target array should be at least the size of the source. It's possible
 * under rare circumstances for the encoded version to exceed the size of the
 * source - if that occurs, the method will fail and a -1 will be returned.
 *
 * For optimal compression avoid the special input value of 0xFFxx or 0xFExx, as
 * that is currently the control code used.
 *
 * @param {!Uint16Array} source Source array.
 * @param {!Uint8Array} target Target byte array to populate.
 * @return {number} Number of bytes used in the target array, or -1 if an
 *     error occurred.
 */
blk.io.rle.encodeUint16 = function(source, target) {
  var oi = 0;
  var runSeq = 0;
  var runCount = 0;

  // Main loop is using a one slot lookahead - if the next char doesn't match
  // the current (or is the end), the current run is flushed
  for (var ii = 0; ii < source.length; ii++) {
    var s = source[ii];

    if (ii && s == runSeq) {
      // Another sequence in the current run
      runCount++;
    } else {
      // Sequence mismatch, start of a new run
      runSeq = s;
      runCount = 1;
    }

    if (ii >= source.length - 2 ||
        source[ii + 1] != runSeq) {
      if (runCount > 1 ||
          (runSeq >> 8) == blk.io.rle.CONTROL_CODE_1B ||
          (runSeq >> 8) == blk.io.rle.CONTROL_CODE_2B) {
        // If we have multiple sequences or are using a reserved word
        // we write first a control code and run count, followed by the sequence
        // to repeat
        if (runCount > 0xFF) {
          // 2 byte code
          target[oi++] = blk.io.rle.CONTROL_CODE_2B;
          target[oi++] = runCount >> 8;
          target[oi++] = runCount & 0xFF;
        } else {
          // 1 byte code
          target[oi++] = blk.io.rle.CONTROL_CODE_1B;
          target[oi++] = runCount;
        }
        target[oi++] = runSeq >> 8;
        target[oi++] = runSeq & 0xFF;
      } else {
        // Just write the value
        target[oi++] = s >> 8;
        target[oi++] = s & 0xFF;
      }
    }
  }

  return oi;
};


/**
 * Run length decodes a source byte array into a target Uint16Array.
 * It is expected that the target array is properly sized to hold the
 * uncompressed data, and it is up to the caller to pass that information
 * around.
 *
 * @param {!Uint8Array} source Source encoded data.
 * @param {!Uint16Array} target Target array.
 */
blk.io.rle.decodeUint16 = function(source, target) {
  var oi = 0;
  for (var ii = 0; ii < source.length;) {
    var s = source[ii++];
    if (s == blk.io.rle.CONTROL_CODE_1B ||
        s == blk.io.rle.CONTROL_CODE_2B) {
      // Repeated sequence
      var runCount;
      if (s == blk.io.rle.CONTROL_CODE_1B) {
        // 1 byte code
        runCount = source[ii++];
      } else {
        // 2 byte code
        runCount = (source[ii++] << 8) | source[ii++];
      }
      var runSeq = (source[ii++] << 8) | source[ii++];
      for (var si = 0; si < runCount; si++) {
        target[oi++] = runSeq;
      }
    } else {
      // Normal char, copy
      target[oi++] = (s << 8) | source[ii++];
    }
  }
};
