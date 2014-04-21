/**
 * libde265.js HEVC/H.265 decoder
 * (c)2014 struktur AG, http://www.struktur.de, opensource@struktur.de
 *
 * This file is part of libde265.js
 * https://github.com/strukturag/libde265.js
 *
 * libde265.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * libde265.js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with libde265.js.  If not, see <http://www.gnu.org/licenses/>.
 */
// don't pollute the global namespace
delete this['Module'];

/**
 * Public API.
 */
var libde265 = {
    /** @expose */
    DE265_OK: 0,
    /** @expose */
    DE265_ERROR_NO_SUCH_FILE: 1,
    //DE265_ERROR_NO_STARTCODE: 2, obsolete
    /** @expose */
    DE265_ERROR_EOF: 3,
    /** @expose */
    DE265_ERROR_COEFFICIENT_OUT_OF_IMAGE_BOUNDS: 4,
    /** @expose */
    DE265_ERROR_CHECKSUM_MISMATCH: 5,
    /** @expose */
    DE265_ERROR_CTB_OUTSIDE_IMAGE_AREA: 6,
    /** @expose */
    DE265_ERROR_OUT_OF_MEMORY: 7,
    /** @expose */
    DE265_ERROR_CODED_PARAMETER_OUT_OF_RANGE: 8,
    /** @expose */
    DE265_ERROR_IMAGE_BUFFER_FULL: 9,
    /** @expose */
    DE265_ERROR_CANNOT_START_THREADPOOL: 10,
    /** @expose */
    DE265_ERROR_LIBRARY_INITIALIZATION_FAILED: 11,
    /** @expose */
    DE265_ERROR_LIBRARY_NOT_INITIALIZED: 12,
    /** @expose */
    DE265_ERROR_WAITING_FOR_INPUT_DATA: 13,
    /** @expose */
    DE265_ERROR_CANNOT_PROCESS_SEI: 14,

    // --- errors that should become obsolete in later libde265 versions ---

    /** @expose */
    DE265_ERROR_MAX_THREAD_CONTEXTS_EXCEEDED: 500,
    /** @expose */
    DE265_ERROR_MAX_NUMBER_OF_SLICES_EXCEEDED: 501,
    //DE265_ERROR_SCALING_LIST_NOT_IMPLEMENTED: 502, obsolete

    // --- warnings ---

    /** @expose */
    DE265_WARNING_NO_WPP_CANNOT_USE_MULTITHREADING: 1000,
    /** @expose */
    DE265_WARNING_WARNING_BUFFER_FULL: 1001,
    /** @expose */
    DE265_WARNING_PREMATURE_END_OF_SLICE_SEGMENT: 1002,
    /** @expose */
    DE265_WARNING_INCORRECT_ENTRY_POINT_OFFSET: 1003,
    /** @expose */
    DE265_WARNING_CTB_OUTSIDE_IMAGE_AREA: 1004,
    /** @expose */
    DE265_WARNING_SPS_HEADER_INVALID: 1005,
    /** @expose */
    DE265_WARNING_PPS_HEADER_INVALID: 1006,
    /** @expose */
    DE265_WARNING_SLICEHEADER_INVALID: 1007,
    /** @expose */
    DE265_WARNING_INCORRECT_MOTION_VECTOR_SCALING: 1008,
    /** @expose */
    DE265_WARNING_NONEXISTING_PPS_REFERENCED: 1009,
    /** @expose */
    DE265_WARNING_NONEXISTING_SPS_REFERENCED: 1010,
    /** @expose */
    DE265_WARNING_BOTH_PREDFLAGS_ZERO: 1011,
    /** @expose */
    DE265_WARNING_NONEXISTING_REFERENCE_PICTURE_ACCESSED: 1012,
    /** @expose */
    DE265_WARNING_NUMMVP_NOT_EQUAL_TO_NUMMVQ: 1013,
    /** @expose */
    DE265_WARNING_NUMBER_OF_SHORT_TERM_REF_PIC_SETS_OUT_OF_RANGE: 1014,
    /** @expose */
    DE265_WARNING_SHORT_TERM_REF_PIC_SET_OUT_OF_RANGE: 1015,
    /** @expose */
    DE265_WARNING_FAULTY_REFERENCE_PICTURE_LIST: 1016,
    /** @expose */
    DE265_WARNING_EOSS_BIT_NOT_SET: 1017,
    /** @expose */
    DE265_WARNING_MAX_NUM_REF_PICS_EXCEEDED: 1018,
    /** @expose */
    DE265_WARNING_INVALID_CHROMA_FORMAT: 1019,
    /** @expose */
    DE265_WARNING_SLICE_SEGMENT_ADDRESS_INVALID: 1020,
    /** @expose */
    DE265_WARNING_DEPENDENT_SLICE_WITH_ADDRESS_ZERO: 1021,
    /** @expose */
    DE265_WARNING_NUMBER_OF_THREADS_LIMITED_TO_MAXIMUM: 1022,
    /** @expose */
    DE265_NON_EXISTING_LT_REFERENCE_CANDIDATE_IN_SLICE_HEADER: 1023,

    /** @expose */
    de265_get_version: cwrap('de265_get_version', 'string'),
    /** @expose */
    de265_get_version_number: cwrap('de265_get_version_number', 'number'),
    /** @expose */
    de265_get_error_text: cwrap('de265_get_error_text', 'string', ['number']),
    /** @expose */
    de265_isOK: cwrap('de265_isOK', 'number', ['number']),

    /** @expose */
    de265_chroma_mono: 0,
    /** @expose */
    de265_chroma_420: 1,  // currently the only used format
    /** @expose */
    de265_chroma_422: 2,
    /** @expose */
    de265_chroma_444: 3,

    /** @expose */
    de265_get_image_width: cwrap('de265_get_image_width', 'number', ['number', 'number']),
    /** @expose */
    de265_get_image_height: cwrap('de265_get_image_height', 'number', ['number', 'number']),
    /** @expose */
    de265_get_chroma_format: cwrap('de265_get_chroma_format', 'number', ['number']),
    /** @expose */
    de265_get_image_plane: cwrap('de265_get_image_plane', 'number', ['number', 'number', 'number']),
    /** @expose */
    de265_get_image_PTS: cwrap('de265_get_image_PTS', 'number', ['number']),
    /** @expose */
    de265_get_image_user_data: cwrap('de265_get_image_user_data', 'number', ['number']),

    /** @expose */
    de265_new_decoder: cwrap('de265_new_decoder', 'number'),
    // de265_start_worker_threads
    /** @expose */
    de265_free_decoder: cwrap('de265_free_decoder', 'number', ['number']),
    /** @expose */
    de265_push_data: cwrap('de265_push_data', 'number', ['number', 'array', 'number', 'number', 'number']),
    /** @expose */
    de265_push_NAL: cwrap('de265_push_NAL', 'number', ['number', 'array', 'number', 'number', 'number']),
    /** @expose */
    de265_flush_data: cwrap('de265_flush_data', 'number', ['number']),
    /** @expose */
    de265_get_number_of_input_bytes_pending: cwrap('de265_get_number_of_input_bytes_pending', 'number', ['number']),
    /** @expose */
    de265_get_number_of_NAL_units_pending: cwrap('de265_get_number_of_NAL_units_pending', 'number', ['number']),
    /** @expose */
    de265_decode: cwrap('de265_decode', 'number', ['number', 'number']),
    /** @expose */
    de265_reset: cwrap('de265_reset', 'number', ['number']),
    /** @expose */
    de265_peek_next_picture: cwrap('de265_peek_next_picture', 'number', ['number']),
    /** @expose */
    de265_get_next_picture: cwrap('de265_get_next_picture', 'number', ['number']),
    /** @expose */
    de265_release_next_picture: cwrap('de265_release_next_picture', 'number', ['number']),
    /** @expose */
    de265_get_warning: cwrap('de265_get_warning', 'number', ['number']),

    /** @expose */
    DE265_DECODER_PARAM_BOOL_SEI_CHECK_HASH: 0, // (bool) Perform SEI hash check on decoded pictures.
    /** @expose */
    DE265_DECODER_PARAM_DUMP_SPS_HEADERS: 1,    // (int)  Dump headers to specified file-descriptor.
    /** @expose */
    DE265_DECODER_PARAM_DUMP_VPS_HEADERS: 2,
    /** @expose */
    DE265_DECODER_PARAM_DUMP_PPS_HEADERS: 3,
    /** @expose */
    DE265_DECODER_PARAM_DUMP_SLICE_HEADERS: 4,
    /** @expose */
    DE265_DECODER_PARAM_ACCELERATION_CODE: 5,    // (int)  enum de265_acceleration, default: AUTO

    /** @expose */
    de265_acceleration_SCALAR: 0, // only fallback implementation
    /** @expose */
    de265_acceleration_MMX  : 10,
    /** @expose */
    de265_acceleration_SSE  : 20,
    /** @expose */
    de265_acceleration_SSE2 : 30,
    /** @expose */
    de265_acceleration_SSE4 : 40,
    /** @expose */
    de265_acceleration_AVX  : 50,    // not implemented yet
    /** @expose */
    de265_acceleration_AVX2 : 60,    // not implemented yet
    /** @expose */
    de265_acceleration_AUTO : 10000,

    /** @expose */
    de265_set_parameter_bool: cwrap('de265_set_parameter_bool', 'number', ['number', 'number', 'number']),
    /** @expose */
    de265_set_parameter_int: cwrap('de265_set_parameter_int', 'number', ['number', 'number', 'number']),
    /** @expose */
    de265_get_parameter_bool: cwrap('de265_get_parameter_bool', 'number', ['number', 'number'])
};

