#!/bin/bash
export LIBDE265_VERSION=0.7

if [ ! -e "libde265-${LIBDE265_VERSION}.tar.gz" ]; then
    wget https://github.com/strukturag/libde265/releases/download/v${LIBDE265_VERSION}/libde265-${LIBDE265_VERSION}.tar.gz
    tar xzf libde265-${LIBDE265_VERSION}.tar.gz
    cd libde265-${LIBDE265_VERSION}
    emconfigure ./configure --disable-sse --disable-dec265 --disable-sherlock265
    emmake make
    cd ..
fi

echo "Running Emscripten..."
emcc libde265-${LIBDE265_VERSION}/libde265/.libs/libde265.so \
    -s NO_EXIT_RUNTIME=1 \
    -s TOTAL_MEMORY=268435456 \
    -s EXPORTED_FUNCTIONS="[ \
        '_de265_get_version', \
        '_de265_get_version_number', \
        '_de265_get_error_text', \
        '_de265_isOK', \
        '_de265_get_image_width', \
        '_de265_get_image_height', \
        '_de265_get_chroma_format', \
        '_de265_get_image_plane', \
        '_de265_get_image_PTS', \
        '_de265_get_image_user_data', \
        '_de265_new_decoder', \
        '_de265_free_decoder', \
        '_de265_push_data', \
        '_de265_push_NAL', \
        '_de265_flush_data', \
        '_de265_get_number_of_input_bytes_pending', \
        '_de265_get_number_of_NAL_units_pending', \
        '_de265_decode', \
        '_de265_reset', \
        '_de265_peek_next_picture', \
        '_de265_get_next_picture', \
        '_de265_release_next_picture', \
        '_de265_get_warning', \
        '_de265_set_parameter_bool', \
        '_de265_set_parameter_int', \
        '_de265_get_parameter_bool'
    ]" \
    -O2 \
    --pre-js pre.js \
    --post-js post.js \
    -o lib/libde265.js

echo "Running Emscripten (minimized)..."
emcc libde265-${LIBDE265_VERSION}/libde265/.libs/libde265.so \
    -s NO_EXIT_RUNTIME=1 \
    -s TOTAL_MEMORY=268435456 \
    -s EXPORTED_FUNCTIONS="[ \
        '_de265_get_version', \
        '_de265_get_version_number', \
        '_de265_get_error_text', \
        '_de265_isOK', \
        '_de265_get_image_width', \
        '_de265_get_image_height', \
        '_de265_get_chroma_format', \
        '_de265_get_image_plane', \
        '_de265_get_image_PTS', \
        '_de265_get_image_user_data', \
        '_de265_new_decoder', \
        '_de265_free_decoder', \
        '_de265_push_data', \
        '_de265_push_NAL', \
        '_de265_flush_data', \
        '_de265_get_number_of_input_bytes_pending', \
        '_de265_get_number_of_NAL_units_pending', \
        '_de265_decode', \
        '_de265_reset', \
        '_de265_peek_next_picture', \
        '_de265_get_next_picture', \
        '_de265_release_next_picture', \
        '_de265_get_warning', \
        '_de265_set_parameter_bool', \
        '_de265_set_parameter_int', \
        '_de265_get_parameter_bool'
    ]" \
    -O3 \
    --pre-js pre.js \
    --post-js post.js \
    -o lib/libde265.min.js \
    -s CLOSURE_ANNOTATIONS=1 \
    --closure 1
