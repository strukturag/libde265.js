require(['libde265'], function(libde265) {
    
    var playback = function(url) {
        url = url || "paris-ra-wpp.bin";
        var req = new XMLHttpRequest();
        req.open("get", url, true);
        req.responseType = "arraybuffer";
        
        var canvas = document.getElementById("video");
        var ctx = canvas.getContext("2d");
        var imageData = null;

        var displayImage = function(img) {
            var w = img.get_width();
            var h = img.get_height();
            if (w != canvas.width || h != canvas.height || !imageData) {
                canvas.width = w;
                canvas.height = h;
                imageData = ctx.createImageData(w, h);
                var imageDataData = imageData.data;
                for (var i=0; i<w*h; i++) {
                    imageDataData[i*4+3] = 255;
                }
            }
            
            img.display(imageData, function(displayImageData) {
                ctx.putImageData(displayImageData, 0, 0);
            });
        };

        req.onload = function(event) {
            // TODO(fancycode): move decoding to WebWorker
            var decoder = new libde265.Decoder();
            decoder.set_image_callback(function(image) {
                displayImage(image);
                image.free();
            });
            
            var data = req.response;
            var pos = 0;
            var remaining = data.byteLength;
            
            var decode = function() {
                var err;
                if (remaining === 0) {
                    err = decoder.flush();
                } else {
                    var l = 40960;
                    if (l > remaining) {
                        l = remaining;
                    }
                    var tmp = new Uint8Array(data, pos, l);
                    err = decoder.push_data(tmp);
                    pos += l;
                    remaining -= l;
                }
                if (!libde265.de265_isOK(err)) {
                    console.log("Pushed", err, libde265.de265_get_error_text(err));
                    return;
                }
                
                decoder.decode(function(err) {
                    if (!libde265.de265_isOK(err)) {
                        console.log("Decode", err, libde265.de265_get_error_text(err));
                        return;
                    }
                    
                    if (remaining > 0 || decoder.has_more()) {
                        setTimeout(decode, 0);
                        return;
                    }
                    
                    decoder.free();
                });
            }
            
            setTimeout(decode, 0);
        };
        
        req.send();
    };
    
    var button = document.getElementById("play");
    button.addEventListener("click", function() {
        playback();
        return false;
    }, false); 
    
});
