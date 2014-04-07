#!/bin/bash
export LIBDE265_VERSION=0.6

if [ ! -e "libde265-${LIBDE265_VERSION}.tar.gz" ]; then
    wget https://github.com/strukturag/libde265/releases/download/v${LIBDE265_VERSION}/libde265-${LIBDE265_VERSION}.tar.gz
    tar xzf libde265-${LIBDE265_VERSION}.tar.gz
    patch -p0 < patches/libde265-0.6_disable_sse.diff
    cd libde265-${LIBDE265_VERSION}
    emconfigure ./configure --disable-dec265 --disable-sherlock265
    emmake make
    cd ..
fi

emcc libde265-${LIBDE265_VERSION}/libde265/.libs/libde265.so \
    -o libde265.js \
    -s NO_EXIT_RUNTIME=1 \
    -s TOTAL_MEMORY=134217728 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s EXPORT_ALL=1 \
    -O2 \
    --pre-js pre.js \
    --post-js post.js