/**
 * A decoded image
 * 
 * @constructor
 */
var Image = function(decoder, img) {
    this.decoder = decoder;
    this.img = img;
    this.width = null;
    this.height = null;
};

/**
 * @expose
 */
Image.prototype.free = function() {
};

/**
 * @expose
 */
Image.prototype.get_width = function() {
    if (this.width === null) {
        this.width = libde265.de265_get_image_width(this.img, 0);
    }
    return this.width;
};

/**
 * @expose
 */
Image.prototype.get_height = function() {
    if (this.height === null) {
        this.height = libde265.de265_get_image_height(this.img, 0);
    }
    return this.height;
};

/**
 * @expose
 */
Image.prototype.display = function(imageData, callback) {
    var w = this.get_width();
    var h = this.get_height();
    var stride = _malloc(4);
    var y = libde265.de265_get_image_plane(this.img, 0, stride);
    var stridey = getValue(stride, "i32");
    var u = libde265.de265_get_image_plane(this.img, 1, stride);
    var strideu = getValue(stride, "i32");
    var v = libde265.de265_get_image_plane(this.img, 2, stride);
    var stridev = getValue(stride, "i32");
    _free(stride);

    this.decoder.convert_yuv2rgb(y, u, v, w, h, stridey, strideu, stridev, imageData, callback);
};

