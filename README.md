# libde265.js

Pure JavaScript HEVC/H.265 video decoding library using libde265.

Compiled from libde265 using Emscripten. Should run in all current
browsers like Google Chrome 33+, Firefox 28+, IE 11+, Opera 20+ and
Safari 7+ on OSX Mavericks. Older versions might work, but this is
mostly untested.

NOTE: This is a very early preview which needs more testing and lots of
optimizations!

## Building

(currently only tested on Linux)

- Install [Emscripten][1] and put into your `PATH`
- Execute the `build.sh`, this will download and compile libde265 using
  Emscripten and will generate the `libde265.js` file.
- If the version of your default LLVM is below 3.2, you might need to
  install the package `llvm-3.2` (or newer) and set the environment
  variable `LLVM_ADD_VERSION` to `3.2` (or whatever you installed).

## Examples

A small example can be found in the `demo` folder and on
https://strukturag.github.io/libde265.js/.

## Known issues

- More code from libde265 should be made asm.js aware
- Decoding should be made asynchronous through WebWorkers where available

[1]: http://emscripten.org

Copyright (c) 2014 struktur AG

fixes gewisser 2021
