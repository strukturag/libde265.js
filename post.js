/**
 * libde265.js HEVC/H.265 decoder
 * (c)2014 struktur AG, http://www.struktur.de, opensource@struktur.de
 *
 * This file is part of libde265.js
 * https://github.com/strukturag/libde265.js
 *
 * libde265 is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * libde265 is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with libde265.js.  If not, see <http://www.gnu.org/licenses/>.
 */
// NOTE: wrapped inside "define(..., function(...) {" block from pre.js

    // don't pollute the global namespace
    delete this['Module'];

    /**
     * Public API.
     * 
     * @expose
     */
    var api = {
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
     * @expose
     */
    var Image = function(img) {
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
            this.width = api.de265_get_image_width(this.img, 0);
        }
        return this.width;
    };

    /**
     * @expose
     */
    Image.prototype.get_height = function() {
        if (this.height === null) {
            this.height = api.de265_get_image_height(this.img, 0);
        }
        return this.height;
    };

    /**
     * @expose
     */
    Image.prototype.display = function(imageData, callback) {
        // TODO(fancycode): move to WebWorker
        var w = this.get_width();
        var h = this.get_height();
        var stride = _malloc(4);
        var y = api.de265_get_image_plane(this.img, 0, stride);
        var stridey = getValue(stride, "i32");
        var u = api.de265_get_image_plane(this.img, 1, stride);
        var strideu = getValue(stride, "i32");
        var v = api.de265_get_image_plane(this.img, 2, stride);
        var stridev = getValue(stride, "i32");
        _free(stride);
        var yval;
        var uval;
        var vval;
        var xpos = 0;
        var ypos = 0;
        var w2 = w >> 1;
        var imageDataData = imageData.data;
        var maxi = w2*h;
        var yoffset = y;
        var uoffset = u;
        var voffset = v;
        var x2;
        var i2;
        for (var i=0; i<maxi; i++) {
            i2 = i << 1;
            x2 = (xpos << 1);
            yval = 1.164 * (HEAPU8[yoffset + x2] - 16);

            uval = HEAPU8[uoffset + xpos] - 128;
            vval = HEAPU8[voffset + xpos] - 128;
            imageDataData[(i2<<2)+0] = yval + 1.596 * vval;
            imageDataData[(i2<<2)+1] = yval - 0.813 * vval - 0.391 * uval;
            imageDataData[(i2<<2)+2] = yval + 2.018 * uval;

            yval = 1.164 * (HEAPU8[yoffset + x2 + 1] - 16);
            imageDataData[((i2+1)<<2)+0] = yval + 1.596 * vval;
            imageDataData[((i2+1)<<2)+1] = yval - 0.813 * vval - 0.391 * uval;
            imageDataData[((i2+1)<<2)+2] = yval + 2.018 * uval;

            xpos++;
            if (xpos === w2) {
                xpos = 0;
                ypos++;
                yoffset = y + (ypos * stridey);
                uoffset = u + ((ypos >> 1) * strideu);
                voffset = v + ((ypos >> 1) * stridev);
            }
        }
        callback(imageData);
    };

    /**
     * The HEVC/H.265 decoder
     * 
     * @constructor
     * @expose
     */
    var Decoder = function() {
        this.image_callback = null;
        this.more = _malloc(2);
        this.ctx = api.de265_new_decoder();
        api.de265_set_parameter_bool(this.ctx, api.DE265_DECODER_PARAM_BOOL_SEI_CHECK_HASH, true);
    };

    /**
     * @expose
     */
    Decoder.prototype.free = function() {
        api.de265_free_decoder(this.ctx);
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
        api.de265_reset(this.ctx);
    };

    /**
     * @expose
     */
    Decoder.prototype.push_data = function(data, pts) {
        pts = pts || 0;
        return api.de265_push_data(this.ctx, data, data.length, pts, 0);
    };

    /**
     * @expose
     */
    Decoder.prototype.flush = function() {
        return api.de265_flush_data(this.ctx);
    };

    /**
     * @expose
     */
    Decoder.prototype.has_more = function() {
        return getValue(this.more, "i16") !== 0;
    };

    /**
     * @expose
     */
    Decoder.prototype.decode = function(callback) {
        var err;
        setValue(this.more, "i16", 0);
        while (true) {
            err = api.de265_decode(this.ctx, this.more);
            switch (err) {
            case api.DE265_ERROR_WAITING_FOR_INPUT_DATA:
                setValue(this.more, "i16", 0);
                err = api.DE265_OK;
                break;

            default:
                if (!api.de265_isOK(err)) {
                    setValue(this.more, "i16", 0);
                }
            }

            var img = api.de265_get_next_picture(this.ctx);
            if (img) {
                if (this.image_callback) {
                    this.image_callback(new Image(img));
                }
                break;
            }

            if (getValue(this.more, "i16") === 0) {
                break;
            }
        }
        callback(err);
        return;
    };

    /**
     * @expose
     */
    api.Decoder = Decoder;

    return api;

});
