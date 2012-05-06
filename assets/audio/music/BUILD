# Copyright 2012 Google Inc. All Rights Reserved.

__author__ = 'benvanik@google.com (Ben Vanik)'

# Music

GF = '../../../third_party/games-framework'
include_rules(glob(GF + '/anvil_rules/**/*_rules.py'))

audio_tracklist(
    name='music',
    class_name='blk.assets.audio.Music',
    srcs=glob('*.ogg'))

audio_tracklist(
    name='music_optimized',
    class_name='blk.assets.audio.Music',
    formats=['audio/ogg', 'audio/mpeg', 'audio/mp4',],
    srcs=glob('*.ogg'))
