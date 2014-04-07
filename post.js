// NOTE: wrapped inside "define(..., function(...) {" block from pre.js

    var api = {
        DE265_OK: 0,
        DE265_ERROR_NO_SUCH_FILE: 1,
        //DE265_ERROR_NO_STARTCODE: 2, obsolete
        DE265_ERROR_EOF: 3,
        DE265_ERROR_COEFFICIENT_OUT_OF_IMAGE_BOUNDS: 4,
        DE265_ERROR_CHECKSUM_MISMATCH: 5,
        DE265_ERROR_CTB_OUTSIDE_IMAGE_AREA: 6,
        DE265_ERROR_OUT_OF_MEMORY: 7,
        DE265_ERROR_CODED_PARAMETER_OUT_OF_RANGE: 8,
        DE265_ERROR_IMAGE_BUFFER_FULL: 9,
        DE265_ERROR_CANNOT_START_THREADPOOL: 10,
        DE265_ERROR_LIBRARY_INITIALIZATION_FAILED: 11,
        DE265_ERROR_LIBRARY_NOT_INITIALIZED: 12,
        DE265_ERROR_WAITING_FOR_INPUT_DATA: 13,
        DE265_ERROR_CANNOT_PROCESS_SEI: 14,

        // --- errors that should become obsolete in later libde265 versions ---

        DE265_ERROR_MAX_THREAD_CONTEXTS_EXCEEDED: 500,
        DE265_ERROR_MAX_NUMBER_OF_SLICES_EXCEEDED: 501,
        //DE265_ERROR_SCALING_LIST_NOT_IMPLEMENTED: 502, obsolete

        // --- warnings ---

        DE265_WARNING_NO_WPP_CANNOT_USE_MULTITHREADING: 1000,
        DE265_WARNING_WARNING_BUFFER_FULL: 1001,
        DE265_WARNING_PREMATURE_END_OF_SLICE_SEGMENT: 1002,
        DE265_WARNING_INCORRECT_ENTRY_POINT_OFFSET: 1003,
        DE265_WARNING_CTB_OUTSIDE_IMAGE_AREA: 1004,
        DE265_WARNING_SPS_HEADER_INVALID: 1005,
        DE265_WARNING_PPS_HEADER_INVALID: 1006,
        DE265_WARNING_SLICEHEADER_INVALID: 1007,
        DE265_WARNING_INCORRECT_MOTION_VECTOR_SCALING: 1008,
        DE265_WARNING_NONEXISTING_PPS_REFERENCED: 1009,
        DE265_WARNING_NONEXISTING_SPS_REFERENCED: 1010,
        DE265_WARNING_BOTH_PREDFLAGS_ZERO: 1011,
        DE265_WARNING_NONEXISTING_REFERENCE_PICTURE_ACCESSED: 1012,
        DE265_WARNING_NUMMVP_NOT_EQUAL_TO_NUMMVQ: 1013,
        DE265_WARNING_NUMBER_OF_SHORT_TERM_REF_PIC_SETS_OUT_OF_RANGE: 1014,
        DE265_WARNING_SHORT_TERM_REF_PIC_SET_OUT_OF_RANGE: 1015,
        DE265_WARNING_FAULTY_REFERENCE_PICTURE_LIST: 1016,
        DE265_WARNING_EOSS_BIT_NOT_SET: 1017,
        DE265_WARNING_MAX_NUM_REF_PICS_EXCEEDED: 1018,
        DE265_WARNING_INVALID_CHROMA_FORMAT: 1019,
        DE265_WARNING_SLICE_SEGMENT_ADDRESS_INVALID: 1020,
        DE265_WARNING_DEPENDENT_SLICE_WITH_ADDRESS_ZERO: 1021,
        DE265_WARNING_NUMBER_OF_THREADS_LIMITED_TO_MAXIMUM: 1022,
        DE265_NON_EXISTING_LT_REFERENCE_CANDIDATE_IN_SLICE_HEADER: 1023,

        de265_get_version: Module.cwrap('de265_get_version', 'string'),
        de265_get_version_number: Module.cwrap('de265_get_version_number', 'number'),
        de265_get_error_text: Module.cwrap('de265_get_error_text', 'string', ['number']),
        de265_isOK: Module.cwrap('de265_isOK', 'number', ['number']),

        de265_chroma_mono: 0,
        de265_chroma_420: 1,  // currently the only used format
        de265_chroma_422: 2,
        de265_chroma_444: 3,

        de265_get_image_width: Module.cwrap('de265_get_image_width', 'number', ['number', 'number']),
        de265_get_image_height: Module.cwrap('de265_get_image_height', 'number', ['number', 'number']),
        de265_get_chroma_format: Module.cwrap('de265_get_chroma_format', 'number', ['number']),
        de265_get_image_plane: Module.cwrap('de265_get_image_plane', 'number', ['number', 'number', 'number']),
        de265_get_image_PTS: Module.cwrap('de265_get_image_PTS', 'number', ['number']),
        de265_get_image_user_data: Module.cwrap('de265_get_image_user_data', 'number', ['number']),

        de265_new_decoder: Module.cwrap('de265_new_decoder', 'number'),
        // de265_start_worker_threads
        de265_free_decoder: Module.cwrap('de265_free_decoder', 'number', ['number']),
        de265_push_data: Module.cwrap('de265_push_data', 'number', ['number', 'array', 'number', 'number', 'number']),
        de265_push_NAL: Module.cwrap('de265_push_NAL', 'number', ['number', 'array', 'number', 'number', 'number']),
        de265_flush_data: Module.cwrap('de265_flush_data', 'number', ['number']),
        de265_get_number_of_input_bytes_pending: Module.cwrap('de265_get_number_of_input_bytes_pending', 'number', ['number']),
        de265_get_number_of_NAL_units_pending: Module.cwrap('de265_get_number_of_NAL_units_pending', 'number', ['number']),
        de265_decode: Module.cwrap('de265_decode', 'number', ['number', 'number']),
        de265_reset: Module.cwrap('de265_reset', 'number', ['number']),
        de265_peek_next_picture: Module.cwrap('de265_peek_next_picture', 'number', ['number']),
        de265_get_next_picture: Module.cwrap('de265_get_next_picture', 'number', ['number']),
        de265_release_next_picture: Module.cwrap('de265_release_next_picture', 'number', ['number']),
        de265_get_warning: Module.cwrap('de265_get_warning', 'number', ['number']),

        DE265_DECODER_PARAM_BOOL_SEI_CHECK_HASH: 0, // (bool) Perform SEI hash check on decoded pictures.
        DE265_DECODER_PARAM_DUMP_SPS_HEADERS: 1,    // (int)  Dump headers to specified file-descriptor.
        DE265_DECODER_PARAM_DUMP_VPS_HEADERS: 2,
        DE265_DECODER_PARAM_DUMP_PPS_HEADERS: 3,
        DE265_DECODER_PARAM_DUMP_SLICE_HEADERS: 4,
        DE265_DECODER_PARAM_ACCELERATION_CODE: 5,    // (int)  enum de265_acceleration, default: AUTO

        de265_acceleration_SCALAR: 0, // only fallback implementation
        de265_acceleration_MMX  : 10,
        de265_acceleration_SSE  : 20,
        de265_acceleration_SSE2 : 30,
        de265_acceleration_SSE4 : 40,
        de265_acceleration_AVX  : 50,    // not implemented yet
        de265_acceleration_AVX2 : 60,    // not implemented yet
        de265_acceleration_AUTO : 10000,

        de265_set_parameter_bool: Module.cwrap('de265_set_parameter_bool', 'number', ['number', 'number', 'number']),
        de265_set_parameter_int: Module.cwrap('de265_set_parameter_int', 'number', ['number', 'number', 'number']),
        de265_get_parameter_bool: Module.cwrap('de265_get_parameter_bool', 'number', ['number', 'number'])
    };

    var Image = function(img) {
        this.img = img;
        this.width = null;
        this.height = null;
    };

    Image.prototype.free = function() {
    };

    Image.prototype.get_width = function() {
        if (this.width === null) {
            this.width = api.de265_get_image_width(this.img, 0);
        }
        return this.width;
    };

    Image.prototype.get_height = function() {
        if (this.height === null) {
            this.height = api.de265_get_image_height(this.img, 0);
        }
        return this.height;
    };

    Image.prototype.display = function(imageData, callback) {
        // TODO(fancycode): move to WebWorker
        var w = this.get_width();
        var h = this.get_height();
        var stride = Module._malloc(4);
        var y = api.de265_get_image_plane(this.img, 0, stride);
        var stridey = Module.getValue(stride, "i32");
        var u = api.de265_get_image_plane(this.img, 1, stride);
        var strideu = Module.getValue(stride, "i32");
        var v = api.de265_get_image_plane(this.img, 2, stride);
        var stridev = Module.getValue(stride, "i32");
        Module._free(stride);
        var yval;
        var uval;
        var vval;
        var xpos = 0;
        var ypos = 0;
        var w2 = w >> 1;
        var HEAPU8 = Module.HEAPU8;
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

    var Decoder = function() {
        this.image_callback = null;
        this.more = Module._malloc(2);
        this.ctx = api.de265_new_decoder();
        api.de265_set_parameter_bool(this.ctx, api.DE265_DECODER_PARAM_BOOL_SEI_CHECK_HASH, true);
    };

    Decoder.prototype.free = function() {
        api.de265_free_decoder(this.ctx);
        this.ctx = null;
        Module._free(this.more);
        this.more = null;
    };

    Decoder.prototype.set_image_callback = function(callback) {
        this.image_callback = callback;
    };

    Decoder.prototype.reset = function() {
        api.de265_reset(this.ctx);
    };

    Decoder.prototype.push_data = function(data, pts) {
        pts = pts || 0;
        return api.de265_push_data(this.ctx, data, data.length, pts, 0);
    };

    Decoder.prototype.flush = function() {
        return api.de265_flush_data(this.ctx);
    };

    Decoder.prototype.has_more = function() {
        return Module.getValue(this.more, "i16") !== 0;
    };

    Decoder.prototype.decode = function(callback) {
        var err;
        Module.setValue(this.more, "i16", 0);
        while (true) {
            err = api.de265_decode(this.ctx, this.more);
            switch (err) {
            case api.DE265_ERROR_WAITING_FOR_INPUT_DATA:
                Module.setValue(this.more, "i16", 0);
                err = api.DE265_OK;
                break;

            default:
                if (!api.de265_isOK(err)) {
                    Module.setValue(this.more, "i16", 0);
                }
            }

            var img = api.de265_get_next_picture(this.ctx);
            if (img) {
                if (this.image_callback) {
                    this.image_callback(new Image(img));
                }
                break;
            }

            if (Module.getValue(this.more, "i16") === 0) {
                break;
            }
        }
        callback(err);
        return;
    };

    api.Decoder = Decoder;

    return api;

});