function worker_func() {
    self.addEventListener("message", function(e) {
        var data = e.data;
        switch (data["cmd"]) {
        case "start":
            break;

        case "stop":
            self.close();
            break;

        case "convert":
            var img = _do_convert_yuv2rgb(data["data"]["y"], data["data"]["u"], data["data"]["v"], data["data"]["w"], data["data"]["h"], data["data"]["stridey"], data["data"]["strideu"], data["data"]["stridev"]);
            this.postMessage({"cmd": "converted", "data": {"image": img}});
            break;

        default:
            // ignore unknown commands
            break;
        }
    }, 0);
}

var worker_blob_url = null;

/**
 * The HEVC/H.265 decoder
 * 
 * @constructor
 */
var Decoder = function() {
    this.image_callback = null;
    this.more = _malloc(2);
    this.stop = false;
    this.ctx = libde265.de265_new_decoder();
    if (typeof Worker !== "undefined" && typeof Uint8ClampedArray !== "undefined" && typeof Blob !== "undefined") {
        var that = this;
        this.yuv2rgb_callbacks = [];
        if (worker_blob_url === null) {
            // load worker from inplace blob so we don't have to depend
            // on additional external files
            var blob = new Blob([
                "(function() {\n",
                _do_convert_yuv2rgb.toString() + ";\n",
                worker_func.toString() + ";\n",
                worker_func.name + "();\n",
                "}).call(this);"
            ], {"type": "text/javascript"});

            worker_blob_url = window.URL.createObjectURL(blob);
        }
        this.yuv2rgb_worker = new Worker(worker_blob_url);
        this.yuv2rgb_worker.addEventListener('message', function(e) {
            switch (e.data["cmd"]) {
            case "converted":
                var cb = that.yuv2rgb_callbacks[0];
                that.yuv2rgb_callbacks = that.yuv2rgb_callbacks.splice(1);
                cb(e.data["data"]["image"]);
                break;

            default:
                // ignore unknown commands
                break;
            }
        }, false);
        this.yuv2rgb_worker.postMessage({"cmd": "start"});
    } else {
        this.yuv2rgb_worker = null;
    }
};

