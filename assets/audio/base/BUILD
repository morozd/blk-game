# Copyright 2012 Google Inc. All Rights Reserved.

__author__ = 'benvanik@google.com (Ben Vanik)'

# Base game sound bank

GF = '../../../third_party/games-framework'
include_rules(glob(GF + '/anvil_rules/**/*_rules.py'))

audio_soundbank(
    name='base',
    class_name='blk.assets.audio.BaseSounds',
    srcs=glob('*.wav'))

audio_soundbank(
    name='base_optimized',
    class_name='blk.assets.audio.BaseSounds',
    formats=['audio/wav', 'audio/ogg', 'audio/mpeg',],
    srcs=glob('*.wav'))
