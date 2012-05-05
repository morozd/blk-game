# Copyright 2012 Google Inc. All Rights Reserved.

__author__ = 'benvanik@google.com (Ben Vanik)'

# Master build file for blk-game

GF = 'third_party/games-framework'
GSS_COMPILER_JAR=GF + ':closure_stylesheets_jar'
JS_COMPILER_JAR=GF + ':closure_compiler_jar'
GLSL_COMPILER_JS=GF + ':glsl_compiler_js'
include_rules(glob(GF + '/anvil_rules/**/*_rules.py'))


# ----------------------------------------------------------------------------------------------------------------------
# CSS
# ----------------------------------------------------------------------------------------------------------------------

closure_gss_library(
    name='blk_css_debug_compiled',
    mode='DEBUG_COMPILED',
    srcs='assets/css:all_client_css',
    compiler_jar=GSS_COMPILER_JAR)

closure_gss_library(
    name='blk_css_compiled',
    mode='COMPILED',
    srcs='assets/css:all_client_css',
    compiler_jar=GSS_COMPILER_JAR)
file_set(
    name='blk_css_compiled_only',
    srcs=':blk_css_compiled',
    src_filter='*.css')


# ----------------------------------------------------------------------------------------------------------------------
# Static Content
# ----------------------------------------------------------------------------------------------------------------------

COMMON_CLIENT_STATIC_FILES=[
    'client/index.html',
    'client/index.css',
    ]

copy_files(
    name='blk_client_static_uncompiled',
    srcs=COMMON_CLIENT_STATIC_FILES + [
        'client/game-uncompiled.html',
        'client/worker-server-uncompiled.js',
        ])

copy_files(
    name='blk_client_static_compiled',
    srcs=COMMON_CLIENT_STATIC_FILES + [
        'client/game.html',
        'client/worker-server.js',
        ])

COMMON_NODE_STATIC_FILES=[
    ]

copy_files(
    name='blk_node_static_uncompiled',
    srcs=COMMON_NODE_STATIC_FILES + [
        'server/server-uncompiled.js',
        ])

copy_files(
    name='blk_node_static_compiled',
    srcs=COMMON_NODE_STATIC_FILES + [
        'server/server.js',
        ])


# ----------------------------------------------------------------------------------------------------------------------
# Textures
# ----------------------------------------------------------------------------------------------------------------------

# TODO(benvaniK): atlases
file_set(
    name='blk_blocksets',
    namespace='blk.assets.blocksets',
    srcs=glob('assets/blocksets/**/*.png'))
file_set(
    name='blk_blockset_images',
    srcs=':blk_blocksets',
    src_filter='*.png')

texture_set(
    name='blk_textures',
    namespace='blk.assets.textures',
    srcs=glob('assets/textures/**/*.*'))
file_set(
    name='blk_texture_images',
    srcs=':blk_textures',
    src_filter='*.png|*.jpg|*.gif|*.webp')

texture_set(
    name='blk_font_textures',
    namespace='blk.assets.fonts',
    srcs=glob('assets/fonts/**/*.png'))
file_set(
    name='blk_font_texture_images',
    srcs=':blk_font_textures',
    src_filter='*.png')

file_set(
    name='blk_images',
    srcs=[
        ':blk_blockset_images',
        ':blk_texture_images',
        ':blk_font_texture_images',
        ])


# ----------------------------------------------------------------------------------------------------------------------
# GLSL
# ----------------------------------------------------------------------------------------------------------------------

file_set(
    name='all_glsl',
    srcs=glob('assets/programs/**/*.glsl'))
file_set(
    name='all_glsllib',
    srcs=glob('assets/programs/**/*.glsllib'))

compile_glsl(
    name='blk_glsl',
    srcs=[':all_glsl'],
    deps=[':all_glsllib'],
    compiler_js=GLSL_COMPILER_JS)
file_set(
    name='blk_glsl_json',
    srcs=[':blk_glsl'],
    src_filter='*.json')


# ----------------------------------------------------------------------------------------------------------------------
# Messages/networking
# ----------------------------------------------------------------------------------------------------------------------

compile_msg(
    name='blk_msg',
    srcs=glob('src/**/*.msg'))