/**
 * @expose
 */
Decoder.prototype.free = function() {
    if (this.yuv2rgb_worker) {
        this.yuv2rgb_worker.postMessage({"cmd": "stop"});
        this.yuv2rgb_worker.terminate();
        this.yuv2rgb_worker = null;
        this.yuv2rgb_callbacks = null;
    }
    libde265.de265_free_decoder(this.ctx);
    this.ctx = null;
    _free(this.more);
    this.more = null;
};

/**
 * @expose
 */
Decoder.prototype.set_image_callback = function(callback) {
    this.image_callback = callback;
};

/**
 * @expose
 */
Decoder.prototype.reset = function() {
    libde265.de265_reset(this.ctx);
};

/**
 * @expose
 */
Decoder.prototype.push_data = function(data, pts) {
    pts = pts || 0;
    return libde265.de265_push_data(this.ctx, data, data.length, pts, 0);
};

/**
 * @expose
 */
Decoder.prototype.flush = function() {
    this.stop = true;
    return libde265.de265_flush_data(this.ctx);
};

/**
 * @expose
 */
Decoder.prototype.has_more = function() {
    return !this.stop || getValue(this.more, "i16") !== 0;
};

/**
 * @expose
 */
Decoder.prototype.decode = function(callback) {
    var err;
    setValue(this.more, 1, "i16");
    while (getValue(this.more, "i16") !== 0) {
        err = libde265.de265_decode(this.ctx, this.more);
        if (!libde265.de265_isOK(err)) {
            setValue(this.more, 0, "i16");
            break;
        }

        var img = libde265.de265_get_next_picture(this.ctx);
        if (img) {
            if (this.image_callback) {
                this.image_callback(new Image(this, img));
            }
            break;
        }
    }
    callback(err);
    return;
};

function _do_convert_yuv2rgb(y, u, v, w, h, stridey, strideu, stridev, dest) {
    if (!dest) {
        dest = new Uint8ClampedArray(w*h*4);
    }
    var yval;
    var uval;
    var vval;
    var xpos = 0;
    var ypos = 0;
    var w2 = w >> 1;
    var maxi = w2*h;
    var yoffset = 0;
    var uoffset = 0;
    var voffset = 0;
    var x2;
    var i2;
    for (var i=0; i<maxi; i++) {
        i2 = i << 1;
        x2 = (xpos << 1);
        yval = 1.164 * (y[yoffset + x2] - 16);

        uval = u[uoffset + xpos] - 128;
        vval = v[voffset + xpos] - 128;
        dest[(i2<<2)+0] = yval + 1.596 * vval;
        dest[(i2<<2)+1] = yval - 0.813 * vval - 0.391 * uval;
        dest[(i2<<2)+2] = yval + 2.018 * uval;
        dest[(i2<<2)+3] = 0xff;

        yval = 1.164 * (y[yoffset + x2 + 1] - 16);
        dest[((i2+1)<<2)+0] = yval + 1.596 * vval;
        dest[((i2+1)<<2)+1] = yval - 0.813 * vval - 0.391 * uval;
        dest[((i2+1)<<2)+2] = yval + 2.018 * uval;
        dest[((i2+1)<<2)+3] = 0xff;

        xpos++;
        if (xpos === w2) {
            xpos = 0;
            ypos++;
            yoffset += stridey;
            uoffset = ((ypos >> 1) * strideu);
            voffset = ((ypos >> 1) * stridev);
        }
    }
    return dest;
}

Decoder.prototype.convert_yuv2rgb = function(y, u, v, w, h, stridey, strideu, stridev, imageData, callback) {
    y = HEAPU8.subarray(y, y+(h*stridey));
    u = HEAPU8.subarray(u, u+(h*strideu));
    v = HEAPU8.subarray(v, v+(h*stridev));
    if (this.yuv2rgb_worker) {
        var msg = {
            "cmd": "convert",
            "data": {
                "y": new Uint8Array(y),
                "u": new Uint8Array(u),
                "v": new Uint8Array(v),
                "w": w,
                "h": h,
                "stridey": stridey,
                "strideu": strideu,
                "stridev": stridev
            }
        };
        this.yuv2rgb_callbacks.push(function(data) {
            if (imageData.data.set) {
                imageData.data.set(data);
            } else {
                var dest = imageData.data;
                var cnt = dest.length;
                for (var i=0; i<cnt; i++) {
                    dest[i] = data[i];
                }
            }
            callback(imageData);
        });
        this.yuv2rgb_worker.postMessage(msg);
        return;
    }

    _do_convert_yuv2rgb(y, u, v,
        w, h,
        stridey, strideu, stridev,
        imageData.data);
    callback(imageData);
};

