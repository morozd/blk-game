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

goog.provide('blk.io.IndexedDbMapStore');

goog.require('blk.io.MapStore');
goog.require('gf.log');
goog.require('goog.asserts');
goog.require('goog.async.Deferred');



/**
 * Map storage provider based on IndexedDB.
 *
 * @constructor
 * @extends {blk.io.MapStore}
 * @param {string} basePath Base map path.
 */
blk.io.IndexedDbMapStore = function(basePath) {
  goog.base(this);

  /**
   * Base path for all file operations, such as /foo/maps/map01/.
   * @private
   * @type {string}
   */
  this.basePath_ = basePath;

  /**
   * Opened database.
   * @type {IDBDatabase}
   * @private
   */
  this.db_ = null;
};
goog.inherits(blk.io.IndexedDbMapStore, blk.io.MapStore);


/**
 * indexedDB.
 * @type {IDBFactory|undefined}
 */
blk.io.IndexedDbMapStore.indexedDB =
    goog.global.indexedDB ||
    goog.global.mozIndexedDB ||
    goog.global.webkitIndexedDB ||
    goog.global['msIndexedDB'];


/**
 * Object store name for map info.
 * @const
 * @type {string}
 * @private
 */
blk.io.IndexedDbMapStore.INFO_OBJECT_STORE_ = 'info';


/**
 * Object store name for chunks.
 * @const
 * @type {string}
 * @private
 */
blk.io.IndexedDbMapStore.CHUNK_OBJECT_STORE_ = 'chunks';


/**
 * @override
 */
blk.io.IndexedDbMapStore.prototype.setup = function() {
  if (!blk.io.IndexedDbMapStore.indexedDB) {
    return goog.async.Deferred.fail(null);
  }

  // TODO(benvanik): request quota like FileMapStore - only on Chrome

  var deferred = new goog.async.Deferred();
  var req = blk.io.IndexedDbMapStore.indexedDB.open(this.basePath_, 2);
  req.onerror = function(e) {
    deferred.errback(null);
  };
  req.onsuccess = goog.bind(function(e) {
    this.db_ = /** @type {!IDBDatabase} */ (req.result);

    this.db_.onerror = function(e) {
      gf.log.write('idb error: ' + e);
    };

    this.resume();
    deferred.callback(null);
  }, this);
  req.onupgradeneeded = function(e) {
    var db = e.target.result;
    db.createObjectStore(blk.io.IndexedDbMapStore.INFO_OBJECT_STORE_);
    db.createObjectStore(blk.io.IndexedDbMapStore.CHUNK_OBJECT_STORE_);
  };

  return deferred;
};


/**
 * @override
 */
blk.io.IndexedDbMapStore.prototype.disposeInternal = function() {
  if (this.db_) {
    this.db_.close();
    this.db_ = null;
  }
  goog.base(this, 'disposeInternal');
};


/**
 * Gets a unique key for the chunk referenced by the given entry.
 * @private
 * @param {!blk.io.MapStore.QueueEntry} entry Queue entry.
 * @return {string} A unique string key for a chunk.
 */
blk.io.IndexedDbMapStore.prototype.getChunkKey_ = function(entry) {
  return [entry.x, entry.y, entry.z].join('.');
};


/**
 * @override
 */
blk.io.IndexedDbMapStore.prototype.processEntry = function(entry) {
  switch (entry.action) {
    case blk.io.MapStore.QueueAction.READ_INFO:
      this.readInfo_(entry);
      break;
    case blk.io.MapStore.QueueAction.WRITE_INFO:
      this.writeInfo_(entry);
      break;
    case blk.io.MapStore.QueueAction.READ_CHUNK:
      this.readChunk_(entry);
      break;
    case blk.io.MapStore.QueueAction.WRITE_CHUNK:
      this.writeChunk_(entry);
      break;
    case blk.io.MapStore.QueueAction.REMOVE_CHUNK:
      this.removeChunk_(entry);
      break;
    default:
      goog.asserts.fail('unknown action');
      break;
  }
};


/**
 * Implements READ_INFO.
 * @param {!blk.io.MapStore.QueueEntry} entry READ_INFO entry.
 * @private
 */