# ----------------------------------------------------------------------------------------------------------------------
# JavaScript
# ----------------------------------------------------------------------------------------------------------------------

file_set(
    name='all_js',
    srcs=glob('src/**/*.js'))

closure_js_fixstyle(
    name='blk_js_fixstyle',
    namespaces=['goog', 'gf', 'blk',],
    srcs=[':all_js'])

closure_js_fixstyle(
    name='all_js_fixstyle',
    namespaces=['goog', 'gf', 'blk',],
    srcs=[
        GF + ':gf_js',
        ':all_js',
        ])

closure_js_lint(
    name='blk_js_lint',
    namespaces=['goog', 'gf', 'blk',],
    srcs=[':blk_js_fixstyle'])

BLK_JS_SRCS=[
    GF + ':all_gf_js',
    ':all_js',
    ':blk_msg',
    ]

BLK_CLIENT_JS_SRCS=BLK_JS_SRCS + [
    ':blk_css_compiled',
    ':blk_glsl',
    #':blk_textures',
    ':blk_font_textures',
    ]

BLK_SERVER_JS_SRCS=BLK_JS_SRCS + [
    ]

SHARED_JS_FLAGS=[
    #'--define=gf.BUILD_CLIENT=false',
    #'--define=goog.DEBUG=false',
    #'--define=goog.asserts.ENABLE_ASSERTS=false',
    ]

closure_js_library(
    name='blk_js_uncompiled',
    mode='UNCOMPILED',
    entry_points=['blk.client.start', 'blk.server.start',],
    srcs=BLK_CLIENT_JS_SRCS,
    compiler_jar=JS_COMPILER_JAR)

closure_js_library(
    name='blk_client_js_compiled',
    mode='ADVANCED',
    entry_points='blk.client.start',
    srcs=BLK_CLIENT_JS_SRCS,
    externs=[GF + ':closure_externs'],
    compiler_jar=JS_COMPILER_JAR,
    compiler_flags=SHARED_JS_FLAGS + [
        '--define=gf.SERVER=false',
        '--define=gf.NODE=false',
        ])

closure_js_library(
    name='blk_server_js_compiled',
    mode='ADVANCED',
    entry_points='blk.server.start',
    srcs=BLK_SERVER_JS_SRCS,
    externs=[GF + ':closure_externs'],
    compiler_jar=JS_COMPILER_JAR,
    compiler_flags=SHARED_JS_FLAGS + [
        '--define=gf.SERVER=true',
        '--define=gf.NODE=false',
        ])

closure_js_library(
    name='blk_node_js_compiled',
    mode='ADVANCED',
    entry_points='blk.server.start',
    srcs=BLK_SERVER_JS_SRCS,
    externs=[GF + ':closure_externs'],
    compiler_jar=JS_COMPILER_JAR,
    compiler_flags=SHARED_JS_FLAGS + [
        '--define=gf.SERVER=true',
        '--define=gf.NODE=true',
        ],
    wrap_with_global='global')

file_set(
    name='node_modules',
    srcs=
        glob(GF + '/third_party/abbrev/**/*.*') +
        glob(GF + '/third_party/nopt/**/*.*') +
        glob(GF + '/third_party/node-closure/**/*.*') +
        glob(GF + '/third_party/options/**/*.*') +
        glob(GF + '/third_party/ws/**/*.*'))


# ----------------------------------------------------------------------------------------------------------------------
# Target rules
# ----------------------------------------------------------------------------------------------------------------------

file_set(
    name='lint',
    deps=':blk_js_lint')

file_set(
    name='debug',
    srcs=[
        ':blk_client_static_uncompiled',
        ':blk_node_static_uncompiled',
        ':blk_images',
        ':blk_css_debug_compiled',
        ':blk_glsl_json',
        ':blk_js_uncompiled',
        ':node_modules',
        ])

file_set(
    name='release',
    srcs=[
        ':blk_client_static_compiled',
        ':blk_node_static_compiled',
        ':blk_images',
        ':blk_css_compiled_only',
        ':blk_client_js_compiled',
        ':blk_server_js_compiled',
        ':blk_node_js_compiled',
        ':node_modules',
        ],
    deps=[
        #':blk_js_lint',
        ])
