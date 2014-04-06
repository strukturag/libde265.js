define([], function() {

var Module = {
    print: function(text) {
        text = Array.prototype.slice.call(arguments).join(' ');
        console.log(text);
    },
    printErr: function(text) {
        text = Array.prototype.slice.call(arguments).join(' ');
        console.error(text);
    },
    canvas: {},
    noInitialRun: true
};
