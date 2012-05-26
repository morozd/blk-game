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

goog.provide('blk.client.MusicController');

goog.require('blk.assets.audio.Music');
goog.require('goog.Disposable');



/**
 * Music playback controller.
 * Handles the loading and randomized playback of music tracks.
 *
 * @constructor
 * @extends {goog.Disposable}
 * @param {!blk.client.ClientGame} game Game.
 */
blk.client.MusicController = function(game) {
  goog.base(this);

  /**
   * @type {!blk.client.ClientGame}
   */
  this.game = game;

  /**
   * @private
   * @type {!gf.audio.AudioManager}
   */
  this.audio_ = game.audio;

  /**
   * Whether music playback is muted.
   * @private
   * @type {boolean}
   */
  this.isMuted_ = false;

  /**
   * Whether any tracks are playing.
   * @private
   * @type {boolean}
   */
  this.isPlaying_ = false;

  /**
   * Background sound track list.
   * @private
   * @type {!gf.audio.TrackList}
   */
  this.trackList_ = blk.assets.audio.Music.create(
      this.game.assetManager, this.audio_.context);
  this.audio_.loadTrackList(this.trackList_);
};
goog.inherits(blk.client.MusicController, goog.Disposable);


/**
 * Sets whether music should be muted.
 * @param {boolean} value Whether music should be muted.
 */
blk.client.MusicController.prototype.setMuted = function(value) {
  if (this.isMuted_ == value) {
    return;
  }
  if (value) {
    // Stop in progress music playback if muting
    this.stop();
  }
  this.isMuted_ = value;
};


/**
 * Starts playing a track if none are playing or stops the playing track.
 */
blk.client.MusicController.prototype.togglePlayback = function() {
  if (this.isPlaying_) {
    this.stop();
  } else {
    this.playRandom();
  }
};


/**
 * Starts playing a random track.
 */
blk.client.MusicController.prototype.playRandom = function() {
  if (this.isMuted_) {
    return;
  }

  // TODO(benvanik): pick a track
  // TODO(benvanik): check what's playing and ensure something else

  this.trackList_.stopAll();
  this.trackList_.play('track1');
  this.isPlaying_ = true;
};


/**
 * Stops any playback that may be occuring.
 */
blk.client.MusicController.prototype.stop = function() {
  this.trackList_.stopAll();
  this.isPlaying_ = false;
};