/**
 * @expose
 */
libde265.Decoder = Decoder;

/**
 * A simple raw bitstream player interface.
 * 
 * @constructor
 */
var RawPlayer = function(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.status_cb = null;
    this.error_cb = null;
    this._reset();
};

RawPlayer.prototype._reset = function() {
    this.start = null;
    this.frames = 0;
    this.image_data = null;
    this.running = false;
};

/** @expose */
RawPlayer.prototype.set_status_callback = function(callback) {
    this.status_cb = callback;
};

RawPlayer.prototype._set_status = function() {
    if (this.status_cb) {
        this.status_cb.apply(this.status_cb, arguments);
    }
};

/** @expose */
RawPlayer.prototype.set_error_callback = function(callback) {
    this.error_cb = callback;
};

RawPlayer.prototype._set_error = function(error, message) {
    if (this.error_cb) {
        this.error_cb(error, message);
    }
};

RawPlayer.prototype._display_image = function(image) {
    if (!this.start) {
        this.start = new Date();
        this._set_status("playing");
    } else {
        this.frames += 1;
        var duration = (new Date()) - this.start;
        if (duration > 1000) {
            this._set_status("fps", this.frames / (duration * 0.001));
        }
    }

    var w = image.get_width();
    var h = image.get_height();
    if (w != this.canvas.width || h != this.canvas.height || !this.image_data) {
        this.canvas.width = w;
        this.canvas.height = h;
        this.image_data = this.ctx.createImageData(w, h);
        var image_data = this.image_data.data;
        for (var i=0; i<w*h; i++) {
            image_data[i*4+3] = 255;
        }
    }

    var that = this;
    image.display(this.image_data, function(display_image_data) {
        that.ctx.putImageData(display_image_data, 0, 0);
    });
};

RawPlayer.prototype._handle_onload = function(request, event) {
    var that = this;
    this._set_status("initializing");

    var decoder = new Decoder();
    decoder.set_image_callback(function(image) {
        that._display_image(image);
        image.free();
    });

    var data = request.response;
    var pos = 0;
    var remaining = data.byteLength;

    var decode = function() {
        if (!that.running) {
            return;
        }

        var err;
        if (remaining === 0) {
            err = decoder.flush();
        } else {
            var l = 4096;
            if (l > remaining) {
                l = remaining;
            }
            var tmp = new Uint8Array(data, pos, l);
            err = decoder.push_data(tmp);
            pos += l;
            remaining -= l;
        }
        if (!libde265.de265_isOK(err)) {
            that._set_error(err, libde265.de265_get_error_text(err));
            return;
        }
        
        decoder.decode(function(err) {
            switch(err) {
            case libde265.DE265_ERROR_WAITING_FOR_INPUT_DATA:
                setTimeout(decode, 0);
                return;

            default:
                if (!libde265.de265_isOK(err)) {
                    that._set_error(err, libde265.de265_get_error_text(err));
                    return;
                }
            }

            if (remaining > 0 || decoder.has_more()) {
                setTimeout(decode, 0);
                return;
            }
            
            decoder.free();
            that.stop();
        });
    };

    setTimeout(decode, 0);
};

/** @expose */
RawPlayer.prototype.playback = function(url) {
    this._reset();
    var request = new XMLHttpRequest();
    request.open("get", url, true);
    request.responseType = "arraybuffer";
    var that = this;
    request.onload = function(event) {
        that._handle_onload(request, event);
    };
    this._set_status("loading");
    this.running = true;
    request.send();
};

/** @expose */
RawPlayer.prototype.stop = function() {
    this._set_status("stopped");
    this._reset();
};

/**
 * @expose
 */
libde265.RawPlayer = RawPlayer;

var root = this;

if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        /** @expose */
        exports = module.exports = libde265;
    }
    /** @expose */
    exports.libde265 = libde265;
} else {
    /** @expose */
    root.libde265 = libde265;
}

if (typeof define === "function" && define.amd) {
    /** @expose */
    define([], function() {
        return libde265;
    });
}

// NOTE: wrapped inside "(function() {" block from pre.js
}).call(this);
