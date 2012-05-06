# Copyright 2012 Google Inc. All Rights Reserved.

__author__ = 'benvanik@google.com (Ben Vanik)'

# Sound bank 1

GF = '../../../third_party/games-framework'
include_rules(glob(GF + '/anvil_rules/**/*_rules.py'))

audio_soundbank(
    name='bank1',
    class_name='blk.assets.audio.Bank1',
    srcs=glob('*.wav'))

audio_soundbank(
    name='bank1_optimized',
    class_name='blk.assets.audio.Bank1',
    formats=['audio/wav', 'audio/ogg', 'audio/mpeg', 'audio/mp4',],
    srcs=glob('*.wav'))
