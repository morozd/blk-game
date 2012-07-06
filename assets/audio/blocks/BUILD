# Copyright 2012 Google Inc. All Rights Reserved.

__author__ = 'benvanik@google.com (Ben Vanik)'

# Sound bank 1

GF = '../../../third_party/games-framework'
include_rules(glob(GF + '/anvil_rules/**/*_rules.py'))

audio_soundbank(
    name='blocks',
    class_name='blk.assets.audio.BlockSounds',
    srcs=glob('*.wav'))

audio_soundbank(
    name='blocks_optimized',
    class_name='blk.assets.audio.BlockSounds',
    formats=['audio/wav', 'audio/ogg', 'audio/mpeg',],
    srcs=glob('*.wav'))