blk.io.IndexedDbMapStore.prototype.readInfo_ = function(entry) {
  var transaction = this.db_.transaction([
    blk.io.IndexedDbMapStore.INFO_OBJECT_STORE_
  ], 'readonly');
  var infoObjectStore = transaction.objectStore(
      blk.io.IndexedDbMapStore.INFO_OBJECT_STORE_);
  var req = infoObjectStore.get('info');
  req.onsuccess = goog.bind(function(e) {
    var data = req.result;
    this.finishReadInfo(entry, null, data);
  }, this);
  req.onerror = goog.bind(function(e) {
    e.preventDefault();
    this.finishReadInfo(entry, e, null);
  }, this);
};


/**
 * Implements WRITE_INFO.
 * @param {!blk.io.MapStore.QueueEntry} entry WRITE_INFO entry.
 * @private
 */
blk.io.IndexedDbMapStore.prototype.writeInfo_ = function(entry) {
  var transaction = this.db_.transaction([
    blk.io.IndexedDbMapStore.INFO_OBJECT_STORE_
  ], 'readwrite');
  var infoObjectStore = transaction.objectStore(
      blk.io.IndexedDbMapStore.INFO_OBJECT_STORE_);
  var req = infoObjectStore.put(entry.data, 'info');
  req.onsuccess = goog.bind(function(e) {
    this.finishWriteInfo(entry, null);
  }, this);
  req.onerror = goog.bind(function(e) {
    e.preventDefault();
    this.finishWriteInfo(entry, e);
  }, this);
};


/**
 * Implements READ_CHUNK.
 * @param {!blk.io.MapStore.QueueEntry} entry READ_CHUNK entry.
 * @private
 */
blk.io.IndexedDbMapStore.prototype.readChunk_ = function(entry) {
  var transaction = this.db_.transaction([
    blk.io.IndexedDbMapStore.CHUNK_OBJECT_STORE_
  ], 'readonly');
  var chunkObjectStore = transaction.objectStore(
      blk.io.IndexedDbMapStore.CHUNK_OBJECT_STORE_);
  var req = chunkObjectStore.get(this.getChunkKey_(entry));
  req.onsuccess = goog.bind(function(e) {
    var data = req.result;
    this.finishReadChunk(entry, null, data);
  }, this);
  req.onerror = goog.bind(function(e) {
    e.preventDefault();
    this.finishReadChunk(entry, e, null);
  }, this);
};


/**
 * Implements WRITE_CHUNK.
 * @param {!blk.io.MapStore.QueueEntry} entry WRITE_CHUNK entry.
 * @private
 */
blk.io.IndexedDbMapStore.prototype.writeChunk_ = function(entry) {
  var transaction = this.db_.transaction([
    blk.io.IndexedDbMapStore.CHUNK_OBJECT_STORE_
  ], 'readwrite');
  var chunkObjectStore = transaction.objectStore(
      blk.io.IndexedDbMapStore.CHUNK_OBJECT_STORE_);
  var req = chunkObjectStore.put(entry.data, this.getChunkKey_(entry));
  req.onsuccess = goog.bind(function(e) {
    this.finishWriteChunk(entry, null);
  }, this);
  req.onerror = goog.bind(function(e) {
    e.preventDefault();
    this.finishWriteChunk(entry, e);
  }, this);
};


/**
 * Implements REMOVE_CHUNK.
 * @param {!blk.io.MapStore.QueueEntry} entry REMOVE_CHUNK entry.
 * @private
 */
blk.io.IndexedDbMapStore.prototype.removeChunk_ = function(entry) {
  var transaction = this.db_.transaction([
    blk.io.IndexedDbMapStore.CHUNK_OBJECT_STORE_
  ], 'readwrite');
  var chunkObjectStore = transaction.objectStore(
      blk.io.IndexedDbMapStore.CHUNK_OBJECT_STORE_);
  var req = chunkObjectStore['delete'](this.getChunkKey_(entry));
  req.onsuccess = goog.bind(function(e) {
    this.finishRemoveChunk(entry, null);
  }, this);
  req.onerror = goog.bind(function(e) {
    e.preventDefault();
    this.finishRemoveChunk(entry, e);
  }, this);
};
