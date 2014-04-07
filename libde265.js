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

// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  Module['arguments'] = process['argv'].slice(2);

  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  this['Module'] = Module;

  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



// === Auto-generated preamble library stuff ===

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?\{ ?[^}]* ?\}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (vararg) return 8;
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_ && type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    code = Pointer_stringify(code);
    if (code[0] === '"') {
      // tolerate EM_ASM("..code..") even though EM_ASM(..code..) is correct
      if (code.indexOf('"', 1) === code.length-1) {
        code = code.substr(1, code.length-2);
      } else {
        // something invalid happened, e.g. EM_ASM("..code($0)..", input)
        abort('invalid EM_ASM input |' + code + '|. Please use EM_ASM(..code..) (no quotes) or EM_ASM({ ..code($0).. }, input) (to input values)');
      }
    }
    return Runtime.asmConstCache[code] = eval('(function(' + args.join(',') + '){ ' + code + ' })'); // new Function does not allow upvars in node
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;

      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }

      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }

      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  getCompilerSetting: function (name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}


Module['Runtime'] = Runtime;









//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}

// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;

// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }

  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;

// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;

function demangle(func) {
  var i = 3;
  // params, etc.
  var basicTypes = {
    'v': 'void',
    'b': 'bool',
    'c': 'char',
    's': 'short',
    'i': 'int',
    'l': 'long',
    'f': 'float',
    'd': 'double',
    'w': 'wchar_t',
    'a': 'signed char',
    'h': 'unsigned char',
    't': 'unsigned short',
    'j': 'unsigned int',
    'm': 'unsigned long',
    'x': 'long long',
    'y': 'unsigned long long',
    'z': '...'
  };
  var subs = [];
  var first = true;
  function dump(x) {
    //return;
    if (x) Module.print(x);
    Module.print(func);
    var pre = '';
    for (var a = 0; a < i; a++) pre += ' ';
    Module.print (pre + '^');
  }
  function parseNested() {
    i++;
    if (func[i] === 'K') i++; // ignore const
    var parts = [];
    while (func[i] !== 'E') {
      if (func[i] === 'S') { // substitution
        i++;
        var next = func.indexOf('_', i);
        var num = func.substring(i, next) || 0;
        parts.push(subs[num] || '?');
        i = next+1;
        continue;
      }
      if (func[i] === 'C') { // constructor
        parts.push(parts[parts.length-1]);
        i += 2;
        continue;
      }
      var size = parseInt(func.substr(i));
      var pre = size.toString().length;
      if (!size || !pre) { i--; break; } // counter i++ below us
      var curr = func.substr(i + pre, size);
      parts.push(curr);
      subs.push(curr);
      i += pre + size;
    }
    i++; // skip E
    return parts;
  }
  function parse(rawList, limit, allowVoid) { // main parser
    limit = limit || Infinity;
    var ret = '', list = [];
    function flushList() {
      return '(' + list.join(', ') + ')';
    }
    var name;
    if (func[i] === 'N') {
      // namespaced N-E
      name = parseNested().join('::');
      limit--;
      if (limit === 0) return rawList ? [name] : name;
    } else {
      // not namespaced
      if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
      var size = parseInt(func.substr(i));
      if (size) {
        var pre = size.toString().length;
        name = func.substr(i + pre, size);
        i += pre + size;
      }
    }
    first = false;
    if (func[i] === 'I') {
      i++;
      var iList = parse(true);
      var iRet = parse(true, 1, true);
      ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
    } else {
      ret = name;
    }
    paramLoop: while (i < func.length && limit-- > 0) {
      //dump('paramLoop');
      var c = func[i++];
      if (c in basicTypes) {
        list.push(basicTypes[c]);
      } else {
        switch (c) {
          case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
          case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
          case 'L': { // literal
            i++; // skip basic type
            var end = func.indexOf('E', i);
            var size = end - i;
            list.push(func.substr(i, size));
            i += size + 2; // size + 'EE'
            break;
          }
          case 'A': { // array
            var size = parseInt(func.substr(i));
            i += size.toString().length;
            if (func[i] !== '_') throw '?';
            i++; // skip _
            list.push(parse(true, 1, true)[0] + ' [' + size + ']');
            break;
          }
          case 'E': break paramLoop;
          default: ret += '?' + c; break paramLoop;
        }
      }
    }
    if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
    return rawList ? list : ret + flushList();
  }
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    return parse();
  } catch(e) {
    return func;
  }
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk

function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 268435456;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

var totalMemory = 4096;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be more reasonable');
  TOTAL_MEMORY = totalMemory;
}

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'JS engine does not provide full typed array support');

var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;

function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;

// Tools

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


var memoryInitializer = null;

// === Body ===



STATIC_BASE = 8;

STATICTOP = STATIC_BASE + 49728;


/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });









var _stdout;
var _stdout=_stdout=allocate(1, "i32*", ALLOC_STATIC);
var _stderr;
var _stderr=_stderr=allocate(1, "i32*", ALLOC_STATIC);


































































































































































































































































































































































































































































































































































































































































































































































































































































































































/* memory initializer */ allocate([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,5,5,6,6,7,8,9,10,11,13,14,16,18,20,22,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,7,8,9,10,11,12,13,14,15,16,17,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,62,64,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,2,0,0,0,1,0,0,0,2,0,0,0,0,0,0,0,3,0,0,0,1,0,0,0,3,0,0,0,2,0,0,0,3,0,0,0,1,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,1,0,0,0,3,0,0,0,0,0,0,0,3,0,0,0,1,0,0,0,3,0,0,0,2,0,0,0,29,0,0,0,30,0,0,0,31,0,0,0,32,0,0,0,33,0,0,0,33,0,0,0,34,0,0,0,34,0,0,0,35,0,0,0,35,0,0,0,36,0,0,0,36,0,0,0,37,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,80,94,0,0,208,93,0,0,208,91,0,0,208,83,0,0,0,0,0,0,0,0,0,0,176,83,0,0,48,83,0,0,48,81,0,0,48,73,0,0,0,0,0,0,0,0,0,0,16,73,0,0,144,72,0,0,144,70,0,0,144,62,0,0,104,126,0,0,16,105,0,0,240,104,0,0,112,104,0,0,112,102,0,0,112,94,0,0,0,0,0,0,0,0,0,0,104,126,0,0,184,115,0,0,152,115,0,0,24,115,0,0,24,113,0,0,24,105,0,0,0,0,0,0,0,0,0,0,104,126,0,0,96,126,0,0,64,126,0,0,192,125,0,0,192,123,0,0,192,115,0,0,0,0,0,0,0,0,0,0,6,5,4,4,3,3,3,3,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,26,0,0,0,10,0,0,0,1,0,0,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,62,63,0,0,1,2,2,4,4,5,6,7,8,9,9,11,11,12,13,13,15,15,16,16,18,18,19,19,21,21,22,22,23,24,24,25,26,26,27,27,28,29,29,30,30,30,31,32,32,33,33,33,34,34,35,35,35,36,36,36,37,37,37,38,38,63,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,64,90,90,88,85,82,78,73,67,61,54,46,38,31,22,13,4,252,243,234,225,218,210,202,195,189,183,178,174,171,168,166,166,90,87,80,70,57,43,25,9,247,231,213,199,186,176,169,166,166,169,176,186,199,213,231,247,9,25,43,57,70,80,87,90,90,82,67,46,22,252,225,202,183,171,166,168,178,195,218,243,13,38,61,78,88,90,85,73,54,31,4,234,210,189,174,166,89,75,50,18,238,206,181,167,167,181,206,238,18,50,75,89,89,75,50,18,238,206,181,167,167,181,206,238,18,50,75,89,88,67,31,243,202,174,166,178,210,252,38,73,90,85,61,22,234,195,171,166,183,218,4,46,78,90,82,54,13,225,189,168,87,57,9,213,176,166,186,231,25,70,90,80,43,247,199,169,169,199,247,43,80,90,70,25,231,186,166,176,213,9,57,87,85,46,243,189,166,183,234,38,82,88,54,252,195,166,178,225,31,78,90,61,4,202,168,174,218,22,73,90,67,13,210,171,83,36,220,173,173,220,36,83,83,36,220,173,173,220,36,83,83,36,220,173,173,220,36,83,83,36,220,173,173,220,36,83,82,22,202,166,195,13,78,85,31,210,166,189,4,73,88,38,218,168,183,252,67,90,46,225,171,178,243,61,90,54,234,174,80,9,186,169,231,57,90,43,213,166,199,25,87,70,247,176,176,247,70,87,25,199,166,213,43,90,57,231,169,186,9,80,78,252,174,183,13,85,67,234,168,195,31,90,54,218,166,210,46,90,38,202,166,225,61,88,22,189,171,243,73,82,4,178,75,238,167,206,50,89,18,181,181,18,89,50,206,167,238,75,75,238,167,206,50,89,18,181,181,18,89,50,206,167,238,75,73,225,166,234,78,67,218,166,243,82,61,210,168,252,85,54,202,171,4,88,46,195,174,13,90,38,189,178,22,90,31,183,70,213,169,9,90,25,176,199,57,80,231,166,247,87,43,186,186,43,87,247,166,231,80,57,199,176,25,90,9,169,213,70,67,202,178,38,85,234,166,4,90,13,168,225,82,46,183,195,61,73,210,174,31,88,243,166,252,90,22,171,218,78,54,189,64,192,192,64,64,192,192,64,64,192,192,64,64,192,192,64,64,192,192,64,64,192,192,64,64,192,192,64,64,192,192,64,61,183,210,82,31,168,243,90,252,166,22,85,218,178,54,67,189,202,78,38,171,234,90,4,166,13,88,225,174,46,73,195,57,176,231,90,247,169,43,70,186,213,87,9,166,25,80,199,199,80,25,166,9,87,213,186,70,43,169,247,90,231,176,57,54,171,252,88,210,195,82,13,166,38,67,178,234,90,225,183,73,31,166,22,78,189,218,90,243,174,61,46,168,4,85,202,50,167,18,75,181,238,89,206,206,89,238,181,75,18,167,50,50,167,18,75,181,238,89,206,206,89,238,181,75,18,167,50,46,166,38,54,166,31,61,168,22,67,171,13,73,174,4,78,178,252,82,183,243,85,189,234,88,195,225,90,202,218,90,210,43,166,57,25,169,70,9,176,80,247,186,87,231,199,90,213,213,90,199,231,87,186,247,80,176,9,70,169,25,57,166,43,38,168,73,252,189,90,210,225,85,178,13,61,166,54,22,174,82,234,202,90,195,243,78,171,31,46,166,67,4,183,88,218,36,173,83,220,220,83,173,36,36,173,83,220,220,83,173,36,36,173,83,220,220,83,173,36,36,173,83,220,220,83,173,36,31,178,90,195,4,54,168,82,218,234,73,166,67,243,210,85,171,46,13,189,90,183,22,38,174,88,202,252,61,166,78,225,25,186,90,176,43,9,199,87,169,57,247,213,80,166,70,231,231,70,166,80,213,247,57,169,87,199,9,43,176,90,186,25,22,195,85,166,73,218,252,46,178,90,174,54,243,225,67,168,88,189,31,13,202,82,166,78,210,4,38,183,90,171,61,234,18,206,75,167,89,181,50,238,238,50,181,89,167,75,206,18,18,206,75,167,89,181,50,238,238,50,181,89,167,75,206,18,13,218,61,178,88,166,85,183,54,225,4,22,210,67,174,90,166,82,189,46,234,252,31,202,73,171,90,168,78,195,38,243,9,231,43,199,70,176,87,166,90,169,80,186,57,213,25,247,247,25,213,57,186,80,169,90,166,87,176,70,199,43,231,9,4,243,22,225,38,210,54,195,67,183,78,174,85,168,90,166,90,166,88,171,82,178,73,189,61,202,46,218,31,234,13,252,29,55,74,84,74,74,0,182,84,227,182,55,55,172,74,227,241,216,255,255,0,0,0,0,40,0,0,0,45,0,0,0,51,0,0,0,57,0,0,0,64,0,0,0,72,0,0,0,0,240,255,255,154,249,255,255,114,252,255,255,138,253,255,255,30,254,255,255,122,254,255,255,197,254,255,255,0,255,255,255,197,254,255,255,122,254,255,255,30,254,255,255,138,253,255,255,114,252,255,255,154,249,255,255,0,240,255,255,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,26,0,0,0,21,0,0,0,17,0,0,0,13,0,0,0,9,0,0,0,5,0,0,0,2,0,0,0,0,0,0,0,254,255,255,255,251,255,255,255,247,255,255,255,243,255,255,255,239,255,255,255,235,255,255,255,230,255,255,255,224,255,255,255,230,255,255,255,235,255,255,255,239,255,255,255,243,255,255,255,247,255,255,255,251,255,255,255,254,255,255,255,0,0,0,0,2,0,0,0,5,0,0,0,9,0,0,0,13,0,0,0,17,0,0,0,21,0,0,0,26,0,0,0,32,0,0,0,0,0,0,0,139,0,0,0,139,0,0,0,153,0,0,0,138,0,0,0,138,0,0,0,124,0,0,0,138,0,0,0,94,0,0,0,224,0,0,0,167,0,0,0,122,0,0,0,0,0,0,0,139,0,0,0,141,0,0,0,157,0,0,0,107,0,0,0,139,0,0,0,126,0,0,0,107,0,0,0,139,0,0,0,126,0,0,0,0,0,0,0,111,0,0,0,111,0,0,0,125,0,0,0,110,0,0,0,110,0,0,0,94,0,0,0,124,0,0,0,108,0,0,0,124,0,0,0,107,0,0,0,125,0,0,0,141,0,0,0,179,0,0,0,153,0,0,0,125,0,0,0,107,0,0,0,125,0,0,0,141,0,0,0,179,0,0,0,153,0,0,0,125,0,0,0,107,0,0,0,125,0,0,0,141,0,0,0,179,0,0,0,153,0,0,0,125,0,0,0,140,0,0,0,139,0,0,0,182,0,0,0,182,0,0,0,152,0,0,0,136,0,0,0,152,0,0,0,136,0,0,0,153,0,0,0,136,0,0,0,139,0,0,0,111,0,0,0,136,0,0,0,139,0,0,0,111,0,0,0,155,0,0,0,154,0,0,0,139,0,0,0,153,0,0,0,139,0,0,0,123,0,0,0,123,0,0,0,63,0,0,0,153,0,0,0,166,0,0,0,183,0,0,0,140,0,0,0,136,0,0,0,153,0,0,0,154,0,0,0,166,0,0,0,183,0,0,0,140,0,0,0,136,0,0,0,153,0,0,0,154,0,0,0,166,0,0,0,183,0,0,0,140,0,0,0,136,0,0,0,153,0,0,0,154,0,0,0,170,0,0,0,153,0,0,0,123,0,0,0,123,0,0,0,107,0,0,0,121,0,0,0,107,0,0,0,121,0,0,0,167,0,0,0,151,0,0,0,183,0,0,0,140,0,0,0,151,0,0,0,183,0,0,0,140,0,0,0,170,0,0,0,154,0,0,0,139,0,0,0,153,0,0,0,139,0,0,0,123,0,0,0,123,0,0,0,63,0,0,0,124,0,0,0,166,0,0,0,183,0,0,0,140,0,0,0,136,0,0,0,153,0,0,0,154,0,0,0,166,0,0,0,183,0,0,0,140,0,0,0,136,0,0,0,153,0,0,0,154,0,0,0,166,0,0,0,183,0,0,0,140,0,0,0,136,0,0,0,153,0,0,0,154,0,0,0,170,0,0,0,153,0,0,0,138,0,0,0,138,0,0,0,122,0,0,0,121,0,0,0,122,0,0,0,121,0,0,0,167,0,0,0,151,0,0,0,183,0,0,0,140,0,0,0,151,0,0,0,183,0,0,0,140,0,0,0,200,0,0,0,185,0,0,0,160,0,0,0,0,0,0,0,153,0,0,0,153,0,0,0,153,0,0,0,0,0,0,0,79,0,0,0,0,0,0,0,153,0,0,0,153,0,0,0,184,0,0,0,154,0,0,0,183,0,0,0,0,0,0,0,149,0,0,0,134,0,0,0,184,0,0,0,154,0,0,0,139,0,0,0,154,0,0,0,154,0,0,0,154,0,0,0,139,0,0,0,154,0,0,0,154,0,0,0,0,0,0,0,168,0,0,0,0,0,0,0,122,0,0,0,137,0,0,0,110,0,0,0,154,0,0,0,110,0,0,0,110,0,0,0,124,0,0,0,125,0,0,0,140,0,0,0,153,0,0,0,125,0,0,0,127,0,0,0,140,0,0,0,109,0,0,0,111,0,0,0,143,0,0,0,127,0,0,0,111,0,0,0,79,0,0,0,108,0,0,0,123,0,0,0,63,0,0,0,125,0,0,0,110,0,0,0,94,0,0,0,110,0,0,0,95,0,0,0,79,0,0,0,125,0,0,0,111,0,0,0,110,0,0,0,78,0,0,0,110,0,0,0,111,0,0,0,111,0,0,0,95,0,0,0,94,0,0,0,108,0,0,0,123,0,0,0,108,0,0,0,125,0,0,0,110,0,0,0,124,0,0,0,110,0,0,0,95,0,0,0,94,0,0,0,125,0,0,0,111,0,0,0,111,0,0,0,79,0,0,0,125,0,0,0,126,0,0,0,111,0,0,0,111,0,0,0,79,0,0,0,108,0,0,0,123,0,0,0,93,0,0,0,63,0,0,0,152,0,0,0,152,0,0,0,0,0,0,0,95,0,0,0,79,0,0,0,63,0,0,0,31,0,0,0,31,0,0,0,0,0,0,0,154,0,0,0,154,0,0,0,154,0,0,0,0,0,0,0,197,0,0,0,185,0,0,0,201,0,0,0,197,0,0,0,185,0,0,0,201,0,0,0,154,0,0,0,154,0,0,0,138,0,0,0,153,0,0,0,136,0,0,0,167,0,0,0,152,0,0,0,152,0,0,0,107,0,0,0,167,0,0,0,91,0,0,0,122,0,0,0,107,0,0,0,167,0,0,0,107,0,0,0,167,0,0,0,91,0,0,0,107,0,0,0,107,0,0,0,167,0,0,0,140,0,0,0,92,0,0,0,137,0,0,0,138,0,0,0,140,0,0,0,152,0,0,0,138,0,0,0,139,0,0,0,153,0,0,0,74,0,0,0,149,0,0,0,92,0,0,0,139,0,0,0,107,0,0,0,122,0,0,0,152,0,0,0,140,0,0,0,179,0,0,0,166,0,0,0,182,0,0,0,140,0,0,0,227,0,0,0,122,0,0,0,197,0,0,0,154,0,0,0,196,0,0,0,196,0,0,0,167,0,0,0,154,0,0,0,152,0,0,0,167,0,0,0,182,0,0,0,182,0,0,0,134,0,0,0,149,0,0,0,136,0,0,0,153,0,0,0,121,0,0,0,136,0,0,0,137,0,0,0,169,0,0,0,194,0,0,0,166,0,0,0,167,0,0,0,154,0,0,0,167,0,0,0,137,0,0,0,182,0,0,0,154,0,0,0,196,0,0,0,167,0,0,0,167,0,0,0,154,0,0,0,152,0,0,0,167,0,0,0,182,0,0,0,182,0,0,0,134,0,0,0,149,0,0,0,136,0,0,0,153,0,0,0,121,0,0,0,136,0,0,0,122,0,0,0,169,0,0,0,208,0,0,0,166,0,0,0,167,0,0,0,154,0,0,0,152,0,0,0,167,0,0,0,182,0,0,0,91,0,0,0,171,0,0,0,134,0,0,0,141,0,0,0,121,0,0,0,140,0,0,0,61,0,0,0,154,0,0,0,121,0,0,0,140,0,0,0,61,0,0,0,154,0,0,0,111,0,0,0,141,0,0,0,153,0,0,0,111,0,0,0,94,0,0,0,138,0,0,0,182,0,0,0,154,0,0,0,149,0,0,0,107,0,0,0,167,0,0,0,154,0,0,0,149,0,0,0,92,0,0,0,167,0,0,0,154,0,0,0,140,0,0,0,198,0,0,0,169,0,0,0,198,0,0,0,0,0,0,0,3,0,0,0,3,0,0,0,2,0,0,0,0,0,0,0,3,0,0,0,3,0,0,0,2,0,0,0,0,0,0,0,3,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,3,0,0,0,4,0,0,0,4,0,0,0,1,0,0,0,0,0,0,0,16,16,16,16,16,16,16,16,16,16,17,16,17,16,17,18,17,18,18,17,18,21,19,20,21,20,19,21,24,22,22,24,24,22,22,24,25,25,27,30,27,25,25,29,31,35,35,31,29,36,41,44,41,36,47,54,54,47,65,70,65,88,88,115,16,16,16,16,16,16,16,16,16,16,17,17,17,17,17,18,18,18,18,18,18,20,20,20,20,20,20,20,24,24,24,24,24,24,24,24,25,25,25,25,25,25,25,28,28,28,28,28,28,33,33,33,33,33,41,41,41,41,54,54,54,71,71,91,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,0,1,4,5,2,3,4,5,6,6,8,8,7,7,8,99,108,97,121,101,114,32,37,100,58,32,118,112,115,95,109,97,120,95,100,101,99,95,112,105,99,95,98,117,102,102,101,114,105,110,103,32,61,32,37,100,10,0,0,0,0,0,0,0,52,58,50,58,50,0,0,0,100,101,112,101,110,100,101,110,116,95,115,108,105,99,101,95,115,101,103,109,101,110,116,95,102,108,97,103,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,42,37,115,10,0,0,0,0,110,117,109,95,114,101,102,95,105,100,120,95,108,49,95,100,101,102,97,117,108,116,95,97,99,116,105,118,101,32,58,32,37,100,10,0,0,0,0,0,68,80,66,47,111,117,116,112,117,116,32,113,117,101,117,101,32,102,117,108,108,0,0,0,112,111,111,108,45,62,110,117,109,95,116,97,115,107,115,32,60,32,77,65,88,95,84,72,82,69,65,68,95,84,65,83,75,83,0,0,0,0,0,0,99,116,120,45,62,105,109,97,103,101,95,111,117,116,112,117,116,95,113,117,101,117,101,95,108,101,110,103,116,104,32,60,32,68,69,50,54,53,95,68,80,66,95,83,73,90,69,0,118,112,115,95,115,117,98,95,108,97,121,101,114,95,111,114,100,101,114,105,110,103,95,105,110,102,111,95,112,114,101,115,101,110,116,95,102,108,97,103,32,58,32,37,100,10,0,0,52,58,50,58,48,0,0,0,115,108,105,99,101,95,112,105,99,95,112,97,114,97,109,101,116,101,114,95,115,101,116,95,105,100,32,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,42,37,100,37,99,32,0,0,110,117,109,95,114,101,102,95,105,100,120,95,108,48,95,100,101,102,97,117,108,116,95,97,99,116,105,118,101,32,58,32,37,100,10,0,0,0,0,0,99,111,100,101,100,32,112,97,114,97,109,101,116,101,114,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,0,99,116,120,45,62,114,101,111,114,100,101,114,95,111,117,116,112,117,116,95,113,117,101,117,101,95,108,101,110,103,116,104,62,48,0,0,0,0,0,0,118,112,115,95,116,101,109,112,111,114,97,108,95,105,100,95,110,101,115,116,105,110,103,95,102,108,97,103,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,99,104,114,111,109,97,95,102,111,114,109,97,116,95,105,100,99,32,32,32,32,32,32,32,58,32,37,100,32,40,37,115,41,10,0,0,0,0,0,0,110,111,95,111,117,116,112,117,116,95,111,102,95,112,114,105,111,114,95,112,105,99,115,95,102,108,97,103,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,99,97,98,97,99,95,105,110,105,116,95,112,114,101,115,101,110,116,95,102,108,97,103,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,0,0,111,117,116,32,111,102,32,109,101,109,111,114,121,0,0,0,109,111,100,101,108,45,62,115,116,97,116,101,32,60,61,32,54,50,0,0,0,0,0,0,109,111,100,101,108,45,62,115,116,97,116,101,32,62,61,32,48,0,0,0,0,0,0,0,99,111,110,116,101,120,116,32,62,61,32,48,32,38,38,32,99,111,110,116,101,120,116,32,60,61,32,50,0,0,0,0,104,100,114,45,62,110,117,109,95,114,101,102,95,105,100,120,95,108,49,95,97,99,116,105,118,101,32,60,61,32,49,53,0,0,0,0,0,0,0,0,118,112,115,95,109,97,120,95,115,117,98,95,108,97,121,101,114,115,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,102,97,108,115,101,0,0,0,115,101,113,95,112,97,114,97,109,101,116,101,114,95,115,101,116,95,105,100,32,32,32,32,58,32,37,100,10,0,0,0,99,111,110,116,101,120,116,95,115,116,111,114,97,103,101,0,102,105,114,115,116,95,115,108,105,99,101,95,115,101,103,109,101,110,116,95,105,110,95,112,105,99,95,102,108,97,103,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,48,0,0,0,0,0,0,0,40,119,105,100,116,104,38,49,41,61,61,48,0,0,0,0,115,105,103,110,95,100,97,116,97,95,104,105,100,105,110,103,95,102,108,97,103,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,0,0,99,98,102,95,108,117,109,97,32,33,61,32,45,49,0,0,115,99,97,108,105,110,103,95,108,105,115,116,95,112,114,101,100,95,109,97,116,114,105,120,95,105,100,95,100,101,108,116,97,61,61,49,0,0,0,0,99,116,98,88,32,43,32,99,116,98,89,42,115,112,115,45,62,80,105,99,87,105,100,116,104,73,110,67,116,98,115,89,32,60,32,105,109,103,45,62,99,116,98,95,105,110,102,111,95,115,105,122,101,0,0,0,99,98,102,95,99,114,32,33,61,32,45,49,0,0,0,0,48,0,0,0,0,0,0,0,99,98,102,95,99,98,32,33,61,32,45,49,0,0,0,0,67,84,66,32,111,117,116,115,105,100,101,32,111,102,32,105,109,97,103,101,32,97,114,101,97,0,0,0,0,0,0,0,83,117,98,72,101,105,103,104,116,67,32,32,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,105,110,105,116,84,121,112,101,32,62,61,32,48,32,38,38,32,105,110,105,116,84,121,112,101,32,60,61,32,50,0,0,83,117,98,87,105,100,116,104,67,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,99,116,120,73,100,120,76,111,111,107,117,112,91,108,111,103,50,119,45,50,93,91,99,73,100,120,93,91,115,99,97,110,73,100,120,93,91,112,114,101,118,67,115,98,102,93,91,120,67,43,40,121,67,60,60,108,111,103,50,119,41,93,32,61,61,32,99,116,120,73,100,120,73,110,99,0,0,0,0,0,77,97,120,84,66,83,105,122,101,89,32,32,32,58,32,37,100,10,0,0,0,0,0,0,101,110,116,114,121,32,112,111,105,110,116,32,91,37,105,93,32,58,32,37,100,10,0,0,77,105,110,84,66,83,105,122,101,89,32,32,32,58,32,37,100,10,0,0,0,0,0,0,111,102,102,115,101,116,95,108,101,110,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,0,0,105,109,103,45,62,98,111,114,100,101,114,61,61,48,0,0,77,97,120,67,98,83,105,122,101,89,32,32,32,58,32,37,100,10,0,0,0,0,0,0,118,112,115,95,109,97,120,95,108,97,121,101,114,115,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,110,117,109,95,101,110,116,114,121,95,112,111,105,110,116,95,111,102,102,115,101,116,115,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,0,0,77,105,110,67,98,83,105,122,101,89,32,32,32,58,32,37,100,10,0,0,0,0,0,0,115,112,115,95,116,101,109,112,111,114,97,108,95,105,100,95,110,101,115,116,105,110,103,95,102,108,97,103,32,58,32,37,100,10,0,0,0,0,0,0,115,108,105,99,101,95,108,111,111,112,95,102,105,108,116,101,114,95,97,99,114,111,115,115,95,115,108,105,99,101,115,95,101,110,97,98,108,101,100,95,102,108,97,103,32,58,32,37,100,10,0,0,0,0,0,0,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,32,83,76,73,67,69,32,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,10,0,0,0,0,0,0,67,116,98,83,105,122,101,89,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,115,108,105,99,101,95,116,99,95,111,102,102,115,101,116,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,0,0,118,117,105,95,112,97,114,97,109,101,116,101,114,115,95,112,114,101,115,101,110,116,95,102,108,97,103,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,0,0,100,101,112,101,110,100,101,110,116,95,115,108,105,99,101,95,115,101,103,109,101,110,116,115,95,101,110,97,98,108,101,100,95,102,108,97,103,32,58,32,37,100,10,0,0,0,0,0,115,108,105,99,101,95,98,101,116,97,95,111,102,102,115,101,116,32,32,58,32,37,100,10,0,0,0,0,0,0,0,0,105,110,116,114,97,112,114,101,100,46,99,0,0,0,0,0,115,116,114,111,110,103,95,105,110,116,114,97,95,115,109,111,111,116,104,105,110,103,95,101,110,97,98,108,101,95,102,108,97,103,32,58,32,37,100,10,0,0,0,0,0,0,0,0,40,102,114,111,109,32,112,112,115,41,0,0,0,0,0,0,120,100,60,105,109,103,45,62,100,101,98,108,107,95,119,105,100,116,104,32,38,38,32,121,100,60,105,109,103,45,62,100,101,98,108,107,95,104,101,105,103,104,116,0,0,0,0,0,99,116,120,45,62,78,65,76,95,113,117,101,117,101,32,33,61,32,78,85,76,76,0,0,102,105,114,115,116,76,97,121,101,114,82,101,97,100,32,60,32,77,65,88,95,84,69,77,80,79,82,65,76,95,83,85,66,76,65,89,69,82,83,0,115,112,115,95,116,101,109,112,111,114,97,108,95,109,118,112,95,101,110,97,98,108,101,100,95,102,108,97,103,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,0,0,40,111,118,101,114,114,105,100,101,41,0,0,0,0,0,0,105,109,97,103,101,32,99,104,101,99,107,115,117,109,32,109,105,115,109,97,116,99,104,0,108,116,95,114,101,102,95,112,105,99,95,112,111,99,95,108,115,98,95,115,112,115,91,37,100,93,32,58,32,37,100,32,32,32,40,117,115,101,100,95,98,121,95,99,117,114,114,95,112,105,99,95,108,116,95,115,112,115,95,102,108,97,103,61,37,100,41,10,0,0,0,0,115,108,105,99,101,95,100,101,98,108,111,99,107,105,110,103,95,102,105,108,116,101,114,95,100,105,115,97,98,108,101,100,95,102,108,97,103,32,58,32,37,100,32,37,115,10,0,0,69,82,82,58,32,0,0,0,110,117,109,95,108,111,110,103,95,116,101,114,109,95,114,101,102,95,112,105,99,115,95,115,112,115,32,58,32,37,100,10,0,0,0,0,0,0,0,0,100,101,98,108,111,99,107,105,110,103,95,102,105,108,116,101,114,95,111,118,101,114,114,105,100,101,95,102,108,97,103,32,58,32,37,100,10,0,0,0,114,101,102,80,105,99,81,48,61,61,114,101,102,80,105,99,81,49,0,0,0,0,0,0,32,32,32,32,115,117,98,95,108,97,121,101,114,95,108,101,118,101,108,95,105,100,99,32,32,32,58,32,37,100,10,0,108,111,110,103,95,116,101,114,109,95,114,101,102,95,112,105,99,115,95,112,114,101,115,101,110,116,95,102,108,97,103,32,58,32,37,100,10,0,0,0,115,108,105,99,101,95,99,114,95,113,112,95,111,102,102,115,101,116,32,32,32,32,32,58,32,37,100,10,0,0,0,0,102,97,108,115,101,0,0,0,32,32,32,32,115,117,98,95,108,97,121,101,114,95,102,114,97,109,101,95,111,110,108,121,95,99,111,110,115,116,114,97,105,110,116,95,102,108,97,103,32,58,32,37,100,10,0,0,114,101,102,95,112,105,99,95,115,101,116,91,32,37,50,100,32,93,58,32,0,0,0,0,115,108,105,99,101,95,99,98,95,113,112,95,111,102,102,115,101,116,32,32,32,32,32,58,32,37,100,10,0,0,0,0,99,116,120,45,62,105,109,103,45,62,116,97,115,107,115,95,112,101,110,100,105,110,103,32,61,61,32,48,0,0,0,0,32,32,32,32,115,117,98,95,108,97,121,101,114,95,110,111,110,95,112,97,99,107,101,100,95,99,111,110,115,116,114,97,105,110,116,95,102,108,97,103,32,58,32,37,100,10,0,0,105,100,120,62,61,48,0,0,110,117,109,95,115,104,111,114,116,95,116,101,114,109,95,114,101,102,95,112,105,99,95,115,101,116,115,32,58,32,37,100,10,0,0,0,0,0,0,0,115,108,105,99,101,95,113,112,95,100,101,108,116,97,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,118,105,100,101,111,95,112,97,114,97,109,101,116,101,114,95,115,101,116,95,105,100,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,110,84,105,108,101,115,32,61,61,32,112,112,115,45,62,110,117,109,95,116,105,108,101,95,99,111,108,117,109,110,115,32,42,32,112,112,115,45,62,110,117,109,95,116,105,108,101,95,114,111,119,115,0,0,0,0,32,32,32,32,115,117,98,95,108,97,121,101,114,95,105,110,116,101,114,108,97,99,101,100,95,115,111,117,114,99,101,95,102,108,97,103,32,58,32,37,100,10,0,0,0,0,0,0,112,99,109,95,108,111,111,112,95,102,105,108,116,101,114,95,100,105,115,97,98,108,101,95,102,108,97,103,32,32,58,32,37,100,10,0,0,0,0,0,102,105,118,101,95,109,105,110,117,115,95,109,97,120,95,110,117,109,95,109,101,114,103,101,95,99,97,110,100,32,32,58,32,37,100,10,0,0,0,0,115,112,115,95,109,97,120,95,115,117,98,95,108,97,121,101,114,115,32,32,32,32,32,32,58,32,37,100,10,0,0,0,110,97,108,0,0,0,0,0,115,112,115,45,62,115,112,115,95,114,101,97,100,0,0,0,32,32,32,32,115,117,98,95,108,97,121,101,114,95,112,114,111,103,114,101,115,115,105,118,101,95,115,111,117,114,99,101,95,102,108,97,103,32,58,32,37,100,10,0,0,0,0,0,108,111,103,50,95,100,105,102,102,95,109,97,120,95,109,105,110,95,112,99,109,95,108,117,109,97,95,99,111,100,105,110,103,95,98,108,111,99,107,95,115,105,122,101,32,58,32,37,100,10,0,0,0,0,0,0,67,104,114,111,109,97,79,102,102,115,101,116,95,76,37,100,91,37,100,93,91,37,100,93,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,112,112,115,95,101,120,116,101,110,115,105,111,110,95,102,108,97,103,32,58,32,37,100,10,0,0,0,0,0,0,0,0,100,101,50,54,53,46,99,0,10,0,0,0,0,0,0,0,108,111,103,50,95,109,105,110,95,112,99,109,95,108,117,109,97,95,99,111,100,105,110,103,95,98,108,111,99,107,95,115,105,122,101,32,58,32,37,100,10,0,0,0,0,0,0,0,67,104,114,111,109,97,87,101,105,103,104,116,95,76,37,100,91,37,100,93,91,37,100,93,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,115,101,113,95,112,97,114,97,109,101,116,101,114,95,115,101,116,95,105,100,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,0,0,115,108,105,99,101,95,115,101,103,109,101,110,116,95,104,101,97,100,101,114,95,101,120,116,101,110,115,105,111,110,95,112,114,101,115,101,110,116,95,102,108,97,103,32,58,32,37,100,10,0,0,0,0,0,0,0,99,116,120,45,62,112,101,110,100,105,110,103,95,105,110,112,117,116,95,78,65,76,32,61,61,32,78,85,76,76,0,0,114,101,102,60,55,0,0,0,102,97,108,115,101,0,0,0,37,100,0,0,0,0,0,0,112,99,109,95,115,97,109,112,108,101,95,98,105,116,95,100,101,112,116,104,95,99,104,114,111,109,97,32,32,32,58,32,37,100,10,0,0,0,0,0,108,117,109,97,95,111,102,102,115,101,116,95,108,37,100,91,37,100,93,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,110,117,109,95,101,120,116,114,97,95,115,108,105,99,101,95,104,101,97,100,101,114,95,98,105,116,115,32,32,32,32,58,32,37,100,10,0,0,0,0,121,62,61,48,32,38,38,32,121,60,115,112,115,45,62,112,105,99,95,104,101,105,103,104,116,95,105,110,95,108,117,109,97,95,115,97,109,112,108,101,115,0,0,0,0,0,0,0,117,110,107,110,111,119,110,32,101,114,114,111,114,0,0,0,44,0,0,0,0,0,0,0,112,99,109,95,115,97,109,112,108,101,95,98,105,116,95,100,101,112,116,104,95,108,117,109,97,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,76,117,109,97,87,101,105,103,104,116,95,76,37,100,91,37,100,93,32,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,108,111,103,50,95,112,97,114,97,108,108,101,108,95,109,101,114,103,101,95,108,101,118,101,108,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,110,111,110,45,101,120,105,115,116,105,110,103,32,108,111,110,103,45,116,101,114,109,32,114,101,102,101,114,101,110,99,101,32,99,97,110,100,105,100,97,116,101,32,115,112,101,99,105,102,105,101,100,32,105,110,32,115,108,105,99,101,32,104,101,97,100,101,114,0,0,0,0,99,111,101,102,102,105,99,105,101,110,116,32,111,117,116,32,111,102,32,105,109,97,103,101,32,98,111,117,110,100,115,0,32,32,32,32,115,117,98,95,108,97,121,101,114,95,112,114,111,102,105,108,101,95,99,111,109,112,97,116,105,98,105,108,105,116,121,95,102,108,97,103,115,58,32,0,0,0,0,0,112,99,109,95,101,110,97,98,108,101,100,95,102,108,97,103,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,0,67,104,114,111,109,97,76,111,103,50,87,101,105,103,104,116,68,101,110,111,109,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,108,105,115,116,115,95,109,111,100,105,102,105,99,97,116,105,111,110,95,112,114,101,115,101,110,116,95,102,108,97,103,58,32,37,100,10,0,0,0,0,110,117,109,98,101,114,32,111,102,32,116,104,114,101,97,100,115,32,108,105,109,105,116,101,100,32,116,111,32,109,97,120,105,109,117,109,32,97,109,111,117,110,116,0,0,0,0,0,32,32,32,32,115,117,98,95,108,97,121,101,114,95,112,114,111,102,105,108,101,95,105,100,99,32,32,32,58,32,37,100,10,0,0,0,0,0,0,0,115,97,109,112,108,101,95,97,100,97,112,116,105,118,101,95,111,102,102,115,101,116,95,101,110,97,98,108,101,100,95,102,108,97,103,32,58,32,37,100,10,0,0,0,0,0,0,0,108,117,109,97,95,108,111,103,50,95,119,101,105,103,104,116,95,100,101,110,111,109,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,112,105,99,95,115,99,97,108,105,110,103,95,108,105,115,116,95,100,97,116,97,95,112,114,101,115,101,110,116,95,102,108,97,103,58,32,37,100,10,0,100,101,112,101,110,100,101,110,116,32,115,108,105,99,101,32,119,105,116,104,32,97,100,100,114,101,115,115,32,48,0,0,32,32,32,32,115,117,98,95,108,97,121,101,114,95,116,105,101,114,95,102,108,97,103,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,0,97,109,112,95,101,110,97,98,108,101,100,95,102,108,97,103,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,0,99,111,108,108,111,99,97,116,101,100,95,114,101,102,95,105,100,120,32,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,116,99,95,111,102,102,115,101,116,58,32,32,32,32,32,37,100,10,0,0,0,0,0,0,115,108,105,99,101,32,115,101,103,109,101,110,116,32,97,100,100,114,101,115,115,32,105,110,118,97,108,105,100,0,0,0,105,110,118,97,108,105,100,32,99,104,114,111,109,97,32,102,111,114,109,97,116,32,105,110,32,83,80,83,32,104,101,97,100,101,114,0,0,0,0,0,32,32,32,32,115,117,98,95,108,97,121,101,114,95,112,114,111,102,105,108,101,95,115,112,97,99,101,32,58,32,37,100,10,0,0,0,0,0,0,0,115,99,97,108,105,110,103,32,108,105,115,116,32,108,111,103,103,105,110,103,32,111,117,116,112,117,116,32,110,111,116,32,105,109,112,108,101,109,101,110,116,101,100,0,0,0,0,0,99,111,108,108,111,99,97,116,101,100,95,102,114,111,109,95,108,48,95,102,108,97,103,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,98,101,116,97,95,111,102,102,115,101,116,58,32,32,37,100,10,0,0,0,0,0,0,0,101,110,100,32,111,102,32,102,105,108,101,0,0,0,0,0,116,104,114,101,97,100,115,46,99,0,0,0,0,0,0,0,32,32,80,114,111,102,105,108,101,47,84,105,101,114,47,76,101,118,101,108,32,91,76,97,121,101,114,32,37,100,93,10,0,0,0,0,0,0,0,0,115,112,115,95,115,99,97,108,105,110,103,95,108,105,115,116,95,100,97,116,97,95,112,114,101,115,101,110,116,95,102,108,97,103,32,58,32,37,100,10,0,0,0,0,0,0,0,0,104,97,115,95,102,114,101,101,95,100,112,98,95,112,105,99,116,117,114,101,40,99,116,120,44,32,116,114,117,101,41,0,99,97,98,97,99,95,105,110,105,116,95,102,108,97,103,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,112,105,99,95,100,105,115,97,98,108,101,95,100,101,98,108,111,99,107,105,110,103,95,102,105,108,116,101,114,95,102,108,97,103,58,32,37,100,10,0,112,112,115,0,0,0,0,0,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,32,86,80,83,32,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,10,0,0,0,0,0,0,0,0,109,97,120,105,109,117,109,32,110,117,109,98,101,114,32,111,102,32,114,101,102,101,114,101,110,99,101,32,112,105,99,116,117,114,101,115,32,101,120,99,101,101,100,101,100,0,0,0,32,32,103,101,110,101,114,97,108,95,108,101,118,101,108,95,105,100,99,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,0,115,99,97,108,105,110,103,95,108,105,115,116,95,101,110,97,98,108,101,95,102,108,97,103,32,58,32,37,100,10,0,0,109,118,100,95,108,49,95,122,101,114,111,95,102,108,97,103,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,100,101,98,108,111,99,107,105,110,103,95,102,105,108,116,101,114,95,111,118,101,114,114,105,100,101,95,101,110,97,98,108,101,100,95,102,108,97,103,58,32,37,100,10,0,0,0,0,118,105,100,101,111,95,112,97,114,97,109,101,116,101,114,95,115,101,116,95,105,100,32,32,58,32,37,100,10,0,0,0,101,110,100,95,111,102,95,115,117,98,95,115,116,114,101,97,109,95,111,110,101,95,98,105,116,32,110,111,116,32,115,101,116,32,116,111,32,49,32,119,104,101,110,32,105,116,32,115,104,111,117,108,100,32,98,101,0,0,0,0,0,0,0,0,112,112,115,45,62,112,112,115,95,114,101,97,100,0,0,0,42,10,0,0,0,0,0,0,109,97,120,95,116,114,97,110,115,102,111,114,109,95,104,105,101,114,97,114,99,104,121,95,100,101,112,116,104,95,105,110,116,114,97,32,58,32,37,100,10,0,0,0,0,0,0,0,114,101,102,95,112,105,99,95,108,105,115,116,95,109,111,100,105,102,105,99,97,116,105,111,110,95,102,108,97,103,95,108,49,32,58,32,37,100,10,0,100,101,98,108,111,99,107,105,110,103,95,102,105,108,116,101,114,95,99,111,110,116,114,111,108,95,112,114,101,115,101,110,116,95,102,108,97,103,58,32,37,100,10,0,0,0,0,0,102,97,117,108,116,121,32,114,101,102,101,114,101,110,99,101,32,112,105,99,116,117,114,101,32,108,105,115,116,0,0,0,42,37,100,0,0,0,0,0,109,97,120,95,116,114,97,110,115,102,111,114,109,95,104,105,101,114,97,114,99,104,121,95,100,101,112,116,104,95,105,110,116,101,114,32,58,32,37,100,10,0,0,0,0,0,0,0,32,32,37,100,58,32,37,100,10,0,0,0,0,0,0,0,112,105,99,95,112,97,114,97,109,101,116,101,114,95,115,101,116,95,105,100,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,0,0,112,112,115,95,108,111,111,112,95,102,105,108,116,101,114,95,97,99,114,111,115,115,95,115,108,105,99,101,115,95,101,110,97,98,108,101,100,95,102,108,97,103,58,32,37,100,10,0,115,104,111,114,116,45,116,101,114,109,32,114,101,102,45,112,105,99,45,115,101,116,32,105,110,100,101,120,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,0,0,0,0,42,44,0,0,0,0,0,0,108,111,103,50,95,100,105,102,102,95,109,97,120,95,109,105,110,95,116,114,97,110,115,102,111,114,109,95,98,108,111,99,107,95,115,105,122,101,32,58,32,37,100,10,0,0,0,0,114,101,102,95,112,105,99,95,108,105,115,116,95,109,111,100,105,102,105,99,97,116,105,111,110,95,102,108,97,103,95,108,48,32,58,32,37,100,10,0,108,111,111,112,95,102,105,108,116,101,114,95,97,99,114,111,115,115,95,116,105,108,101,115,95,101,110,97,98,108,101,100,95,102,108,97,103,32,58,32,37,100,10,0,0,0,0,0,120,62,61,48,32,38,38,32,120,60,115,112,115,45,62,112,105,99,95,119,105,100,116,104,95,105,110,95,108,117,109,97,95,115,97,109,112,108,101,115,0,0,0,0,0,0,0,0,110,117,109,98,101,114,32,111,102,32,115,104,111,114,116,45,116,101,114,109,32,114,101,102,45,112,105,99,45,115,101,116,115,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,32,32,103,101,110,101,114,97,108,95,112,114,111,102,105,108,101,95,99,111,109,112,97,116,105,98,105,108,105,116,121,95,102,108,97,103,115,58,32,0,108,111,103,50,95,109,105,110,95,116,114,97,110,115,102,111,114,109,95,98,108,111,99,107,95,115,105,122,101,32,32,32,58,32,37,100,10,0,0,0,110,117,109,95,114,101,102,95,105,100,120,95,108,49,95,97,99,116,105,118,101,32,32,32,32,32,32,32,32,32,32,58,32,37,100,32,37,115,10,0,116,105,108,101,32,114,111,119,32,98,111,117,110,100,97,114,105,101,115,58,32,0,0,0,82,73,100,120,62,61,48,0,110,117,109,77,86,95,80,32,33,61,32,110,117,109,77,86,95,81,32,105,110,32,100,101,98,108,111,99,107,105,110,103,0,0,0,0,0,0,0,0,48,46,54,0,0,0,0,0,32,32,103,101,110,101,114,97,108,95,112,114,111,102,105,108,101,95,105,100,99,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,0,108,111,103,50,95,100,105,102,102,95,109,97,120,95,109,105,110,95,108,117,109,97,95,99,111,100,105,110,103,95,98,108,111,99,107,95,115,105,122,101,32,58,32,37,100,10,0,0,40,102,114,111,109,32,80,80,83,41,0,0,0,0,0,0,83,69,73,32,100,101,99,111,100,101,100,32,112,105,99,116,117,114,101,32,104,97,115,104,58,32,37,48,52,120,44,32,100,101,99,111,100,101,100,32,112,105,99,116,117,114,101,58,32,37,48,52,120,32,40,80,79,67,61,37,100,41,10,0,42,10,0,0,0,0,0,0,110,111,110,45,101,120,105,115,116,105,110,103,32,114,101,102,101,114,101,110,99,101,32,112,105,99,116,117,114,101,32,97,99,99,101,115,115,101,100,0,32,32,103,101,110,101,114,97,108,95,116,105,101,114,95,102,108,97,103,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,0,108,111,103,50,95,109,105,110,95,108,117,109,97,95,99,111,100,105,110,103,95,98,108,111,99,107,95,115,105,122,101,32,58,32,37,100,10,0,0,0,83,69,73,32,100,101,99,111,100,101,100,32,112,105,99,116,117,114,101,32,77,68,53,32,109,105,115,109,97,116,99,104,32,40,80,79,67,61,37,100,41,10,0,0,0,0,0,0,42,37,100,32,0,0,0,0,98,111,116,104,32,112,114,101,100,70,108,97,103,115,91,93,32,97,114,101,32,122,101,114], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
/* memory initializer */ allocate([111,32,105,110,32,77,67,0,32,32,103,101,110,101,114,97,108,95,112,114,111,102,105,108,101,95,115,112,97,99,101,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,0,32,32,115,112,115,95,109,97,120,95,108,97,116,101,110,99,121,95,105,110,99,114,101,97,115,101,95,112,108,117,115,49,32,58,32,37,100,10,0,0,110,117,109,95,114,101,102,95,105,100,120,95,108,48,95,97,99,116,105,118,101,32,32,32,32,32,32,32,32,32,32,58,32,37,100,32,37,115,10,0,115,101,105,46,99,0,0,0,116,105,108,101,32,99,111,108,117,109,110,32,98,111,117,110,100,97,114,105,101,115,58,32,0,0,0,0,0,0,0,0,110,111,110,45,101,120,105,115,116,105,110,103,32,83,80,83,32,114,101,102,101,114,101,110,99,101,100,0,0,0,0,0,118,112,115,95,101,120,116,101,110,115,105,111,110,95,102,108,97,103,32,61,32,37,100,10,0,0,0,0,0,0,0,0,32,32,115,112,115,95,109,97,120,95,110,117,109,95,114,101,111,114,100,101,114,95,112,105,99,115,32,32,32,32,32,32,32,58,32,37,100,10,0,0,110,117,109,95,114,101,102,95,105,100,120,95,97,99,116,105,118,101,95,111,118,101,114,114,105,100,101,95,102,108,97,103,32,58,32,37,100,10,0,0,105,109,103,32,33,61,32,78,85,76,76,0,0,0,0,0,108,111,103,50,87,68,62,61,49,0,0,0,0,0,0,0,117,110,105,102,111,114,109,95,115,112,97,99,105,110,103,95,102,108,97,103,58,32,37,100,10,0,0,0,0,0,0,0,110,111,110,45,101,120,105,115,116,105,110,103,32,80,80,83,32,114,101,102,101,114,101,110,99,101,100,0,0,0,0,0,105,109,112,111,115,115,105,98,108,101,32,109,111,116,105,111,110,32,118,101,99,116,111,114,32,115,99,97,108,105,110,103,0,0,0,0,0,0,0,0,99,112,114,109,115,95,112,114,101,115,101,110,116,95,102,108,97,103,91,37,100,93,32,61,32,37,100,10,0,0,0,0,32,32,115,112,115,95,109,97,120,95,100,101,99,95,112,105,99,95,98,117,102,102,101,114,105,110,103,32,32,32,32,32,32,58,32,37,100,10,0,0,115,108,105,99,101,95,115,97,111,95,99,104,114,111,109,97,95,102,108,97,103,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,83,80,83,32,37,100,32,104,97,115,32,110,111,116,32,98,101,101,110,32,114,101,97,100,10,0,0,0,0,0,0,0,110,117,109,95,116,105,108,101,95,114,111,119,115,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,0,102,97,108,115,101,0,0,0,48,0,0,0,0,0,0,0,110,111,32,115,117,99,104,32,102,105,108,101,0,0,0,0,104,114,100,95,108,97,121,101,114,95,115,101,116,95,105,100,120,91,37,100,93,32,61,32,37,100,10,0,0,0,0,0,76,97,121,101,114,32,37,100,10,0,0,0,0,0,0,0,115,108,105,99,101,95,115,97,111,95,108,117,109,97,95,102,108,97,103,32,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,110,117,109,95,116,105,108,101,95,99,111,108,117,109,110,115,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,0,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,32,83,80,83,32,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,10,0,0,0,0,0,0,0,0,115,108,105,99,101,32,104,101,97,100,101,114,32,105,110,118,97,108,105,100,0,0,0,0,115,112,115,0,0,0,0,0,118,112,115,95,110,117,109,95,104,114,100,95,112,97,114,97,109,101,116,101,114,115,32,32,32,32,32,61,32,37,100,10,0,0,0,0,0,0,0,0,115,112,115,95,115,117,98,95,108,97,121,101,114,95,111,114,100,101,114,105,110,103,95,105,110,102,111,95,112,114,101,115,101,110,116,95,102,108,97,103,32,58,32,37,100,10,0,0,115,108,105,99,101,95,116,101,109,112,111,114,97,108,95,109,118,112,95,101,110,97,98,108,101,100,95,102,108,97,103,32,58,32,37,100,10,0,0,0,116,105,108,101,88,62,61,48,32,38,38,32,116,105,108,101,89,62,61,48,0,0,0,0,101,110,116,114,111,112,121,95,99,111,100,105,110,103,95,115,121,110,99,95,101,110,97,98,108,101,100,95,102,108,97,103,58,32,37,100,10,0,0,0,112,112,115,32,104,101,97,100,101,114,32,105,110,118,97,108,105,100,0,0,0,0,0,0,118,112,115,95,110,117,109,95,116,105,99,107,115,95,112,111,99,95,100,105,102,102,95,111,110,101,32,61,32,37,100,10,0,0,0,0,0,0,0,0,108,111,103,50,95,109,97,120,95,112,105,99,95,111,114,100,101,114,95,99,110,116,95,108,115,98,32,58,32,37,100,10,0,0,0,0,0,0,0,0,68,101,108,116,97,80,111,99,77,115,98,67,121,99,108,101,76,116,91,37,100,93,32,32,58,32,37,100,10,0,0,0,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,32,80,80,83,32,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,45,10,0,0,0,0,0,0,0,0,116,105,108,101,115,95,101,110,97,98,108,101,100,95,102,108,97,103,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,115,112,115,32,104,101,97,100,101,114,32,105,110,118,97,108,105,100,0,0,0,0,0,0,118,112,115,95,112,111,99,95,112,114,111,112,111,114,116,105,111,110,97,108,95,116,111,95,116,105,109,105,110,103,95,102,108,97,103,32,61,32,37,100,10,0,0,0,0,0,0,0,98,105,116,95,100,101,112,116,104,95,99,104,114,111,109,97,32,58,32,37,100,10,0,0,85,115,101,100,66,121,67,117,114,114,80,105,99,76,116,91,37,100,93,32,32,32,32,32,58,32,37,100,10,0,0,0,116,114,97,110,115,113,117,97,110,116,95,98,121,112,97,115,115,95,101,110,97,98,108,101,95,102,108,97,103,58,32,37,100,10,0,0,0,0,0,0,112,101,110,100,105,110,103,32,62,61,32,48,0,0,0,0,67,84,66,32,111,117,116,115,105,100,101,32,111,102,32,105,109,97,103,101,32,97,114,101,97,32,40,99,111,110,99,101,97,108,105,110,103,32,115,116,114,101,97,109,32,101,114,114,111,114,46,46,46,41,0,0,118,112,115,95,116,105,109,101,95,115,99,97,108,101,32,32,32,32,32,32,32,32,61,32,37,100,10,0,0,0,0,0,98,105,116,95,100,101,112,116,104,95,108,117,109,97,32,32,32,58,32,37,100,10,0,0,80,111,99,76,115,98,76,116,91,37,100,93,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,111,117,116,112,117,116,95,102,108,97,103,95,112,114,101,115,101,110,116,95,102,108,97,103,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,73,110,99,111,114,114,101,99,116,32,101,110,116,114,121,45,112,111,105,110,116,32,111,102,102,115,101,116,0,0,0,0,109,118,112,0,0,0,0,0,118,112,115,95,110,117,109,95,117,110,105,116,115,95,105,110,95,116,105,99,107,32,61,32,37,100,10,0,0,0,0,0,99,111,110,102,95,119,105,110,95,98,111,116,116,111,109,95,111,102,102,115,101,116,58,32,37,100,10,0,0,0,0,0,110,117,109,95,108,111,110,103,95,116,101,114,109,95,112,105,99,115,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,119,101,105,103,104,116,101,100,95,98,105,112,114,101,100,95,102,108,97,103,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,80,114,101,109,97,116,117,114,101,32,101,110,100,32,111,102,32,115,108,105,99,101,32,115,101,103,109,101,110,116,0,0,109,101,114,103,101,95,109,111,100,101,0,0,0,0,0,0,118,112,115,95,116,105,109,105,110,103,95,105,110,102,111,95,112,114,101,115,101,110,116,95,102,108,97,103,32,61,32,37,100,10,0,0,0,0,0,0,99,111,110,102,95,119,105,110,95,116,111,112,95,111,102,102,115,101,116,32,32,32,58,32,37,100,10,0,0,0,0,0,110,117,109,95,108,111,110,103,95,116,101,114,109,95,115,112,115,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,119,101,105,103,104,116,101,100,95,112,114,101,100,95,102,108,97,103,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,84,111,111,32,109,97,110,121,32,119,97,114,110,105,110,103,115,32,113,117,101,117,101,100,0,0,0,0,0,0,0,0,114,101,102,73,100,120,66,62,61,48,0,0,0,0,0,0,108,97,121,101,114,95,105,100,95,105,110,99,108,117,100,101,100,95,102,108,97,103,91,37,100,93,91,37,100,93,32,61,32,37,100,10,0,0,0,0,99,111,110,102,95,119,105,110,95,114,105,103,104,116,95,111,102,102,115,101,116,32,58,32,37,100,10,0,0,0,0,0,115,104,111,114,116,95,116,101,114,109,95,114,101,102,95,112,105,99,95,115,101,116,95,105,100,120,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,112,112,115,95,115,108,105,99,101,95,99,104,114,111,109,97,95,113,112,95,111,102,102,115,101,116,115,95,112,114,101,115,101,110,116,95,102,108,97,103,32,58,32,37,100,10,0,0,67,97,110,110,111,116,32,114,117,110,32,100,101,99,111,100,101,114,32,109,117,108,116,105,45,116,104,114,101,97,100,101,100,32,98,101,99,97,117,115,101,32,115,116,114,101,97,109,32,100,111,101,115,32,110,111,116,32,115,117,112,112,111,114,116,32,87,80,80,0,0,0,102,97,108,115,101,0,0,0,114,101,102,80,105,99,76,105,115,116,62,61,48,0,0,0,118,112,115,95,110,117,109,95,108,97,121,101,114,95,115,101,116,115,32,61,32,37,100,10,0,0,0,0,0,0,0,0,99,111,110,102,95,119,105,110,95,108,101,102,116,95,111,102,102,115,101,116,32,32,58,32,37,100,10,0,0,0,0,0,114,101,102,95,112,105,99,95,115,101,116,91,32,37,50,100,32,93,58,32,0,0,0,0,102,97,108,108,98,97,99,107,45,109,111,116,105,111,110,46,99,0,0,0,0,0,0,0,112,105,99,95,99,114,95,113,112,95,111,102,102,115,101,116,32,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,83,69,73,32,100,97,116,97,32,99,97,110,110,111,116,32,98,101,32,112,114,111,99,101,115,115,101,100,0,0,0,0,80,80,83,32,37,100,32,104,97,115,32,110,111,116,32,98,101,101,110,32,114,101,97,100,10,0,0,0,0,0,0,0,114,101,102,73,100,120,65,62,61,48,0,0,0,0,0,0,118,112,115,95,109,97,120,95,108,97,121,101,114,95,105,100,32,32,32,61,32,37,100,10,0,0,0,0,0,0,0,0,99,111,110,102,111,114,109,97,110,99,101,95,119,105,110,100,111,119,95,102,108,97,103,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,0,0,115,104,111,114,116,95,116,101,114,109,95,114,101,102,95,112,105,99,95,115,101,116,95,115,112,115,95,102,108,97,103,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,112,105,99,95,99,98,95,113,112,95,111,102,102,115,101,116,32,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,100,101,99,99,116,120,46,99,0,0,0,0,0,0,0,0,118,112,115,46,99,0,0,0,110,111,32,109,111,114,101,32,105,110,112,117,116,32,100,97,116,97,44,32,100,101,99,111,100,101,114,32,115,116,97,108,108,101,100,0,0,0,0,0,73,78,70,79,58,32,0,0,100,101,98,108,111,99,107,46,99,0,0,0,0,0,0,0,105,110,116,101,114,110,97,108,32,101,114,114,111,114,58,32,109,97,120,105,109,117,109,32,110,117,109,98,101,114,32,111,102,32,115,108,105,99,101,115,32,101,120,99,101,101,100,101,100,0,0,0,0,0,0,0,48,0,0,0,0,0,0,0,115,104,100,114,45,62,115,108,105,99,101,95,116,121,112,101,32,61,61,32,83,76,73,67,69,95,84,89,80,69,95,66,0,0,0,0,0,0,0,0,32,32,32,32,32,32,32,32,32,32,32,32,32,118,112,115,95,109,97,120,95,108,97,116,101,110,99,121,95,105,110,99,114,101,97,115,101,32,32,61,32,37,100,10,0,0,0,0,112,105,99,95,104,101,105,103,104,116,95,105,110,95,108,117,109,97,95,115,97,109,112,108,101,115,32,58,32,37,100,10,0,0,0,0,0,0,0,0,115,108,105,99,101,95,112,105,99,95,111,114,100,101,114,95,99,110,116,95,108,115,98,32,32,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,116,114,97,110,115,102,111,114,109,46,99,0,0,0,0,0,100,105,102,102,95,99,117,95,113,112,95,100,101,108,116,97,95,100,101,112,116,104,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,0,0,115,112,115,46,99,0,0,0,110,111,32,101,114,114,111,114,0,0,0,0,0,0,0,0,99,116,120,45,62,114,101,111,114,100,101,114,95,111,117,116,112,117,116,95,113,117,101,117,101,95,108,101,110,103,116,104,32,60,32,68,69,50,54,53,95,68,80,66,95,83,73,90,69,0,0,0,0,0,0,0,109,111,116,105,111,110,46,99,0,0,0,0,0,0,0,0,115,108,105,99,101,46,99,0,32,32,32,32,32,32,32,32,32,32,32,32,32,118,112,115,95,109,97,120,95,110,117,109,95,114,101,111,114,100,101,114,95,112,105,99,115,32,32,61,32,37,100,10,0,0,0,0,112,105,99,95,119,105,100,116,104,95,105,110,95,108,117,109,97,95,115,97,109,112,108,101,115,32,32,58,32,37,100,10,0,0,0,0,0,0,0,0,99,111,108,111,117,114,95,112,108,97,110,101,95,105,100,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,48,0,0,0,0,0,0,0,99,117,95,113,112,95,100,101,108,116,97,95,101,110,97,98,108,101,100,95,102,108,97,103,32,32,32,58,32,37,100,10,0,0,0,0,0,0,0,0,114,101,102,112,105,99,46,99,0,0,0,0,0,0,0,0,105,110,116,101,114,110,97,108,32,101,114,114,111,114,58,32,109,97,120,105,109,117,109,32,110,117,109,98,101,114,32,111,102,32,116,104,114,101,97,100,32,99,111,110,116,101,120,116,115,32,101,120,99,101,101,100,101,100,0,0,0,0,0,0,102,97,108,115,101,0,0,0,108,97,121,101,114,32,40,97,108,108,41,58,32,118,112,115,95,109,97,120,95,100,101,99,95,112,105,99,95,98,117,102,102,101,114,105,110,103,32,61,32,37,100,10,0,0,0,0,115,101,112,97,114,97,116,101,95,99,111,108,111,117,114,95,112,108,97,110,101,95,102,108,97,103,32,58,32,37,100,10,0,0,0,0,0,0,0,0,112,105,99,95,111,117,116,112,117,116,95,102,108,97,103,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,112,112,115,46,99,0,0,0,116,114,97,110,115,102,111,114,109,95,115,107,105,112,95,101,110,97,98,108,101,100,95,102,108,97,103,58,32,37,100,10,0,0,0,0,0,0,0,0,99,97,110,110,111,116,32,102,114,101,101,32,108,105,98,114,97,114,121,32,100,97,116,97,32,40,110,111,116,32,105,110,105,116,105,97,108,105,122,101,100,0,0,0,0,0,0,0,32,32,32,32,32,32,32,32,32,118,112,115,95,109,97,120,95,108,97,116,101,110,99,121,95,105,110,99,114,101,97,115,101,32,32,61,32,37,100,10,0,0,0,0,0,0,0,0,117,110,107,110,111,119,110,0,115,108,105,99,101,95,116,121,112,101,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,99,10,0,0,0,0,0,0,99,111,110,115,116,114,97,105,110,101,100,95,105,110,116,114,97,95,112,114,101,100,95,102,108,97,103,58,32,37,100,10,0,0,0,0,0,0,0,0,105,109,97,103,101,46,99,0,48,0,0,0,0,0,0,0,103,108,111,98,97,108,32,108,105,98,114,97,114,121,32,105,110,105,116,105,97,108,105,122,97,116,105,111,110,32,102,97,105,108,101,100,0,0,0,0,32,32,32,32,32,32,32,32,32,118,112,115,95,109,97,120,95,110,117,109,95,114,101,111,114,100,101,114,95,112,105,99,115,32,32,61,32,37,100,10,0,0,0,0,0,0,0,0,52,58,52,58,52,0,0,0,115,108,105,99,101,95,115,101,103,109,101,110,116,95,97,100,100,114,101,115,115,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,112,105,99,95,105,110,105,116,95,113,112,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,58,32,37,100,10,0,0,0,0,0,0,0,0,99,97,110,110,111,116,32,115,116,97,114,116,32,100,101,99,111,100,105,110,103,32,116,104,114,101,97,100,115,0,0,0,115,101,116,95,115,97,111,95,105,110,102,111,0,0,0,0,115,101,116,95,105,110,105,116,86,97,108,117,101,0,0,0,115,101,116,95,99,111,110,102,111,114,109,97,110,99,101,95,119,105,110,100,111,119,0,0,115,101,116,95,83,108,105,99,101,65,100,100,114,82,83,0,115,101,116,95,81,80,89,0,115,99,97,108,101,95,99,111,101,102,102,105,99,105,101,110,116,115,0,0,0,0,0,0,114,101,97,100,95,118,112,115,0,0,0,0,0,0,0,0,114,101,97,100,95,116,114,97,110,115,102,111,114,109,95,117,110,105,116,0,0,0,0,0,114,101,97,100,95,115,112,115,0,0,0,0,0,0,0,0,114,101,97,100,95,115,104,111,114,116,95,116,101,114,109,95,114,101,102,95,112,105,99,95,115,101,116,0,0,0,0,0,114,101,97,100,95,115,99,97,108,105,110,103,95,108,105,115,116,0,0,0,0,0,0,0,114,101,97,100,95,112,114,101,100,95,119,101,105,103,104,116,95,116,97,98,108,101,0,0,114,101,97,100,95,112,112,115,0,0,0,0,0,0,0,0,114,101,97,100,95,99,111,100,105,110,103,95,117,110,105,116,0,0,0,0,0,0,0,0,112,117,116,95,119,101,105,103,104,116,101,100,95,112,114,101,100,95,97,118,103,95,56,95,102,97,108,108,98,97,99,107,0,0,0,0,0,0,0,0,112,117,116,95,119,101,105,103,104,116,101,100,95,112,114,101,100,95,56,95,102,97,108,108,98,97,99,107,0,0,0,0,112,117,116,95,119,101,105,103,104,116,101,100,95,98,105,112,114,101,100,95,56,95,102,97,108,108,98,97,99,107,0,0,112,117,116,95,117,110,119,101,105,103,104,116,101,100,95,112,114,101,100,95,56,95,102,97,108,108,98,97,99,107,0,0,112,117,115,104,95,99,117,114,114,101,110,116,95,112,105,99,116,117,114,101,95,116,111,95,111,117,116,112,117,116,95,113,117,101,117,101,0,0,0,0,112,114,111,99,101,115,115,95,115,108,105,99,101,95,115,101,103,109,101,110,116,95,104,101,97,100,101,114,0,0,0,0,112,114,111,99,101,115,115,95,115,101,105,95,100,101,99,111,100,101,100,95,112,105,99,116,117,114,101,95,104,97,115,104,0,0,0,0,0,0,0,0,112,111,112,95,102,114,111,109,95,78,65,76,95,113,117,101,117,101,0,0,0,0,0,0,109,99,95,99,104,114,111,109,97,0,0,0,0,0,0,0,105,110,116,114,97,95,112,114,101,100,105,99,116,105,111,110,95,115,97,109,112,108,101,95,102,105,108,116,101,114,105,110,103,0,0,0,0,0,0,0,105,110,105,116,105,97,108,105,122,101,95,110,101,119,95,68,80,66,95,105,109,97,103,101,0,0,0,0,0,0,0,0,105,110,105,116,105,97,108,105,122,101,95,67,65,66,65,67,0,0,0,0,0,0,0,0,103,101,116,95,115,97,111,95,105,110,102,111,0,0,0,0,103,101,116,95,100,101,98,108,107,95,102,108,97,103,115,0,103,101,110,101,114,97,116,101,95,117,110,97,118,97,105,108,97,98,108,101,95,114,101,102,101,114,101,110,99,101,95,112,105,99,116,117,114,101,0,0,103,101,110,101,114,97,116,101,95,105,110,116,101,114,95,112,114,101,100,105,99,116,105,111,110,95,115,97,109,112,108,101,115,0,0,0,0,0,0,0,102,108,117,115,104,95,110,101,120,116,95,112,105,99,116,117,114,101,95,102,114,111,109,95,114,101,111,114,100,101,114,95,98,117,102,102,101,114,0,0,102,105,108,108,95,115,99,97,108,105,110,103,95,102,97,99,116,111,114,0,0,0,0,0,101,100,103,101,95,102,105,108,116,101,114,105,110,103,95,108,117,109,97,0,0,0,0,0,100,117,109,112,95,115,108,105,99,101,95,115,101,103,109,101,110,116,95,104,101,97,100,101,114,0,0,0,0,0,0,0,100,101,114,105,118,101,95,115,112,97,116,105,97,108,95,108,117,109,97,95,118,101,99,116,111,114,95,112,114,101,100,105,99,116,105,111,110,0,0,0,100,101,114,105,118,101,95,99,111,109,98,105,110,101,100,95,98,105,112,114,101,100,105,99,116,105,118,101,95,109,101,114,103,105,110,103,95,99,97,110,100,105,100,97,116,101,115,0,100,101,114,105,118,101,95,98,111,117,110,100,97,114,121,83,116,114,101,110,103,116,104,0,100,101,99,114,101,97,115,101,95,112,101,110,100,105,110,103,95,116,97,115,107,115,0,0,100,101,99,111,100,101,95,115,117,98,115,116,114,101,97,109,0,0,0,0,0,0,0,0,100,101,99,111,100,101,95,115,112,108,105,116,95,116,114,97,110,115,102,111,114,109,95,102,108,97,103,0,0,0,0,0,100,101,99,111,100,101,95,112,97,114,116,95,109,111,100,101,0,0,0,0,0,0,0,0,100,101,50,54,53,95,115,101,116,95,112,97,114,97,109,101,116,101,114,95,105,110,116,0,100,101,50,54,53,95,115,101,116,95,112,97,114,97,109,101,116,101,114,95,98,111,111,108,0,0,0,0,0,0,0,0,100,101,50,54,53,95,112,117,115,104,95,78,65,76,0,0,100,101,50,54,53,95,103,101,116,95,112,97,114,97,109,101,116,101,114,95,98,111,111,108,0,0,0,0,0,0,0,0,100,101,50,54,53,95,100,101,99,111,100,101,95,78,65,76,0,0,0,0,0,0,0,0,100,101,50,54,53,95,100,101,99,111,100,101,0,0,0,0,99,111,110,115,116,114,117,99,116,95,114,101,102,101,114,101,110,99,101,95,112,105,99,116,117,114,101,95,108,105,115,116,115,0,0,0,0,0,0,0,97,108,108,111,99,95,97,110,100,95,105,110,105,116,95,115,105,103,110,105,102,105,99,97,110,116,95,99,111,101,102,102,95,99,116,120,73,100,120,95,108,111,111,107,117,112,84,97,98,108,101,0,0,0,0,0,97,100,100,95,116,97,115,107,0,0,0,0,0,0,0,0,255,255,255,255,2,0,0,0,2,0,0,0,1,0,0,0,255,255,255,255,2,0,0,0,1,0,0,0,1,0,0,0,128,176,208,240,128,167,197,227,128,158,187,216,123,150,178,205,116,142,169,195,111,135,160,185,105,128,152,175,100,122,144,166,95,116,137,158,90,110,130,150,85,104,123,142,81,99,117,135,77,94,111,128,73,89,105,122,69,85,100,116,66,80,95,110,62,76,90,104,59,72,86,99,56,69,81,94,53,65,77,89,51,62,73,85,48,59,69,80,46,56,66,76,43,53,63,72,41,50,59,69,39,48,56,65,37,45,54,62,35,43,51,59,33,41,48,56,32,39,46,53,30,37,43,50,29,35,41,48,27,33,39,45,26,31,37,43,24,30,35,41,23,28,33,39,22,27,32,37,21,26,30,35,20,24,29,33,19,23,27,31,18,22,26,30,17,21,25,28,16,20,23,27,15,19,22,25,14,18,21,24,14,17,20,23,13,16,19,22,12,15,18,21,12,14,17,20,11,14,16,19,11,13,15,18,10,12,15,17,10,12,14,16,9,11,13,15,9,11,12,14,8,10,12,14,8,9,11,13,7,9,11,12,7,9,10,12,7,8,10,11,6,8,9,11,6,7,9,10,6,7,8,9,2,2,2,2], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+10240);



var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}


  
  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    } 
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;

  
   
  Module["_memmove"] = _memmove;var _llvm_memmove_p0i8_p0i8_i32=_memmove;

  function ___assert_fail(condition, filename, line, func) {
      ABORT = true;
      throw 'Assertion failed: ' + Pointer_stringify(condition) + ', at: ' + [filename ? Pointer_stringify(filename) : 'unknown filename', line, func ? Pointer_stringify(func) : 'unknown function'] + ' at ' + stackTrace();
    }

  var _llvm_expect_i32=undefined;

  
   
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;

  
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
  
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value;
      return value;
    }
  
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        // reuse all of the core MEMFS functionality
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },getDB:function (name, callback) {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
  
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          var transaction = e.target.transaction;
  
          var fileStore;
  
          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }
  
          fileStore.createIndex('timestamp', 'timestamp', { unique: false });
        };
        req.onsuccess = function() {
          db = req.result;
  
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function() {
          callback(this.error);
        };
      },getLocalSet:function (mount, callback) {
        var entries = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat;
  
          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }
  
          entries[path] = { timestamp: stat.mtime };
        }
  
        return callback(null, { type: 'local', entries: entries });
      },getRemoteSet:function (mount, callback) {
        var entries = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function() { callback(this.error); };
  
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          var index = store.index('timestamp');
  
          index.openKeyCursor().onsuccess = function(event) {
            var cursor = event.target.result;
  
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, entries: entries });
            }
  
            entries[cursor.primaryKey] = { timestamp: cursor.key };
  
            cursor.continue();
          };
        });
      },loadLocalEntry:function (path, callback) {
        var stat, node;
  
        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }
  
        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      },storeLocalEntry:function (path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { encoding: 'binary', canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }
  
          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },removeLocalEntry:function (path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);
  
          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },loadRemoteEntry:function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) { callback(null, event.target.result); };
        req.onerror = function() { callback(this.error); };
      },storeRemoteEntry:function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },removeRemoteEntry:function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = [];
        Object.keys(src.entries).forEach(function (key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });
  
        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });
  
        if (!total) {
          return callback(null);
        }
  
        var errored = false;
        var completed = 0;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        transaction.onerror = function() { done(this.error); };
  
        // sort paths in ascending order so directory entries are created
        // before the files inside them
        create.sort().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });
  
        // sort paths in descending order so files are deleted before their
        // parent directories
        remove.sort().reverse().forEach(function(path) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          stream.position = position;
          return position;
        }}};
  
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);var FS={root:null,mounts:[],devices:[null],streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };
  
          FS.FSNode.prototype = {};
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
  
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return !!node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },getStreamFromPtr:function (ptr) {
        return FS.streams[ptr - 1];
      },getPtrForStream:function (stream) {
        return stream ? stream.fd + 1 : 0;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },getMounts:function (mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            callback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0, opts.canOwn);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0, opts.canOwn);
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=FS.getPtrForStream(stdin);
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=FS.getPtrForStream(stdout);
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=FS.getPtrForStream(stderr);
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
  
              if (!hasByteServing) chunkSize = datalength;
  
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
  
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
  
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
  
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }

  
  
  
  
  
  function _mkport() { throw 'TODO' }var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
  
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
  
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
  
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
  
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
  
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
  
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
  
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {headers: {'websocket-protocol': ['binary']}} : ['binary'];
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
  
  
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
  
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
  
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
  
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
  
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
  
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
  
  
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
  
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
  
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
  
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
  
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
  
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
  
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
  
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
  
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
  
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
  
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
  
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
  
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
  
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
  
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
  
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
  
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
  
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
  
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
  
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
  
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
  
  
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
  
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  
  function _fileno(stream) {
      // int fileno(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fileno.html
      return FS.getStreamFromPtr(stream).fd;
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var fd = _fileno(stream);
      var bytesWritten = _write(fd, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStreamFromPtr(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  
  
   
  Module["_strlen"] = _strlen;
  
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
  
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
  
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
  
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
  
          // Handle precision.
          var precisionSet = false, precision = -1;
          if (next == 46) {
            precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          }
          if (precision < 0) {
            precision = 6; // Standard default.
            precisionSet = false;
          }
  
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
  
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
  
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
  
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
  
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
  
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
  
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
  
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
  
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
  
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
  
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
  
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
  
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
  
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length;
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }

  var _llvm_va_start=undefined;

  function _vfprintf(s, f, va_arg) {
      return _fprintf(s, f, HEAP32[((va_arg)>>2)]);
    }

  function _llvm_va_end() {}

  function _pthread_create() {
  Module['printErr']('missing function: pthread_create'); abort(-1);
  }

  function _pthread_join() { throw 'TODO: ' + aborter }

  function _pthread_mutex_init() {}

  function _pthread_mutex_destroy() {}

  function _pthread_mutex_lock() {}

  function _pthread_mutex_unlock() {}

  function _pthread_cond_init() {}

  function _pthread_cond_destroy() {}

  function _pthread_cond_broadcast() {
      return 0;
    }

  function _pthread_cond_wait() {
      return 0;
    }

  function _pthread_cond_signal() { throw 'TODO: ' + aborter }

  function _abort() {
      Module['abort']();
    }

  function ___errno_location() {
      return ___errno_state;
    }

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }

  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }






  var Browser={mainLoop:{scheduler:null,method:"",shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
        // Canvas event setup
  
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
  
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
  
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        var errorInfo = '?';
        function onContextCreationError(event) {
          errorInfo = event.statusMessage || errorInfo;
        }
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
  
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
  
  
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
  
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          GLctx = Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
  
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
  
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },getMouseWheelDelta:function (event) {
        return Math.max(-1, Math.min(1, event.type === 'DOMMouseScroll' ? event.detail : -event.wheelDelta));
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (scrollX + rect.left);
              y = t.pageY - (scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (scrollX + rect.left);
            y = event.pageY - (scrollY + rect.top);
          }
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + 5242880;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");

 var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_DYNAMIC);
 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);

var Math_min = Math.min;
function invoke_viiiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  try {
    Module["dynCall_viiiiiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12) {
  try {
    Module["dynCall_viiiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viii(index,a1,a2,a3) {
  try {
    Module["dynCall_viii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  try {
    Module["dynCall_viiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiii(index,a1,a2,a3,a4) {
  try {
    Module["dynCall_viiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.cttz_i8|0;var n=env.ctlz_i8|0;var o=env._stderr|0;var p=env._stdout|0;var q=+env.NaN;var r=+env.Infinity;var s=0;var t=0;var u=0;var v=0;var w=0,x=0,y=0,z=0,A=0.0,B=0,C=0,D=0,E=0.0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=0;var N=0;var O=0;var P=global.Math.floor;var Q=global.Math.abs;var R=global.Math.sqrt;var S=global.Math.pow;var T=global.Math.cos;var U=global.Math.sin;var V=global.Math.tan;var W=global.Math.acos;var X=global.Math.asin;var Y=global.Math.atan;var Z=global.Math.atan2;var _=global.Math.exp;var $=global.Math.log;var aa=global.Math.ceil;var ba=global.Math.imul;var ca=env.abort;var da=env.assert;var ea=env.asmPrintInt;var fa=env.asmPrintFloat;var ga=env.min;var ha=env.invoke_viiiiiii;var ia=env.invoke_vi;var ja=env.invoke_viiiiiiiiiiii;var ka=env.invoke_ii;var la=env.invoke_viii;var ma=env.invoke_v;var na=env.invoke_viiiiiiiii;var oa=env.invoke_viiiiii;var pa=env.invoke_iii;var qa=env.invoke_viiii;var ra=env._llvm_va_end;var sa=env.___assert_fail;var ta=env._pthread_mutex_lock;var ua=env._pthread_cond_signal;var va=env._abort;var wa=env._fprintf;var xa=env._pthread_create;var ya=env._fflush;var za=env.__reallyNegative;var Aa=env._sysconf;var Ba=env.___setErrNo;var Ca=env._fwrite;var Da=env._send;var Ea=env._pthread_mutex_init;var Fa=env._write;var Ga=env._pthread_cond_init;var Ha=env.__formatString;var Ia=env._pthread_cond_broadcast;var Ja=env._vfprintf;var Ka=env._pthread_join;var La=env._emscripten_memcpy_big;var Ma=env._fileno;var Na=env._pwrite;var Oa=env._sbrk;var Pa=env.___errno_location;var Qa=env._pthread_mutex_destroy;var Ra=env._pthread_cond_wait;var Sa=env._pthread_mutex_unlock;var Ta=env._mkport;var Ua=env._time;var Va=env._pthread_cond_destroy;var Wa=0.0;
// EMSCRIPTEN_START_FUNCS
function ve(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;f=i;g=b;b=d;d=e;a[b|0]=0;e=Gb(g)|0;h=e;a[b+1|0]=e;do{if((h|0)<64){if((h|0)==-99999){break}e=Gb(g)|0;h=e;a[b+2|0]=e;do{if((h|0)<64){if((h|0)==-99999){break}a[b+3|0]=Cb(g,1)|0;a[b+31|0]=Cb(g,1)|0;a[b+4328|0]=Cb(g,3)|0;a[b+4|0]=Cb(g,1)|0;a[b+5|0]=Cb(g,1)|0;e=Gb(g)|0;h=e;a[b+6|0]=e;if((h|0)==-99999){ed(d,1006,0);j=0;k=j;i=f;return k|0}e=b+6|0;a[e]=(a[e]|0)+1;e=Gb(g)|0;h=e;a[b+7|0]=e;if((h|0)==-99999){ed(d,1006,0);j=0;k=j;i=f;return k|0}e=b+7|0;a[e]=(a[e]|0)+1;e=Uc(d,a[b+2|0]|0)|0;if((e|0)==0){ed(d,1010,0);j=0;k=j;i=f;return k|0}l=Hb(g)|0;c[b+8>>2]=l;if((l|0)==-99999){ed(d,1006,0);j=0;k=j;i=f;return k|0}l=b+8|0;c[l>>2]=(c[l>>2]|0)+26;a[b+12|0]=Cb(g,1)|0;a[b+13|0]=Cb(g,1)|0;a[b+14|0]=Cb(g,1)|0;do{if((a[b+14|0]|0)!=0){l=Gb(g)|0;c[b+16>>2]=l;if(!((l|0)==-99999)){break}ed(d,1006,0);j=0;k=j;i=f;return k|0}else{c[b+16>>2]=0}}while(0);l=Hb(g)|0;c[b+20>>2]=l;if((l|0)==-99999){ed(d,1006,0);j=0;k=j;i=f;return k|0}l=Hb(g)|0;c[b+24>>2]=l;if((l|0)==-99999){ed(d,1006,0);j=0;k=j;i=f;return k|0}a[b+28|0]=Cb(g,1)|0;a[b+29|0]=Cb(g,1)|0;a[b+30|0]=Cb(g,1)|0;a[b+32|0]=Cb(g,1)|0;a[b+34|0]=Cb(g,1)|0;a[b+33|0]=Cb(g,1)|0;a:do{if((a[b+34|0]|0)!=0){c[b+36>>2]=Gb(g)|0;do{if(!((c[b+36>>2]|0)==-99999)){if((c[b+36>>2]|0)>10){break}l=b+36|0;c[l>>2]=(c[l>>2]|0)+1;c[b+40>>2]=Gb(g)|0;do{if(!((c[b+40>>2]|0)==-99999)){if((c[b+40>>2]|0)>10){break}l=b+40|0;c[l>>2]=(c[l>>2]|0)+1;a[b+44|0]=Cb(g,1)|0;do{if((a[b+44|0]|0)==0){l=c[e+4928>>2]|0;m=c[e+4936>>2]|0;n=0;while(1){if((n|0)>=((c[b+36>>2]|0)-1|0)){break}c[b+48+(n<<2)>>2]=Gb(g)|0;if((c[b+48+(n<<2)>>2]|0)==-99999){o=35;break}p=b+48+(n<<2)|0;c[p>>2]=(c[p>>2]|0)+1;l=l-(c[b+48+(n<<2)>>2]|0)|0;n=n+1|0}if((o|0)==35){ed(d,1006,0);j=0;k=j;i=f;return k|0}c[b+48+((c[b+36>>2]|0)-1<<2)>>2]=l;n=0;while(1){if((n|0)>=((c[b+40>>2]|0)-1|0)){o=44;break}c[b+88+(n<<2)>>2]=Gb(g)|0;if((c[b+88+(n<<2)>>2]|0)==-99999){break}p=b+88+(n<<2)|0;c[p>>2]=(c[p>>2]|0)+1;m=m-(c[b+88+(n<<2)>>2]|0)|0;n=n+1|0}if((o|0)==44){c[b+88+((c[b+40>>2]|0)-1<<2)>>2]=m;break}ed(d,1006,0);j=0;k=j;i=f;return k|0}}while(0);a[b+240|0]=Cb(g,1)|0;break a}}while(0);ed(d,1006,0);j=0;k=j;i=f;return k|0}}while(0);ed(d,1006,0);j=0;k=j;i=f;return k|0}else{c[b+36>>2]=1;c[b+40>>2]=1;a[b+44|0]=1;a[b+240|0]=0}}while(0);if((a[b+44|0]|0)!=0){n=i;i=i+((c[b+36>>2]|0)+1<<2)|0;i=i+7&-8;l=n;n=0;while(1){if((n|0)>(c[b+36>>2]|0)){break}p=ba(n,c[e+4928>>2]|0)|0;c[l+(n<<2)>>2]=(p|0)/(c[b+36>>2]|0)|0;n=n+1|0}n=0;while(1){if((n|0)>=(c[b+36>>2]|0)){break}c[b+48+(n<<2)>>2]=(c[l+(n+1<<2)>>2]|0)-(c[l+(n<<2)>>2]|0);n=n+1|0}n=i;i=i+((c[b+40>>2]|0)+1<<2)|0;i=i+7&-8;l=n;n=0;while(1){if((n|0)>(c[b+40>>2]|0)){break}p=ba(n,c[e+4936>>2]|0)|0;c[l+(n<<2)>>2]=(p|0)/(c[b+40>>2]|0)|0;n=n+1|0}n=0;while(1){if((n|0)>=(c[b+40>>2]|0)){break}c[b+88+(n<<2)>>2]=(c[l+(n+1<<2)>>2]|0)-(c[l+(n<<2)>>2]|0);n=n+1|0}}c[b+128>>2]=0;n=0;while(1){if((n|0)>=(c[b+36>>2]|0)){break}c[b+128+(n+1<<2)>>2]=(c[b+128+(n<<2)>>2]|0)+(c[b+48+(n<<2)>>2]|0);n=n+1|0}c[b+172>>2]=0;n=0;while(1){if((n|0)>=(c[b+40>>2]|0)){break}c[b+172+(n+1<<2)>>2]=(c[b+172+(n<<2)>>2]|0)+(c[b+88+(n<<2)>>2]|0);n=n+1|0}if((c[b+216>>2]|0)!=0){Ph(c[b+216>>2]|0)}if((c[b+220>>2]|0)!=0){Ph(c[b+220>>2]|0)}if((c[b+224>>2]|0)!=0){Ph(c[b+224>>2]|0)}if((c[b+228>>2]|0)!=0){Ph(c[b+228>>2]|0)}if((c[b+232>>2]|0)!=0){Ph(c[b+232>>2]|0)}c[b+216>>2]=Oh(c[e+4944>>2]<<2)|0;c[b+220>>2]=Oh(c[e+4944>>2]<<2)|0;c[b+224>>2]=Oh(c[e+4944>>2]<<2)|0;c[b+228>>2]=Oh(c[e+4944>>2]<<2)|0;c[b+232>>2]=Oh(c[e+4968>>2]<<2)|0;n=0;while(1){if((n|0)>=(c[e+4944>>2]|0)){break}l=(n|0)%(c[e+4928>>2]|0)|0;p=(n|0)/(c[e+4928>>2]|0)|0;q=-1;r=-1;s=0;while(1){if((s|0)>=(c[b+36>>2]|0)){break}if((l|0)>=(c[b+128+(s<<2)>>2]|0)){q=s}s=s+1|0}s=0;while(1){if((s|0)>=(c[b+40>>2]|0)){break}if((p|0)>=(c[b+172+(s<<2)>>2]|0)){r=s}s=s+1|0}c[(c[b+216>>2]|0)+(n<<2)>>2]=0;s=0;while(1){if((s|0)>=(q|0)){break}t=ba(c[b+88+(r<<2)>>2]|0,c[b+48+(s<<2)>>2]|0)|0;u=(c[b+216>>2]|0)+(n<<2)|0;c[u>>2]=(c[u>>2]|0)+t;s=s+1|0}s=0;while(1){if((s|0)>=(r|0)){break}t=ba(c[e+4928>>2]|0,c[b+88+(s<<2)>>2]|0)|0;u=(c[b+216>>2]|0)+(n<<2)|0;c[u>>2]=(c[u>>2]|0)+t;s=s+1|0}if((q|0)>=0){if((r|0)>=0){}else{o=107}}else{o=107}if((o|0)==107){o=0;sa(11232,13888,265,14600);return 0}s=ba(p-(c[b+172+(r<<2)>>2]|0)|0,c[b+48+(q<<2)>>2]|0)|0;t=(c[b+216>>2]|0)+(n<<2)|0;c[t>>2]=(c[t>>2]|0)+s;s=(c[b+216>>2]|0)+(n<<2)|0;c[s>>2]=(c[s>>2]|0)+(l-(c[b+128+(q<<2)>>2]|0));c[(c[b+220>>2]|0)+(c[(c[b+216>>2]|0)+(n<<2)>>2]<<2)>>2]=n;n=n+1|0}n=0;while(1){if((n|0)>=(c[e+4936>>2]|0)){break}s=0;while(1){if((s|0)>=(c[e+4928>>2]|0)){break}s=s+1|0}n=n+1|0}n=0;s=0;while(1){if((n|0)>=(c[b+40>>2]|0)){break}q=0;while(1){if((q|0)>=(c[b+36>>2]|0)){break}l=c[b+172+(n<<2)>>2]|0;while(1){if((l|0)>=(c[b+172+(n+1<<2)>>2]|0)){break}r=c[b+128+(q<<2)>>2]|0;while(1){if((r|0)>=(c[b+128+(q+1<<2)>>2]|0)){break}p=(ba(l,c[e+4928>>2]|0)|0)+r|0;c[(c[b+224>>2]|0)+(c[(c[b+216>>2]|0)+(p<<2)>>2]<<2)>>2]=s;p=(ba(l,c[e+4928>>2]|0)|0)+r|0;c[(c[b+228>>2]|0)+(p<<2)>>2]=s;r=r+1|0}l=l+1|0}s=s+1|0;q=q+1|0}n=n+1|0}n=0;while(1){if((n|0)>=(c[e+4936>>2]|0)){break}s=0;while(1){if((s|0)>=(c[e+4928>>2]|0)){break}s=s+1|0}n=n+1|0}n=0;while(1){if((n|0)>=(c[e+4964>>2]|0)){break}s=0;while(1){if((s|0)>=(c[e+4960>>2]|0)){break}q=(ba(c[e+4928>>2]|0,n<<c[e+4972>>2]>>c[e+4912>>2])|0)+(s<<c[e+4972>>2]>>c[e+4912>>2])|0;l=s+(ba(n,c[e+4960>>2]|0)|0)|0;c[(c[b+232>>2]|0)+(l<<2)>>2]=c[(c[b+216>>2]|0)+(q<<2)>>2]<<((c[e+4912>>2]|0)-(c[e+4972>>2]|0)<<1);q=0;l=0;while(1){if((l|0)>=((c[e+4912>>2]|0)-(c[e+4972>>2]|0)|0)){break}r=1<<l;if((r&s|0)!=0){v=ba(r,r)|0}else{v=0}if((r&n|0)!=0){w=ba(r<<1,r)|0}else{w=0}q=q+(v+w)|0;l=l+1|0}l=s+(ba(n,c[e+4960>>2]|0)|0)|0;r=(c[b+232>>2]|0)+(l<<2)|0;c[r>>2]=(c[r>>2]|0)+q;s=s+1|0}n=n+1|0}c[b+236>>2]=(c[e+4912>>2]|0)-(c[b+16>>2]|0);c[b+248>>2]=0;c[b+252>>2]=0;a[b+241|0]=Cb(g,1)|0;a[b+242|0]=Cb(g,1)|0;if((a[b+242|0]|0)!=0){a[b+243|0]=Cb(g,1)|0;a[b+244|0]=Cb(g,1)|0;do{if((a[b+244|0]|0)==0){c[b+248>>2]=Hb(g)|0;if((c[b+248>>2]|0)==-99999){ed(d,1006,0);j=0;k=j;i=f;return k|0}n=b+248|0;c[n>>2]=c[n>>2]<<1;c[b+252>>2]=Hb(g)|0;if(!((c[b+252>>2]|0)==-99999)){n=b+252|0;c[n>>2]=c[n>>2]<<1;break}ed(d,1006,0);j=0;k=j;i=f;return k|0}}while(0)}else{a[b+243|0]=0;a[b+244|0]=0}a[b+256|0]=Cb(g,1)|0;do{if((a[e+604|0]|0)==0){if((a[b+256|0]|0)==0){break}ed(d,1006,0);j=0;k=j;i=f;return k|0}}while(0);do{if((a[b+256|0]|0)!=0){n=hg(g,e,b+257|0,1)|0;if((n|0)==0){break}ed(d,n,0);j=0;k=j;i=f;return k|0}else{Wh(b+257|0,e+606|0,4064)|0}}while(0);a[b+4321|0]=Cb(g,1)|0;c[b+4324>>2]=Gb(g)|0;if((c[b+4324>>2]|0)==-99999){ed(d,1006,0);j=0;k=j;i=f;return k|0}e=b+4324|0;c[e>>2]=(c[e>>2]|0)+2;a[b+4329|0]=Cb(g,1)|0;a[b+4330|0]=Cb(g,1)|0;a[b|0]=1;j=1;k=j;i=f;return k|0}}while(0);ed(d,1010,0);j=0;k=j;i=f;return k|0}}while(0);ed(d,1009,0);j=0;k=j;i=f;return k|0}function we(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=i;f=b;b=d;do{if((b|0)==1){g=c[p>>2]|0}else{if((b|0)==2){g=c[o>>2]|0;break}else{i=e;return}}}while(0);rg(g,11432,(b=i,i=i+1|0,i=i+7&-8,c[b>>2]=0,b)|0);i=b;rg(g,9296,(b=i,i=i+8|0,c[b>>2]=a[f+1|0]|0,b)|0);i=b;rg(g,7072,(b=i,i=i+8|0,c[b>>2]=a[f+2|0]|0,b)|0);i=b;rg(g,5536,(b=i,i=i+8|0,c[b>>2]=a[f+3|0]|0,b)|0);i=b;rg(g,4624,(b=i,i=i+8|0,c[b>>2]=a[f+4|0]|0,b)|0);i=b;rg(g,4272,(b=i,i=i+8|0,c[b>>2]=a[f+5|0]|0,b)|0);i=b;rg(g,4024,(b=i,i=i+8|0,c[b>>2]=a[f+6|0]|0,b)|0);i=b;rg(g,3760,(b=i,i=i+8|0,c[b>>2]=a[f+7|0]|0,b)|0);i=b;rg(g,14288,(b=i,i=i+8|0,c[b>>2]=c[f+8>>2],b)|0);i=b;rg(g,14088,(b=i,i=i+8|0,c[b>>2]=a[f+12|0]|0,b)|0);i=b;rg(g,13896,(b=i,i=i+8|0,c[b>>2]=a[f+13|0]|0,b)|0);i=b;rg(g,13624,(b=i,i=i+8|0,c[b>>2]=a[f+14|0]|0,b)|0);i=b;if((a[f+14|0]|0)!=0){rg(g,13336,(b=i,i=i+8|0,c[b>>2]=c[f+16>>2],b)|0);i=b}rg(g,12952,(b=i,i=i+8|0,c[b>>2]=c[f+20>>2],b)|0);i=b;rg(g,12712,(b=i,i=i+8|0,c[b>>2]=c[f+24>>2],b)|0);i=b;rg(g,12456,(b=i,i=i+8|0,c[b>>2]=a[f+28|0]|0,b)|0);i=b;rg(g,12248,(b=i,i=i+8|0,c[b>>2]=a[f+29|0]|0,b)|0);i=b;rg(g,12040,(b=i,i=i+8|0,c[b>>2]=a[f+30|0]|0,b)|0);i=b;rg(g,11848,(b=i,i=i+8|0,c[b>>2]=a[f+31|0]|0,b)|0);i=b;rg(g,11648,(b=i,i=i+8|0,c[b>>2]=a[f+32|0]|0,b)|0);i=b;rg(g,11480,(b=i,i=i+8|0,c[b>>2]=a[f+34|0]|0,b)|0);i=b;rg(g,11256,(b=i,i=i+8|0,c[b>>2]=a[f+33|0]|0,b)|0);i=b;if((a[f+34|0]|0)!=0){rg(g,10992,(b=i,i=i+8|0,c[b>>2]=c[f+36>>2],b)|0);i=b;rg(g,10840,(b=i,i=i+8|0,c[b>>2]=c[f+40>>2],b)|0);i=b;rg(g,10592,(b=i,i=i+8|0,c[b>>2]=a[f+44|0]|0,b)|0);i=b;rg(g,10384,(b=i,i=i+1|0,i=i+7&-8,c[b>>2]=0,b)|0);i=b;d=0;while(1){if((d|0)>(c[f+36>>2]|0)){break}rg(g,10216,(b=i,i=i+8|0,c[b>>2]=c[f+128+(d<<2)>>2],b)|0);i=b;d=d+1|0}rg(g,10040,(b=i,i=i+1|0,i=i+7&-8,c[b>>2]=0,b)|0);i=b;rg(g,9792,(b=i,i=i+1|0,i=i+7&-8,c[b>>2]=0,b)|0);i=b;d=0;while(1){if((d|0)>(c[f+40>>2]|0)){break}rg(g,10216,(b=i,i=i+8|0,c[b>>2]=c[f+172+(d<<2)>>2],b)|0);i=b;d=d+1|0}rg(g,10040,(b=i,i=i+1|0,i=i+7&-8,c[b>>2]=0,b)|0);i=b;rg(g,9528,(b=i,i=i+8|0,c[b>>2]=a[f+240|0]|0,b)|0);i=b}rg(g,9336,(b=i,i=i+8|0,c[b>>2]=a[f+241|0]|0,b)|0);i=b;rg(g,9144,(b=i,i=i+8|0,c[b>>2]=a[f+242|0]|0,b)|0);i=b;if((a[f+242|0]|0)!=0){rg(g,8888,(b=i,i=i+8|0,c[b>>2]=a[f+243|0]|0,b)|0);i=b;rg(g,8632,(b=i,i=i+8|0,c[b>>2]=a[f+244|0]|0,b)|0);i=b;rg(g,8416,(b=i,i=i+8|0,c[b>>2]=c[f+248>>2],b)|0);i=b;rg(g,8192,(b=i,i=i+8|0,c[b>>2]=c[f+252>>2],b)|0);i=b}rg(g,7992,(b=i,i=i+8|0,c[b>>2]=a[f+256|0]|0,b)|0);i=b;rg(g,7776,(b=i,i=i+8|0,c[b>>2]=a[f+4321|0]|0,b)|0);i=b;rg(g,7496,(b=i,i=i+8|0,c[b>>2]=c[f+4324>>2],b)|0);i=b;rg(g,7304,(b=i,i=i+8|0,c[b>>2]=a[f+4328|0]|0,b)|0);i=b;rg(g,7112,(b=i,i=i+8|0,c[b>>2]=a[f+4329|0]|0,b)|0);i=b;rg(g,6936,(b=i,i=i+8|0,c[b>>2]=a[f+4330|0]|0,b)|0);i=b;i=e;return}function xe(a){a=a|0;var b=0;b=a;c[b+216>>2]=0;c[b+220>>2]=0;c[b+224>>2]=0;c[b+228>>2]=0;c[b+232>>2]=0;i=i;return}function ye(a){a=a|0;var b=0,d=0;b=i;d=a;if((c[d+216>>2]|0)!=0){Ph(c[d+216>>2]|0)}if((c[d+220>>2]|0)!=0){Ph(c[d+220>>2]|0)}if((c[d+224>>2]|0)!=0){Ph(c[d+224>>2]|0)}if((c[d+228>>2]|0)!=0){Ph(c[d+228>>2]|0)}if((c[d+232>>2]|0)==0){i=b;return}Ph(c[d+232>>2]|0);i=b;return}function ze(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;g=b;b=d;d=e;if((a[g+34|0]|0)==0){if((b|0)==0){h=(d|0)==0}else{h=0}j=h;k=j;i=f;return k|0}h=0;while(1){if((h|0)>=(c[g+36>>2]|0)){l=17;break}if((c[g+128+(h<<2)>>2]|0)==(b|0)){break}h=h+1|0}if((l|0)==17){j=0;k=j;i=f;return k|0}h=0;while(1){if((h|0)>=(c[g+40>>2]|0)){l=14;break}if((c[g+172+(h<<2)>>2]|0)==(d|0)){l=11;break}h=h+1|0}if((l|0)==11){j=1;k=j;i=f;return k|0}else if((l|0)==14){j=0;k=j;i=f;return k|0}return 0}function Ae(a){a=a|0;var b=0,d=0,e=0;b=i;d=a;do{if((d|0)<30){e=d}else{if((d|0)>=43){e=d-6|0;break}else{e=c[216+(d-30<<2)>>2]|0;break}}}while(0);i=b;return e|0}function Be(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0;j=i;k=b;b=d;d=g;g=h;do{if((e|0)==168){if((f|0)!=128){break}}}while(0);f=c[k+2243440>>2]|0;e=c[k+2243436>>2]|0;h=c[b+14632>>2]|0;l=d-(d&(1<<c[f+236>>2])-1)|0;m=g-(g&(1<<c[f+236>>2])-1)|0;if((l|0)!=(c[b+14424>>2]|0)){n=6}else{if((m|0)!=(c[b+14428>>2]|0)){n=6}}if((n|0)==6){c[b+14432>>2]=c[b+14420>>2];c[b+14424>>2]=l;c[b+14428>>2]=m}o=0;p=(l|0)==0|0;q=c[(c[b+14632>>2]|0)+1052>>2]|0;r=ba((q|0)%(c[e+4928>>2]|0)|0,c[e+4920>>2]|0)|0;s=ba((q|0)/(c[e+4928>>2]|0)|0,c[e+4920>>2]|0)|0;if((r|0)==(l|0)){t=(s|0)==(m|0)}else{t=0}s=t&1;if((a[f+34|0]|0)!=0){do{if((l&(1<<c[e+4912>>2])-1|0)==0){if((m&(1<<c[e+4912>>2])-1|0)!=0){break}o=(ze(f,l>>c[e+4912>>2],m>>c[e+4912>>2])|0)&1}}while(0)}do{if(s&1){n=18}else{if(o&1){n=18;break}if(p&1){if((a[f+33|0]|0)!=0){n=18;break}}u=c[b+14432>>2]|0}}while(0);if((n|0)==18){u=c[(c[b+14632>>2]|0)+1056>>2]|0}if(md(c[k+2287824>>2]|0,l,m,l-1|0,m)|0){n=(l-1>>c[e+4972>>2])+(ba(m>>c[e+4972>>2],c[e+4960>>2]|0)|0)|0;if((c[(c[f+232>>2]|0)+(n<<2)>>2]>>((c[e+4912>>2]|0)-(c[e+4972>>2]|0)<<1)|0)==(c[b+8>>2]|0)){v=Pd(c[k+2287824>>2]|0,e,l-1|0,m)|0}else{v=u}}else{v=u}if(md(c[k+2287824>>2]|0,l,m,l,m-1|0)|0){n=(l>>c[e+4972>>2])+(ba(m-1>>c[e+4972>>2],c[e+4960>>2]|0)|0)|0;if((c[(c[f+232>>2]|0)+(n<<2)>>2]>>((c[e+4912>>2]|0)-(c[e+4972>>2]|0)<<1)|0)==(c[b+8>>2]|0)){w=Pd(c[k+2287824>>2]|0,e,l,m-1|0)|0}else{w=u}}else{w=u}u=v+w+1>>1;w=((u+(c[b+14416>>2]|0)+52+(c[e+4872>>2]<<1)|0)%((c[e+4872>>2]|0)+52|0)|0)-(c[e+4872>>2]|0)|0;c[b+14436>>2]=w+(c[e+4872>>2]|0);if((w+(c[f+20>>2]|0)+(c[h+744>>2]|0)|0)<(-(c[e+4880>>2]|0)|0)){x=-(c[e+4880>>2]|0)|0}else{if((w+(c[f+20>>2]|0)+(c[h+744>>2]|0)|0)>57){y=57}else{y=w+(c[f+20>>2]|0)+(c[h+744>>2]|0)|0}x=y}y=x;if((w+(c[f+24>>2]|0)+(c[h+748>>2]|0)|0)<(-(c[e+4880>>2]|0)|0)){z=-(c[e+4880>>2]|0)|0;A=z;B=y;C=Ae(B)|0;D=C;E=A;F=Ae(E)|0;G=F;H=D;I=e;J=I+4880|0;K=c[J>>2]|0;L=H+K|0;M=b;N=M+14440|0;c[N>>2]=L;O=G;P=e;Q=P+4880|0;R=c[Q>>2]|0;S=O+R|0;T=b;U=T+14444|0;c[U>>2]=S;V=k;W=V+2287824|0;X=c[W>>2]|0;Y=e;Z=d;_=g;$=Hd(X,Y,Z,_)|0;aa=$;ca=k;da=ca+2287824|0;ea=c[da>>2]|0;fa=e;ga=f;ha=d;ia=g;ja=aa;ka=w;Od(ea,fa,ga,ha,ia,ja,ka);la=w;ma=b;na=ma+14420|0;c[na>>2]=la;i=j;return}if((w+(c[f+24>>2]|0)+(c[h+748>>2]|0)|0)>57){oa=57}else{oa=w+(c[f+24>>2]|0)+(c[h+748>>2]|0)|0}z=oa;A=z;B=y;C=Ae(B)|0;D=C;E=A;F=Ae(E)|0;G=F;H=D;I=e;J=I+4880|0;K=c[J>>2]|0;L=H+K|0;M=b;N=M+14440|0;c[N>>2]=L;O=G;P=e;Q=P+4880|0;R=c[Q>>2]|0;S=O+R|0;T=b;U=T+14444|0;c[U>>2]=S;V=k;W=V+2287824|0;X=c[W>>2]|0;Y=e;Z=d;_=g;$=Hd(X,Y,Z,_)|0;aa=$;ca=k;da=ca+2287824|0;ea=c[da>>2]|0;fa=e;ga=f;ha=d;ia=g;ja=aa;ka=w;Od(ea,fa,ga,ha,ia,ja,ka);la=w;ma=b;na=ma+14420|0;c[na>>2]=la;i=j;return}function Ce(a,b,d,e,f,g,h,j,k){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;h=i;e=a;a=d;d=f;f=j;j=k;if((g|0)==1){$a[c[e+132>>2]&15](f,a,j);c[8096]=(c[8096]|0)+1;i=h;return}if((d|0)==4){$a[c[e+136>>2]&15](f,a,j);c[8100]=(c[8100]|0)+1}else{if((d|0)==8){$a[c[e+140>>2]&15](f,a,j);c[8098]=(c[8098]|0)+1}else{if((d|0)==16){$a[c[e+144>>2]&15](f,a,j);c[8104]=(c[8104]|0)+1}else{$a[c[e+148>>2]&15](f,a,j);c[8102]=(c[8102]|0)+1}}}i=h;return}function De(e,f,g,h,j,k,l,m,n,o){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;k=i;i=i+24|0;j=k|0;p=k+8|0;q=k+16|0;r=e;e=f;f=g;g=h;h=l;l=m;m=n&1;n=o&1;o=c[r+2243436>>2]|0;s=c[r+2243440>>2]|0;t=c[e+14632>>2]|0;u=l;if((u|0)==0){v=c[e+14436>>2]|0}else if((u|0)==1){v=c[e+14440>>2]|0}else if((u|0)==2){v=c[e+14444>>2]|0}else{v=0;sa(13616,13320,262,14440)}u=c[e+2112>>2]|0;w=h;td(c[r+2287824>>2]|0,l,j,p);x=f+(ba(g,c[p>>2]|0)|0)|0;c[j>>2]=(c[j>>2]|0)+x;if((a[e+40|0]|0)!=0){x=0;while(1){if((x|0)>=(b[e+14404+(l<<1)>>1]|0)){break}b[(c[e+2112>>2]|0)+(b[e+8260+(l<<11)+(x<<1)>>1]<<1)>>1]=b[e+2116+(l<<11)+(x<<1)>>1]|0;x=x+1|0}eb[c[r+128>>2]&3](c[j>>2]|0,u,h,c[p>>2]|0)}else{if((l|0)==0){y=c[o+4868>>2]|0}else{y=c[o+4876>>2]|0}x=y+(og(h)|0)-5|0;if((a[o+604|0]|0)==0){x=x-4|0;y=1<<x-1;z=c[1664+(((v|0)%6|0)<<2)>>2]<<((v|0)/6|0);A=0;while(1){if((A|0)>=(b[e+14404+(l<<1)>>1]|0)){break}B=b[e+2116+(l<<11)+(A<<1)>>1]|0;if(((ba(B,z)|0)+y>>x|0)<-32768){C=-32768}else{if(((ba(B,z)|0)+y>>x|0)>32767){D=32767}else{D=(ba(B,z)|0)+y>>x}C=D}B=C;b[(c[e+2112>>2]|0)+(b[e+8260+(l<<11)+(A<<1)>>1]<<1)>>1]=B;A=A+1|0}}else{A=1<<x-1;C=l;if(!(n&1)){if((h|0)<32){C=C+3|0}else{C=C+1|0}}n=h;if((n|0)==4){E=s+257+(C<<4)|0}else if((n|0)==8){E=s+353+(C<<6)|0}else if((n|0)==16){E=s+737+(C<<8)|0}else if((n|0)==32){E=s+2273+(C<<10)|0}else{sa(13616,13320,356,14440)}C=0;while(1){if((C|0)>=(b[e+14404+(l<<1)>>1]|0)){break}s=b[e+8260+(l<<11)+(C<<1)>>1]|0;n=d[E+(((s|0)%(h|0)|0)+(ba((s|0)/(h|0)|0,h)|0))|0]|0;s=(ba(n,c[1664+(((v|0)%6|0)<<2)>>2]|0)|0)<<((v|0)/6|0);n=b[e+2116+(l<<11)+(C<<1)>>1]|0;c[q>>2]=n<<16>>16;c[q+4>>2]=n<<16>>16<0|0?-1:0;n=s;D=ii(c[q>>2]|0,c[q+4>>2]|0,n,(n|0)<0|0?-1:0)|0;n=A;y=_h(D,F,n,(n|0)<0|0?-1:0)|0;n=ci(y|0,F|0,x|0)|0;y=F;D=-1;if((y|0)<(D|0)|(y|0)==(D|0)&n>>>0<-32768>>>0){G=-1;H=-32768}else{n=s;D=ii(c[q>>2]|0,c[q+4>>2]|0,n,(n|0)<0|0?-1:0)|0;n=A;y=_h(D,F,n,(n|0)<0|0?-1:0)|0;n=ci(y|0,F|0,x|0)|0;y=F;D=0;if((y|0)>(D|0)|(y|0)==(D|0)&n>>>0>32767>>>0){I=0;J=32767}else{n=s;s=ii(c[q>>2]|0,c[q+4>>2]|0,n,(n|0)<0|0?-1:0)|0;n=A;D=_h(s,F,n,(n|0)<0|0?-1:0)|0;n=ci(D|0,F|0,x|0)|0;I=F;J=n}G=I;H=J}c[q>>2]=H;c[q+4>>2]=G;b[(c[e+2112>>2]|0)+(b[e+8260+(l<<11)+(C<<1)>>1]<<1)>>1]=c[q>>2];C=C+1|0}}C=0;while(1){if((C|0)>=(h|0)){break}q=0;while(1){if((q|0)>=(h|0)){break}q=q+1|0}C=C+1|0}if((l|0)==0){K=20-(c[o+4868>>2]|0)|0}else{K=20-(c[o+4876>>2]|0)|0}o=K;if(m&1){$a[c[r+124>>2]&15](c[j>>2]|0,u,c[p>>2]|0);c[8092]=(c[8092]|0)+1}else{do{if((h|0)==4){if((l|0)!=0){L=66;break}if((Cd(c[r+2287824>>2]|0,c[r+2243436>>2]|0,f,g)|0)!=0){L=66;break}M=1}else{L=66}}while(0);if((L|0)==66){M=0}Ce(r,t,u,w,h,M,o,c[j>>2]|0,c[p>>2]|0)}}p=0;while(1){if((p|0)>=(h|0)){break}j=0;while(1){if((j|0)>=(h|0)){break}j=j+1|0}p=p+1|0}p=0;while(1){if((p|0)>=(b[e+14404+(l<<1)>>1]|0)){break}b[(c[e+2112>>2]|0)+(b[e+8260+(l<<11)+(p<<1)>>1]<<1)>>1]=0;p=p+1|0}i=k;return}function Ee(e,f,g,h,j,k,l){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;m=i;n=e;e=f;f=g;g=h;h=j;j=k;if((h|0)!=0){o=(Cb(f,1)|0)&255}else{o=0}if(o<<24>>24!=0){if(l&1){l=Gb(f)|0;p=l;q=l;q=q+1|0}else{q=1}l=h-q|0;if((l|0)>=0){}else{sa(9816,13664,98,14520);return 0}q=Cb(f,1)|0;h=Gb(f)|0;p=h;p=h;p=p+1|0;if((q|0)!=0){r=-p|0}else{r=p}p=r;r=d[j+(l*100|0)+2|0]|0;q=i;i=i+(r+1)|0;i=i+7&-8;h=q;q=i;i=i+(r+1)|0;i=i+7&-8;o=q;q=0;while(1){if((q|0)>(r|0)){break}a[h+q|0]=Cb(f,1)|0;if((a[h+q|0]|0)!=0){a[o+q|0]=1}else{a[o+q|0]=Cb(f,1)|0}q=q+1|0}q=0;while(1){if((q|0)>(r|0)){break}q=q+1|0}q=d[j+(l*100|0)|0]|0;k=d[j+(l*100|0)+1|0]|0;s=0;t=k-1|0;while(1){if((t|0)<0){break}u=(b[j+(l*100|0)+36+(t<<1)>>1]|0)+p|0;do{if((u|0)<0){if((a[o+(q+t)|0]|0)==0){break}b[g+4+(s<<1)>>1]=u;a[g+68+s|0]=a[h+(q+t)|0]|0;s=s+1|0}}while(0);t=t-1|0}do{if((p|0)<0){if((a[o+r|0]|0)==0){break}b[g+4+(s<<1)>>1]=p;a[g+68+s|0]=a[h+r|0]|0;s=s+1|0}}while(0);t=0;while(1){if((t|0)>=(q|0)){break}u=(b[j+(l*100|0)+4+(t<<1)>>1]|0)+p|0;do{if((u|0)<0){if((a[o+t|0]|0)==0){break}b[g+4+(s<<1)>>1]=u;a[g+68+s|0]=a[h+t|0]|0;s=s+1|0}}while(0);t=t+1|0}a[g|0]=s;s=0;t=q-1|0;while(1){if((t|0)<0){break}u=(b[j+(l*100|0)+4+(t<<1)>>1]|0)+p|0;do{if((u|0)>0){if((a[o+t|0]|0)==0){break}b[g+36+(s<<1)>>1]=u;a[g+84+s|0]=a[h+t|0]|0;s=s+1|0}}while(0);t=t-1|0}do{if((p|0)>0){if((a[o+r|0]|0)==0){break}b[g+36+(s<<1)>>1]=p;a[g+84+s|0]=a[h+r|0]|0;s=s+1|0}}while(0);r=0;while(1){if((r|0)>=(k|0)){break}t=(b[j+(l*100|0)+36+(r<<1)>>1]|0)+p|0;do{if((t|0)>0){if((a[o+(q+r)|0]|0)==0){break}b[g+36+(s<<1)>>1]=t;a[g+84+s|0]=a[h+(q+r)|0]|0;s=s+1|0}}while(0);r=r+1|0}a[g+1|0]=s;a[g+2|0]=(d[g|0]|0)+(d[g+1|0]|0)}else{s=Gb(f)|0;r=Gb(f)|0;if((s+r|0)>(c[e+496+((a[e+2|0]|0)-1<<2)>>2]|0)){ed(n,1018,0);v=0;w=v;i=m;return w|0}a[g|0]=s;a[g+1|0]=r;a[g+2|0]=r+s;n=0;e=0;while(1){if((e|0)>=(s|0)){break}q=(Gb(f)|0)+1|0;h=(Cb(f,1)|0)&255;b[g+4+(e<<1)>>1]=n-q;a[g+68+e|0]=h;n=b[g+4+(e<<1)>>1]|0;e=e+1|0}n=0;e=0;while(1){if((e|0)>=(r|0)){break}s=(Gb(f)|0)+1|0;h=(Cb(f,1)|0)&255;b[g+36+(e<<1)>>1]=n+s;a[g+84+e|0]=h;n=b[g+36+(e<<1)>>1]|0;e=e+1|0}}Fe(g);v=1;w=v;i=m;return w|0}function Fe(b){b=b|0;var c=0,e=0,f=0;c=i;e=b;a[e+3|0]=0;b=0;while(1){if((b|0)>=(d[e|0]|0)){break}if((a[e+68+b|0]|0)!=0){f=e+3|0;a[f]=(a[f]|0)+1}b=b+1|0}b=0;while(1){if((b|0)>=(d[e+1|0]|0)){break}if((a[e+84+b|0]|0)!=0){f=e+3|0;a[f]=(a[f]|0)+1}b=b+1|0}i=c;return}function Ge(e,f,g){e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0;h=i;j=e;e=f;f=g;g=i;i=i+(e+1+e+1)|0;i=i+7&-8;k=g;a[k+((e<<1)+1)|0]=0;g=0;while(1){if((g|0)>=((e<<1)+1|0)){break}a[k+g|0]=46;g=g+1|0}a[k+e|0]=124;g=(d[j|0]|0)-1|0;while(1){if((g|0)<0){break}l=b[j+4+(g<<1)>>1]|0;if((l|0)>=(-e|0)){if((a[j+68+g|0]|0)!=0){a[k+(l+e)|0]=88}else{a[k+(l+e)|0]=111}}else{m=(d[j+68+g|0]|0)!=0?88:111;rg(f,4016,(n=i,i=i+16|0,c[n>>2]=l,c[n+8>>2]=m,n)|0);i=n}g=g-1|0}g=(d[j+1|0]|0)-1|0;while(1){if((g|0)<0){break}m=b[j+36+(g<<1)>>1]|0;if((m|0)<=(e|0)){if((a[j+84+g|0]|0)!=0){a[k+(m+e)|0]=88}else{a[k+(m+e)|0]=111}}else{l=(d[j+84+g|0]|0)!=0?88:111;rg(f,4016,(n=i,i=i+16|0,c[n>>2]=m,c[n+8>>2]=l,n)|0);i=n}g=g-1|0}rg(f,3752,(n=i,i=i+8|0,c[n>>2]=k,n)|0);i=n;i=h;return}function He(b,e,f,g,h,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0;g=i;i=i+160|0;m=g|0;n=g+8|0;o=g+16|0;p=g+24|0;q=g+32|0;r=b;b=e;e=f;f=h;h=j;j=k;k=l;l=c[r+2243436>>2]|0;s=c[r+2243440>>2]|0;if((f|0)==0){t=c[l+4868>>2]|0}else{t=c[l+4876>>2]|0}u=t;t=(1<<u)-1|0;v=ba(b,h)|0;w=ba(e,h)|0;x=be(c[r+2287824>>2]|0,c[r+2243436>>2]|0,b,e)|0;e=d[x|0]>>(f<<1)&3;if((e|0)==0){i=g;return}b=c[(c[r+2243436>>2]|0)+452>>2]|0;y=c[(c[r+2243436>>2]|0)+456>>2]|0;if((f|0)>0){b=(b+1|0)/2|0;y=(y+1|0)/2|0}z=c[(hd(r,v,w)|0)+1052>>2]|0;A=c[(c[r+2243440>>2]|0)+232>>2]|0;B=c[(c[r+2243436>>2]|0)+4960>>2]|0;C=c[(c[r+2243436>>2]|0)+4972>>2]|0;D=C;if((f|0)>0){D=D-1|0}D=c[(c[r+2243436>>2]|0)+4928>>2]|0;E=c[(c[r+2243436>>2]|0)+4912>>2]|0;F=0;if((f|0)>0){E=E-1|0;F=1}td(c[r+2287824>>2]|0,f,m,n);G=0;while(1){if((G|0)>=5){break}G=G+1|0}if((e|0)!=2){e=u-5|0;u=d[x+2+f|0]|0;Yh(q|0,0,128)|0;G=0;while(1){if((G|0)>=4){break}c[q+((G+u&31)<<2)>>2]=G+1;G=G+1|0}G=0;while(1){if((G|0)>=(h|0)){break}u=0;while(1){if((u|0)>=(h|0)){break}if((v+u|0)>=(b|0)){H=89;break}if((w+G|0)>=(y|0)){H=89;break}if((a[l+4684|0]|0)!=0){if((Gd(c[r+2287824>>2]|0,l,v+u<<F,w+G<<F)|0)!=0){H=93}else{H=92}}else{H=92}do{if((H|0)==92){H=0;if((Ed(c[r+2287824>>2]|0,l,v+u<<F,w+G<<F)|0)!=0){H=93;break}I=c[q+(d[j+(v+u+(ba(w+G|0,k)|0))|0]>>e<<2)>>2]|0;if((I|0)>0){J=a[x+5+(f<<2)+(I-1)|0]|0;if(((d[j+(v+u+(ba(w+G|0,k)|0))|0]|0)+J|0)<0){K=0}else{if(((d[j+(v+u+(ba(w+G|0,k)|0))|0]|0)+J|0)>(t|0)){L=t}else{L=(d[j+(v+u+(ba(w+G|0,k)|0))|0]|0)+J|0}K=L}J=v+u+(ba(w+G|0,c[n>>2]|0)|0)|0;a[(c[m>>2]|0)+J|0]=K}}}while(0);if((H|0)==93){H=0}u=u+1|0}if((H|0)==89){H=0}G=G+1|0}i=g;return}G=d[x+1|0]>>(f<<1)&3;if((G|0)==0){c[o>>2]=-1;c[o+4>>2]=1;c[p>>2]=0;c[p+4>>2]=0}else if((G|0)==1){c[o>>2]=0;c[o+4>>2]=0;c[p>>2]=-1;c[p+4>>2]=1}else if((G|0)==2){c[o>>2]=-1;c[o+4>>2]=1;c[p>>2]=-1;c[p+4>>2]=1}else if((G|0)==3){c[o>>2]=1;c[o+4>>2]=-1;c[p>>2]=-1;c[p+4>>2]=1}G=0;while(1){if((G|0)>=(h|0)){break}K=0;while(1){if((K|0)>=(h|0)){break}L=-1;a:do{if((v+K|0)>=(b|0)){H=28}else{if((w+G|0)>=(y|0)){H=28;break}if((a[l+4684|0]|0)!=0){if((Gd(c[r+2287824>>2]|0,l,v+K<<F,w+G<<F)|0)==0){H=31}}else{H=31}do{if((H|0)==31){H=0;if((Ed(c[r+2287824>>2]|0,l,v+K<<F,w+G<<F)|0)!=0){break}e=0;b:while(1){if((e|0)>=2){break}q=v+K+(c[o+(e<<2)>>2]|0)|0;u=w+G+(c[p+(e<<2)>>2]|0)|0;if((q|0)<0){H=39;break}if((u|0)<0){H=39;break}if((q|0)>=(b|0)){H=39;break}if((u|0)>=(y|0)){H=39;break}J=c[(hd(r,q<<F,u<<F)|0)+1052>>2]|0;do{if((J|0)!=(z|0)){I=c[A+((q>>C)+(ba(u>>C,B)|0)<<2)>>2]|0;if((I|0)>=(c[A+((v+K>>C)+(ba(w+G>>C,B)|0)<<2)>>2]|0)){break}if((a[(hd(r,v+K<<F,w+G<<F)|0)+764|0]|0)==0){H=43;break b}}}while(0);do{if((J|0)!=(z|0)){I=c[A+((v+K>>C)+(ba(w+G>>C,B)|0)<<2)>>2]|0;if((I|0)>=(c[A+((q>>C)+(ba(u>>C,B)|0)<<2)>>2]|0)){break}if((a[(hd(r,q<<F,u<<F)|0)+764|0]|0)==0){H=47;break b}}}while(0);do{if((a[s+240|0]|0)==0){J=(q>>E)+(ba(u>>E,D)|0)|0;I=(v>>E)+(ba(w>>E,D)|0)|0;if((c[(c[s+228>>2]|0)+(J<<2)>>2]|0)==(c[(c[s+228>>2]|0)+(I<<2)>>2]|0)){break}L=0}}while(0);e=e+1|0}if((H|0)==39){H=0;L=0}else if((H|0)==43){H=0;L=0}else if((H|0)==47){H=0;L=0}if((L|0)!=0){e=d[j+(v+K+(ba(w+G|0,k)|0))|0]|0;if((e-(d[j+(v+K+(c[o>>2]|0)+(ba(w+G+(c[p>>2]|0)|0,k)|0))|0]|0)|0)>0){M=1}else{e=d[j+(v+K+(ba(w+G|0,k)|0))|0]|0;u=(e-(d[j+(v+K+(c[o>>2]|0)+(ba(w+G+(c[p>>2]|0)|0,k)|0))|0]|0)|0)<0;M=u?-1:0}u=d[j+(v+K+(ba(w+G|0,k)|0))|0]|0;if((u-(d[j+(v+K+(c[o+4>>2]|0)+(ba(w+G+(c[p+4>>2]|0)|0,k)|0))|0]|0)|0)>0){N=1}else{u=d[j+(v+K+(ba(w+G|0,k)|0))|0]|0;e=(u-(d[j+(v+K+(c[o+4>>2]|0)+(ba(w+G+(c[p+4>>2]|0)|0,k)|0))|0]|0)|0)<0;N=e?-1:0}L=M+2+N|0;if((L|0)<=2){if((L|0)==2){O=0}else{O=L+1|0}L=O}}if((L|0)!=0){e=a[x+5+(f<<2)+(L-1)|0]|0;if(((d[j+(v+K+(ba(w+G|0,k)|0))|0]|0)+e|0)<0){P=0}else{if(((d[j+(v+K+(ba(w+G|0,k)|0))|0]|0)+e|0)>(t|0)){Q=t}else{Q=(d[j+(v+K+(ba(w+G|0,k)|0))|0]|0)+e|0}P=Q}e=v+K+(ba(w+G|0,c[n>>2]|0)|0)|0;a[(c[m>>2]|0)+e|0]=P}break a}}while(0)}}while(0);if((H|0)==28){H=0}K=K+1|0}G=G+1|0}i=g;return}function Ie(b){b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+272|0;e=d|0;f=b;if((a[(c[f+2243436>>2]|0)+4671|0]|0)==0){i=d;return}pd(e);qd(e,c[(c[f+2287824>>2]|0)+28>>2]|0,c[(c[f+2287824>>2]|0)+32>>2]|0,1,0)|0;sd(e,c[f+2287824>>2]|0);b=0;while(1){if((b|0)>=(c[(c[f+2243436>>2]|0)+4936>>2]|0)){break}g=0;while(1){if((g|0)>=(c[(c[f+2243436>>2]|0)+4928>>2]|0)){break}h=id(f,g,b)|0;if((a[h+325|0]|0)!=0){He(f,g,b,h,0,1<<c[(c[f+2243436>>2]|0)+4912>>2],c[e>>2]|0,c[e+44>>2]|0)}if((a[h+326|0]|0)!=0){He(f,g,b,h,1,1<<(c[(c[f+2243436>>2]|0)+4912>>2]|0)-1,c[e+4>>2]|0,c[e+48>>2]|0);He(f,g,b,h,2,1<<(c[(c[f+2243436>>2]|0)+4912>>2]|0)-1,c[e+8>>2]|0,c[e+48>>2]|0)}g=g+1|0}b=b+1|0}rd(e);i=d;return}function Je(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;e=a;a=b;if((a|0)==0){f=c[408+(e<<2)>>2]|0}else if((a|0)==1){f=c[376+(e<<2)>>2]|0}else if((a|0)==2){f=c[344+(e<<2)>>2]|0}else{f=0}i=d;return f|0}function Ke(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;h=g;g=(ba(e,1<<h)|0)+d|0;d=b;b=(c[272+(f*24|0)+(h<<2)>>2]|0)+(g<<1)|0;a[d]=a[b]|0;a[d+1|0]=a[b+1|0]|0;i=i;return}function Le(){var a=0,b=0,d=0,e=0,f=0,g=0;a=i;b=1;while(1){if((b|0)>5){break}Me(c[376+(b<<2)>>2]|0,1<<b);Ne(c[344+(b<<2)>>2]|0,1<<b);Oe(c[408+(b<<2)>>2]|0,1<<b);b=b+1|0}b=2;while(1){if((b|0)>5){break}d=0;while(1){if((d|0)>=3){break}e=0;while(1){if((e|0)>=(1<<b|0)){break}f=0;while(1){if((f|0)>=(1<<b|0)){break}g=(ba(e,1<<b)|0)+f|0;Pe((c[272+(d*24|0)+(b<<2)>>2]|0)+(g<<1)|0,f,e,d,b);f=f+1|0}e=e+1|0}d=d+1|0}b=b+1|0}i=a;return}function Me(b,c){b=b|0;c=c|0;var d=0,e=0,f=0,g=0;d=i;e=b;b=c;c=0;f=0;while(1){if((f|0)>=(b|0)){break}g=0;while(1){if((g|0)>=(b|0)){break}a[e+(c<<1)|0]=g;a[e+(c<<1)+1|0]=f;c=c+1|0;g=g+1|0}f=f+1|0}i=d;return}function Ne(b,c){b=b|0;c=c|0;var d=0,e=0,f=0,g=0;d=i;e=b;b=c;c=0;f=0;while(1){if((f|0)>=(b|0)){break}g=0;while(1){if((g|0)>=(b|0)){break}a[e+(c<<1)|0]=f;a[e+(c<<1)+1|0]=g;c=c+1|0;g=g+1|0}f=f+1|0}i=d;return}function Oe(b,c){b=b|0;c=c|0;var d=0,e=0,f=0,g=0;d=i;e=b;b=c;c=0;f=0;g=0;do{while(1){if((g|0)<0){break}do{if((f|0)<(b|0)){if((g|0)>=(b|0)){break}a[e+(c<<1)|0]=f;a[e+(c<<1)+1|0]=g;c=c+1|0}}while(0);g=g-1|0;f=f+1|0}g=f;f=0;}while((c|0)<(ba(b,b)|0));i=d;return}function Pe(b,c,e,f,g){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0;h=i;i=i+8|0;j=h|0;k=b;b=c;c=e;e=f;f=g;g=16;l=(ba(1<<f-2,1<<f-2)|0)-1|0;m=Je(f-2|0,e)|0;f=Je(2,e)|0;do{if((g|0)==0){g=16;l=l-1|0}g=g-1|0;e=j;n=m+(l<<1)|0;a[e]=a[n]|0;a[e+1|0]=a[n+1|0]|0;if((((d[j|0]|0)<<2)+(d[f+(g<<1)|0]|0)|0)!=(b|0)){o=1}else{o=(((d[j+1|0]|0)<<2)+(d[f+(g<<1)+1|0]|0)|0)!=(c|0)}}while(o);a[k|0]=l;a[k+1|0]=g;i=h;return}function Qe(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;d=i;f=a;a=b;b=e;e=0;do{g=Cb(f,8)|0;e=e+g|0;}while((g|0)==255);g=0;do{h=Cb(f,8)|0;g=g+h|0;}while((h|0)==255);c[a>>2]=e;c[a+4>>2]=g;g=0;if((c[a>>2]|0)==132){g=(Re(f,a,b)|0)&1;j=g;k=j&1;i=d;return k|0}else{j=g;k=j&1;i=d;return k|0}return 0}function Re(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;h=d;d=f;if((c[d+2243436>>2]|0)==0){j=0;k=j;i=g;return k|0}f=e+8|0;c[f>>2]=Cb(h,8)|0;e=(c[(c[d+2243436>>2]|0)+444>>2]|0)==0?1:3;d=0;while(1){if((d|0)>=(e|0)){break}l=c[f>>2]|0;if((l|0)==2){c[f+60+(d<<2)>>2]=Cb(h,32)|0}else if((l|0)==0){m=0;while(1){if((m|0)>=16){break}a[f+4+(d<<4)+m|0]=Cb(h,8)|0;m=m+1|0}}else if((l|0)==1){b[f+52+(d<<1)>>1]=Cb(h,16)|0}d=d+1|0}j=1;k=j;i=g;return k|0}function Se(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=a;if((c[e>>2]|0)==132){Te(e,b);i=d;return}else{i=d;return}}function Te(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;e=b;b=a+8|0;a=c[b>>2]|0;a=(c[(c[e+2243436>>2]|0)+444>>2]|0)==0?1:3;e=0;while(1){if((e|0)>=(a|0)){break}f=c[b>>2]|0;if((f|0)==0){f=1;while(1){if((f|0)>=16){break}f=f+1|0}}e=e+1|0}i=d;return}function Ue(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=i;f=b;b=d;d=0;if((c[f>>2]|0)!=132){g=d;i=e;return g|0}if(a[b|0]&1){d=Ve(f,b)|0}g=d;i=e;return g|0}function Ve(b,f){b=b|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;g=i;i=i+16|0;h=g|0;j=b;b=f;do{if((c[b+2243436>>2]|0)!=0){if((c[b+2287800>>2]|0)==0){break}f=j+8|0;k=c[b+2287800>>2]|0;if((k|0)!=0){}else{sa(10560,10376,198,14848);return 0}if((a[k+92|0]&1|0)==0){l=0;m=l;i=g;return m|0}n=(c[(c[b+2243436>>2]|0)+444>>2]|0)==0?1:3;p=0;a:while(1){if((p|0)>=(n|0)){q=35;break}r=p;if((r|0)==0){s=c[k+28>>2]|0;t=c[k+32>>2]|0;u=c[k+44>>2]|0}else if((r|0)==1|(r|0)==2){s=c[k+36>>2]|0;t=c[k+40>>2]|0;u=c[k+48>>2]|0}if((p|0)==0){v=c[k>>2]|0}else{if((p|0)==1){v=c[k+4>>2]|0}else{v=c[k+8>>2]|0}}r=c[f>>2]|0;if((r|0)==1){w=(Xe(v,s,t,u)|0)&65535;if((w&65535|0)!=(e[f+52+(p<<1)>>1]|0|0)){q=28;break}}else if((r|0)==2){x=Ye(v,s,t,u)|0;if((x|0)!=(c[f+60+(p<<2)>>2]|0)){q=31;break}}else if((r|0)==0){We(v,s,t,u,h|0);r=0;while(1){if((r|0)>=16){break}if((d[h+r|0]|0|0)!=(d[f+4+(p<<4)+r|0]|0|0)){q=23;break a}r=r+1|0}}p=p+1|0}if((q|0)==23){wa(c[o>>2]|0,10168,(y=i,i=i+8|0,c[y>>2]=c[k+88>>2],y)|0)|0;i=y;l=5;m=l;i=g;return m|0}else if((q|0)==28){n=c[k+88>>2]|0;wa(c[o>>2]|0,9976,(y=i,i=i+24|0,c[y>>2]=e[f+52+(p<<1)>>1]|0,c[y+8>>2]=w&65535,c[y+16>>2]=n,y)|0)|0;i=y;l=5;m=l;i=g;return m|0}else if((q|0)==31){n=c[k+88>>2]|0;wa(c[o>>2]|0,9976,(y=i,i=i+24|0,c[y>>2]=c[f+60+(p<<2)>>2],c[y+8>>2]=x,c[y+16>>2]=n,y)|0)|0;i=y;l=5;m=l;i=g;return m|0}else if((q|0)==35){l=0;m=l;i=g;return m|0}}}while(0);ed(b,14,0);l=0;m=l;i=g;return m|0}function We(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;i=i+152|0;g=f|0;h=a;a=b;b=c;c=d;d=e;ke(g);e=0;while(1){if((e|0)>=(b|0)){break}le(g,h+(ba(e,c)|0)|0,a);e=e+1|0}ne(d,g);i=f;return}function Xe(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;g=b;b=c;c=d;d=e;e=-1;e=Ze(e,0)|0;e=Ze(e,0)|0;h=0;while(1){if((h|0)>=(c|0)){break}j=g+(ba(h,d)|0)|0;k=0;while(1){if((k|0)>=(b|0)){break}l=j;j=l+1|0;e=Ze(e,a[l]|0)|0;k=k+1|0}h=h+1|0}i=f;return e&65535|0}function Ye(a,b,c,e){a=a|0;b=b|0;c=c|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;g=a;a=b;b=c;c=e;e=0;h=0;while(1){if((h|0)>=(b|0)){break}j=0;while(1){if((j|0)>=(a|0)){break}e=e+((d[g+((ba(h,c)|0)+j)|0]|0)^(j&255^h&255^j>>8^h>>8)&255)|0;j=j+1|0}h=h+1|0}i=f;return e|0}function Ze(a,b){a=a|0;b=b|0;var c=0;c=a;a=(b&255^(c&65535)>>8)&65535;b=(a&65535^(a&65535)>>4)&65535;i=i;return((c&65535)<<8^b&65535^(b&65535)<<5^(b&65535)<<12)&65535|0}function _e(e,f,g){e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;h=i;j=e;e=f;f=g;g=f+1187944+((c[e+8>>2]|0)*4332|0)|0;if((g|0)!=0){}else{sa(8672,13472,71,14576);return 0}k=f+1107496+((a[g+2|0]|0)*5028|0)|0;if((k|0)!=0){}else{sa(11096,13472,73,14576);return 0}g=Gb(j)|0;f=g;a[e+380|0]=g;do{if((f|0)>=0){if((f|0)>7){break}a:do{if((c[k+444>>2]|0)!=0){f=Hb(j)|0;f=f+(d[e+380|0]|0)|0;do{if((f|0)>=0){if((f|0)>7){break}a[e+381|0]=f;break a}}while(0);l=0;m=l;i=h;return m|0}}while(0);g=0;n=0;b:while(1){if((n|0)>1){o=74;break}do{if((n|0)==0){o=18}else{if((n|0)!=1){break}if((c[e+20>>2]|0)==0){o=18}}}while(0);if((o|0)==18){o=0;if((n|0)==0){p=(c[e+328>>2]|0)-1|0}else{p=(c[e+332>>2]|0)-1|0}q=p;r=0;while(1){if((r|0)>(q|0)){break}a[e+382+(n<<4)+r|0]=Cb(j,1)|0;if((a[e+382+(n<<4)+r|0]|0)!=0){g=g+1|0}r=r+1|0}if((c[k+444>>2]|0)!=0){r=0;while(1){if((r|0)>(q|0)){break}a[e+414+(n<<4)+r|0]=Cb(j,1)|0;if((a[e+414+(n<<4)+r|0]|0)!=0){g=g+2|0}r=r+1|0}}r=0;while(1){if((r|0)>(q|0)){break}if((a[e+382+(n<<4)+r|0]|0)!=0){f=Hb(j)|0;if((f|0)<-128){o=40;break b}if((f|0)>127){o=40;break b}b[e+446+(n<<5)+(r<<1)>>1]=(1<<d[e+380|0])+f;f=Hb(j)|0;if((f|0)<-128){o=43;break b}if((f|0)>127){o=43;break b}a[e+510+(n<<4)+r|0]=f}else{b[e+446+(n<<5)+(r<<1)>>1]=1<<d[e+380|0];a[e+510+(n<<4)+r|0]=0}if((a[e+414+(n<<4)+r|0]|0)!=0){s=0;while(1){if((s|0)>=2){break}f=Hb(j)|0;if((f|0)<-128){o=51;break b}if((f|0)>127){o=51;break b}b[e+542+(n<<6)+(r<<2)+(s<<1)>>1]=(1<<d[e+381|0])+f;f=Hb(j)|0;if((f|0)<-512){o=54;break b}if((f|0)>511){o=54;break b}if((f-(b[e+542+(n<<6)+(r<<2)+(s<<1)>>1]<<7>>d[e+381|0])+128|0)<-128){t=-128}else{if((f-(b[e+542+(n<<6)+(r<<2)+(s<<1)>>1]<<7>>d[e+381|0])+128|0)>127){u=127}else{u=f-(b[e+542+(n<<6)+(r<<2)+(s<<1)>>1]<<7>>d[e+381|0])+128|0}t=u}f=t;a[e+670+(n<<5)+(r<<1)+s|0]=f;s=s+1|0}}else{s=0;while(1){if((s|0)>=2){break}b[e+542+(n<<6)+(r<<2)+(s<<1)>>1]=1<<d[e+381|0];a[e+670+(n<<5)+(r<<1)+s|0]=0;s=s+1|0}}r=r+1|0}}n=n+1|0}if((o|0)==40){l=0;m=l;i=h;return m|0}else if((o|0)==43){l=0;m=l;i=h;return m|0}else if((o|0)==51){l=0;m=l;i=h;return m|0}else if((o|0)==54){l=0;m=l;i=h;return m|0}else if((o|0)==74){l=1;m=l;i=h;return m|0}}}while(0);l=0;m=l;i=h;return m|0}function $e(b,f,g,h){b=b|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;j=i;k=b;b=f;f=g;g=h;a[g]=0;a[b+12|0]=0;a[b+5|0]=Cb(k,1)|0;if((a[f+2288990|0]|0)!=0){a[b+6|0]=Cb(k,1)|0}c[b+8>>2]=Gb(k)|0;do{if((c[b+8>>2]|0)<=64){if((c[b+8>>2]|0)==-99999){break}h=f+1187944+((c[b+8>>2]|0)*4332|0)|0;if(!(a[h|0]&1)){ed(f,1009,0);l=0;m=l;i=j;return m|0}n=f+1107496+((a[h+2|0]|0)*5028|0)|0;if(!(a[n|0]&1)){ed(f,1010,0);a[g]=0;l=0;m=l;i=j;return m|0}if((a[b+5|0]|0)!=0){a[b+12|0]=0;c[b+16>>2]=0}else{if((a[h+3|0]|0)!=0){a[b+12|0]=Cb(k,1)|0}else{a[b+12|0]=0}o=Cb(k,ng(c[n+4944>>2]|0)|0)|0;do{if((a[b+12|0]|0)!=0){if((o|0)!=0){Wh(b|0,f+1465192+((e[(c[(c[f+2287824>>2]|0)+108>>2]|0)+((c[(c[h+220>>2]|0)+((c[(c[h+216>>2]|0)+(o<<2)>>2]|0)-1<<2)>>2]|0)*24|0)+2>>1]|0)*1520|0)|0,1520)|0;a[b+5|0]=0;a[b+12|0]=1;break}a[g]=0;ed(f,1021,0);l=0;m=l;i=j;return m|0}}while(0);c[b+16>>2]=o}do{if((c[b+16>>2]|0)>=0){if((c[b+16>>2]|0)>(c[n+4944>>2]|0)){break}a:do{if((a[b+12|0]|0)==0){p=0;while(1){if((p|0)>=(a[h+4328|0]|0)){break}Db(k,1);p=p+1|0}c[b+20>>2]=Gb(k)|0;do{if((c[b+20>>2]|0)<=2){if((c[b+20>>2]|0)==-99999){break}if((a[h+31|0]|0)!=0){a[b+24|0]=Cb(k,1)|0}else{a[b+24|0]=1}if((a[n+448|0]|0)==1){a[b+25|0]=Cb(k,1)|0}c[b+28>>2]=0;a[b+32|0]=0;do{if((d[f+2288988|0]|0)!=19){if((d[f+2288988|0]|0)==20){q=73;break}c[b+28>>2]=Cb(k,c[n+488>>2]|0)|0;a[b+32|0]=Cb(k,1)|0;do{if((a[b+32|0]|0)!=0){p=ng(c[n+4688>>2]|0)|0;if((p|0)>0){c[b+136>>2]=Cb(k,p)|0}else{c[b+136>>2]=0}if((c[b+136>>2]|0)<=(c[n+4688>>2]|0)){c[b+1068>>2]=c[b+136>>2];c[b+1072>>2]=(c[n+4692>>2]|0)+((c[b+1068>>2]|0)*100|0);break}ed(f,1015,0);l=8;m=l;i=j;return m|0}else{Ee(f,n,k,b+34|0,c[n+4688>>2]|0,c[n+4692>>2]|0,1)|0;c[b+1068>>2]=c[n+4688>>2];c[b+1072>>2]=b+34}}while(0);do{if((a[n+4696|0]|0)!=0){if((c[n+4700>>2]|0)>0){c[b+140>>2]=Gb(k)|0}else{c[b+140>>2]=0}c[b+144>>2]=Gb(k)|0;if(((c[b+140>>2]|0)+(c[b+144>>2]|0)+(d[c[b+1072>>2]|0]|0)+(d[(c[b+1072>>2]|0)+1|0]|0)|0)>(c[n+496+((a[n+2|0]|0)-1<<2)>>2]|0)){ed(f,1018,0);a[g]=0;l=0;m=l;i=j;return m|0}p=0;while(1){if((p|0)>=((c[b+140>>2]|0)+(c[b+144>>2]|0)|0)){q=68;break}if((p|0)<(c[b+140>>2]|0)){a[b+148+p|0]=Cb(k,ng(c[n+4700>>2]|0)|0)|0;if((d[b+148+p|0]|0)>=(c[n+4700>>2]|0)){break}c[f+2287828+(p<<2)>>2]=c[n+4704+(d[b+148+p|0]<<2)>>2];c[f+2287892+(p<<2)>>2]=a[n+4832+(d[b+148+p|0]|0)|0]|0}else{c[b+164+(p<<2)>>2]=Cb(k,c[n+488>>2]|0)|0;a[b+228+p|0]=Cb(k,1)|0;c[f+2287828+(p<<2)>>2]=c[b+164+(p<<2)>>2];c[f+2287892+(p<<2)>>2]=a[b+228+p|0]|0}a[b+244+p|0]=Cb(k,1)|0;if((a[b+244+p|0]|0)!=0){c[b+260+(p<<2)>>2]=Gb(k)|0}else{c[b+260+(p<<2)>>2]=0}do{if((p|0)==0){q=64}else{if((p|0)==(c[b+140>>2]|0)){q=64;break}c[f+2287956+(p<<2)>>2]=(c[b+260+(p<<2)>>2]|0)+(c[f+2287956+(p-1<<2)>>2]|0)}}while(0);if((q|0)==64){q=0;c[f+2287956+(p<<2)>>2]=c[b+260+(p<<2)>>2]}p=p+1|0}if((q|0)==68){break}ed(f,1023,0);a[g]=0;l=0;m=l;i=j;return m|0}}while(0);if((a[n+4864|0]|0)!=0){a[b+324|0]=Cb(k,1)|0}else{a[b+324|0]=0}}else{q=73}}while(0);if((q|0)==73){c[b+28>>2]=0;c[b+140>>2]=0;c[b+144>>2]=0}if((a[n+4671|0]|0)!=0){a[b+325|0]=Cb(k,1)|0;a[b+326|0]=Cb(k,1)|0}else{a[b+325|0]=0;a[b+326|0]=0}if((c[b+20>>2]|0)==1){q=79}else{if((c[b+20>>2]|0)==0){q=79}}do{if((q|0)==79){a[b+327|0]=Cb(k,1)|0;if((a[b+327|0]|0)!=0){c[b+328>>2]=Gb(k)|0;if((c[b+328>>2]|0)==-99999){ed(f,1007,0);l=8;m=l;i=j;return m|0}p=b+328|0;c[p>>2]=(c[p>>2]|0)+1;do{if((c[b+20>>2]|0)==0){c[b+332>>2]=Gb(k)|0;if(!((c[b+332>>2]|0)==-99999)){p=b+332|0;c[p>>2]=(c[p>>2]|0)+1;break}ed(f,1007,0);l=8;m=l;i=j;return m|0}}while(0)}else{c[b+328>>2]=a[h+6|0]|0;c[b+332>>2]=a[h+7|0]|0}p=d[(c[b+1072>>2]|0)+3|0]|0;do{if((a[h+4321|0]|0)!=0){if((p|0)<=1){q=106;break}r=ng(p)|0;a[b+336|0]=Cb(k,1)|0;if((a[b+336|0]|0)!=0){s=0;while(1){if((s|0)>=(c[b+328>>2]|0)){break}a[b+338+s|0]=Cb(k,r)|0;s=s+1|0}}if((c[b+20>>2]|0)==0){a[b+337|0]=Cb(k,1)|0;if((a[b+337|0]|0)!=0){s=0;while(1){if((s|0)>=(c[b+332>>2]|0)){break}a[b+354+s|0]=Cb(k,r)|0;s=s+1|0}}}else{a[b+337|0]=0}}else{q=106}}while(0);if((q|0)==106){a[b+336|0]=0;a[b+337|0]=0}if((c[b+20>>2]|0)==0){a[b+370|0]=Cb(k,1)|0}if((a[h+5|0]|0)!=0){a[b+371|0]=Cb(k,1)|0}else{a[b+371|0]=0}if((a[b+324|0]|0)!=0){if((c[b+20>>2]|0)==0){a[b+372|0]=Cb(k,1)|0}else{a[b+372|0]=1}if((a[b+372|0]|0)!=0){if((c[b+328>>2]|0)>1){q=120}else{q=118}}else{q=118}do{if((q|0)==118){if((a[b+372|0]|0)==0){if((c[b+332>>2]|0)>1){q=120;break}}c[b+376>>2]=0}}while(0);do{if((q|0)==120){c[b+376>>2]=Gb(k)|0;if(!((c[b+376>>2]|0)==-99999)){break}ed(f,1007,0);l=8;m=l;i=j;return m|0}}while(0)}if((a[h+29|0]|0)!=0){if((c[b+20>>2]|0)==1){q=129}else{q=127}}else{q=127}do{if((q|0)==127){if((a[h+30|0]|0)==0){break}if((c[b+20>>2]|0)==0){q=129}}}while(0);do{if((q|0)==129){if(_e(k,b,f)|0){break}ed(f,8,0);l=8;m=l;i=j;return m|0}}while(0);c[b+736>>2]=Gb(k)|0;if(!((c[b+736>>2]|0)==-99999)){c[b+1064>>2]=5-(c[b+736>>2]|0);break}ed(f,1007,0);l=8;m=l;i=j;return m|0}}while(0);c[b+740>>2]=Hb(k)|0;if((c[b+740>>2]|0)==-99999){ed(f,1007,0);l=8;m=l;i=j;return m|0}do{if((a[h+28|0]|0)!=0){c[b+744>>2]=Hb(k)|0;if((c[b+744>>2]|0)==-99999){ed(f,1007,0);l=8;m=l;i=j;return m|0}c[b+748>>2]=Hb(k)|0;if(!((c[b+748>>2]|0)==-99999)){break}ed(f,1007,0);l=8;m=l;i=j;return m|0}else{c[b+744>>2]=0;c[b+748>>2]=0}}while(0);if((a[h+243|0]|0)!=0){a[b+752|0]=Cb(k,1)|0}else{a[b+752|0]=0}c[b+756>>2]=c[h+248>>2];c[b+760>>2]=c[h+252>>2];if((a[b+752|0]|0)!=0){a[b+753|0]=Cb(k,1)|0;do{if((a[b+753|0]|0)==0){c[b+756>>2]=Hb(k)|0;if((c[b+756>>2]|0)==-99999){ed(f,1007,0);l=8;m=l;i=j;return m|0}p=b+756|0;c[p>>2]=c[p>>2]<<1;c[b+760>>2]=Hb(k)|0;if(!((c[b+760>>2]|0)==-99999)){p=b+760|0;c[p>>2]=c[p>>2]<<1;break}ed(f,1007,0);l=8;m=l;i=j;return m|0}}while(0)}else{a[b+753|0]=a[h+244|0]|0}b:do{if((a[h+241|0]|0)!=0){do{if((a[b+325|0]|0)==0){if((a[b+326|0]|0)!=0){break}if((a[b+753|0]|0)!=0){q=161;break b}}}while(0);a[b+764|0]=Cb(k,1)|0}else{q=161}}while(0);if((q|0)==161){a[b+764|0]=a[h+241|0]|0}break a}}while(0);ed(f,1007,0);a[g]=0;l=0;m=l;i=j;return m|0}}while(0);if((a[h+34|0]|0)!=0){q=165}else{if((a[h+33|0]|0)!=0){q=165}}c:do{if((q|0)==165){c[b+768>>2]=Gb(k)|0;do{if(!((c[b+768>>2]|0)==-99999)){if((c[b+768>>2]|0)>68){break}if((c[b+768>>2]|0)>0){c[b+772>>2]=Gb(k)|0;if((c[b+772>>2]|0)==-99999){ed(f,1007,0);l=8;m=l;i=j;return m|0}p=b+772|0;c[p>>2]=(c[p>>2]|0)+1;p=0;while(1){if((p|0)>=(c[b+768>>2]|0)){break}c[b+776+(p<<2)>>2]=(Cb(k,c[b+772>>2]|0)|0)+1;if((p|0)>0){s=b+776+(p<<2)|0;c[s>>2]=(c[s>>2]|0)+(c[b+776+(p-1<<2)>>2]|0)}p=p+1|0}}break c}}while(0);ed(f,1007,0);l=8;m=l;i=j;return m|0}}while(0);d:do{if((a[h+4329|0]|0)!=0){c[b+1048>>2]=Gb(k)|0;do{if(!((c[b+1048>>2]|0)==-99999)){if((c[b+1048>>2]|0)>1e3){break}p=0;while(1){if((p|0)>=(c[b+1048>>2]|0)){break}Cb(k,8)|0;p=p+1|0}break d}}while(0);ed(f,1007,0);l=8;m=l;i=j;return m|0}}while(0);c[b+1056>>2]=(c[h+8>>2]|0)+(c[b+740>>2]|0);p=c[b+20>>2]|0;if((p|0)==2){c[b+1060>>2]=0}else if((p|0)==1){c[b+1060>>2]=(a[b+371|0]|0)+1}else if((p|0)==0){c[b+1060>>2]=2-(a[b+371|0]|0)}a[g]=1;l=0;m=l;i=j;return m|0}}while(0);ed(f,1020,0);l=8;m=l;i=j;return m|0}}while(0);ed(f,1009,0);l=0;m=l;i=j;return m|0}function af(e,f,g){e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,q=0,r=0,s=0;h=i;j=e;e=f;f=g;do{if((f|0)==1){k=c[p>>2]|0}else{if((f|0)==2){k=c[o>>2]|0;break}else{i=h;return}}}while(0);f=e+1187944+((c[j+8>>2]|0)*4332|0)|0;if(a[f|0]&1){}else{sa(9032,13472,641,15224)}g=e+1107496+((a[f+2|0]|0)*5028|0)|0;if(a[g|0]&1){}else{sa(6776,13472,644,15224)}rg(k,5384,(l=i,i=i+1|0,i=i+7&-8,c[l>>2]=0,l)|0);i=l;rg(k,4552,(l=i,i=i+8|0,c[l>>2]=a[j+5|0]|0,l)|0);i=l;do{if((d[e+2288988|0]|0)>=16){if((d[e+2288988|0]|0)>23){break}rg(k,4224,(l=i,i=i+8|0,c[l>>2]=a[j+6|0]|0,l)|0);i=l}}while(0);rg(k,3968,(l=i,i=i+8|0,c[l>>2]=c[j+8>>2],l)|0);i=l;if((a[j+5|0]|0)==0){if((a[f+3|0]|0)!=0){rg(k,3704,(l=i,i=i+8|0,c[l>>2]=a[j+12|0]|0,l)|0);i=l}rg(k,14240,(l=i,i=i+8|0,c[l>>2]=c[j+16>>2],l)|0);i=l}if((a[j+12|0]|0)==0){if((c[j+20>>2]|0)==0){m=66}else{m=(c[j+20>>2]|0)==1?80:73}rg(k,14040,(l=i,i=i+8|0,c[l>>2]=m,l)|0);i=l;if((a[f+31|0]|0)!=0){rg(k,13840,(l=i,i=i+8|0,c[l>>2]=a[j+24|0]|0,l)|0);i=l}if((a[g+448|0]|0)==1){rg(k,13568,(l=i,i=i+8|0,c[l>>2]=a[j+25|0]|0,l)|0);i=l}rg(k,13272,(l=i,i=i+8|0,c[l>>2]=c[j+28>>2],l)|0);i=l;do{if((d[e+2288988|0]|0)!=19){if((d[e+2288988|0]|0)==20){break}rg(k,12904,(l=i,i=i+8|0,c[l>>2]=a[j+32|0]|0,l)|0);i=l;if((a[j+32|0]|0)!=0){if((c[g+4688>>2]|0)>1){rg(k,12408,(l=i,i=i+8|0,c[l>>2]=c[j+136>>2],l)|0);i=l;Ge((c[g+4692>>2]|0)+((c[j+136>>2]|0)*100|0)|0,16,k)}}else{rg(k,12664,(l=i,i=i+8|0,c[l>>2]=c[g+4688>>2],l)|0);i=l;Ge(j+34|0,16,k)}if((a[g+4696|0]|0)!=0){if((c[g+4700>>2]|0)>0){rg(k,12200,(l=i,i=i+8|0,c[l>>2]=c[j+140>>2],l)|0);i=l}rg(k,11992,(l=i,i=i+8|0,c[l>>2]=c[j+144>>2],l)|0);i=l;m=0;while(1){if((m|0)>=((c[j+140>>2]|0)+(c[j+144>>2]|0)|0)){break}n=c[e+2287828+(m<<2)>>2]|0;rg(k,11816,(l=i,i=i+16|0,c[l>>2]=m,c[l+8>>2]=n,l)|0);i=l;n=c[e+2287892+(m<<2)>>2]|0;rg(k,11616,(l=i,i=i+16|0,c[l>>2]=m,c[l+8>>2]=n,l)|0);i=l;n=c[e+2287956+(m<<2)>>2]|0;rg(k,11400,(l=i,i=i+16|0,c[l>>2]=m,c[l+8>>2]=n,l)|0);i=l;m=m+1|0}}if((a[g+4864|0]|0)!=0){rg(k,11192,(l=i,i=i+8|0,c[l>>2]=a[j+324|0]|0,l)|0);i=l}}}while(0);if((a[g+4671|0]|0)!=0){rg(k,10952,(l=i,i=i+8|0,c[l>>2]=a[j+325|0]|0,l)|0);i=l;rg(k,10768,(l=i,i=i+8|0,c[l>>2]=a[j+326|0]|0,l)|0);i=l}if((c[j+20>>2]|0)==1){q=48}else{if((c[j+20>>2]|0)==0){q=48}}if((q|0)==48){rg(k,10520,(l=i,i=i+8|0,c[l>>2]=a[j+327|0]|0,l)|0);i=l;e=(a[j+327|0]|0)!=0?32728:9960;rg(k,10336,(l=i,i=i+16|0,c[l>>2]=c[j+328>>2],c[l+8>>2]=e,l)|0);i=l;if((c[j+20>>2]|0)==0){e=(a[j+327|0]|0)!=0?32728:9960;rg(k,9752,(l=i,i=i+16|0,c[l>>2]=c[j+332>>2],c[l+8>>2]=e,l)|0);i=l}do{if((a[f+4321|0]|0)!=0){if((d[(c[j+1072>>2]|0)+3|0]|0)<=1){break}rg(k,9488,(l=i,i=i+8|0,c[l>>2]=a[j+336|0]|0,l)|0);i=l;if((a[j+336|0]|0)!=0){e=0;while(1){if((e|0)>=(c[j+328>>2]|0)){break}m=d[j+338+e|0]|0;rg(k,9280,(l=i,i=i+16|0,c[l>>2]=e,c[l+8>>2]=m,l)|0);i=l;e=e+1|0}}rg(k,9104,(l=i,i=i+8|0,c[l>>2]=a[j+337|0]|0,l)|0);i=l;if((a[j+337|0]|0)!=0){e=0;while(1){if((e|0)>=(c[j+332>>2]|0)){break}m=d[j+354+e|0]|0;rg(k,9280,(l=i,i=i+16|0,c[l>>2]=e,c[l+8>>2]=m,l)|0);i=l;e=e+1|0}}}}while(0);if((c[j+20>>2]|0)==0){rg(k,8848,(l=i,i=i+8|0,c[l>>2]=a[j+370|0]|0,l)|0);i=l}rg(k,8592,(l=i,i=i+8|0,c[l>>2]=a[j+371|0]|0,l)|0);i=l;if((a[j+324|0]|0)!=0){rg(k,8376,(l=i,i=i+8|0,c[l>>2]=a[j+372|0]|0,l)|0);i=l;rg(k,8152,(l=i,i=i+8|0,c[l>>2]=c[j+376>>2],l)|0);i=l}if((a[f+29|0]|0)!=0){if((c[j+20>>2]|0)==1){q=73}else{q=71}}else{q=71}do{if((q|0)==71){if((a[f+30|0]|0)==0){break}if((c[j+20>>2]|0)==0){q=73}}}while(0);if((q|0)==73){rg(k,7952,(l=i,i=i+8|0,c[l>>2]=d[j+380|0]|0,l)|0);i=l;if((c[g+444>>2]|0)!=0){rg(k,7736,(l=i,i=i+8|0,c[l>>2]=d[j+381|0]|0,l)|0);i=l}g=0;while(1){if((g|0)>1){break}do{if((g|0)==0){q=80}else{if((g|0)!=1){break}if((c[j+20>>2]|0)==0){q=80}}}while(0);if((q|0)==80){q=0;if((g|0)==0){r=(c[j+328>>2]|0)-1|0}else{r=(c[j+332>>2]|0)-1|0}e=r;m=0;while(1){if((m|0)>(e|0)){break}n=b[j+446+(g<<5)+(m<<1)>>1]|0;rg(k,7456,(l=i,i=i+24|0,c[l>>2]=g,c[l+8>>2]=m,c[l+16>>2]=n,l)|0);i=l;n=a[j+510+(g<<4)+m|0]|0;rg(k,7264,(l=i,i=i+24|0,c[l>>2]=g,c[l+8>>2]=m,c[l+16>>2]=n,l)|0);i=l;n=0;while(1){if((n|0)>=2){break}s=b[j+542+(g<<6)+(m<<2)+(n<<1)>>1]|0;rg(k,7032,(l=i,i=i+32|0,c[l>>2]=g,c[l+8>>2]=m,c[l+16>>2]=n,c[l+24>>2]=s,l)|0);i=l;s=a[j+670+(g<<5)+(m<<1)+n|0]|0;rg(k,6896,(l=i,i=i+32|0,c[l>>2]=g,c[l+8>>2]=m,c[l+16>>2]=n,c[l+24>>2]=s,l)|0);i=l;n=n+1|0}m=m+1|0}}g=g+1|0}}rg(k,6696,(l=i,i=i+8|0,c[l>>2]=c[j+736>>2],l)|0);i=l}rg(k,6472,(l=i,i=i+8|0,c[l>>2]=c[j+740>>2],l)|0);i=l;if((a[f+28|0]|0)!=0){rg(k,6312,(l=i,i=i+8|0,c[l>>2]=c[j+744>>2],l)|0);i=l;rg(k,6200,(l=i,i=i+8|0,c[l>>2]=c[j+748>>2],l)|0);i=l}if((a[f+243|0]|0)!=0){rg(k,6064,(l=i,i=i+8|0,c[l>>2]=a[j+752|0]|0,l)|0);i=l}g=(a[j+752|0]|0)!=0?5856:5680;rg(k,5968,(l=i,i=i+16|0,c[l>>2]=a[j+753|0]|0,c[l+8>>2]=g,l)|0);i=l;if((a[j+752|0]|0)!=0){if((a[j+753|0]|0)==0){rg(k,5584,(l=i,i=i+8|0,c[l>>2]=c[j+756>>2],l)|0);i=l;rg(k,5456,(l=i,i=i+8|0,c[l>>2]=c[j+760>>2],l)|0);i=l}}a:do{if((a[f+241|0]|0)!=0){do{if((a[j+325|0]|0)==0){if((a[j+326|0]|0)!=0){break}if((a[j+753|0]|0)!=0){break a}}}while(0);rg(k,5328,(l=i,i=i+8|0,c[l>>2]=a[j+764|0]|0,l)|0);i=l}}while(0)}do{if((a[f+34|0]|0)==0){if((a[f+33|0]|0)!=0){break}i=h;return}}while(0);rg(k,5224,(l=i,i=i+8|0,c[l>>2]=c[j+768>>2],l)|0);i=l;if((c[j+768>>2]|0)>0){rg(k,5096,(l=i,i=i+8|0,c[l>>2]=c[j+772>>2],l)|0);i=l;f=0;while(1){if((f|0)>=(c[j+768>>2]|0)){break}g=c[j+776+(f<<2)>>2]|0;rg(k,5048,(l=i,i=i+16|0,c[l>>2]=f,c[l+8>>2]=g,l)|0);i=l;f=f+1|0}}i=h;return}function bf(){var b=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;b=i;e=11296;f=Oh(e)|0;if((f|0)==0){g=0;h=g;i=b;return h|0}Yh(f|0,-1|0,e|0)|0;e=0;while(1){if((e|0)>=2){break}j=0;while(1){if((j|0)>=2){break}k=0;while(1){if((k|0)>=4){break}c[32472+(e<<5)+(j<<4)+(k<<2)>>2]=f;k=k+1|0}j=j+1|0}f=f+16|0;e=e+1|0}e=0;while(1){if((e|0)>=2){break}j=0;while(1){if((j|0)>=2){break}k=0;while(1){if((k|0)>=4){break}c[32536+(e<<5)+(j<<4)+(k<<2)>>2]=f;f=f+64|0;k=k+1|0}j=j+1|0}e=e+1|0}e=0;while(1){if((e|0)>=2){break}j=0;while(1){if((j|0)>=4){break}k=0;while(1){if((k|0)>=2){break}c[32600+(e<<5)+(k<<4)+(j<<2)>>2]=f;k=k+1|0}f=f+256|0;j=j+1|0}e=e+1|0}e=0;while(1){if((e|0)>=2){break}j=0;while(1){if((j|0)>=4){break}k=0;while(1){if((k|0)>=2){break}c[32664+(e<<5)+(k<<4)+(j<<2)>>2]=f;k=k+1|0}f=f+1024|0;j=j+1|0}e=e+1|0}e=2;while(1){if((e|0)>5){break}f=0;while(1){if((f|0)>=2){break}j=0;while(1){if((j|0)>=2){break}k=0;while(1){if((k|0)>=4){break}l=0;while(1){if((l|0)>=(1<<e|0)){break}m=0;while(1){if((m|0)>=(1<<e|0)){break}n=1<<e>>2;if((n|0)==1){o=d[3632+((l<<2)+m)|0]|0}else{if((m+l|0)==0){o=0}else{p=m>>2;q=l>>2;r=m&3;s=l&3;t=k;if((t|0)==0){if((r+s|0)>=3){u=0}else{u=(r+s|0)>0?1:2}o=u}else if((t|0)==1){if((s|0)==0){v=2}else{v=(s|0)==1?1:0}o=v}else if((t|0)==2){if((r|0)==0){w=2}else{w=(r|0)==1?1:0}o=w}else{o=2}if((f|0)==0){if((p+q|0)>0){o=o+3|0}if((n|0)==2){o=o+((j|0)==0?9:15)|0}else{o=o+21|0}}else{if((n|0)==2){o=o+9|0}else{o=o+12|0}}}}if((f|0)==0){x=o}else{x=o+27|0}if((d[(c[32472+(e-2<<6)+(f<<5)+(j<<4)+(k<<2)>>2]|0)+(m+(l<<e))|0]|0|0)!=255){if((d[(c[32472+(e-2<<6)+(f<<5)+(j<<4)+(k<<2)>>2]|0)+(m+(l<<e))|0]|0|0)==(x|0)){}else{sa(4944,13472,1498,15656);return 0}}a[(c[32472+(e-2<<6)+(f<<5)+(j<<4)+(k<<2)>>2]|0)+(m+(l<<e))|0]=x;m=m+1|0}l=l+1|0}k=k+1|0}j=j+1|0}f=f+1|0}e=e+1|0}g=1;h=g;i=b;return h|0}function cf(){Ph(c[8118]|0);c[8118]=0;return}function df(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;e=a;a=b;b=c[(c[a+14632>>2]|0)+1060>>2]|0;if((b|0)>=0){if((b|0)<=2){}else{f=3}}else{f=3}if((f|0)==3){sa(4880,13472,2030,15e3)}ef(e,a,2,1944+(b*12|0)|0,3);if((b|0)>0){ef(e,a,5,2896+((b-1|0)*12|0)|0,3)}if((b|0)!=2){g=b}else{g=5}ef(e,a,8,2560+(g<<2)|0,4);ef(e,a,12,2536+(b<<2)|0,1);ef(e,a,13,2840+(b<<2)|0,1);ef(e,a,14,3336+(((b|0)==0?0:2)<<2)|0,2);ef(e,a,16,3352+(b<<2<<2)|0,4);ef(e,a,20,1904+((b*3|0)<<2)|0,3);ef(e,a,23,2624+((b*18|0)<<2)|0,18);ef(e,a,41,2624+((b*18|0)<<2)|0,18);ef(e,a,59,3288+(b<<2<<2)|0,4);ef(e,a,63,1984+(b*168|0)|0,42);ef(e,a,105,3e3+((b*24|0)<<2)|0,24);ef(e,a,129,2928+((b*6|0)<<2)|0,6);ef(e,a,0,2504+(b<<2)|0,1);ef(e,a,1,2488+(b<<2)|0,1);ef(e,a,135,2920,2);ef(e,a,137,1896,2);ef(e,a,139,2616+(b-1<<2)|0,1);ef(e,a,140,2608+(b-1<<2)|0,1);ef(e,a,141,2552+(b-1<<2)|0,1);ef(e,a,142,3400+(((b|0)==1?0:2)<<2)|0,2);ef(e,a,144,2600,1);ef(e,a,145,2520,1);ef(e,a,146,2528,2);ef(e,a,148,2856,5);ef(e,a,153,2880+(b<<2)|0,1);i=d;return}function ef(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=i;h=a;a=b;b=d;d=e;e=f;f=0;while(1){if((f|0)>=(e|0)){break}dg(h,c[a+14632>>2]|0,a+14472+(b+f)|0,c[d+(f<<2)>>2]|0);f=f+1|0}i=g;return}function ff(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=a;a=c[(c[d+14628>>2]|0)+2243436>>2]|0;if((c[d+8>>2]|0)<(c[(c[(c[d+14628>>2]|0)+2243436>>2]|0)+4944>>2]|0)){c[d+4>>2]=c[(c[(c[(c[d+14628>>2]|0)+2243440>>2]|0)+220>>2]|0)+(c[d+8>>2]<<2)>>2];c[d+12>>2]=(c[d+4>>2]|0)%(c[a+4928>>2]|0)|0;c[d+16>>2]=(c[d+4>>2]|0)/(c[a+4928>>2]|0)|0;e=0;f=e;i=b;return f|0}else{c[d+4>>2]=c[(c[(c[d+14628>>2]|0)+2243436>>2]|0)+4944>>2];c[d+12>>2]=(c[d+4>>2]|0)%(c[a+4928>>2]|0)|0;c[d+16>>2]=(c[d+4>>2]|0)/(c[a+4928>>2]|0)|0;e=1;f=e;i=b;return f|0}return 0}function gf(a){a=a|0;var b=0,d=0;b=i;d=a;a=d+8|0;c[a>>2]=(c[a>>2]|0)+1;a=ff(d)|0;i=b;return a|0}function hf(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;h=i;i=i+40|0;j=h|0;k=h+24|0;l=b;b=e;e=f;f=g;g=c[b+14632>>2]|0;m=c[l+2243436>>2]|0;n=c[l+2243440>>2]|0;Yh(j|0,0,17)|0;o=0;p=0;if((e|0)>0){q=e+(ba(f,c[m+4928>>2]|0)|0)|0;r=e-1+(ba(f,c[m+4928>>2]|0)|0)|0;do{if((((c[b+4>>2]|0)>(c[g+1052>>2]|0)&255)<<24>>24|0)!=0){if((((c[(c[n+228>>2]|0)+(q<<2)>>2]|0)==(c[(c[n+228>>2]|0)+(r<<2)>>2]|0)&255)<<24>>24|0)==0){break}o=(jf(b)|0)&255}}while(0)}do{if((f|0)>0){if((o<<24>>24|0)!=0){break}r=e+(ba(f,c[m+4928>>2]|0)|0)|0;q=e+(ba(f-1|0,c[m+4928>>2]|0)|0)|0;do{if(((((c[b+4>>2]|0)-(c[(c[l+2243436>>2]|0)+4928>>2]|0)|0)>=(c[g+1052>>2]|0)&255)<<24>>24|0)!=0){if((((c[(c[n+228>>2]|0)+(r<<2)>>2]|0)==(c[(c[n+228>>2]|0)+(q<<2)>>2]|0)&255)<<24>>24|0)==0){break}p=(jf(b)|0)&255}}while(0)}}while(0);do{if(!(p<<24>>24!=0)){if(o<<24>>24!=0){break}n=0;while(1){if((n|0)>=3){break}if((a[g+325|0]|0)!=0){if((n|0)==0){s=20}else{s=18}}else{s=18}do{if((s|0)==18){s=0;if((a[g+326|0]|0)==0){break}if((n|0)>0){s=20}}}while(0);if((s|0)==20){s=0;m=0;if((n|0)==0){q=(kf(b)|0)&255;m=q;a[j|0]=q}else{if((n|0)==1){m=(kf(b)|0)&255;q=j|0;a[q]=d[q]|(m&255)<<2;q=j|0;a[q]=d[q]|(m&255)<<4}else{m=d[j|0]>>(n<<1)&3}}if((m&255|0)!=0){q=0;while(1){if((q|0)>=4){break}a[j+5+(n<<2)+q|0]=lf(b)|0;q=q+1|0}if((m&255|0)==1){q=0;while(1){if((q|0)>=4){break}if((a[j+5+(n<<2)+q|0]|0)!=0){r=(mf(b)|0)!=0;c[k+(q<<2)>>2]=r?-1:1}else{c[k+(q<<2)>>2]=0}q=q+1|0}a[j+2+n|0]=nf(b)|0}else{q=0;c[k+4>>2]=1;c[k>>2]=1;c[k+12>>2]=-1;c[k+8>>2]=-1;if((n|0)==0){m=(of(b)|0)&255;q=m;a[j+1|0]=m}else{if((n|0)==1){q=(of(b)|0)&255;m=j+1|0;a[m]=d[m]|(q&255)<<2;m=j+1|0;a[m]=d[m]|(q&255)<<4}}}if((n|0)==0){t=c[(c[l+2243436>>2]|0)+4868>>2]|0}else{t=c[(c[l+2243436>>2]|0)+4876>>2]|0}q=t;if((q|0)<10){u=q}else{u=10}m=q-u|0;q=0;while(1){if((q|0)>=4){break}a[j+5+(n<<2)+q|0]=ba(c[k+(q<<2)>>2]|0,a[j+5+(n<<2)+q|0]<<m)|0;q=q+1|0}}}n=n+1|0}ae(c[l+2287824>>2]|0,c[l+2243436>>2]|0,e,f,j)}}while(0);if(o<<24>>24!=0){o=c[l+2287824>>2]|0;j=c[l+2243436>>2]|0;ae(o,j,e,f,be(c[l+2287824>>2]|0,c[l+2243436>>2]|0,e-1|0,f)|0)}if(!(p<<24>>24!=0)){i=h;return}p=c[l+2287824>>2]|0;j=c[l+2243436>>2]|0;ae(p,j,e,f,be(c[l+2287824>>2]|0,c[l+2243436>>2]|0,e,f-1|0)|0);i=h;return}function jf(a){a=a|0;var b=0,c=0;b=i;c=a;a=Kb(c+14448|0,c+14472|0)|0;i=b;return a|0}function kf(a){a=a|0;var b=0,c=0,d=0;b=i;c=a;do{if((Kb(c+14448|0,c+14473|0)|0)==0){d=0}else{if((Mb(c+14448|0)|0)==0){d=1;break}else{d=2;break}}}while(0);i=b;return d|0}function lf(a){a=a|0;var b=0,c=0,d=0;b=i;c=8;if((c|0)<10){d=c}else{d=10}c=Nb(a+14448|0,(1<<d-5)-1|0)|0;i=b;return c|0}function mf(a){a=a|0;var b=0,c=0;b=i;c=Mb(a+14448|0)|0;i=b;return c|0}function nf(a){a=a|0;var b=0,c=0;b=i;c=Pb(a+14448|0,5)|0;i=b;return c|0}function of(a){a=a|0;var b=0,c=0;b=i;c=Pb(a+14448|0,2)|0;i=b;return c|0}function pf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;e=i;f=b;b=d;d=c[b+14632>>2]|0;g=c[f+2243436>>2]|0;h=(c[b+4>>2]|0)%(c[g+4928>>2]|0)|0;j=(c[b+4>>2]|0)/(c[g+4928>>2]|0)|0;k=h<<c[g+4912>>2];l=j<<c[g+4912>>2];Xd(c[f+2287824>>2]|0,g,h,j,c[(c[b+14632>>2]|0)+1052>>2]|0);_d(c[f+2287824>>2]|0,g,k,l,c[d>>2]|0);a[f+1465192+((c[d>>2]|0)*1520|0)+4|0]=1;m=(c[b+4>>2]|0)-(c[d+16>>2]|0)|0;do{if((a[d+325|0]|0)==0){if((a[d+326|0]|0)!=0){break}n=f;o=b;p=k;q=l;r=g;s=r+4912|0;t=c[s>>2]|0;qf(n,o,p,q,t,0);i=e;return}}while(0);hf(f,b,h,j,m);n=f;o=b;p=k;q=l;r=g;s=r+4912|0;t=c[s>>2]|0;qf(n,o,p,q,t,0);i=e;return}function qf(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;j=i;k=b;b=d;d=e;e=f;f=g;g=h;h=c[k+2243436>>2]|0;do{if((d+(1<<f)|0)<=(c[h+452>>2]|0)){if((e+(1<<f)|0)>(c[h+456>>2]|0)){l=5;break}if((f|0)<=(c[h+4908>>2]|0)){l=5;break}m=_f(b,d,e,g)|0}else{l=5}}while(0);if((l|0)==5){if((f|0)>(c[h+4908>>2]|0)){m=1}else{m=0}}do{if((a[(c[k+2243440>>2]|0)+14|0]|0)!=0){if((f|0)<(c[(c[k+2243440>>2]|0)+236>>2]|0)){l=12;break}c[b+14412>>2]=0;c[b+14416>>2]=0}else{l=12}}while(0);if((m|0)==0){Md(c[k+2287824>>2]|0,c[k+2243436>>2]|0,d,e,f,g);Pf(k,b,d,e,f,g);i=j;return}m=d+(1<<f-1)|0;l=e+(1<<f-1)|0;qf(k,b,d,e,f-1|0,g+1|0);if((m|0)<(c[h+452>>2]|0)){qf(k,b,m,e,f-1|0,g+1|0)}if((l|0)<(c[h+456>>2]|0)){qf(k,b,d,l,f-1|0,g+1|0)}do{if((m|0)<(c[h+452>>2]|0)){if((l|0)>=(c[h+456>>2]|0)){break}qf(k,b,m,l,f-1|0,g+1|0)}}while(0);i=j;return}function rf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;a=(ba(d>>c[(c[e+2243436>>2]|0)+4912>>2],c[(c[e+2243436>>2]|0)+4928>>2]|0)|0)+(b>>c[(c[e+2243436>>2]|0)+4912>>2])|0;i=i;return a|0}function sf(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0;b=i;h=a;a=d;d=e;e=f;f=g;do{if((e|0)>=0){if((f|0)<0){break}if((e|0)>=(c[(c[h+2243436>>2]|0)+452>>2]|0)){j=0;k=j;i=b;return k|0}if((f|0)>=(c[(c[h+2243436>>2]|0)+456>>2]|0)){j=0;k=j;i=b;return k|0}g=rf(h,a,d)|0;l=rf(h,e,f)|0;m=Zd(c[h+2287824>>2]|0,c[h+2243436>>2]|0,g)|0;if((m|0)!=(Zd(c[h+2287824>>2]|0,c[h+2243436>>2]|0,l)|0)){j=0;k=j;i=b;return k|0}if((c[(c[(c[h+2243440>>2]|0)+228>>2]|0)+(g<<2)>>2]|0)!=(c[(c[(c[h+2243440>>2]|0)+228>>2]|0)+(l<<2)>>2]|0)){j=0;k=j;i=b;return k|0}else{j=1;k=j;i=b;return k|0}}}while(0);j=0;k=j;i=b;return k|0}function tf(e,f,g,h,j,k,l,m){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0;k=i;i=i+184|0;j=k|0;n=k+8|0;o=k+72|0;p=k+80|0;q=k+88|0;r=k+96|0;s=k+104|0;t=k+136|0;u=k+152|0;v=k+168|0;w=e;e=f;f=g;g=h;h=l;l=m;m=c[w+2243436>>2]|0;if((l|0)==0){Sd(c[w+2287824>>2]|0,m,f,g,h)}do{if((a[(c[w+2243440>>2]|0)+13|0]|0)!=0){if((a[e+40|0]|0)!=0){x=7;break}if((h|0)!=2){x=7;break}a[e+41+l|0]=uf(e,l)|0}else{x=7}}while(0);if((x|0)==7){a[e+41+l|0]=0}y=vf(e,h,l,e+14495|0)|0;z=vf(e,h,l,e+14513|0)|0;if((y|0)>3){A=(y>>1)-1|0;B=(ba(1<<A,(y&1)+2|0)|0)+(Pb(e+14448|0,A)|0)|0}else{B=y}if((z|0)>3){y=(z>>1)-1|0;C=(ba(1<<y,(z&1)+2|0)|0)+(Pb(e+14448|0,y)|0)|0}else{C=z}if((Cd(c[w+2287824>>2]|0,m,f,g)|0)==0){if((l|0)==0){do{if((h|0)==2){x=18}else{if((h|0)==3){x=18;break}D=0}}while(0);if((x|0)==18){z=(f>>c[m+4980>>2])+(ba(g>>c[m+4980>>2],c[m+4984>>2]|0)|0)|0;m=d[(c[(c[w+2287824>>2]|0)+136>>2]|0)+z|0]|0;do{if(m>>>0>=6>>>0){if(!(m>>>0<=14>>>0)){x=21;break}D=2}else{x=21}}while(0);if((x|0)==21){do{if(m>>>0>=22>>>0){if(!(m>>>0<=30>>>0)){x=24;break}D=1}else{x=24}}while(0);if((x|0)==24){D=0}}}}else{do{if((h|0)==1){x=31}else{if((h|0)==2){x=31;break}D=0}}while(0);if((x|0)==31){m=c[e+36>>2]|0;do{if(m>>>0>=6>>>0){if(!(m>>>0<=14>>>0)){x=34;break}D=2}else{x=34}}while(0);if((x|0)==34){do{if(m>>>0>=22>>>0){if(!(m>>>0<=30>>>0)){x=37;break}D=1}else{x=37}}while(0);if((x|0)==37){D=0}}}}}else{D=0}if((D|0)==2){m=B;B=C;C=m}m=Je(h-2|0,D)|0;z=Je(2,D)|0;g=0;while(1){if((g|0)>=16){break}g=g+1|0}Ke(j,B,C,D,h);C=d[j+1|0]|0;B=d[j|0]|0;j=1<<h-2;Yh(n|0,0,ba(j,j)|0)|0;g=1;f=1;y=0;A=1<<h;c[o>>2]=0;c[p>>2]=0;c[q>>2]=0;b[e+14404+(l<<1)>>1]=0;E=B;while(1){if((E|0)<0){break}F=r;G=m+(E<<1)|0;a[F]=a[G]|0;a[F+1|0]=a[G+1|0]|0;G=0;F=0;do{if((E|0)<(B|0)){if((E|0)<=0){x=55;break}F=wf(e,l,a[n+((d[r|0]|0)+(ba(d[r+1|0]|0,j)|0))|0]|0)|0;G=1}else{x=55}}while(0);if((x|0)==55){x=0;if((E|0)==0){x=57}else{if((E|0)==(B|0)){x=57}}if((x|0)==57){x=0;F=1}}if((F|0)!=0){if((d[r|0]|0)>0){H=n+((d[r|0]|0)-1+(ba(d[r+1|0]|0,j)|0))|0;a[H]=d[H]|1}if((d[r+1|0]|0)>0){H=n+((d[r|0]|0)+(ba((d[r+1|0]|0)-1|0,j)|0))|0;a[H]=d[H]|2}}H=0;if((F|0)!=0){I=d[r|0]<<2;J=d[r+1|0]<<2;K=c[32472+(h-2<<6)+((((l|0)!=0^1^1)&1)<<5)+((((D|0)!=0^1^1)&1)<<4)+(d[n+((d[r|0]|0)+(ba(d[r+1|0]|0,j)|0))|0]<<2)>>2]|0;if((E|0)==(B|0)){L=C-1|0}else{L=15}M=L;if((E|0)==(B|0)){b[s+(H<<1)>>1]=1;a[v+H|0]=1;a[t+H|0]=C;H=H+1|0}N=M;while(1){if((N|0)<=0){break}O=I+(d[z+(N<<1)|0]|0)|0;P=J+(d[z+(N<<1)+1|0]|0)|0;if((xf(e,a[K+(O+(P<<h))|0]|0)|0)!=0){b[s+(H<<1)>>1]=1;a[v+H|0]=1;a[t+H|0]=N;H=H+1|0;G=0}N=N-1|0}if((M|0)>=0){if((G|0)==0){if((xf(e,a[K+(I+(J<<h))|0]|0)|0)!=0){b[s+(H<<1)>>1]=1;a[v+H|0]=1;a[t+H|0]=0;H=H+1|0}}else{b[s+(H<<1)>>1]=1;a[v+H|0]=1;a[t+H|0]=0;H=H+1|0}}}if((H|0)!=0){do{if((E|0)==0){x=88}else{if((l|0)>0){x=88;break}Q=2}}while(0);if((x|0)==88){x=0;Q=0}if((g|0)==0){Q=Q+1|0}g=1;J=-1;if(8<(H|0)){R=8}else{R=H}I=R;K=0;while(1){if((K|0)>=(I|0)){break}if((yf(e,l,E,(K|0)==0,f&1,y,o,p,q,Q)|0)!=0){G=s+(K<<1)|0;b[G>>1]=(b[G>>1]|0)+1;g=0;if((J|0)==-1){J=K}}else{a[v+K|0]=0;do{if((g|0)<3){if((g|0)<=0){break}g=g+1|0}}while(0)}K=K+1|0}f=0;y=c[o>>2]|0;if((J|0)!=-1){K=zf(e,l,c[q>>2]|0)|0;I=s+(J<<1)|0;b[I>>1]=(b[I>>1]|0)+K;a[v+J|0]=K}if(((a[t|0]|0)-(a[t+(H-1)|0]|0)|0)>3){S=(a[e+40|0]|0)!=0^1}else{S=0}K=S&1;I=0;while(1){if((I|0)>=(H-1|0)){break}a[u+I|0]=Mb(e+14448|0)|0;I=I+1|0}do{if((a[(c[w+2243440>>2]|0)+4|0]|0)!=0){if((K|0)==0){x=117;break}a[u+(H-1)|0]=0}else{x=117}}while(0);if((x|0)==117){x=0;a[u+(H-1)|0]=Mb(e+14448|0)|0}I=0;J=0;G=0;while(1){if((G|0)>=(H|0)){break}M=b[s+(G<<1)>>1]|0;if((a[v+G|0]|0)!=0){T=Af(e,J)|0;if((M+T|0)>((1<<J)*3|0|0)){J=J+1|0;if((J|0)>4){J=4}}}else{T=0}N=M+T&65535;if((a[u+G|0]|0)!=0){N=-(N<<16>>16)&65535}do{if((a[(c[w+2243440>>2]|0)+4|0]|0)!=0){if((K|0)==0){break}I=I+(M+T)|0;do{if((G|0)==(H-1|0)){if((I&1|0)==0){break}N=-(N<<16>>16)&65535}}while(0)}}while(0);M=a[t+G|0]|0;O=(d[r|0]<<2)+(d[z+(M<<1)|0]|0)|0;P=(d[r+1|0]<<2)+(d[z+(M<<1)+1|0]|0)|0;b[e+2116+(l<<11)+(b[e+14404+(l<<1)>>1]<<1)>>1]=N;M=O+(ba(P,A)|0)&65535;b[e+8260+(l<<11)+(b[e+14404+(l<<1)>>1]<<1)>>1]=M;M=e+14404+(l<<1)|0;b[M>>1]=(b[M>>1]|0)+1;G=G+1|0}}E=E-1|0}i=k;return 0}function uf(a,b){a=a|0;b=b|0;var c=0,d=0;c=i;d=a;a=Kb(d+14448|0,d+14472+(((b|0)==0?0:1)+137)|0)|0;i=c;return a|0}function vf(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;f=a;a=b;b=d;d=(a<<1)-1|0;if((c|0)==0){g=((a-2|0)*3|0)+(a-1>>2)|0;h=a+1>>2}else{g=15;h=a-2|0}a=d;c=0;while(1){if((c|0)>=(d|0)){j=10;break}if((Kb(f+14448|0,b+(g+(c>>h))|0)|0)==0){break}c=c+1|0}if((j|0)==10){k=a;i=e;return k|0}a=c;k=a;i=e;return k|0}function wf(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=i;e=a;a=c;c=a&1|(a&255)>>1;if((b|0)!=0){c=c+2|0}b=Kb(e+14448|0,e+14472+(c+59)|0)|0;i=d;return b|0}function xf(a,b){a=a|0;b=b|0;var c=0,d=0;c=i;d=a;a=Kb(d+14448|0,d+14472+((b&255)+63)|0)|0;i=c;return a|0}function yf(a,b,d,e,f,g,h,j,k,l){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0;m=i;n=a;a=b;b=f&1;f=g;g=h;h=j;j=k;k=l;if(e&1){do{if((d|0)==0){o=4}else{if((a|0)>0){o=4;break}p=2}}while(0);if((o|0)==4){p=0}if(b&1){q=1}else{q=f}if((q|0)==0){p=p+1|0}r=1}else{p=c[j>>2]|0;r=c[g>>2]|0;if((r|0)>0){if((c[h>>2]|0)==1){r=0}else{r=r+1|0}}}p=k;if((r|0)>=3){s=3}else{s=r}k=(p<<2)+s|0;if((a|0)>0){k=k+16|0}a=Kb(n+14448|0,n+14472+(k+105)|0)|0;c[g>>2]=r;c[h>>2]=a;c[j>>2]=p;i=m;return a|0}function zf(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=i;e=a;a=c;if((b|0)>0){a=a+4|0}b=Kb(e+14448|0,e+14472+(a+129)|0)|0;i=d;return b|0}function Af(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0;c=i;d=a;a=b;b=0;e=0;do{b=b+1|0;e=Mb(d+14448|0)|0;}while((e|0)!=0);e=1-e|0;b=b-e|0;e=0;if((b|0)<3){e=Pb(d+14448|0,a)|0;f=(b<<a)+e|0;g=f;i=c;return g|0}else{e=Pb(d+14448|0,b-3+a|0)|0;f=((1<<b-3)+3-1<<a)+e|0;g=f;i=c;return g|0}return 0}function Bf(b,d,e,f,g,h,j,k,l,m,n,o,p,q){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;var r=0,s=0,t=0,u=0,v=0,w=0;m=i;r=b;b=d;d=e;e=f;f=g;g=h;h=j;j=k;k=l;l=n;n=o;o=p;p=q;if((o|0)!=-1){}else{sa(4800,13472,2781,14480);return 0}if((p|0)!=-1){}else{sa(4776,13472,2782,14480);return 0}if((n|0)!=-1){}else{sa(4664,13472,2783,14480);return 0}a[b+41|0]=0;a[b+42|0]=0;a[b+43|0]=0;do{if((n|0)!=0){s=10}else{if((o|0)!=0){s=10;break}if((p|0)!=0){s=10}}}while(0);if((s|0)==10){do{if((a[(c[r+2243440>>2]|0)+14|0]|0)!=0){if((c[b+14412>>2]|0)!=0){break}q=Cf(b)|0;t=0;if((q|0)!=0){t=Mb(b+14448|0)|0}c[b+14412>>2]=1;c[b+14416>>2]=ba(q,1-(t<<1)|0)|0;Be(r,b,d,e,h,j)}}while(0)}do{if((n|0)!=0){s=19}else{if((o|0)!=0){s=19;break}if((p|0)!=0){s=19}}}while(0);if((s|0)==19){s=d-h|0;t=e-j|0;do{if((n|0)!=0){q=tf(r,b,d,e,s,t,k,0)|0;u=q;if((q|0)==0){break}v=u;w=v;i=m;return w|0}}while(0);if((k|0)>2){do{if((o|0)!=0){n=tf(r,b,d,e,s,t,k-1|0,1)|0;u=n;if((n|0)==0){break}v=u;w=v;i=m;return w|0}}while(0);do{if((p|0)!=0){n=tf(r,b,d,e,s,t,k-1|0,2)|0;u=n;if((n|0)==0){break}v=u;w=v;i=m;return w|0}}while(0)}else{if((l|0)==3){do{if((o|0)!=0){l=tf(r,b,f,g,f-h|0,g-j|0,k,1)|0;u=l;if((l|0)==0){break}v=u;w=v;i=m;return w|0}}while(0);do{if((p|0)!=0){o=tf(r,b,f,g,f-h|0,g-j|0,k,2)|0;u=o;if((o|0)==0){break}v=u;w=v;i=m;return w|0}}while(0)}}}v=0;w=v;i=m;return w|0}function Cf(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0,h=0;b=i;c=a;a=Kb(c+14448|0,c+14607|0)|0;if((a|0)==0){d=0;e=d;i=b;return e|0}f=1;g=0;while(1){if((g|0)>=4){break}a=Kb(c+14448|0,c+14608|0)|0;if((a|0)==0){h=6;break}f=f+1|0;g=g+1|0}if((f|0)==5){d=(Qb(c+14448|0,0)|0)+5|0;e=d;i=b;return e|0}else{d=f;e=d;i=b;return e|0}return 0}function Df(b,e,f,g,h,j,k,l,m,n,o,p,q,r,s,t){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;r=r|0;s=s|0;t=t|0;var u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;u=i;v=b;b=e;e=f;f=g;g=h;h=j;j=k;k=l;l=m;m=n;n=o;o=p;p=q;q=r;r=s&1;s=t&1;t=c[v+2243436>>2]|0;w=Cd(c[v+2287824>>2]|0,t,e,f)|0;x=Ld(c[v+2287824>>2]|0,t,e,f)|0;do{if((c[t+596>>2]|0)==0){if((w|0)!=1){y=0;break}if((x|0)==0){y=0;break}y=(m|0)==0}else{y=0}}while(0);x=y&1;do{if((l|0)<=(c[(c[v+2243436>>2]|0)+4976>>2]|0)){if((l|0)<=(c[(c[v+2243436>>2]|0)+4972>>2]|0)){z=11;break}if((m|0)>=(o|0)){z=11;break}if((p|0)!=0){if((m|0)==0){z=11;break}}A=Ef(b,l)|0}else{z=11}}while(0);if((z|0)==11){do{if((l|0)>(c[(c[v+2243436>>2]|0)+4976>>2]|0)){B=1}else{if((p|0)==1){if((m|0)==0){B=1;break}}B=(x|0)==1}}while(0);A=B?1:0}if((A|0)!=0){Qd(c[v+2287824>>2]|0,t,e,f,m)}B=-1;x=-1;if((l|0)>2){if(r&1){B=Ff(b,m)|0}if(s&1){x=Ff(b,m)|0}}if((B|0)<0){do{if((m|0)>0){if((l|0)!=2){z=28;break}B=r&1}else{z=28}}while(0);if((z|0)==28){B=0}}if((x|0)<0){do{if((m|0)>0){if((l|0)!=2){z=34;break}x=s&1}else{z=34}}while(0);if((z|0)==34){x=0}}if((A|0)!=0){A=e+(1<<l-1)|0;s=f+(1<<l-1)|0;Df(v,b,e,f,e,f,j,k,l-1|0,m+1|0,0,o,p,q,(B|0)!=0,(x|0)!=0);Df(v,b,A,f,e,f,j,k,l-1|0,m+1|0,1,o,p,q,(B|0)!=0,(x|0)!=0);Df(v,b,e,s,e,f,j,k,l-1|0,m+1|0,2,o,p,q,(B|0)!=0,(x|0)!=0);Df(v,b,A,s,e,f,j,k,l-1|0,m+1|0,3,o,p,q,(B|0)!=0,(x|0)!=0);i=u;return}p=1;do{if((w|0)==0){z=42}else{if((m|0)!=0){z=42;break}if((B|0)!=0){z=42;break}if((x|0)!=0){z=42}}}while(0);if((z|0)==42){p=Gf(b,m)|0}Bf(v,b,e,f,g,h,j,k,l,m,n,p,B,x)|0;m=1<<l;if((q|0)==0){q=(e>>c[t+4980>>2])+(ba(f>>c[t+4980>>2],c[t+4984>>2]|0)|0)|0;je(v,e,f,d[(c[(c[v+2287824>>2]|0)+136>>2]|0)+q|0]|0,m,0);q=c[b+36>>2]|0;if((m|0)>=8){je(v,(e|0)/2|0,(f|0)/2|0,q,(m|0)/2|0,1);je(v,(e|0)/2|0,(f|0)/2|0,q,(m|0)/2|0,2)}else{if((n|0)==3){je(v,(g|0)/2|0,(h|0)/2|0,q,m,1);je(v,(g|0)/2|0,(h|0)/2|0,q,m,2)}}}if((p|0)!=0){De(v,b,e,f,j,k,m,0,(a[b+41|0]|0)!=0,(w|0)==0)}if((m|0)>=8){if((B|0)!=0){De(v,b,(e|0)/2|0,(f|0)/2|0,(j|0)/2|0,(k|0)/2|0,(m|0)/2|0,1,(a[b+42|0]|0)!=0,(w|0)==0)}if((x|0)!=0){De(v,b,(e|0)/2|0,(f|0)/2|0,(j|0)/2|0,(k|0)/2|0,(m|0)/2|0,2,(a[b+43|0]|0)!=0,(w|0)==0)}}else{if((n|0)==3){if((B|0)!=0){De(v,b,(g|0)/2|0,(h|0)/2|0,(j|0)/2|0,(k|0)/2|0,m,1,(a[b+42|0]|0)!=0,(w|0)==0)}if((x|0)!=0){De(v,b,(g|0)/2|0,(h|0)/2|0,(j|0)/2|0,(k|0)/2|0,m,2,(a[b+43|0]|0)!=0,(w|0)==0)}}}i=u;return}function Ef(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;c=i;d=a;a=5-b|0;if((a|0)>=0){if((a|0)<=2){}else{e=3}}else{e=3}if((e|0)==3){sa(4376,13472,1225,15416);return 0}e=Kb(d+14448|0,d+14472+(a+20)|0)|0;i=c;return e|0}function Ff(a,b){a=a|0;b=b|0;var c=0,d=0;c=i;d=a;a=Kb(d+14448|0,d+14472+(b+16)|0)|0;i=c;return a|0}function Gf(a,b){a=a|0;b=b|0;var c=0,d=0;c=i;d=a;a=Kb(d+14448|0,d+14472+(((b|0)==0)+14)|0)|0;i=c;return a|0}function Hf(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;e=i;i=i+40|0;d=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=e+32|0;l=a;a=f;c[d>>2]=Kb(l+14448|0,l+14614|0)|0;c[d+4>>2]=Kb(l+14448|0,l+14614|0)|0;if((c[d>>2]|0)!=0){c[g>>2]=Kb(l+14448|0,l+14615|0)|0}else{c[g>>2]=0}if((c[d+4>>2]|0)!=0){c[g+4>>2]=Kb(l+14448|0,l+14615|0)|0}else{c[g+4>>2]=0}f=0;while(1){if((f|0)>=2){break}if((c[d+(f<<2)>>2]|0)!=0){if((c[g+(f<<2)>>2]|0)!=0){c[h+(f<<2)>>2]=Qb(l+14448|0,1)|0}else{c[h+(f<<2)>>2]=(c[g+(f<<2)>>2]|0)-1}c[j+(f<<2)>>2]=Mb(l+14448|0)|0;c[k+(f<<2)>>2]=(c[h+(f<<2)>>2]|0)+2;if((c[j+(f<<2)>>2]|0)!=0){c[k+(f<<2)>>2]=-(c[k+(f<<2)>>2]|0)}}else{c[k+(f<<2)>>2]=0}f=f+1|0}b[l+22+(a<<2)>>1]=c[k>>2];b[l+22+(a<<2)+2>>1]=c[k+4>>2];i=e;return}function If(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0;h=i;g=d;if((c[(c[g+14632>>2]|0)+1064>>2]|0)>1){j=Jf(g)|0}else{j=0}a[g+31|0]=j;a[g+30|0]=1;i=h;return}function Jf(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=a;a=Kb(d+14448|0,d+14612|0)|0;if((a|0)==0){e=a;i=b;return e|0}a=1;while(1){if((a|0)>=((c[(c[d+14632>>2]|0)+1064>>2]|0)-1|0)){break}if((Mb(d+14448|0)|0)==0){f=7;break}a=a+1|0}e=a;i=b;return e|0}function Kf(d,e,f,g,h,j,k,l,m,n,o){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;p=i;q=d;d=e;e=f;f=g;g=h;h=j;j=k;k=l;l=m;m=n;n=o;o=e+g|0;r=f+h|0;s=c[d+14632>>2]|0;t=Lf(d)|0;a[d+30|0]=t;if((t|0)!=0){if((c[s+1064>>2]|0)>1){u=Jf(d)|0}else{u=0}a[d+31|0]=u;v=q;w=d;x=e;y=f;z=g;A=h;B=m;C=j;D=k;E=n;Ng(v,w,x,y,z,A,B,C,D,E);i=p;return}if((c[s+20>>2]|0)==0){F=Mf(d,o,r,j,k,l)|0}else{F=0}a[d+34|0]=F;if((F|0)!=1){a[d+20|0]=Nf(d,c[s+328>>2]|0)|0;Hf(d,o,r,0);a[d+32|0]=Of(d)|0}if((F|0)!=0){a[d+21|0]=Nf(d,c[s+332>>2]|0)|0;do{if((a[s+370|0]|0)!=0){if((F|0)!=2){G=15;break}b[d+26>>1]=0;b[d+28>>1]=0}else{G=15}}while(0);if((G|0)==15){Hf(d,o,r,1)}a[d+33|0]=Of(d)|0}v=q;w=d;x=e;y=f;z=g;A=h;B=m;C=j;D=k;E=n;Ng(v,w,x,y,z,A,B,C,D,E);i=p;return}function Lf(a){a=a|0;var b=0,c=0;b=i;c=a;a=Kb(c+14448|0,c+14611|0)|0;i=b;return a|0}function Mf(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;c=i;b=a;a=b+14620|0;if((d+e|0)==12){g=Kb(b+14448|0,a+4|0)|0;h=g;i=c;return h|0}if((Kb(b+14448|0,a+f|0)|0)==0){g=Kb(b+14448|0,a+4|0)|0}else{g=2}h=g;i=c;return h|0}function Nf(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0;c=i;d=a;a=b-1|0;if((a|0)==0){e=0;f=e;i=c;return f|0}b=Kb(d+14448|0,d+14618|0)|0;g=0;while(1){if((b|0)==0){break}g=g+1|0;if((g|0)==(a|0)){h=6;break}if((g|0)==1){b=Kb(d+14448|0,d+14619|0)|0}else{b=Mb(d+14448|0)|0}}e=g;f=e;i=c;return f|0}function Of(a){a=a|0;var b=0,c=0;b=i;c=a;a=Kb(c+14448|0,c+14616|0)|0;i=b;return a|0}function Pf(b,e,f,g,h,j){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;k=i;i=i+64|0;l=k|0;m=k+16|0;n=k+32|0;o=k+48|0;p=b;b=e;e=f;f=g;g=h;h=j;j=c[p+2243436>>2]|0;q=c[b+14632>>2]|0;Id(c[p+2287824>>2]|0,j,e,f,g);r=1<<g;Be(p,b,e,f,e,f);if((a[(c[p+2243440>>2]|0)+32|0]|0)!=0){s=Qf(b)|0;a[b+40|0]=s;if((s|0)!=0){Dd(c[p+2287824>>2]|0,j,e,f,g)}}s=0;if((c[q+20>>2]|0)!=2){s=(Rf(b,e,f,h)|0)&255}zd(c[p+2243436>>2]|0,c[p+2287824>>2]|0,e,f,g,s);t=0;if(s<<24>>24!=0){If(p,b,e,f,r,r);Kd(c[p+2287824>>2]|0,c[p+2243436>>2]|0,e,f,0);Bd(c[p+2287824>>2]|0,j,e,f,g,2);u=2;s=1<<g;Ng(p,b,e,f,0,0,s,s,s,0);i=k;return}if((c[q+20>>2]|0)!=2){s=(Sf(b)|0)!=0;u=s?0:1}else{u=0}Bd(c[p+2287824>>2]|0,j,e,f,g,u);do{if((u|0)!=0){v=14}else{if((g|0)==(c[j+4908>>2]|0)){v=14;break}w=0}}while(0);if((v|0)==14){w=Tf(b,u,g)|0;do{if((w|0)==3){if((u|0)!=0){break}t=1}}while(0)}Kd(c[p+2287824>>2]|0,c[p+2243436>>2]|0,e,f,w);s=0;if((u|0)==0){do{if((w|0)==0){if((a[j+4672|0]|0)==0){break}if((g|0)<(c[j+4992>>2]|0)){break}if((g|0)>(c[j+4996>>2]|0)){break}s=(Lb(b+14448|0)|0)!=0|0}}while(0);if(s&1){Fd(c[p+2287824>>2]|0,c[p+2243436>>2]|0,e,f,g);Uf(b,e,f,g)}else{if((w|0)==3){x=(r|0)/2|0}else{x=r}y=x;if((w|0)==3){z=g-1|0}else{z=g}x=z;z=0;A=0;while(1){if((A|0)>=(r|0)){break}B=0;while(1){if((B|0)>=(r|0)){break}C=z;z=C+1|0;c[l+(C<<2)>>2]=Vf(b)|0;B=B+y|0}A=A+y|0}z=0;A=0;while(1){if((A|0)>=(r|0)){break}B=0;while(1){if((B|0)>=(r|0)){break}if((c[l+(z<<2)>>2]|0)!=0){c[m+(z<<2)>>2]=Wf(b)|0}else{c[n+(z<<2)>>2]=Xf(b)|0}C=e+B|0;D=f+A|0;E=sf(p,q,C,D,C-1|0,D)|0;F=sf(p,q,C,D,C,D-1|0)|0;G=(C>>c[j+4980>>2])+(ba(D>>c[j+4980>>2],c[j+4984>>2]|0)|0)|0;if((E|0)==0){H=1}else{do{if((Cd(c[p+2287824>>2]|0,j,C-1|0,D)|0)!=0){v=52}else{if((Gd(c[p+2287824>>2]|0,j,C-1|0,D)|0)!=0){v=52;break}H=d[(c[(c[p+2287824>>2]|0)+136>>2]|0)+(G-1)|0]|0}}while(0);if((v|0)==52){v=0;H=1}}if((F|0)==0){I=1}else{do{if((Cd(c[p+2287824>>2]|0,j,C,D-1|0)|0)!=0){v=59}else{if((Gd(c[p+2287824>>2]|0,j,C,D-1|0)|0)!=0){v=59;break}if((D-1|0)<(D>>c[j+4912>>2]<<c[j+4912>>2]|0)){I=1}else{I=d[(c[(c[p+2287824>>2]|0)+136>>2]|0)+(G-(c[j+4984>>2]|0))|0]|0}}}while(0);if((v|0)==59){v=0;I=1}}if((H|0)==(I|0)){if(H>>>0<2>>>0){c[o>>2]=0;c[o+4>>2]=1;c[o+8>>2]=26}else{c[o>>2]=H;c[o+4>>2]=(((H-2-1+32|0)>>>0)%32|0)+2;c[o+8>>2]=(((H-2+1|0)>>>0)%32|0)+2}}else{c[o>>2]=H;c[o+4>>2]=I;do{if((H|0)!=0){if((I|0)==0){v=73;break}c[o+8>>2]=0}else{v=73}}while(0);if((v|0)==73){v=0;do{if((H|0)!=1){if((I|0)==1){v=76;break}c[o+8>>2]=1}else{v=76}}while(0);if((v|0)==76){v=0;c[o+8>>2]=26}}}D=0;while(1){if((D|0)>=3){break}D=D+1|0}if((c[l+(z<<2)>>2]|0)==1){J=c[o+(c[m+(z<<2)>>2]<<2)>>2]|0}else{if((c[o>>2]|0)>(c[o+4>>2]|0)){D=c[o>>2]|0;c[o>>2]=c[o+4>>2];c[o+4>>2]=D}if((c[o>>2]|0)>(c[o+8>>2]|0)){D=c[o>>2]|0;c[o>>2]=c[o+8>>2];c[o+8>>2]=D}if((c[o+4>>2]|0)>(c[o+8>>2]|0)){D=c[o+4>>2]|0;c[o+4>>2]=c[o+8>>2];c[o+8>>2]=D}J=c[n+(z<<2)>>2]|0;D=0;while(1){if((D|0)>2){break}if((J|0)>=(c[o+(D<<2)>>2]|0)){J=J+1|0}D=D+1|0}}D=1<<x-(c[j+4980>>2]|0);C=0;while(1){if((C|0)>=(D|0)){break}F=0;while(1){if((F|0)>=(D|0)){break}E=G+F+(ba(C,c[j+4984>>2]|0)|0)|0;a[(c[(c[p+2287824>>2]|0)+136>>2]|0)+E|0]=J;F=F+1|0}C=C+1|0}z=z+1|0;B=B+y|0}A=A+y|0}y=Yf(b)|0;A=(e>>c[j+4980>>2])+(ba(f>>c[j+4980>>2],c[j+4984>>2]|0)|0)|0;j=d[(c[(c[p+2287824>>2]|0)+136>>2]|0)+A|0]|0;if((y|0)==4){K=j}else{K=c[472+(y<<2)>>2]|0;if((K|0)==(j|0)){K=34}}c[b+36>>2]=K}}else{K=1<<g;if((w|0)==0){Kf(p,b,e,f,0,0,r,r,h,K,0)}else{if((w|0)==1){Kf(p,b,e,f,0,0,r,(r|0)/2|0,h,K,0);Kf(p,b,e,f,0,(r|0)/2|0,r,(r|0)/2|0,h,K,1)}else{if((w|0)==2){Kf(p,b,e,f,0,0,(r|0)/2|0,r,h,K,0);Kf(p,b,e,f,(r|0)/2|0,0,(r|0)/2|0,r,h,K,1)}else{if((w|0)==4){Kf(p,b,e,f,0,0,r,(r|0)/4|0,h,K,0);Kf(p,b,e,f,0,(r|0)/4|0,r,(r*3|0|0)/4|0,h,K,1)}else{if((w|0)==5){Kf(p,b,e,f,0,0,r,(r*3|0|0)/4|0,h,K,0);Kf(p,b,e,f,0,(r*3|0|0)/4|0,r,(r|0)/4|0,h,K,1)}else{if((w|0)==6){Kf(p,b,e,f,0,0,(r|0)/4|0,r,h,K,0);Kf(p,b,e,f,(r|0)/4|0,0,(r*3|0|0)/4|0,r,h,K,1)}else{if((w|0)==7){Kf(p,b,e,f,0,0,(r*3|0|0)/4|0,r,h,K,0);Kf(p,b,e,f,(r*3|0|0)/4|0,0,(r|0)/4|0,r,h,K,1)}else{if((w|0)!=3){sa(4600,13472,3600,14616)}Kf(p,b,e,f,0,0,(r|0)/2|0,(r|0)/2|0,h,K,0);Kf(p,b,e,f,(r|0)/2|0,0,(r|0)/2|0,(r|0)/2|0,h,K,1);Kf(p,b,e,f,0,(r|0)/2|0,(r|0)/2|0,(r|0)/2|0,h,K,2);Kf(p,b,e,f,(r|0)/2|0,(r|0)/2|0,(r|0)/2|0,(r|0)/2|0,h,K,3)}}}}}}}}if(!(s&1)){s=a[b+30|0]|0;do{if((u|0)!=0){if((w|0)==0){if((s&255|0)!=0){v=147;break}}L=((Zf(b)|0)!=0^1^1)&1}else{v=147}}while(0);if((v|0)==147){L=1}if(L&1){if((u|0)==0){M=(c[(c[p+2243436>>2]|0)+600>>2]|0)+t|0}else{M=c[(c[p+2243436>>2]|0)+596>>2]|0}Df(p,b,e,f,e,f,e,f,g,0,0,M,t,u,1,1)}}i=k;return}function Qf(a){a=a|0;var b=0,c=0;b=i;c=a;a=Kb(c+14448|0,c+14625|0)|0;i=b;return a|0}function Rf(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;e=i;f=a;a=b;b=d;d=c[f+14628>>2]|0;g=sf(d,c[f+14632>>2]|0,a,b,a-1|0,b)|0;h=sf(d,c[f+14632>>2]|0,a,b,a,b-1|0)|0;j=0;k=0;do{if((g|0)!=0){if(((Ad(c[d+2243436>>2]|0,c[d+2287824>>2]|0,a-1|0,b)|0)&255|0)==0){break}j=1}}while(0);do{if((h|0)!=0){if(((Ad(c[d+2243436>>2]|0,c[d+2287824>>2]|0,a,b-1|0)|0)&255|0)==0){break}k=1}}while(0);b=Kb(f+14448|0,f+14472+(j+k+5)|0)|0;i=e;return b|0}function Sf(a){a=a|0;var b=0,c=0;b=i;c=a;a=Kb(c+14448|0,c+14613|0)|0;i=b;return a|0}function Tf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;g=b;b=e;e=c[g+14628>>2]|0;a:do{if((d|0)==0){h=(Kb(g+14448|0,g+14480|0)|0)!=0;j=h?0:3}else{if((Kb(g+14448|0,g+14480|0)|0)!=0){j=0;break}h=Kb(g+14448|0,g+14481|0)|0;if((b|0)<=(c[(c[e+2243436>>2]|0)+4908>>2]|0)){if((h|0)!=0){j=1;break}if((b|0)==3){j=2;break}else{j=3-(Kb(g+14448|0,g+14482|0)|0)|0;break}}if((a[(c[e+2243436>>2]|0)+4670|0]|0)==0){j=(h|0)!=0?1:2;break}if((Kb(g+14448|0,g+14483|0)|0)!=0){j=(h|0)!=0?1:2;break}k=Mb(g+14448|0)|0;do{if((h|0)!=0){if((k|0)==0){break}j=5;break a}}while(0);do{if((h|0)!=0){if((k|0)!=0){break}j=4;break a}}while(0);do{if((h|0)==0){if((k|0)!=0){break}j=6;break a}}while(0);do{if((h|0)==0){if((k|0)==0){break}j=7;break a}}while(0);sa(4496,13472,1170,15448);return 0}}while(0);i=f;return j|0}function Uf(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;i=i+64|0;h=g|0;j=g+24|0;k=g+32|0;l=g+40|0;m=g+48|0;n=g+56|0;o=b;b=d;d=e;e=f;c[h>>2]=c[o+14452>>2];c[h+4>>2]=(c[o+14456>>2]|0)-(c[o+14452>>2]|0);f=h+8|0;c[f>>2]=0;c[f+4>>2]=0;c[h+16>>2]=0;f=c[(c[o+14628>>2]|0)+2243436>>2]|0;p=a[f+4673|0]|0;q=a[f+4674|0]|0;r=1<<e;s=1<<e-1;td(c[(c[o+14628>>2]|0)+2287824>>2]|0,0,j,m);td(c[(c[o+14628>>2]|0)+2287824>>2]|0,1,k,n);td(c[(c[o+14628>>2]|0)+2287824>>2]|0,2,l,n);e=(ba(d,c[m>>2]|0)|0)+b|0;c[j>>2]=(c[j>>2]|0)+e;e=(ba((d|0)/2|0,c[n>>2]|0)|0)+((b|0)/2|0)|0;c[k>>2]=(c[k>>2]|0)+e;e=(ba((d|0)/2|0,c[n>>2]|0)|0)+((b|0)/2|0)|0;c[l>>2]=(c[l>>2]|0)+e;e=(c[f+4868>>2]|0)-p|0;b=(c[f+4876>>2]|0)-q|0;f=0;while(1){if((f|0)>=(r|0)){break}d=0;while(1){if((d|0)>=(r|0)){break}t=(Cb(h,p)|0)<<e&255;u=(ba(f,c[m>>2]|0)|0)+d|0;a[(c[j>>2]|0)+u|0]=t;d=d+1|0}f=f+1|0}f=0;while(1){if((f|0)>=(s|0)){break}j=0;while(1){if((j|0)>=(s|0)){break}m=(Cb(h,q)|0)<<b&255;e=(ba(f,c[n>>2]|0)|0)+j|0;a[(c[k>>2]|0)+e|0]=m;j=j+1|0}f=f+1|0}f=0;while(1){if((f|0)>=(s|0)){break}k=0;while(1){if((k|0)>=(s|0)){break}j=(Cb(h,q)|0)<<b&255;m=(ba(f,c[n>>2]|0)|0)+k|0;a[(c[l>>2]|0)+m|0]=j;k=k+1|0}f=f+1|0}Fb(h);c[o+14452>>2]=c[h>>2];Jb(o+14448|0);i=g;return}function Vf(a){a=a|0;var b=0,c=0;b=i;c=a;a=Kb(c+14448|0,c+14484|0)|0;i=b;return a|0}function Wf(a){a=a|0;var b=0,c=0;b=i;c=Nb(a+14448|0,2)|0;i=b;return c|0}function Xf(a){a=a|0;var b=0,c=0;b=i;c=Pb(a+14448|0,5)|0;i=b;return c|0}function Yf(a){a=a|0;var b=0,c=0,d=0,e=0;b=i;c=a;if((Kb(c+14448|0,c+14485|0)|0)==0){d=4;e=d;i=b;return e|0}else{d=Pb(c+14448|0,2)|0;e=d;i=b;return e|0}return 0}function Zf(a){a=a|0;var b=0,c=0;b=i;c=a;a=Kb(c+14448|0,c+14617|0)|0;i=b;return a|0}function _f(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;g=a;a=b;b=d;d=e;e=c[g+14628>>2]|0;h=sf(e,c[g+14632>>2]|0,a,b,a-1|0,b)|0;j=sf(e,c[g+14632>>2]|0,a,b,a,b-1|0)|0;k=0;l=0;do{if((h|0)!=0){if((Nd(c[e+2287824>>2]|0,c[e+2243436>>2]|0,a-1|0,b)|0)<=(d|0)){break}k=1}}while(0);do{if((j|0)!=0){if((Nd(c[e+2287824>>2]|0,c[e+2243436>>2]|0,a,b-1|0)|0)<=(d|0)){break}l=1}}while(0);d=Kb(g+14448|0,g+14472+(k+l+2)|0)|0;i=f;return d|0}function $f(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;h=b;b=d&1;d=e;e=f;f=c[h+14628>>2]|0;j=c[f+2243440>>2]|0;k=c[f+2243436>>2]|0;l=c[k+4928>>2]|0;while(1){m=c[h+12>>2]|0;n=c[h+16>>2]|0;do{if(b&1){if((n|0)<=0){break}if((m|0)>=(l-1|0)){break}o=m+1+(ba(n-1|0,l)|0)|0;ah((c[(c[f+2287824>>2]|0)+184>>2]|0)+(o*76|0)|0,1)|0}}while(0);pf(f,h);do{if((a[j+33|0]|0)!=0){if((m|0)!=(d|0)){break}if((n+1|0)>=(c[k+4936>>2]|0)){break}if((e|0)!=0){}else{sa(4536,13472,3764,15392);return 0}Wh(e|0,h+14472|0,154)|0}}while(0);o=m+(ba(n,l)|0)|0;bh((c[(c[f+2287824>>2]|0)+184>>2]|0)+(o*76|0)|0,1);o=Lb(h+14448|0)|0;p=c[h+16>>2]|0;if((gf(h)|0)&1){if((o|0)==0){q=14;break}}if((o|0)!=0){q=16;break}if((o|0)==0){o=0;if((a[j+34|0]|0)!=0){r=(c[(c[j+224>>2]|0)+(c[h+8>>2]<<2)>>2]|0)!=(c[(c[j+224>>2]|0)+((c[h+8>>2]|0)-1<<2)>>2]|0)}else{r=0}o=(o&1|r&1|0)!=0|0;if((a[j+33|0]|0)!=0){s=(p|0)!=(c[h+16>>2]|0)}else{s=0}o=(o&1|s&1|0)!=0|0;if(o&1){q=23;break}}if(!1){q=29;break}}if((q|0)==14){ed(f,1004,0);a[(c[f+2287824>>2]|0)+180|0]=3;t=2;u=t;i=g;return u|0}else if((q|0)==16){t=0;u=t;i=g;return u|0}else if((q|0)==23){if((Lb(h+14448|0)|0)!=0){Jb(h+14448|0);t=1;u=t;i=g;return u|0}else{ed(f,1017,0);a[(c[f+2287824>>2]|0)+180|0]=3;t=2;u=t;i=g;return u|0}}else if((q|0)==29){u=t;i=g;return u|0}return 0}function ag(a){a=a|0;var b=0,d=0,e=0;b=i;d=a;a=c[d+8>>2]|0;e=a+2288992+((c[d>>2]|0)*14640|0)|0;ff(e)|0;df(a,e);Jb(e+14448|0);$f(e,0,-1,0)|0;wd(c[a+2287824>>2]|0,1);i=b;return}function bg(b){b=b|0;var d=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;d=i;f=b;b=c[f+8>>2]|0;g=b+2288992+((c[f>>2]|0)*14640|0)|0;h=c[b+2243436>>2]|0;j=c[h+4928>>2]|0;ff(g)|0;k=(c[g+4>>2]|0)/(j|0)|0;l=k;if(a[f+4|0]&1){df(b,g)}Jb(g+14448|0);f=0;if((k+1|0)<(c[h+4936>>2]|0)){m=ba(k+1|0,j)|0;f=e[(c[(c[b+2287824>>2]|0)+108>>2]|0)+(m*24|0)+22>>1]|0}$f(g,1,1,b+2288992+(f*14640|0)+14472|0)|0;if((c[g+16>>2]|0)!=(l|0)){n=b;o=n+2287824|0;p=c[o>>2]|0;wd(p,1);i=d;return}f=c[h+4928>>2]|0;h=c[g+12>>2]|0;while(1){if((h|0)>=(f|0)){break}g=(ba(l,j)|0)+h|0;bh((c[(c[b+2287824>>2]|0)+184>>2]|0)+(g*76|0)|0,1);h=h+1|0}n=b;o=n+2287824|0;p=c[o>>2]|0;wd(p,1);i=d;return}function cg(b,d){b=b|0;d=d|0;var f=0,g=0,h=0,j=0,k=0;f=i;g=b;b=d;ff(b)|0;d=c[g+2243440>>2]|0;h=c[b+14632>>2]|0;if((a[h+12|0]|0)!=0){j=g+1465192+((e[(c[(c[g+2287824>>2]|0)+108>>2]|0)+((c[(c[d+220>>2]|0)+((c[(c[d+216>>2]|0)+(c[h+16>>2]<<2)>>2]|0)-1<<2)>>2]|0)*24|0)+2>>1]|0)*1520|0)|0;if(ze(d,(c[h+16>>2]|0)%(c[(c[g+2243436>>2]|0)+4928>>2]|0)|0,(c[h+16>>2]|0)/(c[(c[g+2243436>>2]|0)+4928>>2]|0)|0)|0){df(g,b)}else{Wh(b+14472|0,j+1364|0,154)|0}}else{df(g,b)}Jb(b+14448|0);while(1){j=$f(b,0,1,h+1364|0)|0;if((j|0)==0){break}if((j|0)==2){break}if((a[(c[g+2243440>>2]|0)+33|0]|0)!=0){Wh(b+14472|0,h+1364|0,154)|0}if((a[(c[g+2243440>>2]|0)+34|0]|0)!=0){df(g,b)}if(!1){k=19;break}}if((k|0)==19){i=f;return 0}if((a[d+3|0]|0)!=0){Wh(h+1364|0,b+14472|0,154)|0}i=f;return 0}function dg(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;b=i;h=e;e=f;f=g;g=((f>>4)*5|0)-45|0;j=((f&15)<<3)-16|0;f=g;if((c[h+1056>>2]|0)<0){k=0}else{if((c[h+1056>>2]|0)>51){l=51}else{l=c[h+1056>>2]|0}k=l}if((((ba(f,k)|0)>>4)+j|0)<1){m=1}else{k=g;if((c[h+1056>>2]|0)<0){n=0}else{if((c[h+1056>>2]|0)>51){o=51}else{o=c[h+1056>>2]|0}n=o}if((((ba(k,n)|0)>>4)+j|0)>126){p=126}else{n=g;if((c[h+1056>>2]|0)<0){q=0}else{if((c[h+1056>>2]|0)>51){r=51}else{r=c[h+1056>>2]|0}q=r}p=((ba(n,q)|0)>>4)+j|0}m=p}p=m;m=e;a[m]=a[m]&-2|((p|0)<=63?0:1)&1;if((a[e]&1|0)!=0){s=p-64|0}else{s=63-p|0}p=e;a[p]=a[p]&1|(s&127)<<1;if(((d[e]|0)>>>1&255|0)>=0){}else{sa(4352,13472,885,14376)}if(((d[e]|0)>>>1&255|0)<=62){t=1;u=t&1;i=b;return}sa(4328,13472,886,14376);u=t&1;i=b;return}function eg(a){a=a|0;var b=0;b=i;Yh(a|0,0,5028)|0;i=b;return}function fg(a){a=a|0;var b=0,d=0;b=i;d=a;Ph(c[d+4692>>2]|0);c[d+4692>>2]=0;i=b;return}function gg(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;g=b;b=d;d=e;a[d+1|0]=Cb(b,4)|0;a[d+2|0]=(Cb(b,3)|0)+1;if((a[d+2|0]|0)>7){h=8;j=h;i=f;return j|0}a[d+3|0]=Cb(b,1)|0;tg(b,d+4|0,a[d+2|0]|0);c[d+440>>2]=Gb(b)|0;c[d+444>>2]=Gb(b)|0;if((c[d+444>>2]|0)==3){a[d+448|0]=Cb(b,1)|0}else{a[d+448|0]=0}if((a[d+448|0]|0)!=0){c[d+4884>>2]=0}else{c[d+4884>>2]=c[d+444>>2]}do{if((c[d+444>>2]|0)>=0){if((c[d+444>>2]|0)>3){break}c[d+4888>>2]=c[15728+(c[d+444>>2]<<2)>>2];c[d+4892>>2]=c[15744+(c[d+444>>2]<<2)>>2];c[d+452>>2]=Gb(b)|0;c[d+456>>2]=Gb(b)|0;a[d+460|0]=Cb(b,1)|0;if((a[d+460|0]|0)!=0){c[d+464>>2]=Gb(b)|0;c[d+468>>2]=Gb(b)|0;c[d+472>>2]=Gb(b)|0;c[d+476>>2]=Gb(b)|0}else{c[d+464>>2]=0;c[d+468>>2]=0;c[d+472>>2]=0;c[d+476>>2]=0}if((c[d+4884>>2]|0)==0){c[d+4896>>2]=1;c[d+4900>>2]=1}else{c[d+4896>>2]=c[15728+(c[d+444>>2]<<2)>>2];c[d+4900>>2]=c[15744+(c[d+444>>2]<<2)>>2]}c[d+480>>2]=(Gb(b)|0)+8;c[d+484>>2]=(Gb(b)|0)+8;c[d+488>>2]=(Gb(b)|0)+4;c[d+4904>>2]=1<<c[d+488>>2];a[d+492|0]=Cb(b,1)|0;if((a[d+492|0]|0)!=0){k=0}else{k=(a[d+2|0]|0)-1|0}e=k;while(1){if((e|0)>((a[d+2|0]|0)-1|0)){l=32;break}m=Gb(b)|0;if((m|0)==-99999){l=25;break}if((m+1|0)>16){l=25;break}c[d+496+(e<<2)>>2]=m+1;m=Gb(b)|0;if((m|0)==-99999){l=27;break}c[d+524+(e<<2)>>2]=m;m=Gb(b)|0;if((m|0)==-99999){l=29;break}c[d+552+(e<<2)>>2]=m;c[d+5e3+(e<<2)>>2]=(c[d+524+(e<<2)>>2]|0)+(c[d+552+(e<<2)>>2]|0)-1;e=e+1|0}if((l|0)==25){ed(g,8,0);h=8;j=h;i=f;return j|0}else if((l|0)==27){ed(g,8,0);h=8;j=h;i=f;return j|0}else if((l|0)==29){ed(g,8,0);h=8;j=h;i=f;return j|0}else if((l|0)==32){if((a[d+492|0]|0)!=0){e=(a[d+2|0]|0)-1|0;if((e|0)<7){}else{sa(7200,13376,192,14504);return 0}m=0;while(1){if((m|0)>=((a[d+2|0]|0)-1|0)){break}c[d+496+(m<<2)>>2]=c[d+496+(e<<2)>>2];c[d+524+(m<<2)>>2]=c[d+524+(e<<2)>>2];c[d+552+(m<<2)>>2]=c[d+552+(e<<2)>>2];m=m+1|0}}c[d+580>>2]=(Gb(b)|0)+3;c[d+584>>2]=Gb(b)|0;c[d+588>>2]=(Gb(b)|0)+2;c[d+592>>2]=Gb(b)|0;c[d+596>>2]=Gb(b)|0;c[d+600>>2]=Gb(b)|0;a[d+604|0]=Cb(b,1)|0;if((a[d+604|0]|0)!=0){a[d+605|0]=Cb(b,1)|0;do{if((a[d+605|0]|0)!=0){m=hg(b,d,d+606|0,0)|0;if((m|0)==0){break}h=m;j=h;i=f;return j|0}else{ig(d+606|0)}}while(0)}a[d+4670|0]=Cb(b,1)|0;a[d+4671|0]=Cb(b,1)|0;a[d+4672|0]=Cb(b,1)|0;if((a[d+4672|0]|0)!=0){a[d+4673|0]=(Cb(b,4)|0)+1;a[d+4674|0]=(Cb(b,4)|0)+1;c[d+4676>>2]=(Gb(b)|0)+3;c[d+4680>>2]=Gb(b)|0;a[d+4684|0]=Cb(b,1)|0}else{a[d+4673|0]=0;a[d+4674|0]=0;c[d+4676>>2]=0;c[d+4680>>2]=0;a[d+4684|0]=0}c[d+4688>>2]=Gb(b)|0;do{if((c[d+4688>>2]|0)>=0){if((c[d+4688>>2]|0)>64){break}c[d+4692>>2]=Rh(c[d+4692>>2]|0,(c[d+4688>>2]|0)*100|0)|0;m=0;while(1){if((m|0)>=(c[d+4688>>2]|0)){break}if(!((Ee(g,d,b,(c[d+4692>>2]|0)+(m*100|0)|0,m,c[d+4692>>2]|0,0)|0)&1)){l=56;break}m=m+1|0}if((l|0)==56){h=1005;j=h;i=f;return j|0}a[d+4696|0]=Cb(b,1)|0;if((a[d+4696|0]|0)!=0){c[d+4700>>2]=Gb(b)|0;if((c[d+4700>>2]|0)>32){h=8;j=h;i=f;return j|0}m=0;while(1){if((m|0)>=(c[d+4700>>2]|0)){break}c[d+4704+(m<<2)>>2]=Cb(b,c[d+488>>2]|0)|0;a[d+4832+m|0]=Cb(b,1)|0;m=m+1|0}}else{c[d+4700>>2]=0}a[d+4864|0]=Cb(b,1)|0;a[d+4865|0]=Cb(b,1)|0;a[d+4866|0]=Cb(b,1)|0;c[d+4868>>2]=c[d+480>>2];c[d+4872>>2]=((c[d+480>>2]|0)-8|0)*6|0;c[d+4876>>2]=c[d+484>>2];c[d+4880>>2]=((c[d+484>>2]|0)-8|0)*6|0;c[d+4908>>2]=c[d+580>>2];c[d+4912>>2]=(c[d+4908>>2]|0)+(c[d+584>>2]|0);c[d+4916>>2]=1<<c[d+4908>>2];c[d+4920>>2]=1<<c[d+4912>>2];c[d+4924>>2]=(c[d+452>>2]|0)/(c[d+4916>>2]|0)|0;c[d+4928>>2]=mg(c[d+452>>2]|0,c[d+4920>>2]|0)|0;c[d+4932>>2]=(c[d+456>>2]|0)/(c[d+4916>>2]|0)|0;c[d+4936>>2]=mg(c[d+456>>2]|0,c[d+4920>>2]|0)|0;c[d+4940>>2]=ba(c[d+4924>>2]|0,c[d+4932>>2]|0)|0;c[d+4944>>2]=ba(c[d+4928>>2]|0,c[d+4936>>2]|0)|0;c[d+4948>>2]=ba(c[d+452>>2]|0,c[d+456>>2]|0)|0;do{if((c[d+444>>2]|0)==0){l=70}else{if((a[d+448|0]|0)!=0){l=70;break}c[d+4952>>2]=(c[d+4920>>2]|0)/(c[d+4888>>2]|0)|0;c[d+4956>>2]=(c[d+4920>>2]|0)/(c[d+4892>>2]|0)|0}}while(0);if((l|0)==70){c[d+4952>>2]=0;c[d+4956>>2]=0}c[d+4972>>2]=c[d+588>>2];c[d+4976>>2]=(c[d+588>>2]|0)+(c[d+592>>2]|0);c[d+4980>>2]=(c[d+4908>>2]|0)-1;c[d+4984>>2]=c[d+4928>>2]<<(c[d+4912>>2]|0)-(c[d+4980>>2]|0);c[d+4988>>2]=c[d+4936>>2]<<(c[d+4912>>2]|0)-(c[d+4980>>2]|0);c[d+4992>>2]=c[d+4676>>2];c[d+4996>>2]=(c[d+4676>>2]|0)+(c[d+4680>>2]|0);c[d+4960>>2]=c[d+4928>>2]<<(c[d+4912>>2]|0)-(c[d+4972>>2]|0);c[d+4964>>2]=c[d+4936>>2]<<(c[d+4912>>2]|0)-(c[d+4972>>2]|0);c[d+4968>>2]=ba(c[d+4960>>2]|0,c[d+4964>>2]|0)|0;a[d|0]=1;h=0;j=h;i=f;return j|0}}while(0);ed(g,1014,0);h=8;j=h;i=f;return j|0}}}while(0);ed(g,1019,0);h=8;j=h;i=f;return j|0}function hg(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;f=i;i=i+6240|0;d=f|0;g=f+96|0;h=b;b=e;e=0;a:while(1){if((e|0)>=4){j=52;break}k=(e|0)==3?2:6;l=0;while(1){if((l|0)>=(k|0)){break}m=g+(l<<10)|0;n=l;do{if((e|0)==3){if((l|0)!=1){break}n=3}}while(0);if(((Cb(h,1)|0)&255)<<24>>24!=0){o=8;p=(e|0)==0?16:64;if((e|0)>1){q=Hb(h)|0;if((q|0)<-7){j=29;break a}if((q|0)>247){j=29;break a}q=q+8|0;o=q;c[d+(e*24|0)+(l<<2)>>2]=q}else{q=16}r=0;while(1){if((r|0)>=(p|0)){break}s=Hb(h)|0;if((s|0)<-128){j=36;break a}if((s|0)>127){j=36;break a}o=(o+s+256|0)%256|0;if((o|0)<0){j=39;break a}if((o|0)>255){j=39;break a}a[m+r|0]=o;r=r+1|0}}else{r=Gb(h)|0;if((r|0)<0){j=11;break a}if((r|0)>(l|0)){j=11;break a}c[d+(e*24|0)+(l<<2)>>2]=16;q=16;if((r|0)==0){if((e|0)==0){Wh(m|0,3616,16)|0}else{if((n|0)<3){Wh(m|0,3488,64)|0}else{Wh(m|0,3552,64)|0}}}else{if((e|0)==3){if((r|0)==1){}else{sa(4680,13376,675,14552);return 0}}o=l-r|0;Wh(m|0,g+(o<<10)|0,(e|0)==0?16:64)|0;q=c[d+(e*24|0)+(o<<2)>>2]|0;c[d+(e*24|0)+(l<<2)>>2]=c[d+(e*24|0)+(o<<2)>>2]}}o=e;if((o|0)==2){kg(b+480+(l<<8)|0,m,2);a[b+480+(l<<8)|0]=q}else if((o|0)==3){kg(b+2016+(l<<10)|0,m,3);a[b+2016+(l<<10)|0]=q}else if((o|0)==0){kg(b+(l<<4)|0,m,0)}else if((o|0)==1){kg(b+96+(l<<6)|0,m,1)}l=l+1|0}e=e+1|0}if((j|0)==11){t=8;u=t;i=f;return u|0}else if((j|0)==29){t=8;u=t;i=f;return u|0}else if((j|0)==36){t=8;u=t;i=f;return u|0}else if((j|0)==39){t=8;u=t;i=f;return u|0}else if((j|0)==52){t=0;u=t;i=f;return u|0}return 0}function ig(a){a=a|0;var b=0,c=0;b=i;c=a;a=0;while(1){if((a|0)>=6){break}kg(c+(a<<4)|0,3616,0);a=a+1|0}a=0;while(1){if((a|0)>=3){break}kg(c+96+(a<<6)|0,3488,1);kg(c+96+(a+3<<6)|0,3552,1);a=a+1|0}a=0;while(1){if((a|0)>=3){break}kg(c+480+(a<<8)|0,3488,2);kg(c+480+(a+3<<8)|0,3552,2);a=a+1|0}kg(c+2016|0,3488,3);kg(c+3040|0,3552,3);i=b;return}function jg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;f=b;b=d;do{if((b|0)==1){g=c[p>>2]|0}else{if((b|0)==2){g=c[o>>2]|0;break}else{i=e;return}}}while(0);rg(g,11024,(b=i,i=i+1|0,i=i+7&-8,c[b>>2]=0,b)|0);i=b;rg(g,8936,(b=i,i=i+8|0,c[b>>2]=a[f+1|0]|0,b)|0);i=b;rg(g,6736,(b=i,i=i+8|0,c[b>>2]=a[f+2|0]|0,b)|0);i=b;rg(g,5288,(b=i,i=i+8|0,c[b>>2]=a[f+3|0]|0,b)|0);i=b;vg(f+4|0,a[f+2|0]|0,g);rg(g,4504,(b=i,i=i+8|0,c[b>>2]=c[f+440>>2],b)|0);i=b;d=g;h=c[f+444>>2]|0;if((c[f+444>>2]|0)==1){j=3960}else{if((c[f+444>>2]|0)==2){k=3696}else{k=(c[f+444>>2]|0)==3?14232:14032}j=k}rg(d,4184,(b=i,i=i+16|0,c[b>>2]=h,c[b+8>>2]=j,b)|0);i=b;if((c[f+444>>2]|0)==3){rg(g,13800,(b=i,i=i+8|0,c[b>>2]=a[f+448|0]|0,b)|0);i=b}rg(g,13528,(b=i,i=i+8|0,c[b>>2]=c[f+452>>2],b)|0);i=b;rg(g,13232,(b=i,i=i+8|0,c[b>>2]=c[f+456>>2],b)|0);i=b;rg(g,12864,(b=i,i=i+8|0,c[b>>2]=a[f+460|0]|0,b)|0);i=b;if((a[f+460|0]|0)!=0){rg(g,12632,(b=i,i=i+8|0,c[b>>2]=c[f+464>>2],b)|0);i=b;rg(g,12376,(b=i,i=i+8|0,c[b>>2]=c[f+468>>2],b)|0);i=b;rg(g,12168,(b=i,i=i+8|0,c[b>>2]=c[f+472>>2],b)|0);i=b;rg(g,11960,(b=i,i=i+8|0,c[b>>2]=c[f+476>>2],b)|0);i=b}rg(g,11792,(b=i,i=i+8|0,c[b>>2]=c[f+480>>2],b)|0);i=b;rg(g,11592,(b=i,i=i+8|0,c[b>>2]=c[f+484>>2],b)|0);i=b;rg(g,11360,(b=i,i=i+8|0,c[b>>2]=c[f+488>>2],b)|0);i=b;rg(g,11144,(b=i,i=i+8|0,c[b>>2]=a[f+492|0]|0,b)|0);i=b;if((a[f+492|0]|0)!=0){l=0}else{l=(a[f+2|0]|0)-1|0}j=l;while(1){if((j|0)>((a[f+2|0]|0)-1|0)){break}rg(g,10936,(b=i,i=i+8|0,c[b>>2]=j,b)|0);i=b;rg(g,10728,(b=i,i=i+8|0,c[b>>2]=c[f+496+(j<<2)>>2],b)|0);i=b;rg(g,10480,(b=i,i=i+8|0,c[b>>2]=c[f+524+(j<<2)>>2],b)|0);i=b;rg(g,10296,(b=i,i=i+8|0,c[b>>2]=c[f+552+(j<<2)>>2],b)|0);i=b;j=j+1|0}rg(g,10128,(b=i,i=i+8|0,c[b>>2]=c[f+580>>2],b)|0);i=b;rg(g,9912,(b=i,i=i+8|0,c[b>>2]=c[f+584>>2],b)|0);i=b;rg(g,9712,(b=i,i=i+8|0,c[b>>2]=c[f+588>>2],b)|0);i=b;rg(g,9440,(b=i,i=i+8|0,c[b>>2]=c[f+592>>2],b)|0);i=b;rg(g,9232,(b=i,i=i+8|0,c[b>>2]=c[f+596>>2],b)|0);i=b;rg(g,9056,(b=i,i=i+8|0,c[b>>2]=c[f+600>>2],b)|0);i=b;rg(g,8816,(b=i,i=i+8|0,c[b>>2]=a[f+604|0]|0,b)|0);i=b;if((a[f+604|0]|0)!=0){rg(g,8512,(b=i,i=i+8|0,c[b>>2]=a[f+605|0]|0,b)|0);i=b;if((a[f+605|0]|0)!=0){rg(g,8328,(b=i,i=i+1|0,i=i+7&-8,c[b>>2]=0,b)|0);i=b}}rg(g,8104,(b=i,i=i+8|0,c[b>>2]=a[f+4670|0]|0,b)|0);i=b;rg(g,7904,(b=i,i=i+8|0,c[b>>2]=a[f+4671|0]|0,b)|0);i=b;rg(g,7688,(b=i,i=i+8|0,c[b>>2]=a[f+4672|0]|0,b)|0);i=b;if((a[f+4672|0]|0)!=0){rg(g,7416,(b=i,i=i+8|0,c[b>>2]=a[f+4673|0]|0,b)|0);i=b;rg(g,7224,(b=i,i=i+8|0,c[b>>2]=a[f+4674|0]|0,b)|0);i=b;rg(g,6984,(b=i,i=i+8|0,c[b>>2]=c[f+4676>>2],b)|0);i=b;rg(g,6840,(b=i,i=i+8|0,c[b>>2]=c[f+4680>>2],b)|0);i=b;rg(g,6656,(b=i,i=i+8|0,c[b>>2]=a[f+4684|0]|0,b)|0);i=b}rg(g,6432,(b=i,i=i+8|0,c[b>>2]=c[f+4688>>2],b)|0);i=b;j=0;while(1){if((j|0)>=(c[f+4688>>2]|0)){break}rg(g,6288,(b=i,i=i+8|0,c[b>>2]=j,b)|0);i=b;Ge((c[f+4692>>2]|0)+(j*100|0)|0,16,g);j=j+1|0}rg(g,6160,(b=i,i=i+8|0,c[b>>2]=a[f+4696|0]|0,b)|0);i=b;if((a[f+4696|0]|0)!=0){rg(g,6024,(b=i,i=i+8|0,c[b>>2]=c[f+4700>>2],b)|0);i=b;j=0;while(1){if((j|0)>=(c[f+4700>>2]|0)){break}l=c[f+4704+(j<<2)>>2]|0;h=a[f+4832+j|0]|0;rg(g,5896,(b=i,i=i+24|0,c[b>>2]=j,c[b+8>>2]=l,c[b+16>>2]=h,b)|0);i=b;j=j+1|0}}rg(g,5808,(b=i,i=i+8|0,c[b>>2]=a[f+4864|0]|0,b)|0);i=b;rg(g,5632,(b=i,i=i+8|0,c[b>>2]=a[f+4865|0]|0,b)|0);i=b;rg(g,5488,(b=i,i=i+8|0,c[b>>2]=a[f+4866|0]|0,b)|0);i=b;rg(g,5432,(b=i,i=i+8|0,c[b>>2]=c[f+4920>>2],b)|0);i=b;rg(g,5264,(b=i,i=i+8|0,c[b>>2]=c[f+4916>>2],b)|0);i=b;rg(g,5152,(b=i,i=i+8|0,c[b>>2]=1<<(c[f+580>>2]|0)+(c[f+584>>2]|0),b)|0);i=b;rg(g,5072,(b=i,i=i+8|0,c[b>>2]=1<<c[f+588>>2],b)|0);i=b;rg(g,5024,(b=i,i=i+8|0,c[b>>2]=1<<(c[f+588>>2]|0)+(c[f+592>>2]|0),b)|0);i=b;rg(g,4912,(b=i,i=i+8|0,c[b>>2]=c[f+4888>>2],b)|0);i=b;rg(g,4848,(b=i,i=i+8|0,c[b>>2]=c[f+4892>>2],b)|0);i=b;i=e;return}function kg(b,c,e){b=b|0;c=c|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;g=b;b=c;c=e;if((c|0)==1){h=8;j=1;k=Je(3,0)|0;e=0;while(1){if((e|0)>=64){break}a[g+((d[k+(e<<1)|0]|0)+(ba(h,d[k+(e<<1)+1|0]|0)|0))|0]=a[b+e|0]|0;e=e+1|0}i=f;return}else if((c|0)==2){h=8;j=2;k=Je(3,0)|0;e=0;while(1){if((e|0)>=64){break}l=0;while(1){if((l|0)>=2){break}m=0;while(1){if((m|0)>=2){break}a[g+(((d[k+(e<<1)|0]|0)<<1)+m+(ba(ba(h,j)|0,((d[k+(e<<1)+1|0]|0)<<1)+l|0)|0))|0]=a[b+e|0]|0;m=m+1|0}l=l+1|0}e=e+1|0}i=f;return}else if((c|0)==0){h=4;j=1;k=Je(2,0)|0;e=0;while(1){if((e|0)>=16){break}a[g+((d[k+(e<<1)|0]|0)+(ba(h,d[k+(e<<1)+1|0]|0)|0))|0]=a[b+e|0]|0;e=e+1|0}i=f;return}else if((c|0)==3){h=8;j=4;k=Je(3,0)|0;c=0;while(1){if((c|0)>=64){break}e=0;while(1){if((e|0)>=4){break}l=0;while(1){if((l|0)>=4){break}a[g+(((d[k+(c<<1)|0]|0)<<2)+l+(ba(ba(h,j)|0,((d[k+(c<<1)+1|0]|0)<<2)+e|0)|0))|0]=a[b+c|0]|0;l=l+1|0}e=e+1|0}c=c+1|0}i=f;return}else{sa(4792,13376,612,15176)}}function lg(a,b){a=a|0;b=b|0;var c=0,d=0;c=i;d=b;Wh(a|0,d|0,5028)|0;Yh(d|0,0,5028)|0;i=c;return}function mg(a,b){a=a|0;b=b|0;var c=0;c=a;a=b;c=c+(a-1)|0;i=i;return(c|0)/(a|0)|0|0}function ng(a){a=a|0;var b=0,c=0;b=i;c=a;a=0;while(1){if((c|0)<=(1<<a|0)){break}a=a+1|0}i=b;return a|0}function og(a){a=a|0;var b=0,c=0;b=i;c=a;a=0;while(1){if((c|0)<=1){break}a=a+1|0;c=c>>1}i=b;return a|0}function pg(a){a=a|0;c[8116]=a;i=i;return}



function qg(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;b=i;i=i+16|0;f=b|0;g=d;if((c[8112]|0)!=0){i=b;return}if((c[8116]|0)<(c[414]|0)){i=b;return}if((c[870]|0)==0){i=b;return}d=(a[g|0]|0)==42|0;if((d|0)==0){wa(c[p>>2]|0,6016,(h=i,i=i+1|0,i=i+7&-8,c[h>>2]=0,h)|0)|0;i=h}h=f|0;c[h>>2]=e;c[h+4>>2]=0;Ja(c[p>>2]|0,g+((d|0)!=0?1:0)|0,f|0)|0;ya(c[p>>2]|0)|0;i=b;return}function rg(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+16|0;g=f|0;h=d;d=(a[h|0]|0)==42|0;if((d|0)==0){wa(c[p>>2]|0,13056,(j=i,i=i+1|0,i=i+7&-8,c[j>>2]=0,j)|0)|0;i=j}j=g|0;c[j>>2]=e;c[j+4>>2]=0;Ja(b|0,h+((d|0)!=0?1:0)|0,g|0)|0;ya(c[p>>2]|0)|0;i=f;return}function sg(e,f,g){e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0;h=i;j=e;e=f;f=g;g=Cb(e,4)|0;k=g;c[f>>2]=g;if((k|0)>=16){l=8;m=l;i=h;return m|0}Db(e,2);g=(Cb(e,6)|0)+1|0;k=g;c[f+4>>2]=g;if((k|0)!=1){l=8;m=l;i=h;return m|0}g=(Cb(e,3)|0)+1|0;k=g;c[f+8>>2]=g;if((k|0)>=8){l=8;m=l;i=h;return m|0}c[f+12>>2]=Cb(e,1)|0;Db(e,16);tg(e,f+16|0,c[f+8>>2]|0);c[f+452>>2]=Cb(e,1)|0;if((c[f+452>>2]|0)!=0){n=0}else{n=(c[f+8>>2]|0)-1|0}k=n;n=k;while(1){if((n|0)>=(c[f+8>>2]|0)){break}c[f+456+(n*12|0)>>2]=Gb(e)|0;c[f+456+(n*12|0)+4>>2]=Gb(e)|0;c[f+456+(n*12|0)+8>>2]=Gb(e)|0;n=n+1|0}if((c[f+452>>2]|0)==0){if((k|0)<8){}else{sa(5768,13008,65,14464);return 0}n=0;while(1){if((n|0)>=(k|0)){break}c[f+456+(n*12|0)>>2]=c[f+456+(k*12|0)>>2];c[f+456+(n*12|0)+4>>2]=c[f+456+(k*12|0)+4>>2];c[f+456+(n*12|0)+8>>2]=c[f+456+(k*12|0)+8>>2];n=n+1|0}}a[f+552|0]=Cb(e,6)|0;c[f+556>>2]=(Gb(e)|0)+1;do{if((c[f+556>>2]|0)>=0){if((c[f+556>>2]|0)>=1024){break}n=1;while(1){if((n|0)>((c[f+556>>2]|0)-1|0)){break}k=0;while(1){if((k|0)>(d[f+552|0]|0)){break}a[f+560+(n<<6)+k|0]=Cb(e,1)|0;k=k+1|0}n=n+1|0}a[f+66096|0]=Cb(e,1)|0;if((a[f+66096|0]|0)!=0){c[f+66100>>2]=Cb(e,32)|0;c[f+66104>>2]=Cb(e,32)|0;a[f+66108|0]=Cb(e,1)|0;do{if((a[f+66108|0]|0)!=0){c[f+66112>>2]=(Gb(e)|0)+1;c[f+66116>>2]=Gb(e)|0;if((c[f+66116>>2]|0)>=1024){sa(10872,13008,102,14464);return 0}n=0;if((n|0)>=(c[f+66116>>2]|0)){break}b[f+66120+(n<<1)>>1]=Gb(e)|0;if((n|0)>0){a[f+68168+n|0]=Cb(e,1)|0}l=0;m=l;i=h;return m|0}}while(0)}a[f+69192|0]=Cb(e,1)|0;l=0;m=l;i=h;return m|0}}while(0);ed(j,8,0);l=8;m=l;i=h;return m|0}function tg(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;g=b;b=d;d=e;c[b>>2]=Cb(g,2)|0;c[b+4>>2]=Cb(g,1)|0;c[b+8>>2]=Cb(g,5)|0;e=0;while(1){if((e|0)>=32){break}a[b+12+e|0]=Cb(g,1)|0;e=e+1|0}a[b+44|0]=Cb(g,1)|0;a[b+45|0]=Cb(g,1)|0;a[b+46|0]=Cb(g,1)|0;a[b+47|0]=Cb(g,1)|0;Db(g,44);c[b+48>>2]=Cb(g,8)|0;e=0;while(1){if((e|0)>=(d-1|0)){break}a[b+52+(e*48|0)|0]=Cb(g,1)|0;a[b+52+(e*48|0)+40|0]=Cb(g,1)|0;e=e+1|0}if((d|0)>1){e=d-1|0;while(1){if((e|0)>=8){break}Db(g,2);e=e+1|0}}e=0;while(1){if((e|0)>=(d-1|0)){break}if((a[b+52+(e*48|0)|0]|0)!=0){a[b+52+(e*48|0)+1|0]=Cb(g,2)|0;a[b+52+(e*48|0)+2|0]=Cb(g,1)|0;a[b+52+(e*48|0)+3|0]=Cb(g,5)|0;h=0;while(1){if((h|0)>=32){break}a[b+52+(e*48|0)+4+h|0]=Cb(g,1)|0;h=h+1|0}a[b+52+(e*48|0)+36|0]=Cb(g,1)|0;a[b+52+(e*48|0)+37|0]=Cb(g,1)|0;a[b+52+(e*48|0)+38|0]=Cb(g,1)|0;a[b+52+(e*48|0)+39|0]=Cb(g,1)|0;Db(g,44)}if((a[b+52+(e*48|0)+40|0]|0)!=0){c[b+52+(e*48|0)+44>>2]=Cb(g,8)|0}e=e+1|0}i=f;return}function ug(b,f){b=b|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;h=b;b=f;do{if((b|0)==1){j=c[p>>2]|0}else{if((b|0)==2){j=c[o>>2]|0;break}else{i=g;return}}}while(0);rg(j,8680,(b=i,i=i+1|0,i=i+7&-8,c[b>>2]=0,b)|0);i=b;rg(j,6504,(b=i,i=i+8|0,c[b>>2]=c[h>>2],b)|0);i=b;rg(j,5176,(b=i,i=i+8|0,c[b>>2]=c[h+4>>2],b)|0);i=b;rg(j,4448,(b=i,i=i+8|0,c[b>>2]=c[h+8>>2],b)|0);i=b;rg(j,4136,(b=i,i=i+8|0,c[b>>2]=c[h+12>>2],b)|0);i=b;vg(h+16|0,c[h+8>>2]|0,j);rg(j,3912,(b=i,i=i+8|0,c[b>>2]=c[h+452>>2],b)|0);i=b;if((c[h+452>>2]|0)!=0){f=0;while(1){if((f|0)>=(c[h+8>>2]|0)){break}k=c[h+456+(f*12|0)>>2]|0;rg(j,3648,(b=i,i=i+16|0,c[b>>2]=f,c[b+8>>2]=k,b)|0);i=b;rg(j,14184,(b=i,i=i+8|0,c[b>>2]=c[h+456+(f*12|0)+4>>2],b)|0);i=b;rg(j,13984,(b=i,i=i+8|0,c[b>>2]=c[h+456+(f*12|0)+8>>2],b)|0);i=b;f=f+1|0}}else{rg(j,13752,(b=i,i=i+8|0,c[b>>2]=c[h+456>>2],b)|0);i=b;rg(j,13480,(b=i,i=i+8|0,c[b>>2]=c[h+460>>2],b)|0);i=b;rg(j,13184,(b=i,i=i+8|0,c[b>>2]=c[h+464>>2],b)|0);i=b}rg(j,12832,(b=i,i=i+8|0,c[b>>2]=d[h+552|0]|0,b)|0);i=b;rg(j,12600,(b=i,i=i+8|0,c[b>>2]=c[h+556>>2],b)|0);i=b;f=1;while(1){if((f|0)>((c[h+556>>2]|0)-1|0)){break}k=0;while(1){if((k|0)>(d[h+552|0]|0)){break}l=a[h+560+(f<<6)+k|0]|0;rg(j,12336,(b=i,i=i+24|0,c[b>>2]=f,c[b+8>>2]=k,c[b+16>>2]=l,b)|0);i=b;k=k+1|0}f=f+1|0}rg(j,12128,(b=i,i=i+8|0,c[b>>2]=a[h+66096|0]|0,b)|0);i=b;if((a[h+66096|0]|0)!=0){rg(j,11928,(b=i,i=i+8|0,c[b>>2]=c[h+66100>>2],b)|0);i=b;rg(j,11760,(b=i,i=i+8|0,c[b>>2]=c[h+66104>>2],b)|0);i=b;rg(j,11544,(b=i,i=i+8|0,c[b>>2]=a[h+66108|0]|0,b)|0);i=b;do{if((a[h+66108|0]|0)!=0){rg(j,11320,(b=i,i=i+8|0,c[b>>2]=c[h+66112>>2],b)|0);i=b;rg(j,11104,(b=i,i=i+8|0,c[b>>2]=c[h+66116>>2],b)|0);i=b;f=0;if((f|0)>=(c[h+66116>>2]|0)){break}k=e[h+66120+(f<<1)>>1]|0;rg(j,10904,(b=i,i=i+16|0,c[b>>2]=f,c[b+8>>2]=k,b)|0);i=b;if((f|0)>0){k=a[h+68168+f|0]|0;rg(j,10696,(b=i,i=i+16|0,c[b>>2]=f,c[b+8>>2]=k,b)|0);i=b}i=g;return}}while(0)}rg(j,10448,(b=i,i=i+8|0,c[b>>2]=a[h+69192|0]|0,b)|0);i=b;i=g;return}function vg(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;g=b;b=d;d=e;rg(d,10256,(e=i,i=i+8|0,c[e>>2]=c[g>>2],e)|0);i=e;rg(d,10088,(e=i,i=i+8|0,c[e>>2]=c[g+4>>2],e)|0);i=e;rg(d,9872,(e=i,i=i+8|0,c[e>>2]=c[g+8>>2],e)|0);i=e;rg(d,9672,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0);i=e;h=0;while(1){if((h|0)>=32){break}if((h|0)!=0){rg(d,9432,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0);i=e}rg(d,9224,(e=i,i=i+8|0,c[e>>2]=a[g+12+h|0]|0,e)|0);i=e;h=h+1|0}rg(d,9048,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0);i=e;rg(d,8776,(e=i,i=i+8|0,c[e>>2]=c[g+48>>2],e)|0);i=e;h=0;while(1){if((h|0)>=(b-1|0)){break}rg(d,8472,(e=i,i=i+8|0,c[e>>2]=h,e)|0);i=e;if((a[g+52+(h*48|0)|0]|0)!=0){rg(d,8288,(e=i,i=i+8|0,c[e>>2]=a[g+52+(h*48|0)+1|0]|0,e)|0);i=e;rg(d,8064,(e=i,i=i+8|0,c[e>>2]=a[g+52+(h*48|0)+2|0]|0,e)|0);i=e;rg(d,7864,(e=i,i=i+8|0,c[e>>2]=a[g+52+(h*48|0)+3|0]|0,e)|0);i=e;rg(d,7640,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0);i=e;j=0;while(1){if((j|0)>=32){break}if((j|0)!=0){rg(d,7408,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0);i=e}rg(d,7216,(e=i,i=i+8|0,c[e>>2]=a[g+52+(h*48|0)+4+j|0]|0,e)|0);i=e;j=j+1|0}rg(d,6976,(e=i,i=i+1|0,i=i+7&-8,c[e>>2]=0,e)|0);i=e;rg(d,6792,(e=i,i=i+8|0,c[e>>2]=a[g+52+(h*48|0)+36|0]|0,e)|0);i=e;rg(d,6608,(e=i,i=i+8|0,c[e>>2]=a[g+52+(h*48|0)+37|0]|0,e)|0);i=e;rg(d,6376,(e=i,i=i+8|0,c[e>>2]=a[g+52+(h*48|0)+38|0]|0,e)|0);i=e;rg(d,6240,(e=i,i=i+8|0,c[e>>2]=a[g+52+(h*48|0)+39|0]|0,e)|0);i=e}if((a[g+52+(h*48|0)+40|0]|0)!=0){rg(d,6128,(e=i,i=i+8|0,c[e>>2]=c[g+52+(h*48|0)+44>>2],e)|0);i=e}h=h+1|0}i=f;return}function wg(c){c=c|0;var d=0,e=0;d=i;e=c;c=0;while(1){if((c|0)>=2){break}b[e+4+(c<<2)>>1]=0;b[e+4+(c<<2)+2>>1]=0;a[e+c|0]=-1;a[e+2+c|0]=0;c=c+1|0}i=d;return}function xg(e,f,g,h,j,k,l,m,n,o,p){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;var q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;q=i;i=i+14768|0;r=q|0;s=q+9088|0;t=e;e=f;f=g;g=k;k=l;l=m;m=n;n=o;o=p;p=c[t+2243436>>2]|0;u=e&3;v=f&3;w=h+(e>>2)|0;h=j+(f>>2)|0;j=49664+(u<<4)+(v<<2)|0;c[j>>2]=(c[j>>2]|0)+1;j=33224+(n-1<<8)+(o-1<<2)|0;c[j>>2]=(c[j>>2]|0)+1;c[8304]=(c[8304]|0)+1;do{if((e|0)==0){if((f|0)!=0){break}c[12404]=(c[12404]|0)+1}}while(0);f=14-(c[p+4868>>2]|0)|0;e=c[p+452>>2]|0;j=c[p+456>>2]|0;do{if((u|0)==0){if((v|0)!=0){break}do{if((w|0)>=0){if((h|0)<0){x=11;break}if((n+w|0)>(e|0)){x=11;break}if((o+h|0)>(j|0)){x=11;break}c[12414]=(c[12414]|0)+1;c[12406]=(c[12406]|0)+1}else{x=11}}while(0);if((x|0)==11){c[12412]=(c[12412]|0)+1;c[12402]=(c[12402]|0)+1}do{if((w|0)>=0){if((h|0)<0){x=17;break}if((n+w|0)>(e|0)){x=17;break}if((o+h|0)>(j|0)){x=17;break}p=l+((ba(h,m)|0)+w)|0;Xa[c[t+60>>2]&63](g,k,p,m,n,o,r|0)}else{x=17}}while(0);if((x|0)==17){p=0;while(1){if((p|0)>=(o|0)){break}y=0;while(1){if((y|0)>=(n|0)){break}if((y+w|0)<0){z=0}else{if((y+w|0)>(e-1|0)){A=e-1|0}else{A=y+w|0}z=A}B=z;if((p+h|0)<0){C=0}else{if((p+h|0)>(j-1|0)){D=j-1|0}else{D=p+h|0}C=D}b[g+((ba(p,k)|0)+y<<1)>>1]=(d[l+(B+(ba(C,m)|0))|0]|0)<<f;y=y+1|0}p=p+1|0}}i=q;return}}while(0);f=c[3432+(u<<2)>>2]|0;C=c[3464+(u<<2)>>2]|0;D=c[3432+(v<<2)>>2]|0;z=c[3464+(v<<2)>>2]|0;do{if(((-f|0)+w|0)>=0){if(((-D|0)+h|0)<0){x=44;break}if((n+C+w|0)>=(e|0)){x=44;break}if((o+z+h|0)>=(j|0)){x=44;break}E=l+(w+(ba(h,m)|0))|0;F=m}else{x=44}}while(0);if((x|0)==44){x=-D|0;while(1){if((x|0)>=(o+z|0)){break}A=-f|0;while(1){if((A|0)>=(n+C|0)){break}if((A+w|0)<0){G=0}else{if((A+w|0)>(e-1|0)){H=e-1|0}else{H=A+w|0}G=H}p=G;if((x+h|0)<0){I=0}else{if((x+h|0)>(j-1|0)){J=j-1|0}else{J=x+h|0}I=J}a[s+(A+f+((x+D|0)*80|0))|0]=a[l+(p+(ba(I,m)|0))|0]|0;A=A+1|0}x=x+1|0}E=s+((D*80|0)+f)|0;F=80}Xa[c[t+60+(u<<4)+(v<<2)>>2]&63](g,k,E,F,n,o,r|0);r=0;while(1){if((r|0)>=(o|0)){break}F=0;while(1){if((F|0)>=(n|0)){break}F=F+1|0}r=r+1|0}i=q;return}function yg(e,f,g,h,j,k,l,m,n,o,p){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;var q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;q=i;i=i+14448|0;r=q|0;s=q+9088|0;t=e;e=f;f=g;g=k;k=l;l=m;m=n;n=o;o=p;p=c[t+2243436>>2]|0;u=14-(c[p+4876>>2]|0)|0;v=(c[p+452>>2]|0)/(c[p+4888>>2]|0)|0;w=(c[p+456>>2]|0)/(c[p+4892>>2]|0)|0;p=e&7;x=f&7;y=((h|0)/2|0)+(e>>3)|0;e=((j|0)/2|0)+(f>>3)|0;do{if((p|0)==0){if((x|0)!=0){break}do{if((y|0)>=0){if((n+y|0)>(v|0)){z=8;break}if((e|0)<0){z=8;break}if((o+e|0)>(w|0)){z=8;break}f=l+(y+(ba(e,m)|0))|0;bb[c[t+44>>2]&7](g,k,f,m,n,o,0,0,0)}else{z=8}}while(0);if((z|0)==8){f=0;while(1){if((f|0)>=(o|0)){break}j=0;while(1){if((j|0)>=(n|0)){break}if((j+y|0)<0){A=0}else{if((j+y|0)>(v-1|0)){B=v-1|0}else{B=j+y|0}A=B}h=A;if((f+e|0)<0){C=0}else{if((f+e|0)>(w-1|0)){D=w-1|0}else{D=f+e|0}C=D}b[g+((ba(f,k)|0)+j<<1)>>1]=(d[l+(h+(ba(C,m)|0))|0]|0)<<u;j=j+1|0}f=f+1|0}}i=q;return}}while(0);u=1;C=1;D=2;A=2;do{if((y|0)>=1){if((n+y|0)>(v-2|0)){z=35;break}if((e|0)<1){z=35;break}if((o+e|0)>(w-2|0)){z=35;break}E=l+(y+(ba(e,m)|0))|0;F=m}else{z=35}}while(0);if((z|0)==35){B=-u|0;while(1){if((B|0)>=(o+A|0)){break}f=-C|0;while(1){if((f|0)>=(n+D|0)){break}if((f+y|0)<0){G=0}else{if((f+y|0)>(v-1|0)){H=v-1|0}else{H=f+y|0}G=H}j=G;if((B+e|0)<0){I=0}else{if((B+e|0)>(w-1|0)){J=w-1|0}else{J=B+e|0}I=J}a[s+(f+C+((B+u|0)*80|0))|0]=a[l+(j+(ba(I,m)|0))|0]|0;f=f+1|0}B=B+1|0}E=s+(C+(u*80|0))|0;F=80}do{if((p|0)!=0){if((x|0)==0){z=59;break}bb[c[t+56>>2]&7](g,k,E,F,n,o,p,x,r|0)}else{z=59}}while(0);if((z|0)==59){if((p|0)!=0){bb[c[t+48>>2]&7](g,k,E,F,n,o,p,x,r|0)}else{if((x|0)==0){sa(13744,13456,345,14912)}bb[c[t+52>>2]&7](g,k,E,F,n,o,p,x,r|0)}}i=q;return}function zg(e,f,g,h,j,k,l,m,n,o){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;p=i;i=i+49160|0;q=p|0;r=p+16384|0;s=p+49152|0;t=e;e=f;f=l;l=m;m=n;n=o;c[8302]=(c[8302]|0)+1;o=g+j|0;j=h+k|0;c[s>>2]=d[n+2|0]|0;c[s+4>>2]=d[n+3|0]|0;if((a[(c[t+2243440>>2]|0)+29|0]|0)==0){do{if((c[s>>2]|0)!=0){if((c[s+4>>2]|0)==0){break}do{if((b[n+4>>1]|0)==(b[n+8>>1]|0)){if((b[n+6>>1]|0)!=(b[n+10>>1]|0)){break}if((c[e+1076+(a[n|0]<<2)>>2]|0)!=(c[e+1140+(a[n+1|0]<<2)>>2]|0)){break}c[s+4>>2]=0}}while(0)}}while(0)}k=0;while(1){if((k|0)>=2){break}if((c[s+(k<<2)>>2]|0)!=0){if((a[n+k|0]|0)>=16){u=14;break}h=t+2280792+((c[e+1076+(k<<6)+(a[n+k|0]<<2)>>2]|0)*272|0)|0;if((c[h+96>>2]|0)==0){a[(c[t+2287824>>2]|0)+180|0]=3;ed(t,1012,0)}else{xg(t,b[n+4+(k<<2)>>1]|0,b[n+4+(k<<2)+2>>1]|0,o,j,q+(k<<13)|0,f,c[h>>2]|0,c[h+44>>2]|0,l,m);yg(t,b[n+4+(k<<2)>>1]|0,b[n+4+(k<<2)+2>>1]|0,o,j,r+(k<<13)|0,f,c[h+4>>2]|0,c[h+48>>2]|0,(l|0)/2|0,(m|0)/2|0);yg(t,b[n+4+(k<<2)>>1]|0,b[n+4+(k<<2)+2>>1]|0,o,j,r+16384+(k<<13)|0,f,c[h+8>>2]|0,c[h+48>>2]|0,(l|0)/2|0,(m|0)/2|0)}}k=k+1|0}if((u|0)==14){a[(c[t+2287824>>2]|0)+180|0]=3;ed(t,1012,0);i=p;return}if((c[e+20>>2]|0)==1){if((a[(c[t+2243440>>2]|0)+29|0]|0)==0){do{if((c[s>>2]|0)==1){if((c[s+4>>2]|0)!=0){u=31;break}do{if((b[n+4>>1]&3|0)==0){if((b[n+6>>1]&3|0)!=0){break}c[12408]=(c[12408]|0)+1}}while(0);k=o+(ba(j,c[(c[t+2287824>>2]|0)+44>>2]|0)|0)|0;cb[c[t+32>>2]&3]((c[c[t+2287824>>2]>>2]|0)+k|0,c[(c[t+2287824>>2]|0)+44>>2]|0,q|0,f,l,m);k=((o|0)/2|0)+(ba((j|0)/2|0,c[(c[t+2287824>>2]|0)+48>>2]|0)|0)|0;cb[c[t+32>>2]&3]((c[(c[t+2287824>>2]|0)+4>>2]|0)+k|0,c[(c[t+2287824>>2]|0)+48>>2]|0,r|0,f,(l|0)/2|0,(m|0)/2|0);k=((o|0)/2|0)+(ba((j|0)/2|0,c[(c[t+2287824>>2]|0)+48>>2]|0)|0)|0;cb[c[t+32>>2]&3]((c[(c[t+2287824>>2]|0)+8>>2]|0)+k|0,c[(c[t+2287824>>2]|0)+48>>2]|0,r+16384|0,f,(l|0)/2|0,(m|0)/2|0)}else{u=31}}while(0);if((u|0)==31){ed(t,1011,0);a[(c[t+2287824>>2]|0)+180|0]=3}}else{do{if((c[s>>2]|0)==1){if((c[s+4>>2]|0)!=0){u=36;break}k=a[n|0]|0;h=(d[e+381|0]|0)+6|0;g=b[e+542+(k<<2)>>1]|0;v=a[e+670+(k<<1)|0]|0;w=b[e+542+(k<<2)+2>>1]|0;x=a[e+670+(k<<1)+1|0]|0;y=o+(ba(j,c[(c[t+2287824>>2]|0)+44>>2]|0)|0)|0;bb[c[t+36>>2]&7]((c[c[t+2287824>>2]>>2]|0)+y|0,c[(c[t+2287824>>2]|0)+44>>2]|0,q|0,f,l,m,b[e+446+(k<<1)>>1]|0,a[e+510+k|0]|0,(d[e+380|0]|0)+6|0);k=((o|0)/2|0)+(ba((j|0)/2|0,c[(c[t+2287824>>2]|0)+48>>2]|0)|0)|0;bb[c[t+36>>2]&7]((c[(c[t+2287824>>2]|0)+4>>2]|0)+k|0,c[(c[t+2287824>>2]|0)+48>>2]|0,r|0,f,(l|0)/2|0,(m|0)/2|0,g,v,h);v=((o|0)/2|0)+(ba((j|0)/2|0,c[(c[t+2287824>>2]|0)+48>>2]|0)|0)|0;bb[c[t+36>>2]&7]((c[(c[t+2287824>>2]|0)+8>>2]|0)+v|0,c[(c[t+2287824>>2]|0)+48>>2]|0,r+16384|0,f,(l|0)/2|0,(m|0)/2|0,w,x,h)}else{u=36}}while(0);if((u|0)==36){ed(t,1011,0);a[(c[t+2287824>>2]|0)+180|0]=3}}}else{if((c[e+20>>2]|0)==0){}else{sa(13144,13456,517,15096)}do{if((c[s>>2]|0)==1){if((c[s+4>>2]|0)!=1){u=52;break}if((a[(c[t+2243440>>2]|0)+30|0]|0)==0){c[12432]=(c[12432]|0)+1;do{if((b[n+4>>1]&3|0)==0){if((b[n+6>>1]&3|0)!=0){break}if((b[n+8>>1]&3|0)!=0){break}if((b[n+10>>1]&3|0)!=0){break}c[12410]=(c[12410]|0)+1}}while(0);h=o+(ba(j|0,c[(c[t+2287824>>2]|0)+44>>2]|0)|0)|0;Xa[c[t+28>>2]&63]((c[c[t+2287824>>2]>>2]|0)+h|0,c[(c[t+2287824>>2]|0)+44>>2]|0,q|0,q+8192|0,f,l,m);h=((o|0)/2|0)+(ba((j|0)/2|0|0,c[(c[t+2287824>>2]|0)+48>>2]|0)|0)|0;x=((o|0)/2|0)+(ba((j|0)/2|0|0,c[(c[t+2287824>>2]|0)+48>>2]|0)|0)|0;w=(c[(c[t+2287824>>2]|0)+8>>2]|0)+x|0;Xa[c[t+28>>2]&63]((c[(c[t+2287824>>2]|0)+4>>2]|0)+h|0,c[(c[t+2287824>>2]|0)+48>>2]|0,r|0,r+8192|0,f,(l|0)/2|0,(m|0)/2|0);Xa[c[t+28>>2]&63](w,c[(c[t+2287824>>2]|0)+48>>2]|0,r+16384|0,r+24576|0,f,(l|0)/2|0,(m|0)/2|0)}else{w=a[n|0]|0;h=a[n+1|0]|0;x=(d[e+381|0]|0)+6|0;v=b[e+542+(w<<2)>>1]|0;g=a[e+670+(w<<1)|0]|0;k=b[e+542+(w<<2)+2>>1]|0;y=a[e+670+(w<<1)+1|0]|0;z=b[e+606+(h<<2)>>1]|0;A=a[e+702+(h<<1)|0]|0;B=b[e+606+(h<<2)+2>>1]|0;C=a[e+702+(h<<1)+1|0]|0;D=o+(ba(j|0,c[(c[t+2287824>>2]|0)+44>>2]|0)|0)|0;Za[c[t+40>>2]&3]((c[c[t+2287824>>2]>>2]|0)+D|0,c[(c[t+2287824>>2]|0)+44>>2]|0,q|0,q+8192|0,f,l,m,b[e+446+(w<<1)>>1]|0,a[e+510+w|0]|0,b[e+478+(h<<1)>>1]|0,a[e+526+h|0]|0,(d[e+380|0]|0)+6|0);h=((o|0)/2|0)+(ba((j|0)/2|0|0,c[(c[t+2287824>>2]|0)+48>>2]|0)|0)|0;w=((o|0)/2|0)+(ba((j|0)/2|0|0,c[(c[t+2287824>>2]|0)+48>>2]|0)|0)|0;D=(c[(c[t+2287824>>2]|0)+8>>2]|0)+w|0;Za[c[t+40>>2]&3]((c[(c[t+2287824>>2]|0)+4>>2]|0)+h|0,c[(c[t+2287824>>2]|0)+48>>2]|0,r|0,r+8192|0,f,(l|0)/2|0,(m|0)/2|0,v,g,z,A,x);Za[c[t+40>>2]&3](D,c[(c[t+2287824>>2]|0)+48>>2]|0,r+16384|0,r+24576|0,f,(l|0)/2|0,(m|0)/2|0,k,y,B,C,x)}}else{u=52}}while(0);if((u|0)==52){do{if((c[s>>2]|0)==1){u=54}else{if((c[s+4>>2]|0)==1){u=54;break}ed(t,1011,0);a[(c[t+2287824>>2]|0)+180|0]=3}}while(0);if((u|0)==54){u=(c[s>>2]|0)!=0?0:1;if((a[(c[t+2243440>>2]|0)+30|0]|0)==0){do{if((b[n+4+(u<<2)>>1]&3|0)==0){if((b[n+4+(u<<2)+2>>1]&3|0)!=0){break}c[12408]=(c[12408]|0)+1}}while(0);s=o+(ba(j,c[(c[t+2287824>>2]|0)+44>>2]|0)|0)|0;cb[c[t+32>>2]&3]((c[c[t+2287824>>2]>>2]|0)+s|0,c[(c[t+2287824>>2]|0)+44>>2]|0,q+(u<<13)|0,f,l,m);s=((o|0)/2|0)+(ba((j|0)/2|0,c[(c[t+2287824>>2]|0)+48>>2]|0)|0)|0;cb[c[t+32>>2]&3]((c[(c[t+2287824>>2]|0)+4>>2]|0)+s|0,c[(c[t+2287824>>2]|0)+48>>2]|0,r+(u<<13)|0,f,(l|0)/2|0,(m|0)/2|0);s=((o|0)/2|0)+(ba((j|0)/2|0,c[(c[t+2287824>>2]|0)+48>>2]|0)|0)|0;cb[c[t+32>>2]&3]((c[(c[t+2287824>>2]|0)+8>>2]|0)+s|0,c[(c[t+2287824>>2]|0)+48>>2]|0,r+16384+(u<<13)|0,f,(l|0)/2|0,(m|0)/2|0)}else{s=a[n+u|0]|0;n=(d[e+381|0]|0)+6|0;x=b[e+542+(u<<6)+(s<<2)>>1]|0;C=a[e+670+(u<<5)+(s<<1)|0]|0;B=b[e+542+(u<<6)+(s<<2)+2>>1]|0;y=a[e+670+(u<<5)+(s<<1)+1|0]|0;k=o+(ba(j,c[(c[t+2287824>>2]|0)+44>>2]|0)|0)|0;bb[c[t+36>>2]&7]((c[c[t+2287824>>2]>>2]|0)+k|0,c[(c[t+2287824>>2]|0)+44>>2]|0,q+(u<<13)|0,f,l,m,b[e+446+(u<<5)+(s<<1)>>1]|0,a[e+510+(u<<4)+s|0]|0,(d[e+380|0]|0)+6|0);e=((o|0)/2|0)+(ba((j|0)/2|0,c[(c[t+2287824>>2]|0)+48>>2]|0)|0)|0;bb[c[t+36>>2]&7]((c[(c[t+2287824>>2]|0)+4>>2]|0)+e|0,c[(c[t+2287824>>2]|0)+48>>2]|0,r+(u<<13)|0,f,(l|0)/2|0,(m|0)/2|0,x,C,n);C=((o|0)/2|0)+(ba((j|0)/2|0,c[(c[t+2287824>>2]|0)+48>>2]|0)|0)|0;bb[c[t+36>>2]&7]((c[(c[t+2287824>>2]|0)+8>>2]|0)+C|0,c[(c[t+2287824>>2]|0)+48>>2]|0,r+16384+(u<<13)|0,f,(l|0)/2|0,(m|0)/2|0,B,y,n)}}}}n=0;while(1){if((n|0)>=(m|0)){break}y=0;while(1){if((y|0)>=(l|0)){break}y=y+1|0}n=n+1|0}n=0;while(1){if((n|0)>=((m|0)/2|0|0)){break}y=0;while(1){if((y|0)>=((l|0)/2|0|0)){break}y=y+1|0}n=n+1|0}n=0;while(1){if((n|0)>=((m|0)/2|0|0)){break}y=0;while(1){if((y|0)>=((l|0)/2|0|0)){break}y=y+1|0}n=n+1|0}i=p;return}function Ag(a){a=a|0;var b=0,d=0;b=i;d=a;a=i;i=i+12|0;i=i+7&-8;c[a>>2]=c[d>>2];c[a+4>>2]=c[d+4>>2];c[a+8>>2]=c[d+8>>2];d=0;while(1){if((d|0)>=2){break}d=d+1|0}i=b;return}function Bg(c,e){c=c|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;g=c;c=e;e=0;while(1){if((e|0)>=2){h=15;break}if((d[g+2+e|0]|0)!=(d[c+2+e|0]|0)){h=4;break}if((a[g+2+e|0]|0)!=0){if((b[g+4+(e<<2)>>1]|0)!=(b[c+4+(e<<2)>>1]|0)){h=7;break}if((b[g+4+(e<<2)+2>>1]|0)!=(b[c+4+(e<<2)+2>>1]|0)){h=9;break}if((a[g+e|0]|0)!=(a[c+e|0]|0)){h=11;break}}e=e+1|0}if((h|0)==4){j=0;k=j;i=f;return k|0}else if((h|0)==7){j=0;k=j;i=f;return k|0}else if((h|0)==9){j=0;k=j;i=f;return k|0}else if((h|0)==11){j=0;k=j;i=f;return k|0}else if((h|0)==15){j=1;k=j;i=f;return k|0}return 0}function Cg(e,f,g,h,j,k,l,m,n,o,p){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;var q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;q=i;r=e;e=f;f=g;g=h;h=j;j=k;k=l;l=m;m=n;n=o;o=p;p=c[(c[r+2243440>>2]|0)+4324>>2]|0;s=Ld(c[r+2287824>>2]|0,c[r+2243436>>2]|0,e,f)|0;t=h-1|0;u=j+m-1|0;do{if((h>>p|0)==(t>>p|0)){if((j>>p|0)!=(u>>p|0)){v=4;break}w=0}else{v=4}}while(0);if((v|0)==4){a:do{if(k<<24>>24!=0){v=10}else{if((n|0)!=1){v=10;break}do{if((s|0)!=2){if((s|0)==6){break}if((s|0)!=7){v=10;break a}}}while(0);w=0}}while(0);if((v|0)==10){w=(nd(r,e,f,g,h,j,l,m,n,t,u)|0)&1;}}if(w&1){a[o|0]=1;x=o+8|0;y=jd(r,t,u)|0;b[x>>1]=b[y>>1]|0;b[x+2>>1]=b[y+2>>1]|0;b[x+4>>1]=b[y+4>>1]|0;b[x+6>>1]=b[y+6>>1]|0;b[x+8>>1]=b[y+8>>1]|0;b[x+10>>1]=b[y+10>>1]|0;Ag(o+8|0)}else{a[o|0]=0;wg(o+8|0)}y=h+l-1|0;x=j-1|0;do{if((h>>p|0)==(y>>p|0)){if((j>>p|0)!=(x>>p|0)){v=20;break}z=0}else{v=20}}while(0);if((v|0)==20){b:do{if(k<<24>>24!=0){v=26}else{if((n|0)!=1){v=26;break}do{if((s|0)!=1){if((s|0)==4){break}if((s|0)!=5){v=26;break b}}}while(0);z=0}}while(0);if((v|0)==26){z=(nd(r,e,f,g,h,j,l,m,n,y,x)|0)&1;}}if(z&1){a[o+1|0]=1;s=o+20|0;k=jd(r,y,x)|0;b[s>>1]=b[k>>1]|0;b[s+2>>1]=b[k+2>>1]|0;b[s+4>>1]=b[k+4>>1]|0;b[s+6>>1]=b[k+6>>1]|0;b[s+8>>1]=b[k+8>>1]|0;b[s+10>>1]=b[k+10>>1]|0;do{if(w&1){if(!(Bg(o+8|0,o+20|0)|0)){v=35;break}a[o+1|0]=0}else{v=35}}while(0);if((v|0)==35){Ag(o+20|0)}}else{a[o+1|0]=0;wg(o+20|0)}k=h+l|0;s=j-1|0;do{if((h>>p|0)==(k>>p|0)){if((j>>p|0)!=(s>>p|0)){v=40;break}A=0}else{v=40}}while(0);if((v|0)==40){A=(nd(r,e,f,g,h,j,l,m,n,k,s)|0)&1;}if(A&1){a[o+2|0]=1;A=o+32|0;x=jd(r,k,s)|0;b[A>>1]=b[x>>1]|0;b[A+2>>1]=b[x+2>>1]|0;b[A+4>>1]=b[x+4>>1]|0;b[A+6>>1]=b[x+6>>1]|0;b[A+8>>1]=b[x+8>>1]|0;b[A+10>>1]=b[x+10>>1]|0;do{if(z&1){if(!(Bg(o+20|0,o+32|0)|0)){v=48;break}a[o+2|0]=0}else{v=48}}while(0);if((v|0)==48){Ag(o+32|0)}}else{a[o+2|0]=0;wg(o+32|0)}x=h-1|0;A=j+m|0;do{if((h>>p|0)==(x>>p|0)){if((j>>p|0)!=(A>>p|0)){v=53;break}B=0}else{v=53}}while(0);if((v|0)==53){B=(nd(r,e,f,g,h,j,l,m,n,x,A)|0)&1;}if(B&1){a[o+3|0]=1;B=o+44|0;s=jd(r,x,A)|0;b[B>>1]=b[s>>1]|0;b[B+2>>1]=b[s+2>>1]|0;b[B+4>>1]=b[s+4>>1]|0;b[B+6>>1]=b[s+6>>1]|0;b[B+8>>1]=b[s+8>>1]|0;b[B+10>>1]=b[s+10>>1]|0;do{if(w&1){if(!(Bg(o+8|0,o+44|0)|0)){v=61;break}a[o+3|0]=0}else{v=61}}while(0);if((v|0)==61){Ag(o+44|0)}}else{a[o+3|0]=0;wg(o+44|0)}s=h-1|0;B=j-1|0;do{if((d[o+3|0]|0|0)!=0){if((d[o|0]|0|0)==0){v=68;break}if((d[o+2|0]|0|0)==0){v=68;break}if((d[o+1|0]|0|0)==0){v=68;break}C=0}else{v=68}}while(0);if((v|0)==68){do{if((h>>p|0)==(s>>p|0)){if((j>>p|0)!=(B>>p|0)){v=71;break}C=0}else{v=71}}while(0);if((v|0)==71){C=(nd(r,e,f,g,h,j,l,m,n,s,B)|0)&1;}}if(!(C&1)){a[o+4|0]=0;wg(o+56|0);i=q;return}a[o+4|0]=1;C=o+56|0;n=jd(r,s,B)|0;b[C>>1]=b[n>>1]|0;b[C+2>>1]=b[n+2>>1]|0;b[C+4>>1]=b[n+4>>1]|0;b[C+6>>1]=b[n+6>>1]|0;b[C+8>>1]=b[n+8>>1]|0;b[C+10>>1]=b[n+10>>1]|0;do{if(z&1){if(!(Bg(o+20|0,o+56|0)|0)){v=80;break}a[o+4|0]=0}else{v=80}}while(0);if((v|0)==80){do{if(w&1){if(!(Bg(o+8|0,o+56|0)|0)){v=83;break}a[o+4|0]=0}else{v=83}}while(0);if((v|0)==83){Ag(o+32|0)}}i=q;return}function Dg(d,e,f,g){d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0;d=i;h=e;e=f;f=g;if((c[h+20>>2]|0)==1){j=c[h+328>>2]|0}else{if((c[h+328>>2]|0)<(c[h+332>>2]|0)){k=c[h+328>>2]|0}else{k=c[h+332>>2]|0}j=k}k=0;while(1){if((c[f>>2]|0)>=(c[h+1064>>2]|0)){break}g=e+((c[f>>2]|0)*12|0)|0;if((c[h+20>>2]|0)==1){if((k|0)<(j|0)){l=k}else{l=0}a[g|0]=l;a[g+1|0]=-1;a[g+2|0]=1;a[g+3|0]=0}else{if((k|0)<(j|0)){m=k}else{m=0}a[g|0]=m;if((k|0)<(j|0)){n=k}else{n=0}a[g+1|0]=n;a[g+2|0]=1;a[g+3|0]=1}b[g+4>>1]=0;b[g+6>>1]=0;b[g+8>>1]=0;b[g+10>>1]=0;g=f;c[g>>2]=(c[g>>2]|0)+1;k=k+1|0}i=d;return}function Eg(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;g=i;h=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[h>>2];h=a;a=e;e=f;if((a|0)<-128){j=-128}else{if((a|0)>127){k=127}else{k=a}j=k}k=j;if((e|0)<-128){l=-128}else{if((e|0)>127){m=127}else{m=e}l=m}m=l;if((k|0)==0){l=h;e=d;b[l>>1]=b[e>>1]|0;b[l+2>>1]=b[e+2>>1]|0;n=0;o=n;i=g;return o|0}if((k|0)<0){p=-k|0}else{p=k}e=((p>>1)+16384|0)/(k|0)|0;if(((ba(m,e)|0)+32>>6|0)<-4096){q=-4096}else{if(((ba(m,e)|0)+32>>6|0)>4095){r=4095}else{r=(ba(m,e)|0)+32>>6}q=r}r=q;if((ba(r,b[d>>1]|0)|0)>0){s=1}else{q=(ba(r,b[d>>1]|0)|0)<0;s=q?-1:0}if((ba(r,b[d>>1]|0)|0)<0){t=-(ba(r,b[d>>1]|0)|0)|0}else{t=ba(r,b[d>>1]|0)|0}if((ba(s,t+127>>8)|0)<-32768){u=-32768}else{if((ba(r,b[d>>1]|0)|0)>0){v=1}else{t=(ba(r,b[d>>1]|0)|0)<0;v=t?-1:0}if((ba(r,b[d>>1]|0)|0)<0){w=-(ba(r,b[d>>1]|0)|0)|0}else{w=ba(r,b[d>>1]|0)|0}if((ba(v,w+127>>8)|0)>32767){x=32767}else{if((ba(r,b[d>>1]|0)|0)>0){y=1}else{w=(ba(r,b[d>>1]|0)|0)<0;y=w?-1:0}if((ba(r,b[d>>1]|0)|0)<0){z=-(ba(r,b[d>>1]|0)|0)|0}else{z=ba(r,b[d>>1]|0)|0}x=ba(y,z+127>>8)|0}u=x}b[h>>1]=u;if((ba(r,b[d+2>>1]|0)|0)>0){A=1}else{u=(ba(r,b[d+2>>1]|0)|0)<0;A=u?-1:0}if((ba(r,b[d+2>>1]|0)|0)<0){B=-(ba(r,b[d+2>>1]|0)|0)|0}else{B=ba(r,b[d+2>>1]|0)|0}if((ba(A,B+127>>8)|0)<-32768){C=-32768}else{if((ba(r,b[d+2>>1]|0)|0)>0){D=1}else{B=(ba(r,b[d+2>>1]|0)|0)<0;D=B?-1:0}if((ba(r,b[d+2>>1]|0)|0)<0){E=-(ba(r,b[d+2>>1]|0)|0)|0}else{E=ba(r,b[d+2>>1]|0)|0}if((ba(D,E+127>>8)|0)>32767){F=32767}else{if((ba(r,b[d+2>>1]|0)|0)>0){G=1}else{E=(ba(r,b[d+2>>1]|0)|0)<0;G=E?-1:0}if((ba(r,b[d+2>>1]|0)|0)<0){H=-(ba(r,b[d+2>>1]|0)|0)|0}else{H=ba(r,b[d+2>>1]|0)|0}F=ba(G,H+127>>8)|0}C=F}b[h+2>>1]=C;n=1;o=n;i=g;return o|0}function Fg(e,f,g,h,j,k,l,m,n,o,p){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;var q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;h=i;i=i+8|0;g=h|0;q=e;e=f;f=j;j=k;k=l;l=m;m=n;n=o;o=p;if((Cd(q+2280792+(f*272|0)|0,c[q+2243436>>2]|0,j,k)|0)==0){b[n>>1]=0;b[n+2>>1]=0;a[o]=0;i=h;return}p=q+2280792+(f*272|0)|0;if((d[p+180|0]|0)==1){b[n>>1]=0;b[n+2>>1]=0;a[o]=0;i=h;return}f=kd(q,p,j,k)|0;Ag(f);if((d[f+2|0]|0)==0){r=g;s=f+8|0;b[r>>1]=b[s>>1]|0;b[r+2>>1]=b[s+2>>1]|0;t=a[f+1|0]|0;u=1}else{if((d[f+3|0]|0)==0){s=g;r=f+4|0;b[s>>1]=b[r>>1]|0;b[s+2>>1]=b[r+2>>1]|0;t=a[f|0]|0;u=0}else{r=1;s=c[(c[q+2287824>>2]|0)+88>>2]|0;v=0;while(1){if((v|0)<(c[e+328>>2]|0)){w=(r|0)!=0}else{w=0}if(!w){break}if((c[q+2280792+((c[e+1076+(v<<2)>>2]|0)*272|0)+88>>2]|0)>(s|0)){r=0}v=v+1|0}v=0;while(1){if((v|0)<(c[e+332>>2]|0)){x=(r|0)!=0}else{x=0}if(!x){break}if((c[q+2280792+((c[e+1140+(v<<2)>>2]|0)*272|0)+88>>2]|0)>(s|0)){r=0}v=v+1|0}if((r|0)!=0){r=g;v=f+4+(m<<2)|0;b[r>>1]=b[v>>1]|0;b[r+2>>1]=b[v+2>>1]|0;t=a[f+m|0]|0;u=m}else{v=a[e+372|0]|0;r=g;s=f+4+(v<<2)|0;b[r>>1]=b[s>>1]|0;b[r+2>>1]=b[s+2>>1]|0;t=a[f+v|0]|0;u=v}}}v=q+1465192+(($d(p,c[q+2243436>>2]|0,j,k)|0)*1520|0)|0;if((a[e+1332+(m<<4)+l|0]|0)!=(a[v+1332+(u<<4)+t|0]|0)){a[o]=0;b[n>>1]=0;b[n+2>>1]=0}else{a[o]=1;o=(c[p+88>>2]|0)-(c[v+1204+(u<<6)+(t<<2)>>2]|0)|0;t=(c[(c[q+2287824>>2]|0)+88>>2]|0)-(c[e+1204+(m<<6)+(l<<2)>>2]|0)|0;do{if((a[e+1332+(m<<4)+l|0]|0)!=0&1){y=34}else{if((o|0)==(t|0)){y=34;break}if(!(Eg(n,g,o,t)|0)){ed(q,1008,0);a[(c[q+2287824>>2]|0)+180|0]=3}}}while(0);if((y|0)==34){y=n;n=g;b[y>>1]=b[n>>1]|0;b[y+2>>1]=b[n+2>>1]|0}}i=h;return}function Gg(e,f,g,h,j,k,l,m,n,o){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;p=i;q=e;e=f;f=g;g=h;h=j;j=k;k=l;l=m;m=n;n=o;if((a[e+324|0]|0)==0){b[m>>1]=0;b[m+2>>1]=0;a[n]=0;i=p;return}o=c[(c[q+2243436>>2]|0)+4912>>2]|0;do{if((c[e+20>>2]|0)==0){if((a[e+372|0]|0)!=0){r=6;break}s=c[e+1140+(c[e+376>>2]<<2)>>2]|0}else{r=6}}while(0);if((r|0)==6){s=c[e+1076+(c[e+376>>2]<<2)>>2]|0}t=g+j|0;u=f+h|0;do{if((g>>o|0)==(t>>o|0)){if((u|0)>=(c[(c[q+2243436>>2]|0)+452>>2]|0)){r=11;break}if((t|0)>=(c[(c[q+2243436>>2]|0)+456>>2]|0)){r=11;break}v=u&-16;w=t&-16;Fg(q,e,f,g,s,v,w,k,l,m,n)}else{r=11}}while(0);if((r|0)==11){b[m>>1]=0;b[m+2>>1]=0;a[n]=0}if((d[n]|0)!=0){i=p;return}v=f+(h>>1)&-16;w=g+(j>>1)&-16;Fg(q,e,f,g,s,v,w,k,l,m,n);i=p;return}function Hg(e,f,g,h,j){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;k=i;l=e;e=f;f=g;g=h;h=j;if((c[g>>2]|0)<=1){i=k;return}if((c[g>>2]|0)>=(c[e+1064>>2]|0)){i=k;return}j=c[g>>2]|0;m=0;n=0;while(1){if(!(n<<24>>24!=0^1)){o=18;break}p=c[120+(m<<2)>>2]|0;q=c[168+(m<<2)>>2]|0;if((p|0)>=(j|0)){o=7;break}if((q|0)>=(j|0)){o=7;break}r=f+(p*12|0)|0;p=f+(q*12|0)|0;Ag(r);Ag(p);a:do{if((d[r+2|0]|0)!=0){if((d[p+3|0]|0)==0){break}do{if((c[l+2280792+((c[e+1076+(a[r|0]<<2)>>2]|0)*272|0)+88>>2]|0)==(c[l+2280792+((c[e+1140+(a[p+1|0]<<2)>>2]|0)*272|0)+88>>2]|0)){if((b[r+4>>1]|0)!=(b[p+8>>1]|0)){break}if((b[r+6>>1]|0)==(b[p+10>>1]|0)){break a}}}while(0);q=f+((c[g>>2]|0)*12|0)|0;a[q|0]=a[r|0]|0;a[q+1|0]=a[p+1|0]|0;a[q+2|0]=a[r+2|0]|0;a[q+3|0]=a[p+3|0]|0;s=q+4|0;t=r+4|0;b[s>>1]=b[t>>1]|0;b[s+2>>1]=b[t+2>>1]|0;t=q+8|0;s=p+8|0;b[t>>1]=b[s>>1]|0;b[t+2>>1]=b[s+2>>1]|0;s=g;c[s>>2]=(c[s>>2]|0)+1;Ag(q)}}while(0);m=m+1|0;if((m|0)==(ba(h,h-1|0)|0)){o=16}else{if((c[g>>2]|0)==(c[e+1064>>2]|0)){o=16}}if((o|0)==16){o=0;n=1}}if((o|0)==7){sa(13744,13456,1295,15296)}else if((o|0)==18){i=k;return}}function Ig(e,f,g,h,j,k,l,m,n,o,p){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;var q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;q=i;i=i+192|0;r=q|0;s=q+96|0;t=q+104|0;u=q+112|0;v=q+120|0;w=q+184|0;x=e;e=f;f=g;g=h;h=j;j=k;k=l;l=m;m=n;n=o;o=p;p=c[e+14632>>2]|0;y=l;z=m;if((c[(c[x+2243440>>2]|0)+4324>>2]|0)>2){A=(k|0)==8}else{A=0}B=A&1;if((B|0)!=0){h=f;j=g;l=k;m=k;n=0}Cg(x,f,g,k,h,j,B&255,l,m,n,r);Yh(s|0,0,8)|0;Gg(x,p,h,j,l,m,c[s>>2]|0,0,t|0,u|0);n=a[u|0]|0;a[u+1|0]=0;if((c[p+20>>2]|0)==0){Gg(x,p,h,j,l,m,c[s+4>>2]|0,1,t+4|0,u+1|0);n=(n&255|d[u+1|0])&255}c[w>>2]=0;m=0;while(1){if((m|0)>=5){break}if((a[r+m|0]|0)!=0){l=c[w>>2]|0;c[w>>2]=l+1;j=v+(l*12|0)|0;l=r+8+(m*12|0)|0;b[j>>1]=b[l>>1]|0;b[j+2>>1]=b[l+2>>1]|0;b[j+4>>1]=b[l+4>>1]|0;b[j+6>>1]=b[l+6>>1]|0;b[j+8>>1]=b[l+8>>1]|0;b[j+10>>1]=b[l+10>>1]|0}m=m+1|0}if(n<<24>>24!=0){a[r+5|0]=n;n=r+72|0;m=t|0;b[n>>1]=b[m>>1]|0;b[n+2>>1]=b[m+2>>1]|0;m=r+76|0;n=t+4|0;b[m>>1]=b[n>>1]|0;b[m+2>>1]=b[n+2>>1]|0;a[r+70|0]=a[u|0]|0;a[r+71|0]=a[u+1|0]|0;a[r+68|0]=c[s>>2];a[r+69|0]=c[s+4>>2];s=c[w>>2]|0;c[w>>2]=s+1;u=v+(s*12|0)|0;s=r+68|0;b[u>>1]=b[s>>1]|0;b[u+2>>1]=b[s+2>>1]|0;b[u+4>>1]=b[s+4>>1]|0;b[u+6>>1]=b[s+6>>1]|0;b[u+8>>1]=b[s+8>>1]|0;b[u+10>>1]=b[s+10>>1]|0}if((c[p+20>>2]|0)==0){Hg(x,p,v|0,w,c[w>>2]|0)}Dg(x,p,v|0,w);w=o|0;x=v+((d[e+31|0]|0)*12|0)|0;b[w>>1]=b[x>>1]|0;b[w+2>>1]=b[x+2>>1]|0;b[w+4>>1]=b[x+4>>1]|0;b[w+6>>1]=b[x+6>>1]|0;b[w+8>>1]=b[x+8>>1]|0;b[w+10>>1]=b[x+10>>1]|0;x=0;while(1){if((x|0)>=(c[p+1064>>2]|0)){break}Ag(v+(x*12|0)|0);x=x+1|0}if((d[o+2|0]|0)==0){i=q;return}if((d[o+3|0]|0)==0){i=q;return}if((y+z|0)!=12){i=q;return}a[o+1|0]=-1;a[o+3|0]=0;i=q;return}function Jg(e,f,g,h,j,k,l,m,n,o,p,q,r,s){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;r=r|0;s=s|0;var t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;t=i;i=i+64|0;u=t|0;v=t+8|0;w=t+16|0;x=t+24|0;y=t+40|0;z=t+56|0;A=e;e=f;f=g;g=h;h=j;j=k;k=l;l=m;m=n;n=o;o=p;p=q;q=r;r=s;s=0;c[u>>2]=j-1;c[v>>2]=k+m;c[u+4>>2]=c[u>>2];c[v+4>>2]=(c[v>>2]|0)-1;a[q|0]=0;b[r>>1]=0;b[r+2>>1]=0;a[w|0]=(nd(A,f,g,h,j,k,l,m,p,c[u>>2]|0,c[v>>2]|0)|0)&1;a[w+1|0]=(nd(A,f,g,h,j,k,l,m,p,c[u+4>>2]|0,c[v+4>>2]|0)|0)&1;if(a[w|0]&1){B=3}else{if(a[w+1|0]&1){B=3}}if((B|0)==3){s=1}C=-1;D=c[A+2280792+((c[e+1076+(n<<6)+(o<<2)>>2]|0)*272|0)+88>>2]|0;E=0;while(1){if((E|0)>1){break}do{if(a[w+E|0]&1){if((d[q|0]|0)!=0){break}if((Cd(c[A+2287824>>2]|0,c[A+2243436>>2]|0,c[u+(E<<2)>>2]|0,c[v+(E<<2)>>2]|0)|0)==0){break}F=1-n|0;G=jd(A,c[u+(E<<2)>>2]|0,c[v+(E<<2)>>2]|0)|0;Ag(G);do{if((d[G+2+n|0]|0)!=0){if((c[A+2280792+((c[e+1076+(n<<6)+(a[G+n|0]<<2)>>2]|0)*272|0)+88>>2]|0)!=(D|0)){B=12;break}a[q|0]=1;H=r|0;I=G+4+(n<<2)|0;b[H>>1]=b[I>>1]|0;b[H+2>>1]=b[I+2>>1]|0;C=a[G+n|0]|0}else{B=12}}while(0);if((B|0)==12){B=0;do{if((d[G+2+F|0]|0)!=0){if((c[A+2280792+((c[e+1076+(F<<6)+(a[G+F|0]<<2)>>2]|0)*272|0)+88>>2]|0)!=(D|0)){break}a[q|0]=1;I=r|0;H=G+4+(F<<2)|0;b[I>>1]=b[H>>1]|0;b[I+2>>1]=b[H+2>>1]|0;C=a[G+F|0]|0}}while(0)}}}while(0);E=E+1|0}E=0;while(1){if((E|0)<=1){J=(d[q|0]|0)==0}else{J=0}if(!J){break}F=-1;do{if(a[w+E|0]&1){if((Cd(c[A+2287824>>2]|0,c[A+2243436>>2]|0,c[u+(E<<2)>>2]|0,c[v+(E<<2)>>2]|0)|0)==0){break}G=1-n|0;H=jd(A,c[u+(E<<2)>>2]|0,c[v+(E<<2)>>2]|0)|0;do{if((d[H+2+n|0]|0)==1){if((a[e+1332+(n<<4)+o|0]|0)!=(a[e+1332+(n<<4)+(a[H+n|0]|0)|0]|0)){B=28;break}a[q|0]=1;I=r|0;K=H+4+(n<<2)|0;b[I>>1]=b[K>>1]|0;b[I+2>>1]=b[K+2>>1]|0;C=a[H+n|0]|0;F=n}else{B=28}}while(0);if((B|0)==28){B=0;do{if((d[H+2+G|0]|0)==1){if((a[e+1332+(n<<4)+o|0]|0)!=(a[e+1332+(G<<4)+(a[H+G|0]|0)|0]|0)){break}a[q|0]=1;K=r|0;I=H+4+(G<<2)|0;b[K>>1]=b[I>>1]|0;b[K+2>>1]=b[I+2>>1]|0;C=a[H+G|0]|0;F=G}}while(0)}}}while(0);if((d[q|0]|0)==1){if((C|0)>=0){}else{sa(12816,13456,1565,15256)}if((F|0)>=0){}else{sa(12584,13456,1566,15256)}G=A+2280792+((c[e+1076+(F<<6)+(C<<2)>>2]|0)*272|0)|0;do{if((c[G+96>>2]|0)==1){if((c[A+2280792+((c[e+1076+(n<<6)+(o<<2)>>2]|0)*272|0)+96>>2]|0)!=1){break}if(!(Eg(r|0,r|0,(c[(c[A+2287824>>2]|0)+88>>2]|0)-(c[G+88>>2]|0)|0,(c[(c[A+2287824>>2]|0)+88>>2]|0)-D|0)|0)){ed(A,1008,0);a[(c[A+2287824>>2]|0)+180|0]=3}}}while(0)}E=E+1|0}c[x>>2]=j+l;c[y>>2]=k-1;c[x+4>>2]=(c[x>>2]|0)-1;c[y+4>>2]=k-1;c[x+8>>2]=j-1;c[y+8>>2]=k-1;a[q+1|0]=0;b[r+4>>1]=0;b[r+6>>1]=0;E=-1;v=0;while(1){if((v|0)>=3){break}a[z+v|0]=(nd(A,f,g,h,j,k,l,m,p,c[x+(v<<2)>>2]|0,c[y+(v<<2)>>2]|0)|0)&1;do{if(a[z+v|0]&1){if((d[q+1|0]|0)!=0){break}u=1-n|0;w=jd(A,c[x+(v<<2)>>2]|0,c[y+(v<<2)>>2]|0)|0;Ag(w);do{if((d[w+2+n|0]|0)!=0){if((c[A+2280792+((c[e+1076+(n<<6)+(a[w+n|0]<<2)>>2]|0)*272|0)+88>>2]|0)!=(D|0)){B=53;break}a[q+1|0]=1;J=r+4|0;G=w+4+(n<<2)|0;b[J>>1]=b[G>>1]|0;b[J+2>>1]=b[G+2>>1]|0;E=a[w+n|0]|0}else{B=53}}while(0);if((B|0)==53){B=0;do{if((d[w+2+u|0]|0)!=0){if((c[A+2280792+((c[e+1076+(u<<6)+(a[w+u|0]<<2)>>2]|0)*272|0)+88>>2]|0)!=(D|0)){break}a[q+1|0]=1;G=r+4|0;J=w+4+(u<<2)|0;b[G>>1]=b[J>>1]|0;b[G+2>>1]=b[J+2>>1]|0;E=a[w+u|0]|0}}while(0)}}}while(0);v=v+1|0}do{if((s|0)==0){if((d[q+1|0]|0)==0){break}a[q|0]=1;v=r|0;p=r+4|0;b[v>>1]=b[p>>1]|0;b[v+2>>1]=b[p+2>>1]|0;C=E}}while(0);if((s|0)!=0){i=t;return}a[q+1|0]=0;s=0;while(1){if((s|0)<=2){L=(d[q+1|0]|0)==0}else{L=0}if(!L){break}C=-1;if(a[z+s|0]&1){p=1-n|0;v=jd(A,c[x+(s<<2)>>2]|0,c[y+(s<<2)>>2]|0)|0;do{if((d[v+2+n|0]|0)==1){if((a[e+1332+(n<<4)+o|0]|0)!=(a[e+1332+(n<<4)+(a[v+n|0]|0)|0]|0)){B=72;break}a[q+1|0]=1;m=r+4|0;l=v+4+(n<<2)|0;b[m>>1]=b[l>>1]|0;b[m+2>>1]=b[l+2>>1]|0;E=a[v+n|0]|0;C=n}else{B=72}}while(0);if((B|0)==72){B=0;do{if((d[v+2+p|0]|0)==1){if((a[e+1332+(n<<4)+o|0]|0)!=(a[e+1332+(p<<4)+(a[v+p|0]|0)|0]|0)){break}a[q+1|0]=1;l=r+4|0;m=v+4+(p<<2)|0;b[l>>1]=b[m>>1]|0;b[l+2>>1]=b[m+2>>1]|0;E=a[v+p|0]|0;C=p}}while(0)}}if((d[q+1|0]|0)==1){if((C|0)>=0){}else{sa(12584,13456,1690,15256)}if((E|0)>=0){}else{sa(12320,13456,1691,15256)}p=A+2280792+((c[e+1076+(C<<6)+(E<<2)>>2]|0)*272|0)|0;v=A+2280792+((c[e+1076+(n<<6)+(o<<2)>>2]|0)*272|0)|0;do{if((c[p+88>>2]|0)!=(c[v+88>>2]|0)){if((c[p+96>>2]|0)!=1){break}if((c[v+96>>2]|0)!=1){break}if(!(Eg(r+4|0,r+4|0,(c[(c[A+2287824>>2]|0)+88>>2]|0)-(c[p+88>>2]|0)|0,(c[(c[A+2287824>>2]|0)+88>>2]|0)-D|0)|0)){ed(A,1008,0);a[(c[A+2287824>>2]|0)+180|0]=3}}}while(0)}s=s+1|0}i=t;return}function Kg(e,f,g,h,j,k,l,m,n,o,p,q,r){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;r=r|0;var s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;s=i;i=i+48|0;t=s|0;u=s+8|0;v=s+16|0;w=s+24|0;x=s+32|0;y=f;f=g;g=l;l=m;m=n;n=o;o=p;p=q;q=c[f+14632>>2]|0;Jg(y,q,h,j,k,g,l,m,n,o,p,r,t|0,u|0);do{if((d[t|0]|0)!=0){if((d[t+1|0]|0)==0){z=6;break}if((b[u>>1]|0)==(b[u+4>>1]|0)){if((b[u+2>>1]|0)==(b[u+6>>1]|0)){z=6;break}}a[v]=0}else{z=6}}while(0);if((z|0)==6){Gg(y,q,g,l,m,n,p,o,w,v)}p=0;if((a[t|0]|0)!=0){n=p;p=n+1|0;m=x+(n<<2)|0;n=u|0;b[m>>1]=b[n>>1]|0;b[m+2>>1]=b[n+2>>1]|0}a:do{if((d[t+1|0]|0)!=0){do{if((a[t|0]|0)!=0){if((b[u>>1]|0)!=(b[u+4>>1]|0)){break}if((b[u+2>>1]|0)==(b[u+6>>1]|0)){break a}}}while(0);n=p;p=n+1|0;m=x+(n<<2)|0;n=u+4|0;b[m>>1]=b[n>>1]|0;b[m+2>>1]=b[n+2>>1]|0}}while(0);if((a[v]|0)!=0){v=p;p=v+1|0;u=x+(v<<2)|0;v=w;b[u>>1]=b[v>>1]|0;b[u+2>>1]=b[v+2>>1]|0}while(1){if((p|0)>=2){break}b[x+(p<<2)>>1]=0;b[x+(p<<2)+2>>1]=0;p=p+1|0}p=e;e=x+(d[f+32+o|0]<<2)|0;b[p>>1]=b[e>>1]|0;b[p+2>>1]=b[e+2>>1]|0;i=s;return}function Lg(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;i=i;return}function Mg(e,f,g,h,j,k,l,m,n,o,p){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;var q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;q=i;i=i+32|0;r=q|0;s=q+16|0;t=q+24|0;u=e;e=f;f=g;g=h;h=l;l=m;m=n;n=o;o=p;p=f+j|0;j=g+k|0;k=Cd(c[u+2287824>>2]|0,c[u+2243436>>2]|0,f,g)|0;do{if((k|0)!=2){if((k|0)==1){if((d[e+30|0]|0)!=0){break}}v=0;while(1){if((v|0)>=2){break}w=d[e+34|0]|0;do{if((w|0)==2){x=12}else{if((w|0)==0){if((v|0)==0){x=12;break}}if((w|0)==1){if((v|0)==1){x=12;break}}a[o+v|0]=-1;a[o+2+v|0]=0}}while(0);if((x|0)==12){x=0;a[o+v|0]=a[e+20+v|0]|0;a[o+2+v|0]=1}c[r+(v<<3)>>2]=b[e+22+(v<<2)>>1]|0;c[r+(v<<3)+4>>2]=b[e+22+(v<<2)+2>>1]|0;if((a[o+2+v|0]|0)!=0){Kg(t,u,e,f,g,h,p,j,l,m,v,a[o+v|0]|0,n);w=s+(v<<2)|0;y=t;b[w>>1]=b[y>>1]|0;b[w+2>>1]=b[y+2>>1]|0;y=(b[s+(v<<2)>>1]|0)+(c[r+(v<<3)>>2]|0)+65536&65535;w=(b[s+(v<<2)+2>>1]|0)+(c[r+(v<<3)+4>>2]|0)+65536&65535;if((y|0)>=32768){z=y-65536|0}else{z=y}b[o+4+(v<<2)>>1]=z;if((w|0)>=32768){A=w-65536|0}else{A=w}b[o+4+(v<<2)+2>>1]=A}v=v+1|0}Lg(p,j,l,m,11920,o);i=q;return}}while(0);Ig(u,e,f,g,p,j,h,l,m,n,o);Lg(p,j,l,m,12112,o);i=q;return}function Ng(a,b,d,e,f,g,h,j,k,l){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0;m=i;i=i+24|0;n=m|0;o=a;a=b;b=d;d=e;e=f;f=g;g=h;h=j;j=k;k=c[a+14632>>2]|0;Mg(o,a,b,d,e,f,g,h,j,l,n);zg(o,k,b,d,e,f,g,h,j,n);ld(o,b+e|0,d+f|0,h,j,n|0);i=m;return}function Og(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=i;e=xa(a|0,0,b|0,c|0)|0;i=d;return e|0}function Pg(a){a=a|0;var b=0;b=i;Ka(a|0,0)|0;i=b;return}function Qg(a){a=a|0;i=i;return}function Rg(a){a=a|0;var b=0;a=i;b;i=a;return}function Sg(a){a=a|0;var b=0;a=i;b;i=a;return}function Tg(a){a=a|0;var b=0;a=i;b;i=a;return}function Ug(a){a=a|0;var b=0;a=i;b;i=a;return}function Vg(a){a=a|0;var b=0;a=i;b;i=a;return}function Wg(a){a=a|0;var b=0;a=i;b;i=a;return}function Xg(a,b){a=a|0;b=b|0;b=i;Ia(a|0)|0;i=b;return}function Yg(a,b){a=a|0;b=b|0;var c=0;c=i;Ra(a|0,b|0)|0;i=c;return}function Zg(a){a=a|0;var b=0;b=i;ua(a|0)|0;i=b;return}function _g(a){a=a|0;var b=0,d=0;b=i;d=a;c[d>>2]=0;Rg(d+4|0);Vg(d+28|0);i=b;return}function $g(a){a=a|0;var b=0,c=0;b=i;c=a;Sg(c+4|0);Wg(c+28|0);i=b;return}function ah(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;e=a;a=b;if((c[e>>2]|0)>=(a|0)){f=c[e>>2]|0;g=f;i=d;return g|0}Tg(e+4|0);while(1){if((c[e>>2]|0)>=(a|0)){break}Yg(e+28|0,e+4|0)}Ug(e+4|0);f=c[e>>2]|0;g=f;i=d;return g|0}function bh(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=a;Tg(e+4|0);c[e>>2]=b;Xg(e+28|0,e+4|0);Ug(e+4|0);i=d;return}function ch(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;f=b;b=d;d=0;if((b|0)>32){b=32;d=1022}c[f+36868>>2]=0;c[f+37e3>>2]=0;c[f+37004>>2]=0;a[f|0]=0;Rg(f+37264|0);Vg(f+37288|0);g=0;while(1){if((g|0)>=(b|0)){h=9;break}if((Og(f+36872+(g<<2)|0,2,f)|0)!=0){h=6;break}j=f+37e3|0;c[j>>2]=(c[j>>2]|0)+1;g=g+1|0}if((h|0)==6){k=10;l=k;i=e;return l|0}else if((h|0)==9){k=d;l=k;i=e;return l|0}return 0}function dh(b){b=b|0;var d=0,e=0,f=0;d=i;i=i+40|0;e=d|0;f=b;Tg(f+37264|0);while(1){while(1){if(a[f|0]&1){break}if((c[f+36868>>2]|0)>0){break}Yg(f+37288|0,f+37264|0)}if(a[f|0]&1){break}Wh(e|0,f+4|0,36)|0;b=f+36868|0;c[b>>2]=(c[b>>2]|0)-1;if((c[f+36868>>2]|0)>0){Xh(f+4|0,f+40|0,(c[f+36868>>2]|0)*36|0|0)|0}b=f+37004|0;c[b>>2]=(c[b>>2]|0)+1;Ug(f+37264|0);if((c[e+8>>2]|0)!=0){Ya[c[e+8>>2]&7](e+12|0)}Tg(f+37264|0);b=f+37004|0;c[b>>2]=(c[b>>2]|0)-1}Ug(f+37264|0);i=d;return 0}function eh(b){b=b|0;var d=0,e=0;d=i;e=b;Tg(e+37264|0);a[e|0]=1;Ug(e+37264|0);Xg(e+37288|0,e+37264|0);b=0;while(1){if((b|0)>=(c[e+37e3>>2]|0)){break}Pg(c[e+36872+(b<<2)>>2]|0);Qg(e+36872+(b<<2)|0);b=b+1|0}Sg(e+37264|0);Wg(e+37288|0);i=d;return}function fh(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;f=b;Tg(f+37264|0);if(a[f|0]&1){g=f;h=g+37264|0;Ug(h);i=e;return}if((c[f+36868>>2]|0)<1024){}else{sa(3824,8456,292,15712)}Wh(f+4+((c[f+36868>>2]|0)*36|0)|0,d|0,36)|0;d=f+36868|0;c[d>>2]=(c[d>>2]|0)+1;Zg(f+37288|0);g=f;h=g+37264|0;Ug(h);i=e;return}function gh(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=a;a=b;b=(D=c[e>>2]|0,c[e>>2]=D-a,D)-a|0;i=d;return b|0}function hh(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=a;a=b;b=(D=c[e>>2]|0,c[e>>2]=D+a,D)+a|0;i=d;return b|0}function ih(a){a=a|0;var b=0;b=a;c[b>>2]=24;c[b+4>>2]=2;c[b+8>>2]=4;c[b+12>>2]=2;c[b+16>>2]=6;c[b+20>>2]=2;c[b+24>>2]=2;c[b+28>>2]=2;c[b+32>>2]=14;c[b+36>>2]=30;c[b+40>>2]=6;c[b+44>>2]=12;c[b+48>>2]=22;c[b+52>>2]=18;c[b+56>>2]=16;c[b+60>>2]=34;c[b+64>>2]=28;c[b+68>>2]=26;c[b+72>>2]=32;c[b+76>>2]=10;c[b+80>>2]=4;c[b+84>>2]=8;c[b+88>>2]=2;c[b+92>>2]=20;c[b+96>>2]=2;c[b+100>>2]=2;c[b+104>>2]=12;c[b+108>>2]=8;c[b+112>>2]=6;c[b+116>>2]=4;c[b+120>>2]=10;i=i;return}function jh(c,d,e,f,g,h){c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;j=i;k=c;c=d;d=e;e=f;f=g;g=h;h=32;l=6;if((f&1|0)==0){}else{sa(4608,12688,21,14744)}m=0;while(1){if((m|0)>=(g|0)){break}n=d+((ba(m,e)|0)<<1)|0;o=k+(ba(m,c)|0)|0;p=0;while(1){if((p|0)>=(f|0)){break}if(((b[n>>1]|0)+h>>l|0)<0){q=0}else{if(((b[n>>1]|0)+h>>l|0)>255){r=255}else{r=(b[n>>1]|0)+h>>l}q=r}a[o|0]=q;if(((b[n+2>>1]|0)+h>>l|0)<0){s=0}else{if(((b[n+2>>1]|0)+h>>l|0)>255){t=255}else{t=(b[n+2>>1]|0)+h>>l}s=t}a[o+1|0]=s;o=o+2|0;n=n+4|0;p=p+2|0}m=m+1|0}i=j;return}function kh(c,d,e,f,g,h,j,k,l){c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;m=i;n=c;c=d;d=e;e=f;f=g;g=h;h=j;j=k;k=l;if((k|0)>=1){}else{sa(10576,12688,41,14680)}l=1<<k-1;o=0;while(1){if((o|0)>=(g|0)){break}p=d+((ba(o,e)|0)<<1)|0;q=n+(ba(o,c)|0)|0;r=0;while(1){if((r|0)>=(f|0)){break}if((((ba(b[p>>1]|0,h)|0)+l>>k)+j|0)<0){s=0}else{if((((ba(b[p>>1]|0,h)|0)+l>>k)+j|0)>255){t=255}else{t=((ba(b[p>>1]|0,h)|0)+l>>k)+j|0}s=t}a[q|0]=s;q=q+1|0;p=p+2|0;r=r+1|0}o=o+1|0}i=m;return}function lh(c,d,e,f,g,h,j,k,l,m,n,o){c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;p=i;q=c;c=d;d=e;e=f;f=g;g=h;h=j;j=k;k=m;m=o;if((m|0)>=1){}else{sa(10576,12688,61,14712)}o=l+n+1<<m;n=0;while(1){if((n|0)>=(h|0)){break}l=d+((ba(n,f)|0)<<1)|0;r=e+((ba(n,f)|0)<<1)|0;s=q+(ba(n,c)|0)|0;t=0;while(1){if((t|0)>=(g|0)){break}u=ba(b[l>>1]|0,j)|0;if((u+(ba(b[r>>1]|0,k)|0)+o>>m+1|0)<0){v=0}else{u=ba(b[l>>1]|0,j)|0;if((u+(ba(b[r>>1]|0,k)|0)+o>>m+1|0)>255){w=255}else{u=ba(b[l>>1]|0,j)|0;w=u+(ba(b[r>>1]|0,k)|0)+o>>m+1}v=w}a[s|0]=v;s=s+1|0;l=l+2|0;r=r+2|0;t=t+1|0}n=n+1|0}i=p;return}function mh(c,d,e,f,g,h,j){c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;k=i;l=c;c=d;d=e;e=f;f=g;g=h;h=j;j=64;m=7;if((g&1|0)==0){}else{sa(4608,12688,86,14640)}n=0;while(1){if((n|0)>=(h|0)){break}o=d+((ba(n,f)|0)<<1)|0;p=e+((ba(n,f)|0)<<1)|0;q=l+(ba(n,c)|0)|0;r=0;while(1){if((r|0)>=(g|0)){break}if(((b[o>>1]|0)+(b[p>>1]|0)+j>>m|0)<0){s=0}else{if(((b[o>>1]|0)+(b[p>>1]|0)+j>>m|0)>255){t=255}else{t=(b[o>>1]|0)+(b[p>>1]|0)+j>>m}s=t}a[q|0]=s;if(((b[o+2>>1]|0)+(b[p+2>>1]|0)+j>>m|0)<0){u=0}else{if(((b[o+2>>1]|0)+(b[p+2>>1]|0)+j>>m|0)>255){v=255}else{v=(b[o+2>>1]|0)+(b[p+2>>1]|0)+j>>m}u=v}a[q+1|0]=u;q=q+2|0;o=o+4|0;p=p+4|0;r=r+2|0}n=n+1|0}i=k;return}function nh(a,c,e,f,g,h,j,k,l){a=a|0;c=c|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0;l=i;k=a;a=c;c=e;e=f;f=g;g=h;h=6;j=0;while(1){if((j|0)>=(g|0)){break}m=k+((ba(j,a)|0)<<1)|0;n=c+(ba(j,e)|0)|0;o=0;while(1){if((o|0)>=(f|0)){break}b[m>>1]=(d[n]|0)<<h;m=m+2|0;n=n+1|0;o=o+1|0}j=j+1|0}i=l;return}function oh(a,c,e,f,g,h,j,k,l){a=a|0;c=c|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;l=i;m=a;a=c;c=e;e=f;f=g;g=h;h=j;j=k;k=1;n=1;o=2;p=n+g+o|0;q=(ba(f,p)|0)<<1;r=i;i=i+q|0;i=i+7&-8;q=r;r=-n|0;while(1){if((r|0)>=(g+o|0)){break}s=c+((ba(r,e)|0)-k)|0;t=0;while(1){if((t|0)>=(f|0)){break}switch(h|0){case 6:{u=((d[s|0]|0)*-2|0)+(d[s+1|0]<<4)+((d[s+2|0]|0)*54|0)-(d[s+3|0]<<2)>>0&65535;break};case 7:{v=14;break};case 0:{u=d[s+1|0]|0;break};case 1:{u=((d[s|0]|0)*-2|0)+((d[s+1|0]|0)*58|0)+((d[s+2|0]|0)*10|0)-(d[s+3|0]<<1)>>0&65535;break};case 2:{u=((d[s|0]|0)*-4|0)+((d[s+1|0]|0)*54|0)+(d[s+2|0]<<4)-(d[s+3|0]<<1)>>0&65535;break};case 3:{u=((d[s|0]|0)*-6|0)+((d[s+1|0]|0)*46|0)+((d[s+2|0]|0)*28|0)-(d[s+3|0]<<2)>>0&65535;break};case 4:{u=((d[s|0]|0)*-4|0)+((d[s+1|0]|0)*36|0)+((d[s+2|0]|0)*36|0)-(d[s+3|0]<<2)>>0&65535;break};case 5:{u=((d[s|0]|0)*-4|0)+((d[s+1|0]|0)*28|0)+((d[s+2|0]|0)*46|0)-((d[s+3|0]|0)*6|0)>>0&65535;break};default:{v=14}}if((v|0)==14){v=0;u=((d[s|0]|0)*-2|0)+((d[s+1|0]|0)*10|0)+((d[s+2|0]|0)*58|0)-(d[s+3|0]<<1)>>0&65535}b[q+(r+n+(ba(t,p)|0)<<1)>>1]=u;s=s+1|0;t=t+1|0}r=r+1|0}r=(h|0)==0?0:6;h=0;while(1){if((h|0)>=(f|0)){break}u=q+((ba(h,p)|0)<<1)|0;n=0;while(1){if((n|0)>=(g|0)){break}switch(j|0){case 0:{w=b[u+2>>1]|0;break};case 1:{w=((b[u>>1]|0)*-2|0)+((b[u+2>>1]|0)*58|0)+((b[u+4>>1]|0)*10|0)-(b[u+6>>1]<<1)>>r&65535;break};case 2:{w=((b[u>>1]|0)*-4|0)+((b[u+2>>1]|0)*54|0)+(b[u+4>>1]<<4)-(b[u+6>>1]<<1)>>r&65535;break};case 3:{w=((b[u>>1]|0)*-6|0)+((b[u+2>>1]|0)*46|0)+((b[u+4>>1]|0)*28|0)-(b[u+6>>1]<<2)>>r&65535;break};case 4:{w=((b[u>>1]|0)*-4|0)+((b[u+2>>1]|0)*36|0)+((b[u+4>>1]|0)*36|0)-(b[u+6>>1]<<2)>>r&65535;break};case 5:{w=((b[u>>1]|0)*-4|0)+((b[u+2>>1]|0)*28|0)+((b[u+4>>1]|0)*46|0)-((b[u+6>>1]|0)*6|0)>>r&65535;break};case 6:{w=((b[u>>1]|0)*-2|0)+(b[u+2>>1]<<4)+((b[u+4>>1]|0)*54|0)-(b[u+6>>1]<<2)>>r&65535;break};case 7:{v=32;break};default:{v=32}}if((v|0)==32){v=0;w=((b[u>>1]|0)*-2|0)+((b[u+2>>1]|0)*10|0)+((b[u+4>>1]|0)*58|0)-(b[u+6>>1]<<1)>>r&65535}b[m+(h+(ba(n,a)|0)<<1)>>1]=w;u=u+2|0;n=n+1|0}h=h+1|0}i=l;return}function ph(a,c,e,f,g,h,j){a=a|0;c=c|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0;j=i;k=a;a=c;c=e;e=f;f=g;g=h;h=0;while(1){if((h|0)>=(g|0)){break}l=c+(ba(e,h)|0)|0;m=k+((ba(a,h)|0)<<1)|0;n=0;while(1){if((n|0)>=(f|0)){break}o=(d[l+1|0]|0)<<6&65535;p=(d[l+2|0]|0)<<6&65535;q=(d[l+3|0]|0)<<6&65535;b[m>>1]=(d[l|0]|0)<<6;b[m+2>>1]=o;b[m+4>>1]=p;b[m+6>>1]=q;m=m+8|0;l=l+4|0;n=n+4|0}h=h+1|0}i=j;return}function qh(a,e,f,g,h,j,k,l,m){a=a|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;n=i;o=a;a=e;e=f;f=g;g=h;h=j;j=k;k=l;l=m;m=c[3416+(k<<2)>>2]|0;p=c[3416+(l<<2)>>2]|0;q=c[3448+(l<<2)>>2]|0;r=p+h+q|0;s=k;if((s|0)==3){t=-p|0;while(1){if((t|0)>=(h+q|0)){break}u=e+(ba(f,t)|0)+(-m|0)|0;v=j+(t+p<<1)|0;w=0;while(1){if((w|0)>=(g|0)){break}b[v>>1]=(d[u|0]|0)-((d[u+1|0]|0)*5|0)+((d[u+2|0]|0)*17|0)+((d[u+3|0]|0)*58|0)-((d[u+4|0]|0)*10|0)+(d[u+5|0]<<2)-(d[u+6|0]|0)>>0;v=v+(r<<1)|0;u=u+1|0;w=w+1|0}t=t+1|0}}else if((s|0)==1){t=-p|0;while(1){if((t|0)>=(h+q|0)){break}w=e+(ba(f,t)|0)+(-m|0)|0;u=j+(t+p<<1)|0;v=0;while(1){if((v|0)>=(g|0)){break}b[u>>1]=(-(d[w|0]|0)|0)+(d[w+1|0]<<2)-((d[w+2|0]|0)*10|0)+((d[w+3|0]|0)*58|0)+((d[w+4|0]|0)*17|0)-((d[w+5|0]|0)*5|0)+(d[w+6|0]|0)>>0;u=u+(r<<1)|0;w=w+1|0;v=v+1|0}t=t+1|0}}else if((s|0)==2){t=-p|0;while(1){if((t|0)>=(h+q|0)){break}v=e+(ba(f,t)|0)+(-m|0)|0;w=j+(t+p<<1)|0;u=0;while(1){if((u|0)>=(g|0)){break}b[w>>1]=(-(d[v|0]|0)|0)+(d[v+1|0]<<2)-((d[v+2|0]|0)*11|0)+((d[v+3|0]|0)*40|0)+((d[v+4|0]|0)*40|0)-((d[v+5|0]|0)*11|0)+(d[v+6|0]<<2)-(d[v+7|0]|0)>>0;w=w+(r<<1)|0;v=v+1|0;u=u+1|0}t=t+1|0}}else if((s|0)==0){s=-p|0;while(1){if((s|0)>=(h+q|0)){break}t=e+(ba(f,s)|0)+(-m|0)|0;u=j+(s+p<<1)|0;v=0;while(1){if((v|0)>=(g|0)){break}b[u>>1]=d[t]|0;u=u+(r<<1)|0;t=t+1|0;v=v+1|0}s=s+1|0}}s=-p|0;while(1){if((s|0)>=(h+q|0)){break}p=0;while(1){if((p|0)>=(g|0)){break}p=p+1|0}s=s+1|0}s=(k|0)==0?0:6;k=l;if((k|0)==2){l=0;while(1){if((l|0)>=(g|0)){break}q=j+((ba(l,r)|0)<<1)|0;p=o+(l<<1)|0;m=0;while(1){if((m|0)>=(h|0)){break}b[p>>1]=(-(b[q>>1]|0)|0)+(b[q+2>>1]<<2)-((b[q+4>>1]|0)*11|0)+((b[q+6>>1]|0)*40|0)+((b[q+8>>1]|0)*40|0)-((b[q+10>>1]|0)*11|0)+(b[q+12>>1]<<2)-(b[q+14>>1]|0)>>s;p=p+(a<<1)|0;q=q+2|0;m=m+1|0}l=l+1|0}}else if((k|0)==3){l=0;while(1){if((l|0)>=(g|0)){break}m=j+((ba(l,r)|0)<<1)|0;q=o+(l<<1)|0;p=0;while(1){if((p|0)>=(h|0)){break}b[q>>1]=(b[m>>1]|0)-((b[m+2>>1]|0)*5|0)+((b[m+4>>1]|0)*17|0)+((b[m+6>>1]|0)*58|0)-((b[m+8>>1]|0)*10|0)+(b[m+10>>1]<<2)-(b[m+12>>1]|0)>>s;q=q+(a<<1)|0;m=m+2|0;p=p+1|0}l=l+1|0}}else if((k|0)==0){l=0;while(1){if((l|0)>=(g|0)){break}p=j+((ba(l,r)|0)<<1)|0;m=o+(l<<1)|0;q=0;while(1){if((q|0)>=(h|0)){break}b[m>>1]=b[p>>1]|0;m=m+(a<<1)|0;p=p+2|0;q=q+1|0}l=l+1|0}}else if((k|0)==1){k=0;while(1){if((k|0)>=(g|0)){break}l=j+((ba(k,r)|0)<<1)|0;q=o+(k<<1)|0;p=0;while(1){if((p|0)>=(h|0)){break}b[q>>1]=(-(b[l>>1]|0)|0)+(b[l+2>>1]<<2)-((b[l+4>>1]|0)*10|0)+((b[l+6>>1]|0)*58|0)+((b[l+8>>1]|0)*17|0)-((b[l+10>>1]|0)*5|0)+(b[l+12>>1]|0)>>s;q=q+(a<<1)|0;l=l+2|0;p=p+1|0}k=k+1|0}}k=0;while(1){if((k|0)>=(h|0)){break}a=0;while(1){if((a|0)>=(g|0)){break}a=a+1|0}k=k+1|0}i=n;return}function rh(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;h=i;qh(a,b,c,d,e,f,g,0,1);i=h;return}function sh(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;h=i;qh(a,b,c,d,e,f,g,0,2);i=h;return}function th(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;h=i;qh(a,b,c,d,e,f,g,0,3);i=h;return}function uh(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;h=i;qh(a,b,c,d,e,f,g,1,0);i=h;return}function vh(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;h=i;qh(a,b,c,d,e,f,g,1,1);i=h;return}function wh(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;h=i;qh(a,b,c,d,e,f,g,1,2);i=h;return}function xh(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;h=i;qh(a,b,c,d,e,f,g,1,3);i=h;return}function yh(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;h=i;qh(a,b,c,d,e,f,g,2,0);i=h;return}function zh(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;h=i;qh(a,b,c,d,e,f,g,2,1);i=h;return}function Ah(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;h=i;qh(a,b,c,d,e,f,g,2,2);i=h;return}function Bh(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;h=i;qh(a,b,c,d,e,f,g,2,3);i=h;return}function Ch(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;h=i;qh(a,b,c,d,e,f,g,3,0);i=h;return}function Dh(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;h=i;qh(a,b,c,d,e,f,g,3,1);i=h;return}function Eh(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;h=i;qh(a,b,c,d,e,f,g,3,2);i=h;return}function Fh(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;h=i;qh(a,b,c,d,e,f,g,3,3);i=h;return}function Gh(c,e,f){c=c|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;h=c;c=e;e=f;f=4;j=12;k=0;while(1){if((k|0)>=(f|0)){break}l=0;while(1){if((l|0)>=(f|0)){break}m=b[c+(l+(ba(k,f)|0)<<1)>>1]<<7;m=m+(1<<j-1)>>j;if(((d[h+((ba(k,e)|0)+l)|0]|0)+m|0)<0){n=0}else{if(((d[h+((ba(k,e)|0)+l)|0]|0)+m|0)>255){o=255}else{o=(d[h+((ba(k,e)|0)+l)|0]|0)+m|0}n=o}a[h+((ba(k,e)|0)+l)|0]=n;l=l+1|0}k=k+1|0}i=g;return}function Hh(c,e,f,g){c=c|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0;h=i;j=c;c=e;e=f;f=g;g=0;while(1){if((g|0)>=(e|0)){break}k=0;while(1){if((k|0)>=(e|0)){break}l=b[c+(k+(ba(g,e)|0)<<1)>>1]|0;if(((d[j+((ba(g,f)|0)+k)|0]|0)+l|0)<0){m=0}else{if(((d[j+((ba(g,f)|0)+k)|0]|0)+l|0)>255){n=255}else{n=(d[j+((ba(g,f)|0)+k)|0]|0)+l|0}m=n}a[j+((ba(g,f)|0)+k)|0]=m;k=k+1|0}g=g+1|0}i=h;return}function Ih(c,e,f){c=c|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;g=i;i=i+32|0;h=g|0;j=c;c=e;e=f;f=12;k=64;l=1<<f-1;m=0;while(1){if((m|0)>=4){break}n=0;while(1){if((n|0)>=4){break}n=n+1|0}n=0;while(1){if((n|0)>=4){break}o=0;p=0;while(1){if((p|0)>=4){break}o=o+(ba(a[1640+(p<<2)+n|0]|0,b[c+(m+(p<<2)<<1)>>1]|0)|0)|0;p=p+1|0}if((o+k>>7|0)<-32768){q=-32768}else{if((o+k>>7|0)>32767){r=32767}else{r=o+k>>7}q=r}b[h+(n<<3)+(m<<1)>>1]=q;n=n+1|0}n=0;while(1){if((n|0)>=4){break}n=n+1|0}m=m+1|0}m=0;while(1){if((m|0)>=4){break}q=0;while(1){if((q|0)>=4){break}q=q+1|0}q=0;while(1){if((q|0)>=4){break}r=0;k=0;while(1){if((k|0)>=4){break}r=r+(ba(a[1640+(k<<2)+q|0]|0,b[h+(m<<3)+(k<<1)>>1]|0)|0)|0;k=k+1|0}if((r+l>>f|0)<-32768){s=-32768}else{if((r+l>>f|0)>32767){t=32767}else{t=r+l>>f}s=t}k=s;if(((d[j+((ba(m,e)|0)+q)|0]|0)+k|0)<0){u=0}else{if(((d[j+((ba(m,e)|0)+q)|0]|0)+k|0)>255){v=255}else{v=(d[j+((ba(m,e)|0)+q)|0]|0)+k|0}u=v}a[j+((ba(m,e)|0)+q)|0]=u;q=q+1|0}m=m+1|0}i=g;return}function Jh(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=i;Kh(a,c,4,b);i=d;return}function Kh(c,e,f,g){c=c|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;h=i;i=i+2048|0;j=h|0;k=c;c=e;e=f;f=g;g=12;l=64;m=1<<g-1;n=1<<5-(og(e)|0);o=0;while(1){if((o|0)>=(e|0)){break}p=0;while(1){if((p|0)>=(e|0)){break}p=p+1|0}p=e-1|0;while(1){if((p|0)<0){break}if((b[f+(o+(ba(p,e)|0)<<1)>>1]|0)!=0){q=10;break}p=p-1|0}if((q|0)==10){q=0}r=0;while(1){if((r|0)>=(e|0)){break}s=0;t=0;while(1){if((t|0)>(p|0)){break}u=a[616+((ba(n,t)|0)<<5)+r|0]|0;s=s+(ba(u,b[f+(o+(ba(t,e)|0)<<1)>>1]|0)|0)|0;t=t+1|0}if((s+l>>7|0)<-32768){v=-32768}else{if((s+l>>7|0)>32767){w=32767}else{w=s+l>>7}v=w}b[j+(o+(ba(r,e)|0)<<1)>>1]=v;r=r+1|0}o=o+1|0}o=0;while(1){if((o|0)>=(e|0)){break}v=0;while(1){if((v|0)>=(e|0)){break}v=v+1|0}v=e-1|0;while(1){if((v|0)<0){break}if((b[j+((ba(o,e)|0)+v<<1)>>1]|0)!=0){q=38;break}v=v-1|0}if((q|0)==38){q=0}w=0;while(1){if((w|0)>=(e|0)){break}l=0;f=0;while(1){if((f|0)>(v|0)){break}r=a[616+((ba(n,f)|0)<<5)+w|0]|0;l=l+(ba(r,b[j+((ba(o,e)|0)+f<<1)>>1]|0)|0)|0;f=f+1|0}f=l+m>>g;if(((d[k+((ba(o,c)|0)+w)|0]|0)+f|0)<0){x=0}else{if(((d[k+((ba(o,c)|0)+w)|0]|0)+f|0)>255){y=255}else{y=(d[k+((ba(o,c)|0)+w)|0]|0)+f|0}x=y}a[k+((ba(o,c)|0)+w)|0]=x;w=w+1|0}o=o+1|0}i=h;return}function Lh(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=i;Kh(a,c,8,b);i=d;return}function Mh(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=i;Kh(a,c,16,b);i=d;return}function Nh(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=i;Kh(a,c,32,b);i=d;return}function Oh(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,wa=0,xa=0,ya=0,za=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0;do{if(a>>>0<245>>>0){if(a>>>0<11>>>0){b=16}else{b=a+11&-8}d=b>>>3;e=c[8184]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=32776+(h<<2)|0;j=32776+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[8184]=e&~(1<<g)}else{if(l>>>0<(c[8188]|0)>>>0){va();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{va();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(!(b>>>0>(c[8186]|0)>>>0)){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=32776+(p<<2)|0;m=32776+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[8184]=e&~(1<<r)}else{if(l>>>0<(c[8188]|0)>>>0){va();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{va();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[8186]|0;if((l|0)!=0){q=c[8189]|0;d=l>>>3;l=d<<1;f=32776+(l<<2)|0;k=c[8184]|0;h=1<<d;do{if((k&h|0)==0){c[8184]=k|h;s=f;t=32776+(l+2<<2)|0}else{d=32776+(l+2<<2)|0;g=c[d>>2]|0;if(!(g>>>0<(c[8188]|0)>>>0)){s=g;t=d;break}va();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[8186]=m;c[8189]=e;n=i;return n|0}l=c[8185]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[33040+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[8188]|0;if(r>>>0<i>>>0){va();return 0}e=r+b|0;m=e;if(!(r>>>0<e>>>0)){va();return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break}else{w=l;x=k}}else{w=g;x=q}while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){va();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){va();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){va();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{va();return 0}}}while(0);a:do{if((e|0)!=0){f=c[d+28>>2]|0;i=33040+(f<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[8185]=c[8185]&~(1<<f);break a}else{if(e>>>0<(c[8188]|0)>>>0){va();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break a}}}while(0);if(v>>>0<(c[8188]|0)>>>0){va();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[8188]|0)>>>0){va();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[8188]|0)>>>0){va();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16>>>0){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b)>>2]=p;f=c[8186]|0;if((f|0)!=0){e=c[8189]|0;i=f>>>3;f=i<<1;q=32776+(f<<2)|0;k=c[8184]|0;g=1<<i;do{if((k&g|0)==0){c[8184]=k|g;y=q;z=32776+(f+2<<2)|0}else{i=32776+(f+2<<2)|0;l=c[i>>2]|0;if(!(l>>>0<(c[8188]|0)>>>0)){y=l;z=i;break}va();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[8186]=p;c[8189]=m}n=d+8|0;return n|0}else{if(a>>>0>4294967231>>>0){o=-1;break}f=a+11|0;g=f&-8;k=c[8185]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215>>>0){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=14-(h|f|l)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[33040+(A<<2)>>2]|0;b:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break b}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[33040+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break}else{p=r;m=i;q=e}}}if((K|0)==0){o=g;break}if(!(J>>>0<((c[8186]|0)-g|0)>>>0)){o=g;break}q=K;m=c[8188]|0;if(q>>>0<m>>>0){va();return 0}p=q+g|0;k=p;if(!(q>>>0<p>>>0)){va();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break}else{M=B;N=j}}else{M=d;N=r}while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<m>>>0){va();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<m>>>0){va();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){va();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{va();return 0}}}while(0);c:do{if((e|0)!=0){i=c[K+28>>2]|0;m=33040+(i<<2)|0;do{if((K|0)==(c[m>>2]|0)){c[m>>2]=L;if((L|0)!=0){break}c[8185]=c[8185]&~(1<<i);break c}else{if(e>>>0<(c[8188]|0)>>>0){va();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break c}}}while(0);if(L>>>0<(c[8188]|0)>>>0){va();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[8188]|0)>>>0){va();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[8188]|0)>>>0){va();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);d:do{if(J>>>0<16>>>0){e=J+g|0;c[K+4>>2]=e|3;i=q+(e+4)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[q+(g|4)>>2]=J|1;c[q+(J+g)>>2]=J;i=J>>>3;if(J>>>0<256>>>0){e=i<<1;m=32776+(e<<2)|0;r=c[8184]|0;j=1<<i;do{if((r&j|0)==0){c[8184]=r|j;O=m;P=32776+(e+2<<2)|0}else{i=32776+(e+2<<2)|0;d=c[i>>2]|0;if(!(d>>>0<(c[8188]|0)>>>0)){O=d;P=i;break}va();return 0}}while(0);c[P>>2]=k;c[O+12>>2]=k;c[q+(g+8)>>2]=O;c[q+(g+12)>>2]=m;break}e=p;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215>>>0){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=14-(d|r|i)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=33040+(Q<<2)|0;c[q+(g+28)>>2]=Q;c[q+(g+20)>>2]=0;c[q+(g+16)>>2]=0;m=c[8185]|0;l=1<<Q;if((m&l|0)==0){c[8185]=m|l;c[j>>2]=e;c[q+(g+24)>>2]=j;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}l=c[j>>2]|0;if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}e:do{if((c[l+4>>2]&-8|0)==(J|0)){S=l}else{j=l;m=J<<R;while(1){T=j+16+(m>>>31<<2)|0;i=c[T>>2]|0;if((i|0)==0){break}if((c[i+4>>2]&-8|0)==(J|0)){S=i;break e}else{j=i;m=m<<1}}if(T>>>0<(c[8188]|0)>>>0){va();return 0}else{c[T>>2]=e;c[q+(g+24)>>2]=j;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break d}}}while(0);l=S+8|0;m=c[l>>2]|0;i=c[8188]|0;if(S>>>0<i>>>0){va();return 0}if(m>>>0<i>>>0){va();return 0}else{c[m+12>>2]=e;c[l>>2]=e;c[q+(g+8)>>2]=m;c[q+(g+12)>>2]=S;c[q+(g+24)>>2]=0;break}}}while(0);n=K+8|0;return n|0}}while(0);K=c[8186]|0;if(!(o>>>0>K>>>0)){S=K-o|0;T=c[8189]|0;if(S>>>0>15>>>0){J=T;c[8189]=J+o;c[8186]=S;c[J+(o+4)>>2]=S|1;c[J+K>>2]=S;c[T+4>>2]=o|3}else{c[8186]=0;c[8189]=0;c[T+4>>2]=K|3;S=T+(K+4)|0;c[S>>2]=c[S>>2]|1}n=T+8|0;return n|0}T=c[8187]|0;if(o>>>0<T>>>0){S=T-o|0;c[8187]=S;T=c[8190]|0;K=T;c[8190]=K+o;c[K+(o+4)>>2]=S|1;c[T+4>>2]=o|3;n=T+8|0;return n|0}do{if((c[8106]|0)==0){T=Aa(30)|0;if((T-1&T|0)==0){c[8108]=T;c[8107]=T;c[8109]=-1;c[8110]=-1;c[8111]=0;c[8295]=0;c[8106]=(Ua(0)|0)&-16^1431655768;break}else{va();return 0}}}while(0);T=o+48|0;S=c[8108]|0;K=o+47|0;J=S+K|0;R=-S|0;S=J&R;if(!(S>>>0>o>>>0)){n=0;return n|0}Q=c[8294]|0;do{if((Q|0)!=0){O=c[8292]|0;P=O+S|0;if(P>>>0<=O>>>0|P>>>0>Q>>>0){n=0}else{break}return n|0}}while(0);f:do{if((c[8295]&4|0)==0){Q=c[8190]|0;g:do{if((Q|0)==0){U=182}else{P=Q;O=33184;while(1){V=O|0;L=c[V>>2]|0;if(!(L>>>0>P>>>0)){W=O+4|0;if((L+(c[W>>2]|0)|0)>>>0>P>>>0){break}}L=c[O+8>>2]|0;if((L|0)==0){U=182;break g}else{O=L}}if((O|0)==0){U=182;break}P=J-(c[8187]|0)&R;if(!(P>>>0<2147483647>>>0)){X=0;break}e=Oa(P|0)|0;L=(e|0)==((c[V>>2]|0)+(c[W>>2]|0)|0);Y=L?e:-1;Z=L?P:0;_=e;$=P;U=191}}while(0);do{if((U|0)==182){Q=Oa(0)|0;if((Q|0)==-1){X=0;break}P=Q;e=c[8107]|0;L=e-1|0;if((L&P|0)==0){aa=S}else{aa=S-P+(L+P&-e)|0}e=c[8292]|0;P=e+aa|0;if(!(aa>>>0>o>>>0&aa>>>0<2147483647>>>0)){X=0;break}L=c[8294]|0;if((L|0)!=0){if(P>>>0<=e>>>0|P>>>0>L>>>0){X=0;break}}L=Oa(aa|0)|0;P=(L|0)==(Q|0);Y=P?Q:-1;Z=P?aa:0;_=L;$=aa;U=191}}while(0);h:do{if((U|0)==191){L=-$|0;if(!((Y|0)==-1)){ba=Z;ca=Y;U=202;break f}do{if((_|0)!=-1&$>>>0<2147483647>>>0&$>>>0<T>>>0){P=c[8108]|0;Q=K-$+P&-P;if(!(Q>>>0<2147483647>>>0)){da=$;break}if((Oa(Q|0)|0)==-1){Oa(L|0)|0;X=Z;break h}else{da=Q+$|0;break}}else{da=$}}while(0);if((_|0)==-1){X=Z}else{ba=da;ca=_;U=202;break f}}}while(0);c[8295]=c[8295]|4;ea=X;U=199}else{ea=0;U=199}}while(0);do{if((U|0)==199){if(!(S>>>0<2147483647>>>0)){break}X=Oa(S|0)|0;_=Oa(0)|0;if(!((_|0)!=-1&(X|0)!=-1&X>>>0<_>>>0)){break}da=_-X|0;_=da>>>0>(o+40|0)>>>0;if(_){ba=_?da:ea;ca=X;U=202}}}while(0);do{if((U|0)==202){ea=(c[8292]|0)+ba|0;c[8292]=ea;if(ea>>>0>(c[8293]|0)>>>0){c[8293]=ea}ea=c[8190]|0;i:do{if((ea|0)==0){S=c[8188]|0;if((S|0)==0|ca>>>0<S>>>0){c[8188]=ca}c[8296]=ca;c[8297]=ba;c[8299]=0;c[8193]=c[8106];c[8192]=-1;S=0;do{X=S<<1;da=32776+(X<<2)|0;c[32776+(X+3<<2)>>2]=da;c[32776+(X+2<<2)>>2]=da;S=S+1|0;}while(S>>>0<32>>>0);S=ca+8|0;if((S&7|0)==0){fa=0}else{fa=-S&7}S=ba-40-fa|0;c[8190]=ca+fa;c[8187]=S;c[ca+(fa+4)>>2]=S|1;c[ca+(ba-36)>>2]=40;c[8191]=c[8110]}else{S=33184;while(1){ga=c[S>>2]|0;ha=S+4|0;ia=c[ha>>2]|0;if((ca|0)==(ga+ia|0)){U=214;break}da=c[S+8>>2]|0;if((da|0)==0){break}else{S=da}}do{if((U|0)==214){if((c[S+12>>2]&8|0)!=0){break}da=ea;if(!(da>>>0>=ga>>>0&da>>>0<ca>>>0)){break}c[ha>>2]=ia+ba;X=(c[8187]|0)+ba|0;_=ea+8|0;if((_&7|0)==0){ja=0}else{ja=-_&7}_=X-ja|0;c[8190]=da+ja;c[8187]=_;c[da+(ja+4)>>2]=_|1;c[da+(X+4)>>2]=40;c[8191]=c[8110];break i}}while(0);if(ca>>>0<(c[8188]|0)>>>0){c[8188]=ca}S=ca+ba|0;X=33184;while(1){ka=X|0;if((c[ka>>2]|0)==(S|0)){U=224;break}da=c[X+8>>2]|0;if((da|0)==0){break}else{X=da}}do{if((U|0)==224){if((c[X+12>>2]&8|0)!=0){break}c[ka>>2]=ca;S=X+4|0;c[S>>2]=(c[S>>2]|0)+ba;S=ca+8|0;if((S&7|0)==0){la=0}else{la=-S&7}S=ca+(ba+8)|0;if((S&7|0)==0){ma=0}else{ma=-S&7}S=ca+(ma+ba)|0;da=S;_=la+o|0;Z=ca+_|0;$=Z;K=S-(ca+la)-o|0;c[ca+(la+4)>>2]=o|3;j:do{if((da|0)==(c[8190]|0)){T=(c[8187]|0)+K|0;c[8187]=T;c[8190]=$;c[ca+(_+4)>>2]=T|1}else{if((da|0)==(c[8189]|0)){T=(c[8186]|0)+K|0;c[8186]=T;c[8189]=$;c[ca+(_+4)>>2]=T|1;c[ca+(T+_)>>2]=T;break}T=ba+4|0;Y=c[ca+(T+ma)>>2]|0;if((Y&3|0)==1){aa=Y&-8;W=Y>>>3;k:do{if(Y>>>0<256>>>0){V=c[ca+((ma|8)+ba)>>2]|0;R=c[ca+(ba+12+ma)>>2]|0;J=32776+(W<<1<<2)|0;do{if((V|0)!=(J|0)){if(V>>>0<(c[8188]|0)>>>0){va();return 0}if((c[V+12>>2]|0)==(da|0)){break}va();return 0}}while(0);if((R|0)==(V|0)){c[8184]=c[8184]&~(1<<W);break}do{if((R|0)==(J|0)){na=R+8|0}else{if(R>>>0<(c[8188]|0)>>>0){va();return 0}L=R+8|0;if((c[L>>2]|0)==(da|0)){na=L;break}va();return 0}}while(0);c[V+12>>2]=R;c[na>>2]=V}else{J=S;L=c[ca+((ma|24)+ba)>>2]|0;O=c[ca+(ba+12+ma)>>2]|0;do{if((O|0)==(J|0)){Q=ma|16;P=ca+(T+Q)|0;e=c[P>>2]|0;if((e|0)==0){M=ca+(Q+ba)|0;Q=c[M>>2]|0;if((Q|0)==0){oa=0;break}else{pa=Q;qa=M}}else{pa=e;qa=P}while(1){P=pa+20|0;e=c[P>>2]|0;if((e|0)!=0){pa=e;qa=P;continue}P=pa+16|0;e=c[P>>2]|0;if((e|0)==0){break}else{pa=e;qa=P}}if(qa>>>0<(c[8188]|0)>>>0){va();return 0}else{c[qa>>2]=0;oa=pa;break}}else{P=c[ca+((ma|8)+ba)>>2]|0;if(P>>>0<(c[8188]|0)>>>0){va();return 0}e=P+12|0;if((c[e>>2]|0)!=(J|0)){va();return 0}M=O+8|0;if((c[M>>2]|0)==(J|0)){c[e>>2]=O;c[M>>2]=P;oa=O;break}else{va();return 0}}}while(0);if((L|0)==0){break}O=c[ca+(ba+28+ma)>>2]|0;V=33040+(O<<2)|0;do{if((J|0)==(c[V>>2]|0)){c[V>>2]=oa;if((oa|0)!=0){break}c[8185]=c[8185]&~(1<<O);break k}else{if(L>>>0<(c[8188]|0)>>>0){va();return 0}R=L+16|0;if((c[R>>2]|0)==(J|0)){c[R>>2]=oa}else{c[L+20>>2]=oa}if((oa|0)==0){break k}}}while(0);if(oa>>>0<(c[8188]|0)>>>0){va();return 0}c[oa+24>>2]=L;J=ma|16;O=c[ca+(J+ba)>>2]|0;do{if((O|0)!=0){if(O>>>0<(c[8188]|0)>>>0){va();return 0}else{c[oa+16>>2]=O;c[O+24>>2]=oa;break}}}while(0);O=c[ca+(T+J)>>2]|0;if((O|0)==0){break}if(O>>>0<(c[8188]|0)>>>0){va();return 0}else{c[oa+20>>2]=O;c[O+24>>2]=oa;break}}}while(0);ra=ca+((aa|ma)+ba)|0;sa=aa+K|0}else{ra=da;sa=K}T=ra+4|0;c[T>>2]=c[T>>2]&-2;c[ca+(_+4)>>2]=sa|1;c[ca+(sa+_)>>2]=sa;T=sa>>>3;if(sa>>>0<256>>>0){W=T<<1;Y=32776+(W<<2)|0;O=c[8184]|0;L=1<<T;do{if((O&L|0)==0){c[8184]=O|L;ta=Y;ua=32776+(W+2<<2)|0}else{T=32776+(W+2<<2)|0;V=c[T>>2]|0;if(!(V>>>0<(c[8188]|0)>>>0)){ta=V;ua=T;break}va();return 0}}while(0);c[ua>>2]=$;c[ta+12>>2]=$;c[ca+(_+8)>>2]=ta;c[ca+(_+12)>>2]=Y;break}W=Z;L=sa>>>8;do{if((L|0)==0){wa=0}else{if(sa>>>0>16777215>>>0){wa=31;break}O=(L+1048320|0)>>>16&8;aa=L<<O;T=(aa+520192|0)>>>16&4;V=aa<<T;aa=(V+245760|0)>>>16&2;R=14-(T|O|aa)+(V<<aa>>>15)|0;wa=sa>>>((R+7|0)>>>0)&1|R<<1}}while(0);L=33040+(wa<<2)|0;c[ca+(_+28)>>2]=wa;c[ca+(_+20)>>2]=0;c[ca+(_+16)>>2]=0;Y=c[8185]|0;R=1<<wa;if((Y&R|0)==0){c[8185]=Y|R;c[L>>2]=W;c[ca+(_+24)>>2]=L;c[ca+(_+12)>>2]=W;c[ca+(_+8)>>2]=W;break}R=c[L>>2]|0;if((wa|0)==31){xa=0}else{xa=25-(wa>>>1)|0}l:do{if((c[R+4>>2]&-8|0)==(sa|0)){ya=R}else{L=R;Y=sa<<xa;while(1){za=L+16+(Y>>>31<<2)|0;aa=c[za>>2]|0;if((aa|0)==0){break}if((c[aa+4>>2]&-8|0)==(sa|0)){ya=aa;break l}else{L=aa;Y=Y<<1}}if(za>>>0<(c[8188]|0)>>>0){va();return 0}else{c[za>>2]=W;c[ca+(_+24)>>2]=L;c[ca+(_+12)>>2]=W;c[ca+(_+8)>>2]=W;break j}}}while(0);R=ya+8|0;Y=c[R>>2]|0;J=c[8188]|0;if(ya>>>0<J>>>0){va();return 0}if(Y>>>0<J>>>0){va();return 0}else{c[Y+12>>2]=W;c[R>>2]=W;c[ca+(_+8)>>2]=Y;c[ca+(_+12)>>2]=ya;c[ca+(_+24)>>2]=0;break}}}while(0);n=ca+(la|8)|0;return n|0}}while(0);X=ea;_=33184;while(1){Ba=c[_>>2]|0;if(!(Ba>>>0>X>>>0)){Ca=c[_+4>>2]|0;Da=Ba+Ca|0;if(Da>>>0>X>>>0){break}}_=c[_+8>>2]|0}_=Ba+(Ca-39)|0;if((_&7|0)==0){Ea=0}else{Ea=-_&7}_=Ba+(Ca-47+Ea)|0;Z=_>>>0<(ea+16|0)>>>0?X:_;_=Z+8|0;$=ca+8|0;if(($&7|0)==0){Fa=0}else{Fa=-$&7}$=ba-40-Fa|0;c[8190]=ca+Fa;c[8187]=$;c[ca+(Fa+4)>>2]=$|1;c[ca+(ba-36)>>2]=40;c[8191]=c[8110];c[Z+4>>2]=27;c[_>>2]=c[8296];c[_+4>>2]=c[8297];c[_+8>>2]=c[8298];c[_+12>>2]=c[8299];c[8296]=ca;c[8297]=ba;c[8299]=0;c[8298]=_;_=Z+28|0;c[_>>2]=7;if((Z+32|0)>>>0<Da>>>0){$=_;while(1){_=$+4|0;c[_>>2]=7;if(($+8|0)>>>0<Da>>>0){$=_}else{break}}}if((Z|0)==(X|0)){break}$=Z-ea|0;_=X+($+4)|0;c[_>>2]=c[_>>2]&-2;c[ea+4>>2]=$|1;c[X+$>>2]=$;_=$>>>3;if($>>>0<256>>>0){K=_<<1;da=32776+(K<<2)|0;S=c[8184]|0;j=1<<_;do{if((S&j|0)==0){c[8184]=S|j;Ga=da;Ha=32776+(K+2<<2)|0}else{_=32776+(K+2<<2)|0;Y=c[_>>2]|0;if(!(Y>>>0<(c[8188]|0)>>>0)){Ga=Y;Ha=_;break}va();return 0}}while(0);c[Ha>>2]=ea;c[Ga+12>>2]=ea;c[ea+8>>2]=Ga;c[ea+12>>2]=da;break}K=ea;j=$>>>8;do{if((j|0)==0){Ia=0}else{if($>>>0>16777215>>>0){Ia=31;break}S=(j+1048320|0)>>>16&8;X=j<<S;Z=(X+520192|0)>>>16&4;_=X<<Z;X=(_+245760|0)>>>16&2;Y=14-(Z|S|X)+(_<<X>>>15)|0;Ia=$>>>((Y+7|0)>>>0)&1|Y<<1}}while(0);j=33040+(Ia<<2)|0;c[ea+28>>2]=Ia;c[ea+20>>2]=0;c[ea+16>>2]=0;da=c[8185]|0;Y=1<<Ia;if((da&Y|0)==0){c[8185]=da|Y;c[j>>2]=K;c[ea+24>>2]=j;c[ea+12>>2]=ea;c[ea+8>>2]=ea;break}Y=c[j>>2]|0;if((Ia|0)==31){Ja=0}else{Ja=25-(Ia>>>1)|0}m:do{if((c[Y+4>>2]&-8|0)==($|0)){Ka=Y}else{j=Y;da=$<<Ja;while(1){La=j+16+(da>>>31<<2)|0;X=c[La>>2]|0;if((X|0)==0){break}if((c[X+4>>2]&-8|0)==($|0)){Ka=X;break m}else{j=X;da=da<<1}}if(La>>>0<(c[8188]|0)>>>0){va();return 0}else{c[La>>2]=K;c[ea+24>>2]=j;c[ea+12>>2]=ea;c[ea+8>>2]=ea;break i}}}while(0);$=Ka+8|0;Y=c[$>>2]|0;da=c[8188]|0;if(Ka>>>0<da>>>0){va();return 0}if(Y>>>0<da>>>0){va();return 0}else{c[Y+12>>2]=K;c[$>>2]=K;c[ea+8>>2]=Y;c[ea+12>>2]=Ka;c[ea+24>>2]=0;break}}}while(0);ea=c[8187]|0;if(!(ea>>>0>o>>>0)){break}Y=ea-o|0;c[8187]=Y;ea=c[8190]|0;$=ea;c[8190]=$+o;c[$+(o+4)>>2]=Y|1;c[ea+4>>2]=o|3;n=ea+8|0;return n|0}}while(0);c[(Pa()|0)>>2]=12;n=0;return n|0}function Ph(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[8188]|0;if(b>>>0<e>>>0){va()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){va()}h=f&-8;i=a+(h-8)|0;j=i;a:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){va()}if((n|0)==(c[8189]|0)){p=a+(h-4)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[8186]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256>>>0){k=c[a+(l+8)>>2]|0;s=c[a+(l+12)>>2]|0;t=32776+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){va()}if((c[k+12>>2]|0)==(n|0)){break}va()}}while(0);if((s|0)==(k|0)){c[8184]=c[8184]&~(1<<p);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){va()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}va()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24)>>2]|0;v=c[a+(l+12)>>2]|0;do{if((v|0)==(t|0)){w=a+(l+20)|0;x=c[w>>2]|0;if((x|0)==0){y=a+(l+16)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break}else{B=z;C=y}}else{B=x;C=w}while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){va()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8)>>2]|0;if(w>>>0<e>>>0){va()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){va()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{va()}}}while(0);if((p|0)==0){q=n;r=o;break}v=c[a+(l+28)>>2]|0;m=33040+(v<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[8185]=c[8185]&~(1<<v);q=n;r=o;break a}else{if(p>>>0<(c[8188]|0)>>>0){va()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break a}}}while(0);if(A>>>0<(c[8188]|0)>>>0){va()}c[A+24>>2]=p;t=c[a+(l+16)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[8188]|0)>>>0){va()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[8188]|0)>>>0){va()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(!(d>>>0<i>>>0)){va()}A=a+(h-4)|0;e=c[A>>2]|0;if((e&1|0)==0){va()}do{if((e&2|0)==0){if((j|0)==(c[8190]|0)){B=(c[8187]|0)+r|0;c[8187]=B;c[8190]=q;c[q+4>>2]=B|1;if((q|0)!=(c[8189]|0)){return}c[8189]=0;c[8186]=0;return}if((j|0)==(c[8189]|0)){B=(c[8186]|0)+r|0;c[8186]=B;c[8189]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;b:do{if(e>>>0<256>>>0){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=32776+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[8188]|0)>>>0){va()}if((c[u+12>>2]|0)==(j|0)){break}va()}}while(0);if((g|0)==(u|0)){c[8184]=c[8184]&~(1<<C);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[8188]|0)>>>0){va()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}va()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16)>>2]|0;t=c[a+(h|4)>>2]|0;do{if((t|0)==(b|0)){p=a+(h+12)|0;v=c[p>>2]|0;if((v|0)==0){m=a+(h+8)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break}else{F=k;G=m}}else{F=v;G=p}while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[8188]|0)>>>0){va()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[8188]|0)>>>0){va()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){va()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{va()}}}while(0);if((f|0)==0){break}t=c[a+(h+20)>>2]|0;u=33040+(t<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[8185]=c[8185]&~(1<<t);break b}else{if(f>>>0<(c[8188]|0)>>>0){va()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break b}}}while(0);if(E>>>0<(c[8188]|0)>>>0){va()}c[E+24>>2]=f;b=c[a+(h+8)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[8188]|0)>>>0){va()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[8188]|0)>>>0){va()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[8189]|0)){H=B;break}c[8186]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256>>>0){d=r<<1;e=32776+(d<<2)|0;A=c[8184]|0;E=1<<r;do{if((A&E|0)==0){c[8184]=A|E;I=e;J=32776+(d+2<<2)|0}else{r=32776+(d+2<<2)|0;h=c[r>>2]|0;if(!(h>>>0<(c[8188]|0)>>>0)){I=h;J=r;break}va()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215>>>0){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=14-(E|J|d)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=33040+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[8185]|0;d=1<<K;c:do{if((r&d|0)==0){c[8185]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{A=c[I>>2]|0;if((K|0)==31){L=0}else{L=25-(K>>>1)|0}d:do{if((c[A+4>>2]&-8|0)==(H|0)){M=A}else{J=A;E=H<<L;while(1){N=J+16+(E>>>31<<2)|0;h=c[N>>2]|0;if((h|0)==0){break}if((c[h+4>>2]&-8|0)==(H|0)){M=h;break d}else{J=h;E=E<<1}}if(N>>>0<(c[8188]|0)>>>0){va()}else{c[N>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break c}}}while(0);A=M+8|0;B=c[A>>2]|0;E=c[8188]|0;if(M>>>0<E>>>0){va()}if(B>>>0<E>>>0){va()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=M;c[q+24>>2]=0;break}}}while(0);q=(c[8192]|0)-1|0;c[8192]=q;if((q|0)==0){O=33192}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[8192]=-1;return}function Qh(a,b){a=a|0;b=b|0;var d=0,e=0;do{if((a|0)==0){d=0}else{e=ba(b,a)|0;if(!((b|a)>>>0>65535>>>0)){d=e;break}d=((e>>>0)/(a>>>0)|0|0)==(b|0)?e:-1}}while(0);b=Oh(d)|0;if((b|0)==0){return b|0}if((c[b-4>>2]&3|0)==0){return b|0}Yh(b|0,0,d|0)|0;return b|0}function Rh(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;if((a|0)==0){d=Oh(b)|0;return d|0}if(b>>>0>4294967231>>>0){c[(Pa()|0)>>2]=12;d=0;return d|0}if(b>>>0<11>>>0){e=16}else{e=b+11&-8}f=Sh(a-8|0,e)|0;if((f|0)!=0){d=f+8|0;return d|0}f=Oh(b)|0;if((f|0)==0){d=0;return d|0}e=c[a-4>>2]|0;g=(e&-8)-((e&3|0)==0?8:4)|0;Wh(f|0,a|0,g>>>0<b>>>0?g:b)|0;Ph(a);d=f;return d|0}function Sh(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=a+4|0;e=c[d>>2]|0;f=e&-8;g=a;h=g+f|0;i=h;j=c[8188]|0;if(g>>>0<j>>>0){va();return 0}k=e&3;if(!((k|0)!=1&g>>>0<h>>>0)){va();return 0}l=g+(f|4)|0;m=c[l>>2]|0;if((m&1|0)==0){va();return 0}if((k|0)==0){if(b>>>0<256>>>0){n=0;return n|0}do{if(!(f>>>0<(b+4|0)>>>0)){if((f-b|0)>>>0>c[8108]<<1>>>0){break}else{n=a}return n|0}}while(0);n=0;return n|0}if(!(f>>>0<b>>>0)){k=f-b|0;if(!(k>>>0>15>>>0)){n=a;return n|0}c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|3;c[l>>2]=c[l>>2]|1;Vh(g+b|0,k);n=a;return n|0}if((i|0)==(c[8190]|0)){k=(c[8187]|0)+f|0;if(!(k>>>0>b>>>0)){n=0;return n|0}l=k-b|0;c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=l|1;c[8190]=g+b;c[8187]=l;n=a;return n|0}if((i|0)==(c[8189]|0)){l=(c[8186]|0)+f|0;if(l>>>0<b>>>0){n=0;return n|0}k=l-b|0;if(k>>>0>15>>>0){c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|1;c[g+l>>2]=k;o=g+(l+4)|0;c[o>>2]=c[o>>2]&-2;p=g+b|0;q=k}else{c[d>>2]=e&1|l|2;e=g+(l+4)|0;c[e>>2]=c[e>>2]|1;p=0;q=0}c[8186]=q;c[8189]=p;n=a;return n|0}if((m&2|0)!=0){n=0;return n|0}p=(m&-8)+f|0;if(p>>>0<b>>>0){n=0;return n|0}q=p-b|0;e=m>>>3;a:do{if(m>>>0<256>>>0){l=c[g+(f+8)>>2]|0;k=c[g+(f+12)>>2]|0;o=32776+(e<<1<<2)|0;do{if((l|0)!=(o|0)){if(l>>>0<j>>>0){va();return 0}if((c[l+12>>2]|0)==(i|0)){break}va();return 0}}while(0);if((k|0)==(l|0)){c[8184]=c[8184]&~(1<<e);break}do{if((k|0)==(o|0)){r=k+8|0}else{if(k>>>0<j>>>0){va();return 0}s=k+8|0;if((c[s>>2]|0)==(i|0)){r=s;break}va();return 0}}while(0);c[l+12>>2]=k;c[r>>2]=l}else{o=h;s=c[g+(f+24)>>2]|0;t=c[g+(f+12)>>2]|0;do{if((t|0)==(o|0)){u=g+(f+20)|0;v=c[u>>2]|0;if((v|0)==0){w=g+(f+16)|0;x=c[w>>2]|0;if((x|0)==0){y=0;break}else{z=x;A=w}}else{z=v;A=u}while(1){u=z+20|0;v=c[u>>2]|0;if((v|0)!=0){z=v;A=u;continue}u=z+16|0;v=c[u>>2]|0;if((v|0)==0){break}else{z=v;A=u}}if(A>>>0<j>>>0){va();return 0}else{c[A>>2]=0;y=z;break}}else{u=c[g+(f+8)>>2]|0;if(u>>>0<j>>>0){va();return 0}v=u+12|0;if((c[v>>2]|0)!=(o|0)){va();return 0}w=t+8|0;if((c[w>>2]|0)==(o|0)){c[v>>2]=t;c[w>>2]=u;y=t;break}else{va();return 0}}}while(0);if((s|0)==0){break}t=c[g+(f+28)>>2]|0;l=33040+(t<<2)|0;do{if((o|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[8185]=c[8185]&~(1<<t);break a}else{if(s>>>0<(c[8188]|0)>>>0){va();return 0}k=s+16|0;if((c[k>>2]|0)==(o|0)){c[k>>2]=y}else{c[s+20>>2]=y}if((y|0)==0){break a}}}while(0);if(y>>>0<(c[8188]|0)>>>0){va();return 0}c[y+24>>2]=s;o=c[g+(f+16)>>2]|0;do{if((o|0)!=0){if(o>>>0<(c[8188]|0)>>>0){va();return 0}else{c[y+16>>2]=o;c[o+24>>2]=y;break}}}while(0);o=c[g+(f+20)>>2]|0;if((o|0)==0){break}if(o>>>0<(c[8188]|0)>>>0){va();return 0}else{c[y+20>>2]=o;c[o+24>>2]=y;break}}}while(0);if(q>>>0<16>>>0){c[d>>2]=p|c[d>>2]&1|2;y=g+(p|4)|0;c[y>>2]=c[y>>2]|1;n=a;return n|0}else{c[d>>2]=c[d>>2]&1|b|2;c[g+(b+4)>>2]=q|3;d=g+(p|4)|0;c[d>>2]=c[d>>2]|1;Vh(g+b|0,q);n=a;return n|0}return 0}function Th(a,b){a=a|0;b=b|0;var c=0;if(a>>>0<9>>>0){c=Oh(b)|0;return c|0}else{c=Uh(a,b)|0;return c|0}return 0}function Uh(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;d=a>>>0<16>>>0?16:a;if((d-1&d|0)==0){e=d}else{a=16;while(1){if(a>>>0<d>>>0){a=a<<1}else{e=a;break}}}if(!((-64-e|0)>>>0>b>>>0)){c[(Pa()|0)>>2]=12;f=0;return f|0}if(b>>>0<11>>>0){g=16}else{g=b+11&-8}b=Oh(e+12+g|0)|0;if((b|0)==0){f=0;return f|0}a=b-8|0;d=a;h=e-1|0;do{if((b&h|0)==0){i=d}else{j=b+h&-e;k=j-8|0;l=a;if((k-l|0)>>>0>15>>>0){m=k}else{m=j+(e-8)|0}j=m;k=m-l|0;l=b-4|0;n=c[l>>2]|0;o=(n&-8)-k|0;if((n&3|0)==0){c[m>>2]=(c[a>>2]|0)+k;c[m+4>>2]=o;i=j;break}else{n=m+4|0;c[n>>2]=o|c[n>>2]&1|2;n=m+(o+4)|0;c[n>>2]=c[n>>2]|1;c[l>>2]=k|c[l>>2]&1|2;l=b+(k-4)|0;c[l>>2]=c[l>>2]|1;Vh(d,k);i=j;break}}}while(0);d=i+4|0;b=c[d>>2]|0;do{if((b&3|0)!=0){m=b&-8;if(!(m>>>0>(g+16|0)>>>0)){break}a=m-g|0;e=i;c[d>>2]=g|b&1|2;c[e+(g|4)>>2]=a|3;h=e+(m|4)|0;c[h>>2]=c[h>>2]|1;Vh(e+g|0,a)}}while(0);f=i+8|0;return f|0}function Vh(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;d=a;e=d+b|0;f=e;g=c[a+4>>2]|0;a:do{if((g&1|0)==0){h=c[a>>2]|0;if((g&3|0)==0){return}i=d+(-h|0)|0;j=i;k=h+b|0;l=c[8188]|0;if(i>>>0<l>>>0){va()}if((j|0)==(c[8189]|0)){m=d+(b+4)|0;if((c[m>>2]&3|0)!=3){n=j;o=k;break}c[8186]=k;c[m>>2]=c[m>>2]&-2;c[d+(4-h)>>2]=k|1;c[e>>2]=k;return}m=h>>>3;if(h>>>0<256>>>0){p=c[d+(8-h)>>2]|0;q=c[d+(12-h)>>2]|0;r=32776+(m<<1<<2)|0;do{if((p|0)!=(r|0)){if(p>>>0<l>>>0){va()}if((c[p+12>>2]|0)==(j|0)){break}va()}}while(0);if((q|0)==(p|0)){c[8184]=c[8184]&~(1<<m);n=j;o=k;break}do{if((q|0)==(r|0)){s=q+8|0}else{if(q>>>0<l>>>0){va()}t=q+8|0;if((c[t>>2]|0)==(j|0)){s=t;break}va()}}while(0);c[p+12>>2]=q;c[s>>2]=p;n=j;o=k;break}r=i;m=c[d+(24-h)>>2]|0;t=c[d+(12-h)>>2]|0;do{if((t|0)==(r|0)){u=16-h|0;v=d+(u+4)|0;w=c[v>>2]|0;if((w|0)==0){x=d+u|0;u=c[x>>2]|0;if((u|0)==0){y=0;break}else{z=u;A=x}}else{z=w;A=v}while(1){v=z+20|0;w=c[v>>2]|0;if((w|0)!=0){z=w;A=v;continue}v=z+16|0;w=c[v>>2]|0;if((w|0)==0){break}else{z=w;A=v}}if(A>>>0<l>>>0){va()}else{c[A>>2]=0;y=z;break}}else{v=c[d+(8-h)>>2]|0;if(v>>>0<l>>>0){va()}w=v+12|0;if((c[w>>2]|0)!=(r|0)){va()}x=t+8|0;if((c[x>>2]|0)==(r|0)){c[w>>2]=t;c[x>>2]=v;y=t;break}else{va()}}}while(0);if((m|0)==0){n=j;o=k;break}t=c[d+(28-h)>>2]|0;l=33040+(t<<2)|0;do{if((r|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[8185]=c[8185]&~(1<<t);n=j;o=k;break a}else{if(m>>>0<(c[8188]|0)>>>0){va()}i=m+16|0;if((c[i>>2]|0)==(r|0)){c[i>>2]=y}else{c[m+20>>2]=y}if((y|0)==0){n=j;o=k;break a}}}while(0);if(y>>>0<(c[8188]|0)>>>0){va()}c[y+24>>2]=m;r=16-h|0;t=c[d+r>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[8188]|0)>>>0){va()}else{c[y+16>>2]=t;c[t+24>>2]=y;break}}}while(0);t=c[d+(r+4)>>2]|0;if((t|0)==0){n=j;o=k;break}if(t>>>0<(c[8188]|0)>>>0){va()}else{c[y+20>>2]=t;c[t+24>>2]=y;n=j;o=k;break}}else{n=a;o=b}}while(0);a=c[8188]|0;if(e>>>0<a>>>0){va()}y=d+(b+4)|0;z=c[y>>2]|0;do{if((z&2|0)==0){if((f|0)==(c[8190]|0)){A=(c[8187]|0)+o|0;c[8187]=A;c[8190]=n;c[n+4>>2]=A|1;if((n|0)!=(c[8189]|0)){return}c[8189]=0;c[8186]=0;return}if((f|0)==(c[8189]|0)){A=(c[8186]|0)+o|0;c[8186]=A;c[8189]=n;c[n+4>>2]=A|1;c[n+A>>2]=A;return}A=(z&-8)+o|0;s=z>>>3;b:do{if(z>>>0<256>>>0){g=c[d+(b+8)>>2]|0;t=c[d+(b+12)>>2]|0;h=32776+(s<<1<<2)|0;do{if((g|0)!=(h|0)){if(g>>>0<a>>>0){va()}if((c[g+12>>2]|0)==(f|0)){break}va()}}while(0);if((t|0)==(g|0)){c[8184]=c[8184]&~(1<<s);break}do{if((t|0)==(h|0)){B=t+8|0}else{if(t>>>0<a>>>0){va()}m=t+8|0;if((c[m>>2]|0)==(f|0)){B=m;break}va()}}while(0);c[g+12>>2]=t;c[B>>2]=g}else{h=e;m=c[d+(b+24)>>2]|0;l=c[d+(b+12)>>2]|0;do{if((l|0)==(h|0)){i=d+(b+20)|0;p=c[i>>2]|0;if((p|0)==0){q=d+(b+16)|0;v=c[q>>2]|0;if((v|0)==0){C=0;break}else{D=v;E=q}}else{D=p;E=i}while(1){i=D+20|0;p=c[i>>2]|0;if((p|0)!=0){D=p;E=i;continue}i=D+16|0;p=c[i>>2]|0;if((p|0)==0){break}else{D=p;E=i}}if(E>>>0<a>>>0){va()}else{c[E>>2]=0;C=D;break}}else{i=c[d+(b+8)>>2]|0;if(i>>>0<a>>>0){va()}p=i+12|0;if((c[p>>2]|0)!=(h|0)){va()}q=l+8|0;if((c[q>>2]|0)==(h|0)){c[p>>2]=l;c[q>>2]=i;C=l;break}else{va()}}}while(0);if((m|0)==0){break}l=c[d+(b+28)>>2]|0;g=33040+(l<<2)|0;do{if((h|0)==(c[g>>2]|0)){c[g>>2]=C;if((C|0)!=0){break}c[8185]=c[8185]&~(1<<l);break b}else{if(m>>>0<(c[8188]|0)>>>0){va()}t=m+16|0;if((c[t>>2]|0)==(h|0)){c[t>>2]=C}else{c[m+20>>2]=C}if((C|0)==0){break b}}}while(0);if(C>>>0<(c[8188]|0)>>>0){va()}c[C+24>>2]=m;h=c[d+(b+16)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[8188]|0)>>>0){va()}else{c[C+16>>2]=h;c[h+24>>2]=C;break}}}while(0);h=c[d+(b+20)>>2]|0;if((h|0)==0){break}if(h>>>0<(c[8188]|0)>>>0){va()}else{c[C+20>>2]=h;c[h+24>>2]=C;break}}}while(0);c[n+4>>2]=A|1;c[n+A>>2]=A;if((n|0)!=(c[8189]|0)){F=A;break}c[8186]=A;return}else{c[y>>2]=z&-2;c[n+4>>2]=o|1;c[n+o>>2]=o;F=o}}while(0);o=F>>>3;if(F>>>0<256>>>0){z=o<<1;y=32776+(z<<2)|0;C=c[8184]|0;b=1<<o;do{if((C&b|0)==0){c[8184]=C|b;G=y;H=32776+(z+2<<2)|0}else{o=32776+(z+2<<2)|0;d=c[o>>2]|0;if(!(d>>>0<(c[8188]|0)>>>0)){G=d;H=o;break}va()}}while(0);c[H>>2]=n;c[G+12>>2]=n;c[n+8>>2]=G;c[n+12>>2]=y;return}y=n;G=F>>>8;do{if((G|0)==0){I=0}else{if(F>>>0>16777215>>>0){I=31;break}H=(G+1048320|0)>>>16&8;z=G<<H;b=(z+520192|0)>>>16&4;C=z<<b;z=(C+245760|0)>>>16&2;o=14-(b|H|z)+(C<<z>>>15)|0;I=F>>>((o+7|0)>>>0)&1|o<<1}}while(0);G=33040+(I<<2)|0;c[n+28>>2]=I;c[n+20>>2]=0;c[n+16>>2]=0;o=c[8185]|0;z=1<<I;if((o&z|0)==0){c[8185]=o|z;c[G>>2]=y;c[n+24>>2]=G;c[n+12>>2]=n;c[n+8>>2]=n;return}z=c[G>>2]|0;if((I|0)==31){J=0}else{J=25-(I>>>1)|0}c:do{if((c[z+4>>2]&-8|0)==(F|0)){K=z}else{I=z;G=F<<J;while(1){L=I+16+(G>>>31<<2)|0;o=c[L>>2]|0;if((o|0)==0){break}if((c[o+4>>2]&-8|0)==(F|0)){K=o;break c}else{I=o;G=G<<1}}if(L>>>0<(c[8188]|0)>>>0){va()}c[L>>2]=y;c[n+24>>2]=I;c[n+12>>2]=n;c[n+8>>2]=n;return}}while(0);L=K+8|0;F=c[L>>2]|0;J=c[8188]|0;if(K>>>0<J>>>0){va()}if(F>>>0<J>>>0){va()}c[F+12>>2]=y;c[L>>2]=y;c[n+8>>2]=F;c[n+12>>2]=K;c[n+24>>2]=0;return}function Wh(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((e|0)>=4096)return La(b|0,d|0,e|0)|0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function Xh(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;if((c|0)<(b|0)&(b|0)<(c+d|0)){e=b;c=c+d|0;b=b+d|0;while((d|0)>0){b=b-1|0;c=c-1|0;d=d-1|0;a[b]=a[c]|0}b=e}else{Wh(b,c,d)|0}return b|0}function Yh(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b+e|0;if((e|0)>=20){d=d&255;g=b&3;h=d|d<<8|d<<16|d<<24;i=f&~3;if(g){g=b+4-g|0;while((b|0)<(g|0)){a[b]=d;b=b+1|0}}while((b|0)<(i|0)){c[b>>2]=h;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}return b-e|0}function Zh(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function _h(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=a+c>>>0;return(F=b+d+(e>>>0<a>>>0|0)>>>0,e|0)|0}function $h(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=b-d>>>0;e=b-d-(c>>>0>a>>>0|0)>>>0;return(F=e,a-c>>>0|0)|0}function ai(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){F=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}F=a<<c-32;return 0}function bi(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){F=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}F=0;return b>>>c-32|0}function ci(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){F=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}F=(b|0)<0?-1:0;return b>>c-32|0}function di(b){b=b|0;var c=0;c=a[n+(b>>>24)|0]|0;if((c|0)<8)return c|0;c=a[n+(b>>16&255)|0]|0;if((c|0)<8)return c+8|0;c=a[n+(b>>8&255)|0]|0;if((c|0)<8)return c+16|0;return(a[n+(b&255)|0]|0)+24|0}function ei(b){b=b|0;var c=0;c=a[m+(b&255)|0]|0;if((c|0)<8)return c|0;c=a[m+(b>>8&255)|0]|0;if((c|0)<8)return c+8|0;c=a[m+(b>>16&255)|0]|0;if((c|0)<8)return c+16|0;return(a[m+(b>>>24)|0]|0)+24|0}function fi(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=a&65535;d=b&65535;e=ba(d,c)|0;f=a>>>16;a=(e>>>16)+(ba(d,f)|0)|0;d=b>>>16;b=ba(d,c)|0;return(F=(a>>>16)+(ba(d,f)|0)+(((a&65535)+b|0)>>>16)|0,a+b<<16|e&65535|0)|0}function gi(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=b>>31|((b|0)<0?-1:0)<<1;f=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;g=d>>31|((d|0)<0?-1:0)<<1;h=((d|0)<0?-1:0)>>31|((d|0)<0?-1:0)<<1;i=$h(e^a,f^b,e,f)|0;b=F;a=g^e;e=h^f;f=$h((li(i,b,$h(g^c,h^d,g,h)|0,F,0)|0)^a,F^e,a,e)|0;return(F=F,f)|0}function hi(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=f|0;h=b>>31|((b|0)<0?-1:0)<<1;j=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;k=e>>31|((e|0)<0?-1:0)<<1;l=((e|0)<0?-1:0)>>31|((e|0)<0?-1:0)<<1;m=$h(h^a,j^b,h,j)|0;b=F;li(m,b,$h(k^d,l^e,k,l)|0,F,g)|0;l=$h(c[g>>2]^h,c[g+4>>2]^j,h,j)|0;j=F;i=f;return(F=j,l)|0}function ii(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;a=c;c=fi(e,a)|0;f=F;return(F=(ba(b,a)|0)+(ba(d,e)|0)+f|f&0,c|0|0)|0}function ji(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=li(a,b,c,d,0)|0;return(F=F,e)|0}function ki(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+8|0;g=f|0;li(a,b,d,e,g)|0;i=f;return(F=c[g+4>>2]|0,c[g>>2]|0)|0}function li(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;g=a;h=b;i=h;j=d;k=e;l=k;if((i|0)==0){m=(f|0)!=0;if((l|0)==0){if(m){c[f>>2]=(g>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(g>>>0)/(j>>>0)>>>0;return(F=n,o)|0}else{if(!m){n=0;o=0;return(F=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=b&0;n=0;o=0;return(F=n,o)|0}}m=(l|0)==0;do{if((j|0)==0){if(m){if((f|0)!=0){c[f>>2]=(i>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(i>>>0)/(j>>>0)>>>0;return(F=n,o)|0}if((g|0)==0){if((f|0)!=0){c[f>>2]=0;c[f+4>>2]=(i>>>0)%(l>>>0)}n=0;o=(i>>>0)/(l>>>0)>>>0;return(F=n,o)|0}p=l-1|0;if((p&l|0)==0){if((f|0)!=0){c[f>>2]=a|0;c[f+4>>2]=p&i|b&0}n=0;o=i>>>((ei(l|0)|0)>>>0);return(F=n,o)|0}p=(di(l|0)|0)-(di(i|0)|0)|0;if(p>>>0<=30){q=p+1|0;r=31-p|0;s=q;t=i<<r|g>>>(q>>>0);u=i>>>(q>>>0);v=0;w=g<<r;break}if((f|0)==0){n=0;o=0;return(F=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(F=n,o)|0}else{if(!m){r=(di(l|0)|0)-(di(i|0)|0)|0;if(r>>>0<=31){q=r+1|0;p=31-r|0;x=r-31>>31;s=q;t=g>>>(q>>>0)&x|i<<p;u=i>>>(q>>>0)&x;v=0;w=g<<p;break}if((f|0)==0){n=0;o=0;return(F=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(F=n,o)|0}p=j-1|0;if((p&j|0)!=0){x=(di(j|0)|0)+33-(di(i|0)|0)|0;q=64-x|0;r=32-x|0;y=r>>31;z=x-32|0;A=z>>31;s=x;t=r-1>>31&i>>>(z>>>0)|(i<<r|g>>>(x>>>0))&A;u=A&i>>>(x>>>0);v=g<<q&y;w=(i<<q|g>>>(z>>>0))&y|g<<r&x-33>>31;break}if((f|0)!=0){c[f>>2]=p&g;c[f+4>>2]=0}if((j|0)==1){n=h|b&0;o=a|0|0;return(F=n,o)|0}else{p=ei(j|0)|0;n=i>>>(p>>>0)|0;o=i<<32-p|g>>>(p>>>0)|0;return(F=n,o)|0}}}while(0);if((s|0)==0){B=w;C=v;D=u;E=t;G=0;H=0}else{g=d|0|0;d=k|e&0;e=_h(g,d,-1,-1)|0;k=F;i=w;w=v;v=u;u=t;t=s;s=0;while(1){I=w>>>31|i<<1;J=s|w<<1;j=u<<1|i>>>31|0;a=u>>>31|v<<1|0;$h(e,k,j,a)|0;b=F;h=b>>31|((b|0)<0?-1:0)<<1;K=h&1;L=$h(j,a,h&g,(((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1)&d)|0;M=F;b=t-1|0;if((b|0)==0){break}else{i=I;w=J;v=M;u=L;t=b;s=K}}B=I;C=J;D=M;E=L;G=0;H=K}K=C;C=0;if((f|0)!=0){c[f>>2]=E;c[f+4>>2]=D}n=(K|0)>>>31|(B|C)<<1|(C<<1|K>>>31)&0|G;o=(K<<1|0>>>31)&-2|H;return(F=n,o)|0}function mi(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;Xa[a&63](b|0,c|0,d|0,e|0,f|0,g|0,h|0)}function ni(a,b){a=a|0;b=b|0;Ya[a&7](b|0)}function oi(a,b,c,d,e,f,g,h,i,j,k,l,m){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;Za[a&3](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0,j|0,k|0,l|0,m|0)}function pi(a,b){a=a|0;b=b|0;return _a[a&3](b|0)|0}function qi(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;$a[a&15](b|0,c|0,d|0)}function ri(a){a=a|0;ab[a&1]()}function si(a,b,c,d,e,f,g,h,i,j){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;bb[a&7](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0,j|0)}function ti(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;cb[a&3](b|0,c|0,d|0,e|0,f|0,g|0)}function ui(a,b,c){a=a|0;b=b|0;c=c|0;return db[a&1](b|0,c|0)|0}function vi(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;eb[a&3](b|0,c|0,d|0,e|0)}function wi(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;ca(0)}function xi(a){a=a|0;ca(1)}function yi(a,b,c,d,e,f,g,h,i,j,k,l){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;ca(2)}function zi(a){a=a|0;ca(3);return 0}function Ai(a,b,c){a=a|0;b=b|0;c=c|0;ca(4)}function Bi(){ca(5)}function Ci(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;ca(6)}function Di(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ca(7)}function Ei(a,b){a=a|0;b=b|0;ca(8);return 0}function Fi(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ca(9)}



function fb(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function gb(){return i|0}function hb(a){a=a|0;i=a}function ib(a,b){a=a|0;b=b|0;if((s|0)==0){s=a;t=b}}function jb(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function kb(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function lb(a){a=a|0;F=a}function mb(a){a=a|0;G=a}function nb(a){a=a|0;H=a}function ob(a){a=a|0;I=a}function pb(a){a=a|0;J=a}function qb(a){a=a|0;K=a}function rb(a){a=a|0;L=a}function sb(a){a=a|0;M=a}function tb(a){a=a|0;N=a}function ub(a){a=a|0;O=a}function vb(){}function wb(a){a=a|0;var b=0;b=a;c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;i=i;return}function xb(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=a;a=b;if((c[e+8>>2]|0)>=(a|0)){i=d;return}b=Oh(a)|0;if((c[e>>2]|0)!=0){Wh(b|0,c[e>>2]|0,c[e+4>>2]|0)|0;Ph(c[e>>2]|0)}c[e>>2]=b;c[e+8>>2]=a;i=d;return}function yb(a){a=a|0;var b=0,d=0;b=i;d=a;if((c[d>>2]|0)==0){i=b;return}Ph(c[d>>2]|0);c[d>>2]=0;c[d+4>>2]=0;c[d+8>>2]=0;i=b;return}function zb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;f=a;a=d;xb(f,(c[f+4>>2]|0)+a|0);Wh((c[f>>2]|0)+(c[f+4>>2]|0)|0,b|0,a)|0;b=f+4|0;c[b>>2]=(c[b>>2]|0)+a;i=e;return}function Ab(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=a;a=b;c[e>>2]=c[a>>2];c[e+4>>2]=c[a+4>>2];a=e+8|0;c[a>>2]=0;c[a+4>>2]=0;c[e+16>>2]=0;Bb(e);i=d;return}function Bb(a){a=a|0;var b=0,e=0,f=0,g=0,h=0,j=0;b=i;i=i+8|0;e=b|0;f=a;a=64-(c[f+16>>2]|0)|0;while(1){if((a|0)>=8){g=(c[f+4>>2]|0)!=0}else{g=0}if(!g){break}h=f|0;j=c[h>>2]|0;c[h>>2]=j+1;c[e>>2]=d[j]|0;c[e+4>>2]=0;j=f+4|0;c[j>>2]=(c[j>>2]|0)-1;a=a-8|0;j=ai(c[e>>2]|0,c[e+4>>2]|0,a|0)|0;c[e>>2]=j;c[e+4>>2]=F;j=f+8|0;h=c[j+4>>2]|c[e+4>>2];c[j>>2]=c[j>>2]|c[e>>2];c[j+4>>2]=h}c[f+16>>2]=64-a;i=b;return}function Cb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+8|0;e=d|0;f=a;a=b;if((c[f+16>>2]|0)<(a|0)){Bb(f)}b=f+8|0;g=c[b+4>>2]|0;c[e>>2]=c[b>>2];c[e+4>>2]=g;g=bi(c[e>>2]|0,c[e+4>>2]|0,64-a|0)|0;c[e>>2]=g;c[e+4>>2]=F;g=f+8|0;b=ai(c[g>>2]|0,c[g+4>>2]|0,a|0)|0;c[g>>2]=b;c[g+4>>2]=F;g=f+16|0;c[g>>2]=(c[g>>2]|0)-a;i=d;return c[e>>2]|0}function Db(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;e=a;a=b;if((c[e+16>>2]|0)<(a|0)){Bb(e)}b=e+8|0;f=ai(c[b>>2]|0,c[b+4>>2]|0,a|0)|0;c[b>>2]=f;c[b+4>>2]=F;b=e+16|0;c[b>>2]=(c[b>>2]|0)-a;i=d;return}function Eb(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=a;a=c[d+16>>2]&7;e=d+8|0;f=ai(c[e>>2]|0,c[e+4>>2]|0,a|0)|0;c[e>>2]=f;c[e+4>>2]=F;e=d+16|0;c[e>>2]=(c[e>>2]|0)-a;i=b;return}function Fb(a){a=a|0;var b=0,d=0,e=0;b=i;d=a;Eb(d);a=(c[d+16>>2]|0)/8|0;e=d|0;c[e>>2]=(c[e>>2]|0)+(-a|0);e=d+4|0;c[e>>2]=(c[e>>2]|0)+a;a=d+8|0;c[a>>2]=0;c[a+4>>2]=0;c[d+16>>2]=0;i=b;return}function Gb(a){a=a|0;var b=0,c=0,d=0,e=0,f=0;b=i;c=a;a=0;while(1){if((Cb(c,1)|0)!=0){break}a=a+1|0;if((a|0)>20){d=4;break}}if((d|0)==4){e=-99999;f=e;i=b;return f|0}d=0;if((a|0)!=0){d=Cb(c,a)|0;e=d+(1<<a)-1|0;f=e;i=b;return f|0}else{e=0;f=e;i=b;return f|0}return 0}function Hb(a){a=a|0;var b=0,c=0,d=0,e=0,f=0;b=i;c=Gb(a)|0;if((c|0)==0){d=c;e=d;i=b;return e|0}if((c|0)==-99999){d=-99999;e=d;i=b;return e|0}if((c&1|0)==0&1){f=(-c|0)/2|0}else{f=(c+1|0)/2|0}d=f;e=d;i=b;return e|0}function Ib(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;a=b;c[e>>2]=a;c[e+4>>2]=a;c[e+8>>2]=a+d;i=i;return}function Jb(a){a=a|0;var e=0,f=0,g=0,h=0;e=i;f=a;a=(c[f+8>>2]|0)-(c[f+4>>2]|0)|0;c[f+12>>2]=510;b[f+20>>1]=8;c[f+16>>2]=0;if((a|0)>0){g=f+4|0;h=c[g>>2]|0;c[g>>2]=h+1;c[f+16>>2]=d[h]<<8;h=f+20|0;b[h>>1]=(b[h>>1]|0)-8}if((a|0)<=1){i=e;return}a=f+4|0;h=c[a>>2]|0;c[a>>2]=h+1;a=f+16|0;c[a>>2]=c[a>>2]|d[h];h=f+20|0;b[h>>1]=(b[h>>1]|0)-8;i=e;return}function Kb(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;h=e;e=f;f=d[15760+(((d[e]|0)>>>1&255)<<2)+(((c[h+12>>2]|0)>>>6)-4)|0]|0;j=h+12|0;c[j>>2]=(c[j>>2]|0)-f;j=c[h+12>>2]<<7;if((c[h+16>>2]|0)>>>0<j>>>0){k=a[e]&1;l=e;a[l]=a[l]&1|(a[488+((d[e]|0)>>>1&255)|0]&127)<<1;if(j>>>0<32768>>>0){c[h+12>>2]=j>>>6;l=h+16|0;c[l>>2]=c[l>>2]<<1;l=h+20|0;b[l>>1]=(b[l>>1]|0)+1;if((b[h+20>>1]|0)==0){b[h+20>>1]=-8;if((c[h+4>>2]|0)!=(c[h+8>>2]|0)){l=h+4|0;m=c[l>>2]|0;c[l>>2]=m+1;l=h+16|0;c[l>>2]=c[l>>2]|d[m]}}}n=k;i=g;return n|0}else{m=d[440+(f>>3)|0]|0;c[h+16>>2]=(c[h+16>>2]|0)-j;j=h+16|0;c[j>>2]=c[j>>2]<<m;c[h+12>>2]=f<<m;k=1-(a[e]&1)|0;if(((d[e]|0)>>>1&255|0)==0){f=e;a[f]=a[f]&-2|1-(a[e]&1)&1}f=e;a[f]=a[f]&1|(a[552+((d[e]|0)>>>1&255)|0]&127)<<1;e=h+20|0;b[e>>1]=(b[e>>1]|0)+m;if((b[h+20>>1]|0)>=0){if((c[h+4>>2]|0)!=(c[h+8>>2]|0)){m=h+4|0;e=c[m>>2]|0;c[m>>2]=e+1;m=h+16|0;c[m>>2]=c[m>>2]|d[e]<<b[h+20>>1]}e=h+20|0;b[e>>1]=(b[e>>1]|0)-8}n=k;i=g;return n|0}return 0}function Lb(a){a=a|0;var e=0,f=0,g=0,h=0,j=0;e=i;f=a;a=f+12|0;c[a>>2]=(c[a>>2]|0)-2;a=c[f+12>>2]<<7;if((c[f+16>>2]|0)>>>0>=a>>>0){g=1;h=g;i=e;return h|0}if(a>>>0<32768>>>0){c[f+12>>2]=a>>>6;a=f+16|0;c[a>>2]=c[a>>2]<<1;a=f+20|0;b[a>>1]=(b[a>>1]|0)+1;if((b[f+20>>1]|0)==0){b[f+20>>1]=-8;if((c[f+4>>2]|0)!=(c[f+8>>2]|0)){a=f+4|0;j=c[a>>2]|0;c[a>>2]=j+1;a=f+16|0;c[a>>2]=(c[a>>2]|0)+(d[j]|0)}}}g=0;h=g;i=e;return h|0}function Mb(a){a=a|0;var e=0,f=0,g=0,h=0,j=0;e=i;f=a;a=f+16|0;c[a>>2]=c[a>>2]<<1;a=f+20|0;b[a>>1]=(b[a>>1]|0)+1;if((b[f+20>>1]|0)>=0){b[f+20>>1]=-8;a=f+4|0;g=c[a>>2]|0;c[a>>2]=g+1;a=f+16|0;c[a>>2]=c[a>>2]|d[g]}g=c[f+12>>2]<<7;if((c[f+16>>2]|0)>>>0>=g>>>0){a=f+16|0;c[a>>2]=(c[a>>2]|0)-g;h=1;j=h;i=e;return j|0}else{h=0;j=h;i=e;return j|0}return 0}function Nb(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0;c=i;d=a;a=b;b=0;while(1){if((b|0)>=(a|0)){e=7;break}if((Mb(d)|0)==0){e=4;break}b=b+1|0}if((e|0)==4){f=b;g=f;i=c;return g|0}else if((e|0)==7){f=a;g=f;i=c;return g|0}return 0}function Ob(a,e){a=a|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;g=a;a=e;e=g+16|0;c[e>>2]=c[e>>2]<<a;e=g+20|0;b[e>>1]=(b[e>>1]|0)+a;if((b[g+20>>1]|0)>=0){e=g+4|0;h=c[e>>2]|0;c[e>>2]=h+1;e=d[h]|0;e=e<<b[g+20>>1];h=g+20|0;b[h>>1]=(b[h>>1]|0)-8;h=g+16|0;c[h>>2]=c[h>>2]|e}e=c[g+12>>2]<<7;h=((c[g+16>>2]|0)>>>0)/(e>>>0)|0;if((((h|0)>=(1<<a|0)^1^1)&1|0)==0){j=h;k=e;l=ba(j,k)|0;m=g;n=m+16|0;o=c[n>>2]|0;p=o-l|0;c[n>>2]=p;q=h;i=f;return q|0}h=(1<<a)-1|0;j=h;k=e;l=ba(j,k)|0;m=g;n=m+16|0;o=c[n>>2]|0;p=o-l|0;c[n>>2]=p;q=h;i=f;return q|0}function Pb(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0;c=i;d=a;a=b;b=0;do{if((((a|0)<=8^1^1)&1|0)!=0){if((a|0)==0){e=0;f=e;i=c;return f|0}else{b=Ob(d,a)|0;break}}else{b=Ob(d,8)|0;a=a-8|0;while(1){g=a;a=g-1|0;if((g|0)==0){break}b=b<<1;b=b|(Mb(d)|0)}}}while(0);e=b;f=e;i=c;return f|0}function Qb(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;c=i;d=a;a=0;e=b;while(1){if((Mb(d)|0)==0){break}a=a+(1<<e)|0;e=e+1|0}b=a+(Pb(d,e)|0)|0;i=c;return b|0}function Rb(){return 9864}function Sb(){return 393216}function Tb(a){a=a|0;var b=0;switch(a|0){case 1006:{b=11296;break};case 1007:{b=11072;break};case 1008:{b=10656;break};case 1009:{b=10624;break};case 1010:{b=10416;break};case 1011:{b=10224;break};case 1012:{b=10048;break};case 1013:{b=9824;break};case 1014:{b=9624;break};case 1015:{b=9384;break};case 14:{b=12752;break};case 1e3:{b=12504;break};case 1001:{b=12288;break};case 1002:{b=12080;break};case 1003:{b=11888;break};case 1004:{b=11704;break};case 1005:{b=11520;break};case 1016:{b=9192;break};case 1017:{b=8968;break};case 1018:{b=8728;break};case 1019:{b=8248;break};case 1020:{b=8216;break};case 1021:{b=8032;break};case 1022:{b=7816;break};case 1023:{b=7536;break};case 5:{b=5872;break};case 3:{b=8440;break};case 1:{b=10888;break};case 8:{b=4064;break};case 9:{b=3800;break};case 10:{b=14328;break};case 0:{b=13384;break};case 6:{b=4816;break};case 7:{b=4312;break};case 4:{b=7608;break};case 11:{b=14144;break};case 12:{b=13936;break};case 500:{b=13680;break};case 501:{b=13080;break};case 13:{b=13016;break};default:{b=7392}}i=i;return b|0}function Ub(a){a=a|0;var b=0,c=0;b=a;if((b|0)==0){c=1}else{c=b>>>0>=1e3>>>0}i=i;return c&1|0}function Vb(){var a=0,b=0;a=i;do{if((hh(32456,1)|0)>1){b=0}else{Le();if(bf()|0){b=0;break}else{gh(32456,1)|0;b=11;break}}}while(0);i=a;return b|0}function Wb(){var a=0,b=0,c=0,d=0;a=i;b=gh(32456,1)|0;if((b|0)<0){hh(32456,1)|0;c=12;d=c;i=a;return d|0}if((b|0)==0){cf()}c=0;d=c;i=a;return d|0}function Xb(){var a=0,b=0,c=0;a=i;do{if((Vb()|0)!=0){b=0}else{c=Qh(3284512,1)|0;if((c|0)!=0){Gc(c);b=c;break}else{Wb()|0;b=0;break}}}while(0);i=a;return b|0}function Yb(a){a=a|0;var b=0,d=0;b=i;d=a;a=d;if((c[a+2280780>>2]|0)>0){eh(a+2243444|0)}Mc(a);Ph(d);d=Wb()|0;i=b;return d|0}function Zb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;e=b;b=a;if((e|0)>32){e=32}c[b+2280780>>2]=e;if((e|0)<=0){f=0;g=f;i=d;return g|0}a=ch(b+2243444|0,e)|0;if((Ub(a)|0)!=0){a=0}f=a;g=f;i=d;return g|0}function _b(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=a;a=b;if((c[e+44>>2]|0)==(c[e+40>>2]|0)){if((c[e+44>>2]|0)==0){c[e+44>>2]=16}else{b=e+44|0;c[b>>2]=c[b>>2]<<2}c[e+36>>2]=Rh(c[e+36>>2]|0,c[e+44>>2]<<2)|0}c[(c[e+36>>2]|0)+(c[e+40>>2]<<2)>>2]=a;a=e+40|0;c[a>>2]=(c[a>>2]|0)+1;i=d;return}function $b(b,e,f,g,h,j){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0;k=i;i=i+8|0;l=k|0;m=f;c[l>>2]=g;c[l+4>>2]=h;h=b;b=e;if((c[h+328>>2]|0)==0){c[h+328>>2]=Ic(h,m+3|0,16)|0;e=c[l+4>>2]|0;g=(c[h+328>>2]|0)+24|0;c[g>>2]=c[l>>2];c[g+4>>2]=e;c[(c[h+328>>2]|0)+32>>2]=j}j=c[h+328>>2]|0;xb(j+12|0,(c[j+16>>2]|0)+m+3|0);e=(c[j+12>>2]|0)+(c[j+16>>2]|0)|0;g=0;while(1){if((g|0)>=(m|0)){break}switch(c[h+324>>2]|0){case 3:{f=e;e=f+1|0;a[f]=a[b]|0;c[h+324>>2]=4;break};case 4:{f=e;e=f+1|0;a[f]=a[b]|0;c[h+324>>2]=5;break};case 5:{if((d[b]|0|0)==0){c[h+324>>2]=6}else{f=e;e=f+1|0;a[f]=a[b]|0}break};case 6:{if((d[b]|0|0)==0){c[h+324>>2]=7}else{f=e;e=f+1|0;a[f]=0;f=e;e=f+1|0;a[f]=a[b]|0;c[h+324>>2]=5}break};case 7:{if((d[b]|0|0)==0){f=e;e=f+1|0;a[f]=0}else{if((d[b]|0|0)==3){f=e;e=f+1|0;a[f]=0;f=e;e=f+1|0;a[f]=0;c[h+324>>2]=5;_b(j,e-(c[j+12>>2]|0)+(c[j+40>>2]|0)|0)}else{if((d[b]|0|0)==1){c[j+16>>2]=e-(c[j+12>>2]|0);Lc(h,j);c[h+328>>2]=Ic(h,m+3|0,16)|0;f=c[l+4>>2]|0;n=(c[h+328>>2]|0)+24|0;c[n>>2]=c[l>>2];c[n+4>>2]=f;j=c[h+328>>2]|0;e=c[j+12>>2]|0;c[h+324>>2]=3;c[j+40>>2]=0}else{f=e;e=f+1|0;a[f]=0;f=e;e=f+1|0;a[f]=0;f=e;e=f+1|0;a[f]=a[b]|0;c[h+324>>2]=5}}}break};case 2:{if((d[b]|0|0)==1){c[h+324>>2]=3;c[j+40>>2]=0}else{if((d[b]|0|0)!=0){c[h+324>>2]=0}}break};case 0:case 1:{if((d[b]|0|0)==0){f=h+324|0;c[f>>2]=(c[f>>2]|0)+1}else{c[h+324>>2]=0}break};default:{}}b=b+1|0;g=g+1|0}c[j+16>>2]=e-(c[j+12>>2]|0);i=k;return 0}function ac(b){b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+8|0;e=d|0;f=b;if((c[f+328>>2]|0)==0){g=f;h=g+320|0;a[h]=1;i=d;return 0}b=c[f+328>>2]|0;Yh(e|0,0,2)|0;if((c[f+324>>2]|0)==6){zb(b+12|0,e|0,1)}if((c[f+324>>2]|0)==7){zb(b+12|0,e|0,2)}if((c[f+324>>2]|0)>=5){Lc(f,b);c[f+328>>2]=0}c[f+324>>2]=0;g=f;h=g+320|0;a[h]=1;i=d;return 0}function bc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;f=b;b=d;d=f;do{if((c[d+336>>2]|0)==0){if(!(a[d+320|0]&1)){break}if((b|0)!=0){c[b>>2]=0}Sc(d);while(1){if((c[d+2287692>>2]|0)<=0){break}Xc(d);if((b|0)!=0){c[b>>2]=1}}g=0;h=g;i=e;return h|0}}while(0);if((c[d+336>>2]|0)==0){if((b|0)!=0){c[b>>2]=1}g=13;h=g;i=e;return h|0}if(!(Yc(d,0)|0)){if((b|0)!=0){c[b>>2]=1}g=9;h=g;i=e;return h|0}j=Kc(d)|0;if((j|0)!=0){}else{sa(6768,6968,514,15600);return 0}k=ec(f,j)|0;Jc(d,j);if((b|0)!=0){c[b>>2]=(k|0)==0}g=k;h=g;i=e;return h|0}function cc(a){a=a|0;var b=0,e=0,f=0,g=0,h=0;b=i;e=a;a=c[e+12>>2]|0;f=0;while(1){if((f|0)>=((c[e+16>>2]|0)-2|0)){break}do{if((d[a+2|0]|0|0)!=3){if((d[a+2|0]|0|0)==0){g=6;break}a=a+2|0;f=f+2|0}else{g=6}}while(0);if((g|0)==6){g=0;do{if((d[a|0]|0|0)==0){if((d[a+1|0]|0|0)!=0){break}if((d[a+2|0]|0|0)!=3){break}_b(e,f+2+(c[e+40>>2]|0)|0);Xh(a+2|0,a+3|0,(c[e+16>>2]|0)-f-3|0)|0;h=e+16|0;c[h>>2]=(c[h>>2]|0)-1;a=a+1|0;f=f+1|0}}while(0)}a=a+1|0;f=f+1|0}i=b;return}function dc(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0;h=i;i=i+8|0;j=h|0;k=d;c[j>>2]=e;c[j+4>>2]=f;f=a;if((c[f+328>>2]|0)==0){}else{sa(7168,6968,455,15528);return 0}a=Ic(f,k,16)|0;xb(a+12|0,k);c[a+16>>2]=k;e=c[j+4>>2]|0;d=a+24|0;c[d>>2]=c[j>>2];c[d+4>>2]=e;c[a+32>>2]=g;Wh(c[a+12>>2]|0,b|0,k)|0;cc(a);Lc(f,a);i=h;return 0}function ec(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;f=i;i=i+78704|0;g=f|0;h=f+8|0;j=f+32|0;k=f+48|0;l=f+56|0;m=f+69256|0;n=f+74288|0;o=f+78624|0;p=e;e=d;d=p+12|0;c[g>>2]=0;Ab(h,d);oe(h,j);Pc(e,j);if((c[j>>2]|0)<32){q=Vc(e)|0;if((q|0)<0){ed(e,501,1);r=501;s=r;i=f;return s|0}t=e+1465192+(q*1520|0)|0;c[g>>2]=$e(h,t,e,k)|0;if(!(a[k]&1)){r=c[g>>2]|0;s=r;i=f;return s|0}c[t>>2]=q;if((c[e+24>>2]|0)>=0){af(t,e,c[e+24>>2]|0)}q=p+24|0;if(((gd(e,t,g,c[q>>2]|0,c[q+4>>2]|0,c[p+32>>2]|0)|0)&1|0)==0){a[(c[e+2287824>>2]|0)+180|0]=2;r=c[g>>2]|0;s=r;i=f;return s|0}Db(h,1);Fb(h);q=(c[h>>2]|0)-(c[d>>2]|0)|0;d=0;while(1){if((d|0)>=(c[p+40>>2]|0)){break}k=(c[p+36>>2]|0)+(d<<2)|0;c[k>>2]=(c[k>>2]|0)-q;d=d+1|0}d=0;while(1){if((d|0)>=(c[t+768>>2]|0)){break}q=(c[p+40>>2]|0)-1|0;while(1){if((q|0)<0){break}if((c[(c[p+36>>2]|0)+(q<<2)>>2]|0)<=(c[t+776+(d<<2)>>2]|0)){u=19;break}q=q-1|0}if((u|0)==19){u=0;k=t+776+(d<<2)|0;c[k>>2]=(c[k>>2]|0)-(q+1)}d=d+1|0}d=c[e+2243440>>2]|0;p=c[(c[e+2243436>>2]|0)+4928>>2]|0;k=(c[t+768>>2]|0)+1|0;if((c[e+2280780>>2]|0)>0){v=(a[(c[e+2243440>>2]|0)+33|0]|0)!=0}else{v=0}w=v&1;if((c[e+2280780>>2]|0)>0){x=(a[(c[e+2243440>>2]|0)+34|0]|0)!=0}else{x=0}v=x&1;do{if(w&1){if(!(v&1)){break}}}while(0);do{if((c[e+2280780>>2]|0)>0){if((a[(c[e+2243440>>2]|0)+33|0]|0)!=0){break}if((a[(c[e+2243440>>2]|0)+34|0]|0)!=0){break}ed(e,1e3,1)}}while(0);do{if(w&1){u=40}else{if(v&1){u=40;break}x=e+2288992+(0*14640|0)|0;fc(x);Ib(x+14448|0,c[h>>2]|0,c[h+4>>2]|0);c[x+14632>>2]=t;c[x+14628>>2]=e;c[x+8>>2]=c[(c[d+216>>2]|0)+(c[t+16>>2]<<2)>>2];y=cg(e,x)|0;c[g>>2]=y;if((y|0)==0){break}r=c[g>>2]|0;s=r;i=f;return s|0}}while(0);if((u|0)==40){do{if(v&1){if(w&1){u=67;break}y=k;if((y|0)>68){r=500;s=r;i=f;return s|0}if((y|0)==(ba(c[d+36>>2]|0,c[d+40>>2]|0)|0)){}else{sa(6552,6968,726,15576);return 0}if((c[(c[e+2287824>>2]|0)+192>>2]|0)==0){}else{sa(6344,6968,728,15576);return 0}vd(c[e+2287824>>2]|0,y);x=0;while(1){if((x|0)>=(c[d+40>>2]|0)){break}z=0;while(1){if((z|0)>=(c[d+36>>2]|0)){break}A=z+(ba(x,c[d+36>>2]|0)|0)|0;c[e+2288992+(A*14640|0)+14632>>2]=t;c[e+2288992+(A*14640|0)+14628>>2]=e;B=(c[d+128+(z<<2)>>2]|0)+(ba(c[d+172+(x<<2)>>2]|0,p)|0)|0;c[e+2288992+(A*14640|0)+8>>2]=c[(c[d+216>>2]|0)+(B<<2)>>2];if((A|0)==0){C=0}else{C=c[t+776+(A-1<<2)>>2]|0}if((A|0)==(k-1|0)){D=c[h+4>>2]|0}else{D=c[t+776+(A<<2)>>2]|0}fc(e+2288992+(A*14640|0)|0);Ib(e+2288992+(A*14640|0)+14448|0,(c[h>>2]|0)+C|0,D-C|0);z=z+1|0}x=x+1|0}x=0;while(1){if((x|0)>=(y|0)){break}hc(e,x);x=x+1|0}xd(c[e+2287824>>2]|0)}else{u=67}}while(0);if((u|0)==67){if((k|0)>68){r=500;s=r;i=f;return s|0}if((c[(c[e+2287824>>2]|0)+192>>2]|0)==0){}else{sa(6344,6968,773,15576);return 0}vd(c[e+2287824>>2]|0,k);u=0;while(1){if((u|0)>=(k|0)){break}C=0;while(1){if((C|0)>=(p|0)){break}D=C+(ba(u,p)|0)|0;b[(c[(c[e+2287824>>2]|0)+108>>2]|0)+(D*24|0)+22>>1]=u;C=C+1|0}c[e+2288992+(u*14640|0)+14632>>2]=t;c[e+2288992+(u*14640|0)+14628>>2]=e;C=ba(u,p)|0;c[e+2288992+(u*14640|0)+8>>2]=c[(c[d+216>>2]|0)+(C<<2)>>2];if((u|0)==0){E=0}else{E=c[t+776+(u-1<<2)>>2]|0}if((u|0)==(k-1|0)){F=c[h+4>>2]|0}else{F=c[t+776+(u<<2)>>2]|0}fc(e+2288992+(u*14640|0)|0);Ib(e+2288992+(u*14640|0)+14448|0,(c[h>>2]|0)+E|0,F-E|0);u=u+1|0}u=0;while(1){if((u|0)>=(k|0)){break}gc(e,u,(u|0)==0);u=u+1|0}xd(c[e+2287824>>2]|0)}}}else{a:do{switch(c[j>>2]|0){case 32:{c[g>>2]=sg(e,h,l)|0;if((c[g>>2]|0)!=0){break a}if((c[e+16>>2]|0)>=0){ug(l,c[e+16>>2]|0)}Qc(e,l);break};case 33:{eg(m);u=gg(e,h,m)|0;c[g>>2]=u;if((u|0)!=0){break a}if((c[e+12>>2]|0)>=0){jg(m,c[e+12>>2]|0)}Rc(e,m);break};case 34:{xe(n);u=(ve(h,n,e)|0)&1;if((c[e+20>>2]|0)>=0){we(n,c[e+20>>2]|0)}if(u&1){Tc(e,n)}break};case 39:case 40:{Sc(e);if(Qe(h,o,(c[j>>2]|0)==40,e)|0){Se(o,e);c[g>>2]=Ue(o,e)|0}break};case 36:{a[e+2287811|0]=1;break};default:{}}}while(0)}r=c[g>>2]|0;s=r;i=f;return s|0}function fc(b){b=b|0;var d=0,e=0;d=i;e=b;Yh(e+48|0,0,2064)|0;c[e+14424>>2]=-1;c[e+14428>>2]=-1;a[e|0]=1;i=d;return}function gc(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;i=i+40|0;g=f|0;h=b;c[g>>2]=0;c[g+4>>2]=2;c[g+8>>2]=6;c[g+20>>2]=h;a[g+16|0]=e&1&1;c[g+12>>2]=d;fh(h+2243444|0,g);i=f;return}function hc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+40|0;e=d|0;f=a;c[e>>2]=0;c[e+4>>2]=3;c[e+8>>2]=2;c[e+20>>2]=f;c[e+12>>2]=b;fh(f+2243444|0,e);i=d;return}function ic(a){a=a|0;var b=0,d=0,e=0;b=i;d=a;a=d;e=c[a+2280780>>2]|0;if((e|0)>0){eh(a+2243444|0)}Mc(a);Gc(a);if((e|0)<=0){i=b;return}Zb(d,e)|0;i=b;return}function jc(a){a=a|0;var b=0,c=0;b=i;c=a;a=kc(c)|0;if((a|0)!=0){lc(c)}i=b;return a|0}function kc(a){a=a|0;i=i;return c[a+2287696>>2]|0}function lc(b){b=b|0;var d=0,e=0;d=i;e=b;if((c[e+2287796>>2]|0)==0){i=d;return}a[(c[e+2287696>>2]|0)+92|0]=0;ad(e,c[e+2287696>>2]|0);b=1;while(1){if((b|0)>=(c[e+2287796>>2]|0)){break}c[e+2287696+(b-1<<2)>>2]=c[e+2287696+(b<<2)>>2];b=b+1|0}b=e+2287796|0;c[b>>2]=(c[b>>2]|0)-1;c[e+2287696+(c[e+2287796>>2]<<2)>>2]=0;b=0;while(1){if((b|0)>=(c[e+2287796>>2]|0)){break}b=b+1|0}i=d;return}function mc(a){a=a|0;var b=0,c=0;b=i;c=od(a)|0;i=b;return c|0}function nc(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;e=i;if((c|0)!=0){sa(6232,6968,992,15496)}a[b|0]=((d|0)!=0^1^1)&1;i=e;return}function oc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;f=d;d=a;switch(b|0){case 3:{c[d+20>>2]=f;i=e;return};case 4:{c[d+24>>2]=f;i=e;return};case 1:{c[d+12>>2]=f;i=e;return};case 2:{c[d+16>>2]=f;i=e;return};case 5:{Hc(d,f);i=e;return};default:{sa(6232,6968,1025,15472)}}}function pc(b,c){b=b|0;c=c|0;if((c|0)==0){i=i;return a[b|0]&1|0}else{sa(6232,6968,1044,15544);return 0}return 0}function qc(a){a=a|0;var b=0,d=0,e=0;b=i;d=a;a=c[d+344>>2]|0;if((c[d+328>>2]|0)==0){e=a;i=b;return e|0}a=a+(c[(c[d+328>>2]|0)+16>>2]|0)|0;e=a;i=b;return e|0}function rc(a){a=a|0;var b=0,d=0,e=0;b=i;d=a;a=c[d+336>>2]|0;if((c[d+328>>2]|0)==0){e=a;i=b;return e|0}a=a+1|0;e=a;i=b;return e|0}function sc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;e=a;a=b;if((a|0)==0){f=c[e+68>>2]|0}else if((a|0)==1|(a|0)==2){f=c[e+76>>2]|0}else{f=0}i=d;return f|0}function tc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;e=a;a=b;if((a|0)==0){f=c[e+72>>2]|0}else if((a|0)==1|(a|0)==2){f=c[e+80>>2]|0}else{f=0}i=d;return f|0}function uc(a){a=a|0;i=i;return c[a+24>>2]|0}function vc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;f=a;a=d;d=b;if((d|0)==0){g=c[f+56>>2]|0;if((a|0)!=0){c[a>>2]=c[f+44>>2]}h=g;i=e;return h|0}else if((d|0)==1){g=c[f+60>>2]|0;if((a|0)!=0){c[a>>2]=c[f+48>>2]}h=g;i=e;return h|0}else if((d|0)==2){g=c[f+64>>2]|0;if((a|0)!=0){c[a>>2]=c[f+48>>2]}h=g;i=e;return h|0}else{g=0;if((a|0)!=0){c[a>>2]=0}h=g;i=e;return h|0}return 0}function wc(a){a=a|0;var b=0;b=a+168|0;i=i;return(F=c[b+4>>2]|0,c[b>>2]|0)|0}function xc(a){a=a|0;i=i;return c[a+176>>2]|0}function yc(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;k=a;a=b;b=d;d=e;e=f;f=g;g=h;if((Rd(c[k+2287824>>2]|0,c[k+2243436>>2]|0,a,b,e)|0)!=0){h=a+(1<<d>>1)|0;l=b+(1<<d>>1)|0;yc(k,a,b,d-1|0,e+1|0,f,g);yc(k,h,b,d-1|0,e+1|0,16,g);yc(k,a,l,d-1|0,e+1|0,f,32);yc(k,h,l,d-1|0,e+1|0,16,32);i=j;return}e=0;while(1){if((e|0)>=(1<<d|0)){break}Td(c[k+2287824>>2]|0,a,b+e|0,f&255);e=e+4|0}e=0;while(1){if((e|0)>=(1<<d|0)){break}Td(c[k+2287824>>2]|0,a+e|0,b,g&255);e=e+4|0}i=j;return}function zc(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0;g=i;f=a;a=b;b=d;d=e;e=1<<d;h=1<<d-1;j=1<<d-2;switch(Ld(c[f+2287824>>2]|0,c[f+2243436>>2]|0,a,b)|0){case 3:{d=0;while(1){if((d|0)>=(e|0)){break}Td(c[f+2287824>>2]|0,a+h|0,b+d|0,64);Td(c[f+2287824>>2]|0,a+d|0,b+h|0,-128);d=d+1|0}i=g;return};case 2:{d=0;while(1){if((d|0)>=(e|0)){break}Td(c[f+2287824>>2]|0,a+h|0,b+d|0,64);d=d+1|0}i=g;return};case 5:{d=0;while(1){if((d|0)>=(e|0)){break}Td(c[f+2287824>>2]|0,a+d|0,b+h+j|0,-128);d=d+1|0}i=g;return};case 0:{i=g;return};case 7:{d=0;while(1){if((d|0)>=(e|0)){break}Td(c[f+2287824>>2]|0,a+h+j|0,b+d|0,64);d=d+1|0}i=g;return};case 1:{d=0;while(1){if((d|0)>=(e|0)){break}Td(c[f+2287824>>2]|0,a+d|0,b+h|0,-128);d=d+1|0}i=g;return};case 4:{d=0;while(1){if((d|0)>=(e|0)){break}Td(c[f+2287824>>2]|0,a+d|0,b+j|0,-128);d=d+1|0}i=g;return};case 6:{d=0;while(1){if((d|0)>=(e|0)){break}Td(c[f+2287824>>2]|0,a+j|0,b+d|0,64);d=d+1|0}i=g;return};default:{i=g;return}}}function Ac(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;e=b;b=c[(c[e+2243436>>2]|0)+4916>>2]|0;f=0;g=(1<<c[(c[e+2243436>>2]|0)+4912>>2])-1|0;h=c[(c[e+2243436>>2]|0)+4928>>2]|0;j=c[(c[e+2243436>>2]|0)+4912>>2]|0;k=c[e+2243440>>2]|0;l=0;while(1){if((l|0)>=(c[(c[e+2243436>>2]|0)+4932>>2]|0)){break}m=0;while(1){if((m|0)>=(c[(c[e+2243436>>2]|0)+4924>>2]|0)){break}n=Jd(c[e+2287824>>2]|0,c[e+2243436>>2]|0,m,l)|0;if((n|0)!=0){o=ba(m,b)|0;p=ba(l,b)|0;q=o>>j;r=p>>j;s=hd(e,o,p)|0;t=16;u=32;if((o|0)==0){t=0}if((p|0)==0){u=0}do{if((o|0)!=0){if((o&g|0)!=0){break}do{if((a[s+764|0]|0)==0){v=c[s+1052>>2]|0;if((v|0)==(c[(hd(e,o-1|0,p)|0)+1052>>2]|0)){w=16;break}t=0}else{w=16}}while(0);if((w|0)==16){w=0;do{if((a[k+240|0]|0)==0){v=q+(ba(r,h)|0)|0;x=(o-1>>j)+(ba(r,h)|0)|0;if((c[(c[k+228>>2]|0)+(v<<2)>>2]|0)==(c[(c[k+228>>2]|0)+(x<<2)>>2]|0)){break}t=0}}while(0)}}}while(0);do{if((p|0)!=0){if((p&g|0)!=0){break}do{if((a[s+764|0]|0)==0){x=c[s+1052>>2]|0;if((x|0)==(c[(hd(e,o,p-1|0)|0)+1052>>2]|0)){w=26;break}u=0}else{w=26}}while(0);if((w|0)==26){w=0;do{if((a[k+240|0]|0)==0){x=q+(ba(r,h)|0)|0;v=q+(ba(p-1>>j,h)|0)|0;if((c[(c[k+228>>2]|0)+(x<<2)>>2]|0)==(c[(c[k+228>>2]|0)+(v<<2)>>2]|0)){break}u=0}}while(0)}}}while(0);if((a[s+753|0]|0)==0){f=1;yc(e,o,p,n,0,t&255,u&255);zc(e,o,p,n,t&255,u&255)}}m=m+1|0}l=l+1|0}i=d;return f|0}function Bc(e,f,g,h,j,k){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0;l=i;i=i+32|0;m=l|0;n=l+8|0;o=l+16|0;p=l+24|0;q=e;e=f&1;f=h;h=j;j=k;k=e&1?2:1;r=e&1?1:2;s=e&1?1:0;t=e&1?0:1;u=e&1?80:160;v=e&1?16:32;e=c[q+2287824>>2]|0;if((j|0)<(c[e+160>>2]|0)){w=j}else{w=c[e+160>>2]|0}j=w;if((f|0)<(c[e+164>>2]|0)){x=f}else{x=c[e+164>>2]|0}f=x;x=c[(c[q+2243436>>2]|0)+4972>>2]|0;e=c[(c[q+2243436>>2]|0)+4960>>2]|0;w=g;while(1){if((w|0)>=(f|0)){break}g=h;while(1){if((g|0)>=(j|0)){break}y=g<<2;z=w<<2;A=Ud(c[q+2287824>>2]|0,y,z)|0;if((A&255&u|0)!=0){B=(Cd(c[q+2287824>>2]|0,c[q+2243436>>2]|0,y-s|0,z-t|0)|0)==0|0;C=(Cd(c[q+2287824>>2]|0,c[q+2243436>>2]|0,y,z)|0)==0|0;do{if(B&1){D=14}else{if(C&1){D=14;break}E=y-s|0;F=z-t|0;do{if((A&255&v|0)!=0){G=(y>>x)+(ba(z>>x,e)|0)|0;if((a[(c[(c[q+2287824>>2]|0)+144>>2]|0)+G|0]&128|0)==0){G=(E>>x)+(ba(F>>x,e)|0)|0;if((a[(c[(c[q+2287824>>2]|0)+144>>2]|0)+G|0]&128|0)==0){D=19;break}}H=1}else{D=19}}while(0);if((D|0)==19){D=0;H=0;G=jd(q,E,F)|0;I=jd(q,y,z)|0;J=hd(q,E,F)|0;K=hd(q,y,z)|0;if((d[G+2|0]|0)!=0){L=c[J+1076+(a[G|0]<<2)>>2]|0}else{L=-1}M=L;if((d[G+3|0]|0)!=0){N=c[J+1140+(a[G+1|0]<<2)>>2]|0}else{N=-1}J=N;if((d[I+2|0]|0)!=0){O=c[K+1076+(a[I|0]<<2)>>2]|0}else{O=-1}P=O;if((d[I+3|0]|0)!=0){Q=c[K+1140+(a[I+1|0]<<2)>>2]|0}else{Q=-1}K=Q;R=m;S=G+4|0;b[R>>1]=b[S>>1]|0;b[R+2>>1]=b[S+2>>1]|0;if((a[G+2|0]|0)==0){b[m+2>>1]=0;b[m>>1]=0}S=n;R=G+8|0;b[S>>1]=b[R>>1]|0;b[S+2>>1]=b[R+2>>1]|0;if((a[G+3|0]|0)==0){b[n+2>>1]=0;b[n>>1]=0}R=o;S=I+4|0;b[R>>1]=b[S>>1]|0;b[R+2>>1]=b[S+2>>1]|0;if((a[I+2|0]|0)==0){b[o+2>>1]=0;b[o>>1]=0}S=p;R=I+8|0;b[S>>1]=b[R>>1]|0;b[S+2>>1]=b[R+2>>1]|0;if((a[I+3|0]|0)==0){b[p+2>>1]=0;b[p>>1]=0}if((M|0)==(P|0)){if((J|0)==(K|0)){T=1}else{D=41}}else{D=41}if((D|0)==41){D=0;if((M|0)==(K|0)){U=(J|0)==(P|0)}else{U=0}T=U}if(T&1){if(((d[G+2|0]|0)+(d[G+3|0]|0)|0)!=((d[I+2|0]|0)+(d[I+3|0]|0)|0)){ed(q,1013,0);a[(c[q+2287824>>2]|0)+180|0]=3}if((M|0)!=(J|0)){if((M|0)==(P|0)){if(((b[m>>1]|0)-(b[o>>1]|0)|0)<0){V=-((b[m>>1]|0)-(b[o>>1]|0)|0)|0}else{V=(b[m>>1]|0)-(b[o>>1]|0)|0}do{if((V|0)>=4){D=66}else{if(((b[m+2>>1]|0)-(b[o+2>>1]|0)|0)<0){W=-((b[m+2>>1]|0)-(b[o+2>>1]|0)|0)|0}else{W=(b[m+2>>1]|0)-(b[o+2>>1]|0)|0}if((W|0)>=4){D=66;break}if(((b[n>>1]|0)-(b[p>>1]|0)|0)<0){X=-((b[n>>1]|0)-(b[p>>1]|0)|0)|0}else{X=(b[n>>1]|0)-(b[p>>1]|0)|0}if((X|0)>=4){D=66;break}if(((b[n+2>>1]|0)-(b[p+2>>1]|0)|0)<0){Y=-((b[n+2>>1]|0)-(b[p+2>>1]|0)|0)|0}else{Y=(b[n+2>>1]|0)-(b[p+2>>1]|0)|0}if((Y|0)>=4){D=66}}}while(0);if((D|0)==66){D=0;H=1}}else{if(((b[m>>1]|0)-(b[p>>1]|0)|0)<0){Z=-((b[m>>1]|0)-(b[p>>1]|0)|0)|0}else{Z=(b[m>>1]|0)-(b[p>>1]|0)|0}do{if((Z|0)>=4){D=84}else{if(((b[m+2>>1]|0)-(b[p+2>>1]|0)|0)<0){_=-((b[m+2>>1]|0)-(b[p+2>>1]|0)|0)|0}else{_=(b[m+2>>1]|0)-(b[p+2>>1]|0)|0}if((_|0)>=4){D=84;break}if(((b[n>>1]|0)-(b[o>>1]|0)|0)<0){$=-((b[n>>1]|0)-(b[o>>1]|0)|0)|0}else{$=(b[n>>1]|0)-(b[o>>1]|0)|0}if(($|0)>=4){D=84;break}if(((b[n+2>>1]|0)-(b[o+2>>1]|0)|0)<0){aa=-((b[n+2>>1]|0)-(b[o+2>>1]|0)|0)|0}else{aa=(b[n+2>>1]|0)-(b[o+2>>1]|0)|0}if((aa|0)>=4){D=84}}}while(0);if((D|0)==84){D=0;H=1}}}else{if((P|0)==(K|0)){}else{sa(6104,13064,333,15344)}if(((b[m>>1]|0)-(b[o>>1]|0)|0)<0){ca=-((b[m>>1]|0)-(b[o>>1]|0)|0)|0}else{ca=(b[m>>1]|0)-(b[o>>1]|0)|0}do{if((ca|0)>=4){D=105}else{if(((b[m+2>>1]|0)-(b[o+2>>1]|0)|0)<0){da=-((b[m+2>>1]|0)-(b[o+2>>1]|0)|0)|0}else{da=(b[m+2>>1]|0)-(b[o+2>>1]|0)|0}if((da|0)>=4){D=105;break}if(((b[n>>1]|0)-(b[p>>1]|0)|0)<0){ea=-((b[n>>1]|0)-(b[p>>1]|0)|0)|0}else{ea=(b[n>>1]|0)-(b[p>>1]|0)|0}if((ea|0)>=4){D=105;break}if(((b[n+2>>1]|0)-(b[p+2>>1]|0)|0)<0){fa=-((b[n+2>>1]|0)-(b[p+2>>1]|0)|0)|0}else{fa=(b[n+2>>1]|0)-(b[p+2>>1]|0)|0}if((fa|0)>=4){D=105}}}while(0);a:do{if((D|0)==105){D=0;if(((b[m>>1]|0)-(b[p>>1]|0)|0)<0){ga=-((b[m>>1]|0)-(b[p>>1]|0)|0)|0}else{ga=(b[m>>1]|0)-(b[p>>1]|0)|0}do{if((ga|0)<4){if(((b[m+2>>1]|0)-(b[p+2>>1]|0)|0)<0){ha=-((b[m+2>>1]|0)-(b[p+2>>1]|0)|0)|0}else{ha=(b[m+2>>1]|0)-(b[p+2>>1]|0)|0}if((ha|0)>=4){break}if(((b[n>>1]|0)-(b[o>>1]|0)|0)<0){ia=-((b[n>>1]|0)-(b[o>>1]|0)|0)|0}else{ia=(b[n>>1]|0)-(b[o>>1]|0)|0}if((ia|0)>=4){break}if(((b[n+2>>1]|0)-(b[o+2>>1]|0)|0)<0){ja=-((b[n+2>>1]|0)-(b[o+2>>1]|0)|0)|0}else{ja=(b[n+2>>1]|0)-(b[o+2>>1]|0)|0}if((ja|0)<4){break a}}}while(0);H=1}}while(0)}}else{H=1}}}}while(0);if((D|0)==14){D=0;H=2}Vd(c[q+2287824>>2]|0,y,z,H&255)}else{Vd(c[q+2287824>>2]|0,y,z,0)}g=g+k|0}w=w+r|0}i=l;return}function Cc(b,e,f,g,h,j){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Na=0,Oa=0;k=i;i=i+48|0;l=k|0;m=k+16|0;n=k+32|0;o=k+40|0;p=b;b=e&1;e=g;g=h;h=j;j=c[p+2243436>>2]|0;q=b&1?2:1;r=b&1?1:2;s=c[(c[p+2287824>>2]|0)+44>>2]|0;t=c[p+2287824>>2]|0;u=c[(c[p+2243436>>2]|0)+4868>>2]|0;if((h|0)<(c[t+160>>2]|0)){v=h}else{v=c[t+160>>2]|0}h=v;if((e|0)<(c[t+164>>2]|0)){w=e}else{w=c[t+164>>2]|0}e=w;w=f;a:while(1){if((w|0)>=(e|0)){x=274;break}f=g;while(1){if((f|0)>=(h|0)){break}v=f<<2;y=w<<2;z=(Wd(c[p+2287824>>2]|0,v,y)|0)&255;if((z|0)>0){A=(c[c[p+2287824>>2]>>2]|0)+(ba(s,y)|0)+v|0;B=0;while(1){if((B|0)>=4){break}C=0;while(1){if((C|0)>=4){break}if(b&1){a[l+(B<<2)+C|0]=a[A+(C+(ba(B,s)|0))|0]|0;a[m+(B<<2)+C|0]=a[A+((-C|0)-1+(ba(B,s)|0))|0]|0}else{a[l+(B<<2)+C|0]=a[A+(B+(ba(C,s)|0))|0]|0;a[m+(B<<2)+C|0]=a[A+(B-(ba(C+1|0,s)|0))|0]|0}C=C+1|0}B=B+1|0}B=Pd(c[p+2287824>>2]|0,c[p+2243436>>2]|0,v,y)|0;if(b&1){D=Pd(c[p+2287824>>2]|0,c[p+2243436>>2]|0,v-1|0,y)|0}else{D=Pd(c[p+2287824>>2]|0,c[p+2243436>>2]|0,v,y-1|0)|0}C=B+D+1>>1;B=$d(c[p+2287824>>2]|0,c[p+2243436>>2]|0,v,y)|0;E=c[p+1465192+(B*1520|0)+756>>2]|0;F=c[p+1465192+(B*1520|0)+760>>2]|0;if((C+E|0)<0){G=0}else{if((C+E|0)>51){H=51}else{H=C+E|0}G=H}E=ba(d[64+G|0]|0,1<<u-8)|0;if((C+(z-1<<1)+F|0)<0){I=0}else{if((C+(z-1<<1)+F|0)>53){J=53}else{J=C+(z-1<<1)+F|0}I=J}F=ba(d[8+I|0]|0,1<<u-8)|0;C=0;B=0;K=0;if(!(b&1)){if(b&1){x=87;break a}}if(((d[m+2|0]|0)-(d[m+1|0]<<1)+(d[m|0]|0)|0)<0){L=-((d[m+2|0]|0)-(d[m+1|0]<<1)+(d[m|0]|0)|0)|0}else{L=(d[m+2|0]|0)-(d[m+1|0]<<1)+(d[m|0]|0)|0}M=L;if(((d[m+14|0]|0)-(d[m+13|0]<<1)+(d[m+12|0]|0)|0)<0){N=-((d[m+14|0]|0)-(d[m+13|0]<<1)+(d[m+12|0]|0)|0)|0}else{N=(d[m+14|0]|0)-(d[m+13|0]<<1)+(d[m+12|0]|0)|0}O=N;if(((d[l+2|0]|0)-(d[l+1|0]<<1)+(d[l|0]|0)|0)<0){P=-((d[l+2|0]|0)-(d[l+1|0]<<1)+(d[l|0]|0)|0)|0}else{P=(d[l+2|0]|0)-(d[l+1|0]<<1)+(d[l|0]|0)|0}Q=P;if(((d[l+14|0]|0)-(d[l+13|0]<<1)+(d[l+12|0]|0)|0)<0){R=-((d[l+14|0]|0)-(d[l+13|0]<<1)+(d[l+12|0]|0)|0)|0}else{R=(d[l+14|0]|0)-(d[l+13|0]<<1)+(d[l+12|0]|0)|0}S=R;T=M+Q|0;U=O+S|0;V=M+O|0;O=Q+S|0;if((T+U|0)<(E|0)){do{if((T<<1|0)<(E>>2|0)){if(((d[m+3|0]|0)-(d[m|0]|0)|0)<0){W=-((d[m+3|0]|0)-(d[m|0]|0)|0)|0}else{W=(d[m+3|0]|0)-(d[m|0]|0)|0}if(((d[l|0]|0)-(d[l+3|0]|0)|0)<0){X=-((d[l|0]|0)-(d[l+3|0]|0)|0)|0}else{X=(d[l|0]|0)-(d[l+3|0]|0)|0}if((W+X|0)>=(E>>3|0)){Y=0;break}if(((d[m|0]|0)-(d[l|0]|0)|0)<0){Z=-((d[m|0]|0)-(d[l|0]|0)|0)|0}else{Z=(d[m|0]|0)-(d[l|0]|0)|0}Y=(Z|0)<((F*5|0)+1>>1|0)}else{Y=0}}while(0);T=Y&1;do{if((U<<1|0)<(E>>2|0)){if(((d[m+15|0]|0)-(d[m+12|0]|0)|0)<0){_=-((d[m+15|0]|0)-(d[m+12|0]|0)|0)|0}else{_=(d[m+15|0]|0)-(d[m+12|0]|0)|0}if(((d[l+12|0]|0)-(d[l+15|0]|0)|0)<0){$=-((d[l+12|0]|0)-(d[l+15|0]|0)|0)|0}else{$=(d[l+12|0]|0)-(d[l+15|0]|0)|0}if((_+$|0)>=(E>>3|0)){aa=0;break}if(((d[m+12|0]|0)-(d[l+12|0]|0)|0)<0){ca=-((d[m+12|0]|0)-(d[l+12|0]|0)|0)|0}else{ca=(d[m+12|0]|0)-(d[l+12|0]|0)|0}aa=(ca|0)<((F*5|0)+1>>1|0)}else{aa=0}}while(0);do{if(T&1){if(!(aa&1)){x=80;break}C=2}else{x=80}}while(0);if((x|0)==80){x=0;C=1}if((V|0)<(E+(E>>1)>>3|0)){B=1}if((O|0)<(E+(E>>1)>>3|0)){K=1}}if((C|0)!=0){T=1;U=1;if(b&1){do{if((a[j+4684|0]|0)!=0){if((Gd(t,j,v-1|0,y)|0)==0){break}T=0}}while(0);if((Ed(t,j,v-1|0,y)|0)!=0){T=0}do{if((a[j+4684|0]|0)!=0){if((Gd(t,j,v,y)|0)==0){break}U=0}}while(0);if((Ed(t,j,v,y)|0)!=0){U=0}}else{do{if((a[j+4684|0]|0)!=0){if((Gd(t,j,v,y-1|0)|0)==0){break}T=0}}while(0);if((Ed(t,j,v,y-1|0)|0)!=0){T=0}do{if((a[j+4684|0]|0)!=0){if((Gd(t,j,v,y)|0)==0){break}U=0}}while(0);if((Ed(t,j,v,y)|0)!=0){U=0}}E=0;while(1){if((E|0)>=4){break}O=a[m+(E<<2)|0]|0;V=a[m+(E<<2)+1|0]|0;z=a[m+(E<<2)+2|0]|0;S=a[m+(E<<2)+3|0]|0;Q=a[l+(E<<2)|0]|0;M=a[l+(E<<2)+1|0]|0;da=a[l+(E<<2)+2|0]|0;ea=a[l+(E<<2)+3|0]|0;if((C|0)==2){if(((z&255)+((V&255)<<1)+((O&255)<<1)+((Q&255)<<1)+(M&255)+4>>3|0)<((O&255)-(F<<1)|0)){fa=(O&255)-(F<<1)|0}else{if(((z&255)+((V&255)<<1)+((O&255)<<1)+((Q&255)<<1)+(M&255)+4>>3|0)>((O&255)+(F<<1)|0)){ga=(O&255)+(F<<1)|0}else{ga=(z&255)+((V&255)<<1)+((O&255)<<1)+((Q&255)<<1)+(M&255)+4>>3}fa=ga}a[n|0]=fa;if(((z&255)+(V&255)+(O&255)+(Q&255)+2>>2|0)<((V&255)-(F<<1)|0)){ha=(V&255)-(F<<1)|0}else{if(((z&255)+(V&255)+(O&255)+(Q&255)+2>>2|0)>((V&255)+(F<<1)|0)){ia=(V&255)+(F<<1)|0}else{ia=(z&255)+(V&255)+(O&255)+(Q&255)+2>>2}ha=ia}a[n+1|0]=ha;if((((S&255)<<1)+((z&255)*3|0)+(V&255)+(O&255)+(Q&255)+4>>3|0)<((z&255)-(F<<1)|0)){ja=(z&255)-(F<<1)|0}else{if((((S&255)<<1)+((z&255)*3|0)+(V&255)+(O&255)+(Q&255)+4>>3|0)>((z&255)+(F<<1)|0)){ka=(z&255)+(F<<1)|0}else{ka=((S&255)<<1)+((z&255)*3|0)+(V&255)+(O&255)+(Q&255)+4>>3}ja=ka}a[n+2|0]=ja;if(((V&255)+((O&255)<<1)+((Q&255)<<1)+((M&255)<<1)+(da&255)+4>>3|0)<((Q&255)-(F<<1)|0)){la=(Q&255)-(F<<1)|0}else{if(((V&255)+((O&255)<<1)+((Q&255)<<1)+((M&255)<<1)+(da&255)+4>>3|0)>((Q&255)+(F<<1)|0)){ma=(Q&255)+(F<<1)|0}else{ma=(V&255)+((O&255)<<1)+((Q&255)<<1)+((M&255)<<1)+(da&255)+4>>3}la=ma}a[o|0]=la;if(((O&255)+(Q&255)+(M&255)+(da&255)+2>>2|0)<((M&255)-(F<<1)|0)){na=(M&255)-(F<<1)|0}else{if(((O&255)+(Q&255)+(M&255)+(da&255)+2>>2|0)>((M&255)+(F<<1)|0)){oa=(M&255)+(F<<1)|0}else{oa=(O&255)+(Q&255)+(M&255)+(da&255)+2>>2}na=oa}a[o+1|0]=na;if(((O&255)+(Q&255)+(M&255)+((da&255)*3|0)+((ea&255)<<1)+4>>3|0)<((da&255)-(F<<1)|0)){pa=(da&255)-(F<<1)|0}else{if(((O&255)+(Q&255)+(M&255)+((da&255)*3|0)+((ea&255)<<1)+4>>3|0)>((da&255)+(F<<1)|0)){qa=(da&255)+(F<<1)|0}else{qa=(O&255)+(Q&255)+(M&255)+((da&255)*3|0)+((ea&255)<<1)+4>>3}pa=qa}a[o+2|0]=pa;if(b&1){ea=0;while(1){if((ea|0)>=3){break}if(T&1){a[A+((-ea|0)-1+(ba(E,s)|0))|0]=a[n+ea|0]|0}if(U&1){a[A+(ea+(ba(E,s)|0))|0]=a[o+ea|0]|0}ea=ea+1|0}}else{ea=0;while(1){if((ea|0)>=3){break}if(T&1){a[A+(E-(ba(ea+1|0,s)|0))|0]=a[n+ea|0]|0}if(U&1){a[A+(E+(ba(ea,s)|0))|0]=a[o+ea|0]|0}ea=ea+1|0}}}else{ea=(((Q&255)-(O&255)|0)*9|0)-(((M&255)-(V&255)|0)*3|0)+8>>4;if((ea|0)<0){ra=-ea|0}else{ra=ea}if((ra|0)<(F*10|0|0)){if((ea|0)<(-F|0)){ta=-F|0}else{if((ea|0)>(F|0)){ua=F}else{ua=ea}ta=ua}ea=ta;if(b&1){if(T&1){if(((O&255)+ea|0)<0){va=0}else{if(((O&255)+ea|0)>255){wa=255}else{wa=(O&255)+ea|0}va=wa}a[A+((ba(E,s)|0)-1)|0]=va}if(U&1){if(((Q&255)-ea|0)<0){xa=0}else{if(((Q&255)-ea|0)>255){ya=255}else{ya=(Q&255)-ea|0}xa=ya}a[A+(ba(E,s)|0)|0]=xa}}else{if(T&1){if(((O&255)+ea|0)<0){za=0}else{if(((O&255)+ea|0)>255){Aa=255}else{Aa=(O&255)+ea|0}za=Aa}a[A+(E-s)|0]=za}if(U&1){if(((Q&255)-ea|0)<0){Ba=0}else{if(((Q&255)-ea|0)>255){Ca=255}else{Ca=(Q&255)-ea|0}Ba=Ca}a[A+(E+0)|0]=Ba}}do{if((B|0)==1){if(!(T&1)){break}if((((z&255)+(O&255)+1>>1)-(V&255)+ea>>1|0)<(-(F>>1)|0)){Da=-(F>>1)|0}else{if((((z&255)+(O&255)+1>>1)-(V&255)+ea>>1|0)>(F>>1|0)){Ea=F>>1}else{Ea=((z&255)+(O&255)+1>>1)-(V&255)+ea>>1}Da=Ea}S=Da;if(b&1){if(((V&255)+S|0)<0){Fa=0}else{if(((V&255)+S|0)>255){Ga=255}else{Ga=(V&255)+S|0}Fa=Ga}a[A+((ba(E,s)|0)-2)|0]=Fa}else{if(((V&255)+S|0)<0){Ha=0}else{if(((V&255)+S|0)>255){Ia=255}else{Ia=(V&255)+S|0}Ha=Ia}a[A+(E-(s<<1))|0]=Ha}}}while(0);do{if((K|0)==1){if(!(U&1)){break}if((((da&255)+(Q&255)+1>>1)-(M&255)-ea>>1|0)<(-(F>>1)|0)){Ja=-(F>>1)|0}else{if((((da&255)+(Q&255)+1>>1)-(M&255)-ea>>1|0)>(F>>1|0)){Ka=F>>1}else{Ka=((da&255)+(Q&255)+1>>1)-(M&255)-ea>>1}Ja=Ka}V=Ja;if(b&1){if(((M&255)+V|0)<0){La=0}else{if(((M&255)+V|0)>255){Ma=255}else{Ma=(M&255)+V|0}La=Ma}a[A+((ba(E,s)|0)+1)|0]=La}else{if(((M&255)+V|0)<0){Na=0}else{if(((M&255)+V|0)>255){Oa=255}else{Oa=(M&255)+V|0}Na=Oa}a[A+(E+s)|0]=Na}}}while(0)}}E=E+1|0}}}f=f+q|0}w=w+r|0}if((x|0)==87){sa(10880,13064,553,15200)}else if((x|0)==274){i=k;return}}function Dc(b,e,f,g,h,j){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0;k=i;i=i+16|0;l=k|0;m=k+8|0;n=b;b=e&1;e=g;g=h;h=j;j=b&1?4:2;o=b&1?2:4;p=c[n+2287824>>2]|0;q=c[n+2243436>>2]|0;r=c[p+48>>2]|0;if((h|0)<(c[p+160>>2]|0)){s=h}else{s=c[p+160>>2]|0}h=s;if((e|0)<(c[p+164>>2]|0)){t=e}else{t=c[p+164>>2]|0}e=t;t=f;while(1){if((t|0)>=(e|0)){break}f=g;while(1){if((f|0)>=(h|0)){break}s=f<<1;u=t<<1;v=(Wd(c[n+2287824>>2]|0,s<<1,u<<1)|0)&255;if((v|0)>1){w=0;while(1){if((w|0)>=2){break}if((w|0)==0){x=c[(c[n+2243440>>2]|0)+20>>2]|0}else{x=c[(c[n+2243440>>2]|0)+24>>2]|0}y=x;if((w|0)==0){z=c[(c[n+2287824>>2]|0)+4>>2]|0}else{z=c[(c[n+2287824>>2]|0)+8>>2]|0}A=z;A=A+((ba(r,u)|0)+s)|0;B=0;while(1){if((B|0)>=2){break}C=0;while(1){if((C|0)>=4){break}if(b&1){a[m+(B<<2)+C|0]=a[A+(B+(ba(C,r)|0))|0]|0;a[l+(B<<2)+C|0]=a[A+((-B|0)-1+(ba(C,r)|0))|0]|0}else{a[m+(B<<2)+C|0]=a[A+(C+(ba(B,r)|0))|0]|0;a[l+(B<<2)+C|0]=a[A+(C-(ba(B+1|0,r)|0))|0]|0}C=C+1|0}B=B+1|0}B=Pd(c[n+2287824>>2]|0,c[n+2243436>>2]|0,s<<1,u<<1)|0;if(b&1){D=Pd(c[n+2287824>>2]|0,c[n+2243436>>2]|0,(s<<1)-1|0,u<<1)|0}else{D=Pd(c[n+2287824>>2]|0,c[n+2243436>>2]|0,s<<1,(u<<1)-1|0)|0}C=Ae((B+D+1>>1)+y|0)|0;B=c[n+1465192+(($d(c[n+2287824>>2]|0,c[n+2243436>>2]|0,s<<1,u<<1)|0)*1520|0)+760>>2]|0;if((C+(v-1<<1)+B|0)<0){E=0}else{if((C+(v-1<<1)+B|0)>53){F=53}else{F=C+(v-1<<1)+B|0}E=F}B=ba(d[8+E|0]|0,1<<(c[(c[n+2243436>>2]|0)+4876>>2]|0)-8)|0;if(b&1){C=1;do{if((a[q+4684|0]|0)!=0){if((Gd(p,q,(s<<1)-1|0,u<<1)|0)==0){break}C=0}}while(0);if((Ed(p,q,(s<<1)-1|0,u<<1)|0)!=0){C=0}y=1;do{if((a[q+4684|0]|0)!=0){if((Gd(p,q,s<<1,u<<1)|0)==0){break}y=0}}while(0);if((Ed(p,q,s<<1,u<<1)|0)!=0){y=0}G=0;while(1){if((G|0)>=4){break}if((((d[m+G|0]|0)-(d[l+G|0]|0)<<2)+(d[l+4+G|0]|0)-(d[m+4+G|0]|0)+4>>3|0)<(-B|0)){H=-B|0}else{if((((d[m+G|0]|0)-(d[l+G|0]|0)<<2)+(d[l+4+G|0]|0)-(d[m+4+G|0]|0)+4>>3|0)>(B|0)){I=B}else{I=((d[m+G|0]|0)-(d[l+G|0]|0)<<2)+(d[l+4+G|0]|0)-(d[m+4+G|0]|0)+4>>3}H=I}J=H;if(C&1){if(((d[l+G|0]|0)+J|0)<0){K=0}else{if(((d[l+G|0]|0)+J|0)>255){L=255}else{L=(d[l+G|0]|0)+J|0}K=L}a[A+((ba(G,r)|0)-1)|0]=K}if(y&1){if(((d[m+G|0]|0)-J|0)<0){M=0}else{if(((d[m+G|0]|0)-J|0)>255){N=255}else{N=(d[m+G|0]|0)-J|0}M=N}a[A+(ba(G,r)|0)|0]=M}G=G+1|0}}else{G=1;do{if((a[q+4684|0]|0)!=0){if((Gd(p,q,s<<1,(u<<1)-1|0)|0)==0){break}G=0}}while(0);if((Ed(p,q,s<<1,(u<<1)-1|0)|0)!=0){G=0}y=1;do{if((a[q+4684|0]|0)!=0){if((Gd(p,q,s<<1,u<<1)|0)==0){break}y=0}}while(0);if((Ed(p,q,s<<1,u<<1)|0)!=0){y=0}C=0;while(1){if((C|0)>=4){break}if((((d[m+C|0]|0)-(d[l+C|0]|0)<<2)+(d[l+4+C|0]|0)-(d[m+4+C|0]|0)+4>>3|0)<(-B|0)){O=-B|0}else{if((((d[m+C|0]|0)-(d[l+C|0]|0)<<2)+(d[l+4+C|0]|0)-(d[m+4+C|0]|0)+4>>3|0)>(B|0)){P=B}else{P=((d[m+C|0]|0)-(d[l+C|0]|0)<<2)+(d[l+4+C|0]|0)-(d[m+4+C|0]|0)+4>>3}O=P}J=O;if(G&1){if(((d[l+C|0]|0)+J|0)<0){Q=0}else{if(((d[l+C|0]|0)+J|0)>255){R=255}else{R=(d[l+C|0]|0)+J|0}Q=R}a[A+(C-r)|0]=Q}if(y&1){if(((d[m+C|0]|0)-J|0)<0){S=0}else{if(((d[m+C|0]|0)-J|0)>255){T=255}else{T=(d[m+C|0]|0)-J|0}S=T}a[A+(C+0)|0]=S}C=C+1|0}}w=w+1|0}}f=f+j|0}t=t+o|0}i=k;return}function Ec(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;d=i;i=i+40|0;e=d|0;f=b;b=Ac(f)|0;g=c[f+2287824>>2]|0;if(!(b<<24>>24!=0)){i=d;return}if((c[f+2280780>>2]|0)==0){Bc(f,1,0,c[g+164>>2]|0,0,c[g+160>>2]|0);Cc(f,1,0,c[g+164>>2]|0,0,c[g+160>>2]|0);Dc(f,1,0,c[g+164>>2]|0,0,c[g+160>>2]|0);Bc(f,0,0,c[g+164>>2]|0,0,c[g+160>>2]|0);Cc(f,0,0,c[g+164>>2]|0,0,c[g+160>>2]|0);Dc(f,0,0,c[g+164>>2]|0,0,c[g+160>>2]|0)}else{b=0;while(1){if((b|0)>=2){break}c[e>>2]=-1;c[e+4>>2]=1;c[e+8>>2]=4;h=c[f+2280780>>2]<<2;vd(c[f+2287824>>2]|0,h);j=0;while(1){if((j|0)>=(h|0)){break}k=(ba(j,c[g+164>>2]|0)|0)/(h|0)|0;l=(ba(j+1|0,c[g+164>>2]|0)|0)/(h|0)|0;k=k&-4;if((j|0)!=(h-1|0)){l=l&-4}c[e+12>>2]=f;c[e+16>>2]=k;c[e+20>>2]=l;a[e+32|0]=(b|0)==0|0;fh(f+2243444|0,e);j=j+1|0}xd(c[f+2287824>>2]|0);b=b+1|0}}i=d;return}function Fc(b){b=b|0;var d=0,e=0,f=0,g=0;d=i;e=b;b=c[e>>2]|0;f=0;g=c[(c[b+2287824>>2]|0)+160>>2]|0;Bc(b,a[e+20|0]&1,c[e+4>>2]|0,c[e+8>>2]|0,f,g);Cc(b,a[e+20|0]&1,c[e+4>>2]|0,c[e+8>>2]|0,f,g);Dc(b,a[e+20|0]&1,c[e+4>>2]|0,c[e+8>>2]|0,f,g);wd(c[b+2287824>>2]|0,1);i=d;return}function Gc(b){b=b|0;var d=0,e=0,f=0;d=i;e=b;Yh(e|0,0,3284512)|0;a[e|0]=0;c[e+4>>2]=999;a[e+8|0]=1;Hc(e,1e4);c[e+12>>2]=-1;c[e+16>>2]=-1;c[e+20>>2]=-1;c[e+24>>2]=-1;b=0;while(1){if((b|0)>=16){break}eg(e+1107496+(b*5028|0)|0);b=b+1|0}b=0;while(1){if((b|0)>=25){break}pd(e+2280792+(b*272|0)|0);b=b+1|0}a[e+2287808|0]=1;c[e+2287804>>2]=-1;b=0;while(1){if((b|0)>=68){break}c[e+2288992+(b*14640|0)+2112>>2]=e+2288992+(b*14640|0)+48;f=c[e+2288992+(b*14640|0)+2112>>2]&15;if((f|0)!=0){c[e+2288992+(b*14640|0)+2112>>2]=(c[e+2288992+(b*14640|0)+2112>>2]|0)+(16-f)}b=b+1|0}i=d;return}function Hc(a,b){a=a|0;b=b|0;b=i;ih(a+28|0);i=b;return}function Ic(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;f=a;a=b;b=d;do{if((c[f+348>>2]|0)==0){g=3}else{if((c[f+352>>2]|0)==0){g=3;break}d=f+352|0;c[d>>2]=(c[d>>2]|0)-1;h=c[(c[f+348>>2]|0)+(c[f+352>>2]<<2)>>2]|0}}while(0);if((g|0)==3){h=Qh(5080,1)|0;wb(h+12|0)}do{if((b|0)>0){if((b|0)<=(c[h+44>>2]|0)){break}c[h+36>>2]=Rh(c[h+36>>2]|0,b<<2)|0;c[h+44>>2]=b}}while(0);c[h+40>>2]=0;c[h+16>>2]=0;xb(h+12|0,a);i=e;return h|0}function Jc(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=a;a=b;if((c[e+348>>2]|0)==0){c[e+356>>2]=16;c[e+348>>2]=Oh(c[e+356>>2]<<2)|0}if((c[e+352>>2]|0)<(c[e+356>>2]|0)){c[(c[e+348>>2]|0)+(c[e+352>>2]<<2)>>2]=a;b=e+352|0;c[b>>2]=(c[b>>2]|0)+1;i=d;return}else{yb(a+12|0);Ph(c[a+36>>2]|0);Ph(a);i=d;return}}function Kc(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;d=a;if((c[d+336>>2]|0)==0){e=0;f=e;i=b;return f|0}if((c[d+332>>2]|0)!=0){}else{sa(5744,12992,180,14888);return 0}a=d+336|0;c[a>>2]=(c[a>>2]|0)-1;a=c[c[d+332>>2]>>2]|0;Xh(c[d+332>>2]|0,(c[d+332>>2]|0)+4|0,c[d+336>>2]<<2|0)|0;g=d+344|0;c[g>>2]=(c[g>>2]|0)-(c[a+16>>2]|0);e=a;f=e;i=b;return f|0}function Lc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;e=a;a=b;if((c[e+332>>2]|0)==0){f=3}else{if((c[e+336>>2]|0)==(c[e+340>>2]|0)){f=3}}if((f|0)==3){f=e+340|0;c[f>>2]=(c[f>>2]|0)+10;c[e+332>>2]=Rh(c[e+332>>2]|0,c[e+340>>2]<<2)|0}c[(c[e+332>>2]|0)+(c[e+336>>2]<<2)>>2]=a;f=e+336|0;c[f>>2]=(c[f>>2]|0)+1;f=e+344|0;c[f>>2]=(c[f>>2]|0)+(c[a+16>>2]|0);i=d;return}function Mc(a){a=a|0;var b=0,d=0;b=i;d=a;while(1){a=Kc(d)|0;if((a|0)==0){break}Jc(d,a)}if((c[d+328>>2]|0)!=0){Jc(d,c[d+328>>2]|0)}a=0;while(1){if((a|0)>=(c[d+352>>2]|0)){break}yb((c[(c[d+348>>2]|0)+(a<<2)>>2]|0)+12|0);Ph(c[(c[(c[d+348>>2]|0)+(a<<2)>>2]|0)+36>>2]|0);Ph(c[(c[d+348>>2]|0)+(a<<2)>>2]|0);a=a+1|0}Ph(c[d+332>>2]|0);Ph(c[d+348>>2]|0);a=0;while(1){if((a|0)>=16){break}fg(d+1107496+(a*5028|0)|0);a=a+1|0}a=0;while(1){if((a|0)>=25){break}rd(d+2280792+(a*272|0)|0);a=a+1|0}a=0;while(1){if((a|0)>=64){break}ye(d+1187944+(a*4332|0)|0);a=a+1|0}i=b;return}function Nc(a){a=a|0;i=i;return}function Oc(a){a=a|0;var b=0;b=i;yd(c[a+2287824>>2]|0);i=b;return}function Pc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;f=b;b=d;a[f+2288988|0]=c[b>>2];if((c[b>>2]|0)==19){g=1}else{g=(c[b>>2]|0)==20}a[f+2288989|0]=g&1;if((c[b>>2]|0)<16){h=0;j=h&1;k=j&255;l=f;m=l+2288990|0;a[m]=k;i=e;return}h=(c[b>>2]|0)<=23;j=h&1;k=j&255;l=f;m=l+2288990|0;a[m]=k;i=e;return}function Qc(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=b;Wh(a+360+((c[e>>2]|0)*69196|0)|0,e|0,69196)|0;i=d;return}function Rc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;f=b;b=d;Sc(f);lg(f+1107496+((c[b+440>>2]|0)*5028|0)|0,b);if(((a[b+2|0]|0)-1|0)<(c[f+4>>2]|0)){g=(a[b+2|0]|0)-1|0;h=f;j=h+2280784|0;c[j>>2]=g;i=e;return}else{g=c[f+4>>2]|0;h=f;j=h+2280784|0;c[j>>2]=g;i=e;return}}function Sc(b){b=b|0;var d=0,e=0,f=0,g=0;d=i;e=b;if((c[e+2287824>>2]|0)==0){i=d;return}Ec(e);Ie(e);if(a[(c[e+2287824>>2]|0)+92|0]&1){ud(c[e+2287824>>2]|0,c[(c[e+2243436>>2]|0)+464>>2]|0,c[(c[e+2243436>>2]|0)+468>>2]|0,c[(c[e+2243436>>2]|0)+472>>2]|0,c[(c[e+2243436>>2]|0)+476>>2]|0);if((c[e+2287692>>2]|0)<25){}else{sa(13400,12992,1044,14776)}b=c[e+2287824>>2]|0;f=e+2287692|0;g=c[f>>2]|0;c[f>>2]=g+1;c[e+2287592+(g<<2)>>2]=b}c[e+2287800>>2]=c[e+2287824>>2];c[e+2287824>>2]=0;a[e+2287808|0]=0;if((c[e+2287692>>2]|0)>(c[(c[e+2243432>>2]|0)+456+(((c[(c[e+2243432>>2]|0)+8>>2]|0)-1|0)*12|0)+4>>2]|0)){Xc(e)}b=0;while(1){if((b|0)>=(c[e+2287692>>2]|0)){break}b=b+1|0}b=0;while(1){if((b|0)>=(c[e+2287796>>2]|0)){break}b=b+1|0}i=d;return}function Tc(b,c){b=b|0;c=c|0;var d=0,e=0;d=i;e=b;b=c;Sc(e);ye(e+1187944+((a[b+1|0]|0)*4332|0)|0);Wh(e+1187944+((a[b+1|0]|0)*4332|0)|0,b|0,4332)|0;i=d;return}function Uc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;f=b;b=d;if((a[f+1107496+(b*5028|0)|0]&1|0)==0){qg(1,10808,(d=i,i=i+8|0,c[d>>2]=b,d)|0);i=d;g=0;h=g;i=e;return h|0}else{g=f+1107496+(b*5028|0)|0;h=g;i=e;return h|0}return 0}function Vc(b){b=b|0;var c=0,d=0,e=0,f=0,g=0;c=i;d=b;b=0;while(1){if((b|0)>=512){e=7;break}if((a[d+1465192+(b*1520|0)+4|0]|0)==0){e=4;break}b=b+1|0}if((e|0)==4){f=b;g=f;i=c;return g|0}else if((e|0)==7){f=-1;g=f;i=c;return g|0}return 0}function Wc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=i;f=b;b=d;do{if(se(a[f+2288988|0]|0)|0){if(!(a[f+2287809|0]&1)){g=7;break}c[f+2287812>>2]=0;while(1){if((c[f+2287692>>2]|0)<=0){break}Xc(f)}}else{g=7}}while(0);if((g|0)==7){d=c[(c[f+2243436>>2]|0)+4904>>2]|0;do{if((c[b+28>>2]|0)<(c[f+2287816>>2]|0)){if(((c[f+2287816>>2]|0)-(c[b+28>>2]|0)|0)<((d|0)/2|0|0)){g=10;break}c[f+2287812>>2]=(c[f+2287820>>2]|0)+d}else{g=10}}while(0);if((g|0)==10){do{if((c[b+28>>2]|0)>(c[f+2287816>>2]|0)){if(((c[b+28>>2]|0)-(c[f+2287816>>2]|0)|0)<=((d|0)/2|0|0)){g=13;break}c[f+2287812>>2]=(c[f+2287820>>2]|0)-d}else{g=13}}while(0);if((g|0)==13){c[f+2287812>>2]=c[f+2287820>>2]}}}c[(c[f+2287824>>2]|0)+88>>2]=(c[f+2287812>>2]|0)+(c[b+28>>2]|0);c[(c[f+2287824>>2]|0)+84>>2]=c[b+28>>2];if(!(ue(a[f+2288988|0]|0)|0)){i=e;return}if(re(a[f+2288988|0]|0)|0){i=e;return}if(te(a[f+2288988|0]|0)|0){i=e;return}c[f+2287816>>2]=c[b+28>>2];c[f+2287820>>2]=c[f+2287812>>2];i=e;return}function Xc(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=a;if((c[d+2287692>>2]|0)>0){}else{sa(4096,12992,902,15136)}a=c[(c[d+2287592>>2]|0)+88>>2]|0;e=0;f=1;while(1){if((f|0)>=(c[d+2287692>>2]|0)){break}if((c[(c[d+2287592+(f<<2)>>2]|0)+88>>2]|0)<(a|0)){a=c[(c[d+2287592+(f<<2)>>2]|0)+88>>2]|0;e=f}f=f+1|0}if((c[d+2287796>>2]|0)<25){}else{sa(3864,12992,919,15136)}c[d+2287696+(c[d+2287796>>2]<<2)>>2]=c[d+2287592+(e<<2)>>2];f=d+2287796|0;c[f>>2]=(c[f>>2]|0)+1;f=e+1|0;while(1){if((f|0)>=(c[d+2287692>>2]|0)){break}c[d+2287592+(f-1<<2)>>2]=c[d+2287592+(f<<2)>>2];f=f+1|0}f=d+2287692|0;c[f>>2]=(c[f>>2]|0)-1;i=b;return}function Yc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;f=b;b=d&1?25:20;d=0;while(1){if((d|0)>=(b|0)){g=8;break}if((a[f+2280792+(d*272|0)+92|0]&1|0)==0){if((c[f+2280792+(d*272|0)+96>>2]|0)==0){g=5;break}}d=d+1|0}if((g|0)==5){h=1;j=h;i=e;return j|0}else if((g|0)==8){h=0;j=h;i=e;return j|0}return 0}function Zc(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0;h=i;j=b;b=e;e=f;f=g&1;if(Yc(j,1)|0){}else{sa(8560,12992,469,15056);return 0}g=_c(j,c[j+2243436>>2]|0)|0;if((g|0)>=0){}else{sa(6424,12992,474,15056);return 0}k=j+2280792+(g*272|0)|0;if((c[k+52>>2]|0)==0){}else{sa(5136,12992,478,15056);return 0}Yh((c[k>>2]|0)+(-(c[k+52>>2]|0)|0)|0,1<<(c[b+4868>>2]|0)-1&255|0,ba(c[k+44>>2]|0,c[k+32>>2]|0)|0)|0;Yh((c[k+4>>2]|0)+(-(c[k+52>>2]|0)|0)|0,1<<(c[b+4876>>2]|0)-1&255|0,ba(c[k+48>>2]|0,c[k+40>>2]|0)|0)|0;Yh((c[k+8>>2]|0)+(-(c[k+52>>2]|0)|0)|0,1<<(c[b+4876>>2]|0)-1&255|0,ba(c[k+48>>2]|0,c[k+40>>2]|0)|0)|0;j=0;while(1){if((j|0)>=(c[k+120>>2]|0)){break}l=(c[k+116>>2]|0)+(j*3|0)|0;x=(d[l]|d[l+1|0]<<8)<<16>>16&-193;a[l]=x;x=x>>8;a[l+1|0]=x;j=j+1|0}c[k+88>>2]=e;c[k+84>>2]=e&(c[b+4904>>2]|0)-1;a[k+92|0]=0;c[k+96>>2]=f&1?2:1;a[k+180|0]=1;i=h;return g|0}function _c(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;f=b;b=d;fd(f);d=-1;g=0;while(1){if((g|0)>=25){break}if((a[f+2280792+(g*272|0)+92|0]&1|0)==0){if((c[f+2280792+(g*272|0)+96>>2]|0)==0){h=5;break}}g=g+1|0}if((h|0)==5){d=g}if((d|0)==-1){j=-1;k=j;i=e;return k|0}g=f+2280792+(d*272|0)|0;f=c[b+452>>2]|0;h=c[b+456>>2]|0;l=c[b+444>>2]|0;if((l|0)==2){m=2}else if((l|0)==3){m=3}else if((l|0)==1){m=1}else if((l|0)==0){m=0}else{m=1;sa(13136,12992,1128,14968);return 0}qd(g,f,h,m,b)|0;a[g+180|0]=0;j=d;k=j;i=e;return k|0}function $c(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+32|0;h=g|0;j=e;e=f;do{if(se(a[j+2288988|0]|0)|0){if(!(a[j+2287809|0]&1)){break}f=c[(c[j+2287824>>2]|0)+88>>2]|0;k=0;while(1){if((k|0)>=25){break}do{if((c[j+2280792+(k*272|0)+96>>2]|0)!=0){if((c[j+2280792+(k*272|0)+88>>2]|0)>=(f|0)){break}c[j+2280792+(k*272|0)+96>>2]=0;ad(j,j+2280792+(k*272|0)|0)}}while(0);k=k+1|0}}}while(0);if(pe(a[j+2288988|0]|0)|0){c[j+2288148>>2]=0;c[j+2288152>>2]=0;c[j+2288156>>2]=0;c[j+2288160>>2]=0;c[j+2288164>>2]=0}else{k=c[e+1072>>2]|0;f=0;l=0;m=0;while(1){if((f|0)>=(d[k|0]|0)){break}if((a[k+68+f|0]|0)!=0){n=l;l=n+1|0;c[j+2288168+(n<<2)>>2]=(c[(c[j+2287824>>2]|0)+88>>2]|0)+(b[k+4+(f<<1)>>1]|0)}else{n=m;m=n+1|0;c[j+2288296+(n<<2)>>2]=(c[(c[j+2287824>>2]|0)+88>>2]|0)+(b[k+4+(f<<1)>>1]|0)}f=f+1|0}c[j+2288148>>2]=l;f=0;l=0;while(1){if((f|0)>=(d[k+1|0]|0)){break}if((a[k+84+f|0]|0)!=0){n=l;l=n+1|0;c[j+2288232+(n<<2)>>2]=(c[(c[j+2287824>>2]|0)+88>>2]|0)+(b[k+36+(f<<1)>>1]|0)}else{n=m;m=n+1|0;c[j+2288296+(n<<2)>>2]=(c[(c[j+2287824>>2]|0)+88>>2]|0)+(b[k+36+(f<<1)>>1]|0)}f=f+1|0}c[j+2288152>>2]=l;c[j+2288156>>2]=m;f=0;l=0;m=0;while(1){if((f|0)>=((c[(c[j+2243436>>2]|0)+4700>>2]|0)+(c[e+144>>2]|0)|0)){break}k=c[j+2287828+(f<<2)>>2]|0;if((a[e+244+f|0]|0)!=0){k=k+((c[(c[j+2287824>>2]|0)+88>>2]|0)-(c[e+28>>2]|0)-(ba(c[j+2287956+(f<<2)>>2]|0,c[(c[j+2243436>>2]|0)+4904>>2]|0)|0))|0}if((c[j+2287892+(f<<2)>>2]|0)!=0){c[j+2288360+(l<<2)>>2]=k;c[j+2288020+(l<<2)>>2]=a[e+244+f|0]|0;l=l+1|0}else{c[j+2288424+(m<<2)>>2]=k;c[j+2288084+(m<<2)>>2]=a[e+244+f|0]|0;m=m+1|0}f=f+1|0}c[j+2288160>>2]=l;c[j+2288164>>2]=m}Yh(h|0,0,25)|0;m=0;while(1){if((m|0)>=(c[j+2288160>>2]|0)){break}if((c[j+2288020+(m<<2)>>2]|0)!=0){l=cd(j,c[j+2288360+(m<<2)>>2]|0)|0;c[j+2288788+(m<<2)>>2]=l;if((l|0)>=0){a[h+l|0]=1}else{l=Zc(j,c[j+2243436>>2]|0,c[j+2288360+(m<<2)>>2]|0,1)|0;c[j+2288788+(m<<2)>>2]=l;a[h+l|0]=1}}else{l=bd(j,c[j+2288360+(m<<2)>>2]|0)|0;c[j+2288788+(m<<2)>>2]=l;if((l|0)>=0){a[h+l|0]=1}else{l=Zc(j,c[j+2243436>>2]|0,c[j+2288360+(m<<2)>>2]|0,1)|0;c[j+2288788+(m<<2)>>2]=l;a[h+l|0]=1}}m=m+1|0}m=0;while(1){if((m|0)>=(c[j+2288164>>2]|0)){break}if((c[j+2288084+(m<<2)>>2]|0)!=0){l=cd(j,c[j+2288424+(m<<2)>>2]|0)|0;c[j+2288888+(m<<2)>>2]=l;if((l|0)>=0){a[h+l|0]=1}else{l=Zc(j,c[j+2243436>>2]|0,c[j+2288424+(m<<2)>>2]|0,1)|0;c[j+2288888+(m<<2)>>2]=l;a[h+l|0]=1}}else{l=bd(j,c[j+2288424+(m<<2)>>2]|0)|0;c[j+2288888+(m<<2)>>2]=l;if((l|0)>=0){a[h+l|0]=1}else{l=Zc(j,c[j+2243436>>2]|0,c[j+2288424+(m<<2)>>2]|0,1)|0;c[j+2288888+(m<<2)>>2]=l;a[h+l|0]=1}}m=m+1|0}m=0;while(1){if((m|0)>=(c[j+2288160>>2]|0)){break}c[j+2280792+((c[j+2288788+(m<<2)>>2]|0)*272|0)+96>>2]=2;m=m+1|0}m=0;while(1){if((m|0)>=(c[j+2288164>>2]|0)){break}c[j+2280792+((c[j+2288888+(m<<2)>>2]|0)*272|0)+96>>2]=2;m=m+1|0}m=0;while(1){if((m|0)>=(c[j+2288148>>2]|0)){break}l=cd(j,c[j+2288168+(m<<2)>>2]|0)|0;c[j+2288488+(m<<2)>>2]=l;if((l|0)>=0){a[h+l|0]=1}else{l=Zc(j,c[j+2243436>>2]|0,c[j+2288168+(m<<2)>>2]|0,0)|0;c[j+2288488+(m<<2)>>2]=l;a[h+l|0]=1}m=m+1|0}m=0;while(1){if((m|0)>=(c[j+2288152>>2]|0)){break}l=cd(j,c[j+2288232+(m<<2)>>2]|0)|0;c[j+2288588+(m<<2)>>2]=l;if((l|0)>=0){a[h+l|0]=1}else{l=Zc(j,c[j+2243436>>2]|0,c[j+2288232+(m<<2)>>2]|0,0)|0;c[j+2288588+(m<<2)>>2]=l;a[h+l|0]=1}m=m+1|0}m=0;while(1){if((m|0)>=(c[j+2288156>>2]|0)){break}l=cd(j,c[j+2288296+(m<<2)>>2]|0)|0;c[j+2288688+(m<<2)>>2]=l;if((l|0)>=0){a[h+l|0]=1}m=m+1|0}m=0;while(1){if((m|0)>=25){break}do{if(!(a[h+m|0]&1)){if((j+2280792+(m*272|0)|0)==(c[j+2287824>>2]|0)){break}if((c[j+2280792+(m*272|0)+96>>2]|0)!=0){c[j+2280792+(m*272|0)+96>>2]=0;ad(j,j+2280792+(m*272|0)|0)}}}while(0);m=m+1|0}i=g;return}function ad(b,d){b=b|0;d=d|0;var f=0,g=0;f=i;g=b;b=d;if((c[b+96>>2]|0)!=0){i=f;return}if(a[b+92|0]&1){i=f;return}if((c[b+100>>2]|0)==0){i=f;return}d=0;while(1){if((d|0)>=(c[b+112>>2]|0)){break}a[g+1465192+((e[(c[b+108>>2]|0)+(d*24|0)+2>>1]|0)*1520|0)+4|0]=0;d=d+1|0}c[b+100>>2]=0;c[b+104>>2]=0;i=f;return}function bd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;e=a;a=b;b=0;while(1){if((b|0)>=25){f=8;break}if((c[e+2280792+(b*272|0)+84>>2]|0)==(a|0)){if((c[e+2280792+(b*272|0)+96>>2]|0)!=0){f=5;break}}b=b+1|0}if((f|0)==5){g=b;h=g;i=d;return h|0}else if((f|0)==8){g=-1;h=g;i=d;return h|0}return 0}function cd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;e=a;a=b;b=0;while(1){if((b|0)>=25){f=8;break}if((c[e+2280792+(b*272|0)+88>>2]|0)==(a|0)){if((c[e+2280792+(b*272|0)+96>>2]|0)!=0){f=5;break}}b=b+1|0}if((f|0)==5){g=b;h=g;i=d;return h|0}else if((f|0)==8){g=-1;h=g;i=d;return h|0}return 0}function dd(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;f=i;i=i+264|0;g=f|0;h=f+104|0;j=f+208|0;k=b;b=e;e=d[(c[b+1072>>2]|0)+3|0]|0;if((c[b+328>>2]|0)>(e|0)){l=c[b+328>>2]|0}else{l=e}m=l;Yh(j|0,0,50)|0;l=0;while(1){if((l|0)>=(m|0)){break}n=0;while(1){if((n|0)<(c[k+2288148>>2]|0)){o=(l|0)<(m|0)}else{o=0}if(!o){break}c[g+(l<<2)>>2]=c[k+2288488+(n<<2)>>2];l=l+1|0;n=n+1|0}n=0;while(1){if((n|0)<(c[k+2288152>>2]|0)){p=(l|0)<(m|0)}else{p=0}if(!p){break}c[g+(l<<2)>>2]=c[k+2288588+(n<<2)>>2];l=l+1|0;n=n+1|0}n=0;while(1){if((n|0)<(c[k+2288160>>2]|0)){q=(l|0)<(m|0)}else{q=0}if(!q){break}c[g+(l<<2)>>2]=c[k+2288788+(n<<2)>>2];a[j+l|0]=1;l=l+1|0;n=n+1|0}if((l|0)==0){r=25;break}}if((r|0)==25){ed(k,1016,0);s=0;t=s;i=f;return t|0}if((c[b+328>>2]|0)>15){ed(k,1012,0);s=0;t=s;i=f;return t|0}l=0;while(1){if((l|0)>=(c[b+328>>2]|0)){break}if((a[b+336|0]|0)!=0){u=d[b+338+l|0]|0}else{u=l}r=u;c[b+1076+(l<<2)>>2]=c[g+(r<<2)>>2];a[b+1332+l|0]=a[j+r|0]|0;c[b+1204+(l<<2)>>2]=c[k+2280792+((c[b+1076+(l<<2)>>2]|0)*272|0)+88>>2];l=l+1|0}if((c[b+20>>2]|0)==0){if((c[b+332>>2]|0)>(e|0)){v=c[b+332>>2]|0}else{v=e}e=v;v=0;while(1){if((v|0)>=(e|0)){break}g=0;while(1){if((g|0)<(c[k+2288152>>2]|0)){w=(v|0)<(e|0)}else{w=0}if(!w){break}c[h+(v<<2)>>2]=c[k+2288588+(g<<2)>>2];v=v+1|0;g=g+1|0}g=0;while(1){if((g|0)<(c[k+2288148>>2]|0)){x=(v|0)<(e|0)}else{x=0}if(!x){break}c[h+(v<<2)>>2]=c[k+2288488+(g<<2)>>2];v=v+1|0;g=g+1|0}g=0;while(1){if((g|0)<(c[k+2288160>>2]|0)){y=(v|0)<(e|0)}else{y=0}if(!y){break}c[h+(v<<2)>>2]=c[k+2288788+(g<<2)>>2];a[j+25+v|0]=1;v=v+1|0;g=g+1|0}}if((c[b+332>>2]|0)<=15){}else{sa(4408,12992,862,15616);return 0}v=0;while(1){if((v|0)>=(c[b+332>>2]|0)){break}if((a[b+337|0]|0)!=0){z=d[b+354+v|0]|0}else{z=v}y=z;c[b+1140+(v<<2)>>2]=c[h+(y<<2)>>2];a[b+1348+v|0]=a[j+25+y|0]|0;c[b+1268+(v<<2)>>2]=c[k+2280792+((c[b+1140+(v<<2)>>2]|0)*272|0)+88>>2];v=v+1|0}}l=0;while(1){if((l|0)>=(c[b+328>>2]|0)){break}l=l+1|0}l=0;while(1){if((l|0)>=(c[b+332>>2]|0)){break}l=l+1|0}s=1;t=s;i=f;return t|0}function ed(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;f=a;a=b;b=d&1;d=1;if(b&1){g=0;while(1){if((g|0)>=(c[f+316>>2]|0)){break}if((c[f+236+(g<<2)>>2]|0)==(a|0)){h=5;break}g=g+1|0}if((h|0)==5){d=0}}if(!(d&1)){i=e;return}if(b&1){if((c[f+316>>2]|0)<20){b=f+316|0;d=c[b>>2]|0;c[b>>2]=d+1;c[f+236+(d<<2)>>2]=a}}if((c[f+232>>2]|0)==20){c[f+228>>2]=1001;i=e;return}else{d=f+232|0;b=c[d>>2]|0;c[d>>2]=b+1;c[f+152+(b<<2)>>2]=a;i=e;return}}function fd(a){a=a|0;var b=0;a=i;b=0;while(1){if((b|0)>=25){break}b=b+1|0}i=a;return}function gd(b,d,f,g,h,j){b=b|0;d=d|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0;k=i;i=i+8|0;l=k|0;m=b;b=d;d=f;c[l>>2]=g;c[l+4>>2]=h;h=j;c[d>>2]=0;j=c[b+8>>2]|0;if((a[m+1187944+(j*4332|0)|0]&1|0)==0){qg(1,12784,(g=i,i=i+8|0,c[g>>2]=j,g)|0);i=g;sa(12576,12992,1150,14816);return 0}c[m+2243440>>2]=m+1187944+(j*4332|0);c[m+2243436>>2]=m+1107496+((a[(c[m+2243440>>2]|0)+2|0]|0)*5028|0);c[m+2243432>>2]=m+360+((a[(c[m+2243436>>2]|0)+1|0]|0)*69196|0);if((a[b+5|0]|0)!=0){Sc(m);c[m+2287804>>2]=c[b+28>>2];j=_c(m,c[m+2243436>>2]|0)|0;if((j|0)==-1){c[d>>2]=9;n=0;o=n;i=k;return o|0}d=m+2280792+(j*272|0)|0;j=c[l+4>>2]|0;g=d+168|0;c[g>>2]=c[l>>2];c[g+4>>2]=j;c[d+176>>2]=h;c[m+2287824>>2]=d;c[d+100>>2]=c[m+2243436>>2];c[d+104>>2]=c[m+2243440>>2];Nc(m);Oc(m);if(se(a[m+2288988|0]|0)|0){do{if(pe(a[m+2288988|0]|0)|0){p=11}else{if(qe(a[m+2288988|0]|0)|0){p=11;break}if(a[m+2287808|0]&1){p=11;break}if(a[m+2287811|0]&1){p=11;break}a[m+2287809|0]=0;a[m+2287810|0]=0}}while(0);if((p|0)==11){a[m+2287809|0]=1;a[m+2287811|0]=0}}do{if(re(a[m+2288988|0]|0)|0){if(!(a[m+2287809|0]&1)){p=17;break}a[(c[m+2287824>>2]|0)+92|0]=0}else{p=17}}while(0);if((p|0)==17){a[(c[m+2287824>>2]|0)+92|0]=((a[b+24|0]|0)!=0^1^1)&1}Wc(m,b);if((a[b+5|0]|0)!=0){c[d+96>>2]=1;$c(m,b)}c[d+96>>2]=1;pg(c[(c[m+2287824>>2]|0)+88>>2]|0)}if((c[b+20>>2]|0)==0){p=23}else{if((c[b+20>>2]|0)==1){p=23}}do{if((p|0)==23){if((dd(m,b)|0)&1){break}n=0;o=n;i=k;return o|0}}while(0);fd(m);if((a[b+12|0]|0)==0){c[b+1052>>2]=c[b+16>>2]}else{p=c[m+2243440>>2]|0;c[b+1052>>2]=e[(c[(c[m+2287824>>2]|0)+108>>2]|0)+((c[(c[p+220>>2]|0)+((c[(c[p+216>>2]|0)+(c[b+16>>2]<<2)>>2]|0)-1<<2)>>2]|0)*24|0)>>1]|0}n=1;o=n;i=k;return o|0}function hd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;f=a;a=f+1465192+(($d(c[f+2287824>>2]|0,c[f+2243436>>2]|0,b,d)|0)*1520|0)|0;i=e;return a|0}function id(a,b,d){a=a|0;b=b|0;d=d|0;var f=0;f=a;a=b+(ba(d,c[(c[f+2243436>>2]|0)+4928>>2]|0)|0)|0;i=i;return f+1465192+((e[(c[(c[f+2287824>>2]|0)+108>>2]|0)+(a*24|0)+2>>1]|0)*1520|0)|0}function jd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=a;a=2;f=(b>>a)+(ba(d>>a,c[(c[e+2287824>>2]|0)+132>>2]|0)|0)|0;i=i;return(c[(c[e+2287824>>2]|0)+124>>2]|0)+(f*12|0)|0}function kd(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=2;g=(d>>f)+(ba(e>>f,c[(c[a+2287824>>2]|0)+132>>2]|0)|0)|0;i=i;return(c[b+124>>2]|0)+(g*12|0)|0}function ld(a,d,e,f,g,h){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0;j=i;k=a;a=h;h=2;l=d>>h;d=e>>h;e=f>>h;f=g>>h;h=c[(c[k+2287824>>2]|0)+132>>2]|0;g=0;while(1){if((g|0)>=(f|0)){break}m=0;while(1){if((m|0)>=(e|0)){break}n=l+m+(ba(d+g|0,h)|0)|0;o=(c[(c[k+2287824>>2]|0)+124>>2]|0)+(n*12|0)|0;n=a;b[o>>1]=b[n>>1]|0;b[o+2>>1]=b[n+2>>1]|0;b[o+4>>1]=b[n+4>>1]|0;b[o+6>>1]=b[n+6>>1]|0;b[o+8>>1]=b[n+8>>1]|0;b[o+10>>1]=b[n+10>>1]|0;m=m+1|0}g=g+1|0}i=j;return}function md(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=i;h=a;a=b;b=d;d=e;e=f;f=c[h+100>>2]|0;j=c[h+104>>2]|0;do{if((d|0)>=0){if((e|0)<0){break}do{if((d|0)<(c[f+452>>2]|0)){if((e|0)>=(c[f+456>>2]|0)){break}k=(d>>c[f+4972>>2])+(ba(e>>c[f+4972>>2],c[f+4960>>2]|0)|0)|0;l=(a>>c[f+4972>>2])+(ba(b>>c[f+4972>>2],c[f+4960>>2]|0)|0)|0;if((c[(c[j+232>>2]|0)+(k<<2)>>2]|0)>(c[(c[j+232>>2]|0)+(l<<2)>>2]|0)){m=0;n=m;i=g;return n|0}l=a>>c[f+4912>>2];k=b>>c[f+4912>>2];o=d>>c[f+4912>>2];p=e>>c[f+4912>>2];q=Yd(h,f,l,k)|0;if((q|0)!=(Yd(h,f,o,p)|0)){m=0;n=m;i=g;return n|0}q=l+(ba(k,c[f+4928>>2]|0)|0)|0;k=o+(ba(p,c[f+4928>>2]|0)|0)|0;if((c[(c[j+228>>2]|0)+(q<<2)>>2]|0)!=(c[(c[j+228>>2]|0)+(k<<2)>>2]|0)){m=0;n=m;i=g;return n|0}else{m=1;n=m;i=g;return n|0}}}while(0);m=0;n=m;i=g;return n|0}}while(0);m=0;n=m;i=g;return n|0}function nd(a,b,d,e,f,g,h,j,k,l,m){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0;n=i;o=a;a=b;b=d;d=e;e=f;f=g;g=h;h=j;j=k;k=l;l=m;do{if((a|0)<=(k|0)){if((k|0)>=(a+d|0)){p=0;break}if((b|0)>(l|0)){p=0;break}p=(l|0)<(b+d|0)}else{p=0}}while(0);if((p&1|0)!=0){do{if((g<<1|0)==(d|0)){if((h<<1|0)!=(d|0)){q=0;break}if((j|0)!=1){q=0;break}if((l|0)<(b+h|0)){q=0;break}q=(k|0)<(a+g|0)}else{q=0}}while(0);r=(q^1)&1}else{r=(md(c[o+2287824>>2]|0,e,f,k,l)|0)&1}if(!(r&1)){s=r;t=s&1;i=n;return t|0}if((Cd(c[o+2287824>>2]|0,c[o+2243436>>2]|0,k,l)|0)!=0){s=r;t=s&1;i=n;return t|0}r=0;s=r;t=s&1;i=n;return t|0}function od(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;d=a;if((c[d+232>>2]|0)==0){e=0;f=e;i=b;return f|0}else{a=c[d+152>>2]|0;g=d+232|0;c[g>>2]=(c[g>>2]|0)-1;Xh(d+152|0,d+156|0,c[d+232>>2]<<2|0)|0;e=a;f=e;i=b;return f|0}return 0}function pd(a){a=a|0;var b=0,d=0;b=i;d=a;Yh(d|0,0,272)|0;c[d+84>>2]=-1;c[d+88>>2]=-1;c[d+96>>2]=0;Rg(d+196|0);Vg(d+220|0);i=b;return}function qd(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;h=a;a=b;b=d;d=e;e=f;do{if((c[h+28>>2]|0)!=(a|0)){j=5}else{if((c[h+32>>2]|0)!=(b|0)){j=5;break}if((c[h+24>>2]|0)!=(d|0)){j=5;break}if((c[h+52>>2]|0)!=0){j=5}}}while(0);if((j|0)==5){f=a;k=b;if((d|0)==1){f=(f+1|0)/2|0;k=(k+1|0)/2|0}if((d|0)==2){k=(k+1|0)/2|0}c[h+44>>2]=((a+16-1|0)/16|0)<<4;c[h+48>>2]=((f+16-1|0)/16|0)<<4;c[h+28>>2]=a;c[h+32>>2]=b;c[h+52>>2]=0;c[h+36>>2]=f;c[h+40>>2]=k;c[h+24>>2]=d;Ph(c[h+12>>2]|0);c[h+12>>2]=Th(16,ba(c[h+44>>2]|0,b|0)|0)|0;c[h>>2]=(c[h+12>>2]|0)+0;if((d|0)!=0){Ph(c[h+16>>2]|0);Ph(c[h+20>>2]|0);c[h+16>>2]=Th(16,ba(c[h+48>>2]|0,k|0)|0)|0;c[h+20>>2]=Th(16,ba(c[h+48>>2]|0,k|0)|0)|0;c[h+4>>2]=(c[h+16>>2]|0)+0;c[h+8>>2]=(c[h+20>>2]|0)+0}else{c[h+16>>2]=0;c[h+20>>2]=0;c[h+4>>2]=0;c[h+8>>2]=0}}do{if((c[h+12>>2]|0)!=0){if((c[h+16>>2]|0)==0){break}if((c[h+20>>2]|0)==0){break}a:do{if((e|0)!=0){k=ba(c[e+4984>>2]|0,c[e+4988>>2]|0)|0;if((k|0)!=(c[h+140>>2]|0)){c[h+140>>2]=k;Ph(c[h+136>>2]|0);c[h+136>>2]=Oh(k)|0}if((c[h+120>>2]|0)!=(c[e+4940>>2]|0)){j=22}else{if((c[h+116>>2]|0)==0){j=22}}if((j|0)==22){c[h+120>>2]=c[e+4940>>2];Ph(c[h+116>>2]|0);c[h+116>>2]=Oh((c[h+120>>2]|0)*3|0)|0}k=c[e+4924>>2]<<(c[e+4908>>2]|0)-2;d=c[e+4932>>2]<<(c[e+4908>>2]|0)-2;if((c[h+128>>2]|0)!=(ba(k,d)|0)){j=25}else{if((c[h+124>>2]|0)==0){j=25}}if((j|0)==25){c[h+128>>2]=ba(k,d)|0;c[h+132>>2]=k;Ph(c[h+124>>2]|0);c[h+124>>2]=Oh((c[h+128>>2]|0)*12|0)|0}if((c[h+148>>2]|0)!=(c[e+4968>>2]|0)){j=28}else{if((c[h+144>>2]|0)==0){j=28}}if((j|0)==28){c[h+148>>2]=c[e+4968>>2];Ph(c[h+144>>2]|0);c[h+144>>2]=Oh(c[h+148>>2]|0)|0}k=((c[e+452>>2]|0)+3|0)/4|0;d=((c[e+456>>2]|0)+3|0)/4|0;do{if((c[h+160>>2]|0)!=(k|0)){j=32}else{if((c[h+164>>2]|0)!=(d|0)){j=32;break}if((c[h+152>>2]|0)==0){j=32}}}while(0);if((j|0)==32){c[h+160>>2]=k;c[h+164>>2]=d;c[h+156>>2]=ba(k,d)|0;Ph(c[h+152>>2]|0);c[h+152>>2]=Oh(c[h+156>>2]|0)|0}if((c[h+112>>2]|0)!=(c[e+4944>>2]|0)){b=0;while(1){if((b|0)>=(c[h+112>>2]|0)){break}$g((c[h+184>>2]|0)+(b*76|0)|0);b=b+1|0}Ph(c[h+108>>2]|0);Ph(c[h+184>>2]|0);c[h+112>>2]=c[e+4944>>2];c[h+108>>2]=Oh((c[h+112>>2]|0)*24|0)|0;c[h+184>>2]=Oh((c[h+112>>2]|0)*76|0)|0;b=0;while(1){if((b|0)>=(c[h+112>>2]|0)){break}_g((c[h+184>>2]|0)+(b*76|0)|0);b=b+1|0}}do{if((c[h+108>>2]|0)!=0){if((c[h+136>>2]|0)==0){break}if((c[h+116>>2]|0)==0){break}if((c[h+124>>2]|0)==0){break}if((c[h+144>>2]|0)==0){break}if((c[h+152>>2]|0)==0){break}break a}}while(0);rd(h);l=7;m=l;i=g;return m|0}}while(0);l=0;m=l;i=g;return m|0}}while(0);rd(h);l=7;m=l;i=g;return m|0}function rd(a){a=a|0;var b=0,d=0;b=i;d=a;if((c[d>>2]|0)!=0){Ph(c[d+12>>2]|0)}if((c[d+4>>2]|0)!=0){Ph(c[d+16>>2]|0)}if((c[d+8>>2]|0)!=0){Ph(c[d+20>>2]|0)}a=0;while(1){if((a|0)>=(c[d+112>>2]|0)){break}$g((c[d+184>>2]|0)+(a*76|0)|0);a=a+1|0}Ph(c[d+184>>2]|0);Ph(c[d+116>>2]|0);Ph(c[d+124>>2]|0);Ph(c[d+144>>2]|0);Ph(c[d+152>>2]|0);Ph(c[d+108>>2]|0);Ph(c[d+136>>2]|0);Wg(d+220|0);Sg(d+196|0);Yh(d|0,0,272)|0;i=b;return}function sd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;e=a;a=b;b=0;while(1){if((b|0)>=(c[a+32>>2]|0)){break}f=(c[e>>2]|0)+(ba(b,c[e+44>>2]|0)|0)|0;g=(c[a>>2]|0)+(ba(b,c[a+44>>2]|0)|0)|0;Wh(f|0,g|0,c[a+28>>2]|0)|0;b=b+1|0}if((c[a+24>>2]|0)==0){i=d;return}b=0;while(1){if((b|0)>=(c[a+40>>2]|0)){break}g=(c[e+4>>2]|0)+(ba(b,c[e+48>>2]|0)|0)|0;f=(c[a+4>>2]|0)+(ba(b,c[a+48>>2]|0)|0)|0;Wh(g|0,f|0,c[a+36>>2]|0)|0;f=(c[e+8>>2]|0)+(ba(b,c[e+48>>2]|0)|0)|0;g=(c[a+8>>2]|0)+(ba(b,c[a+48>>2]|0)|0)|0;Wh(f|0,g|0,c[a+36>>2]|0)|0;b=b+1|0}i=d;return}function td(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;g=a;a=d;d=e;e=b;if((e|0)==1){c[a>>2]=c[g+4>>2];if((d|0)!=0){c[d>>2]=c[g+48>>2]}i=f;return}else if((e|0)==0){c[a>>2]=c[g>>2];if((d|0)!=0){c[d>>2]=c[g+44>>2]}i=f;return}else if((e|0)==2){c[a>>2]=c[g+8>>2];if((d|0)!=0){c[d>>2]=c[g+48>>2]}i=f;return}else{c[a>>2]=0;if((d|0)!=0){c[d>>2]=0}i=f;return}}function ud(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;h=a;a=b;b=d;d=e;e=f;f=c[h+24>>2]|0;if((f|0)==1){j=2;k=2}else if((f|0)==3){j=1;k=1}else if((f|0)==2){j=2;k=1}else if((f|0)==0){j=1;k=1}else{sa(14136,14128,307,14392)}f=(c[h>>2]|0)+(ba(a,j)|0)|0;l=ba(d,k)|0;c[h+56>>2]=f+(ba(l,c[h+44>>2]|0)|0);c[h+60>>2]=(c[h+4>>2]|0)+a+(ba(d,c[h+48>>2]|0)|0);c[h+64>>2]=(c[h+8>>2]|0)+a+(ba(d,c[h+48>>2]|0)|0);c[h+68>>2]=(c[h+28>>2]|0)-(ba(a+b|0,j)|0);c[h+72>>2]=(c[h+32>>2]|0)-(ba(d+e|0,k)|0);c[h+76>>2]=(c[h+36>>2]|0)-a-b;c[h+80>>2]=(c[h+40>>2]|0)-d-e;i=g;return}function vd(a,b){a=a|0;b=b|0;var c=0;c=i;hh(a+192|0,b)|0;i=c;return}function wd(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=i;d=a;Tg(d+196|0);a=gh(d+192|0,b)|0;if((a|0)>=0){}else{sa(11688,14128,333,15368)}if((a|0)!=0){e=d;f=e+196|0;Ug(f);i=c;return}Xg(d+220|0,d+196|0);e=d;f=e+196|0;Ug(f);i=c;return}function xd(a){a=a|0;var b=0,d=0;b=i;d=a;Tg(d+196|0);while(1){if((c[d+192>>2]|0)<=0){break}Yg(d+220|0,d+196|0)}Ug(d+196|0);i=b;return}function yd(a){a=a|0;var b=0,d=0;b=i;d=a;Yh(c[d+116>>2]|0,0,(c[d+120>>2]|0)*3|0|0)|0;Yh(c[d+144>>2]|0,0,c[d+148>>2]|0)|0;Yh(c[d+152>>2]|0,0,c[d+156>>2]|0)|0;Yh(c[d+108>>2]|0,0,(c[d+112>>2]|0)*24|0|0)|0;a=0;while(1){if((a|0)>=(c[d+112>>2]|0)){break}c[(c[d+184>>2]|0)+(a*76|0)>>2]=0;a=a+1|0}i=b;return}function zd(b,e,f,g,h,j){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0;k=i;l=b;b=e;e=j;j=f>>c[l+4908>>2];f=g>>c[l+4908>>2];g=1<<h-(c[l+4908>>2]|0);h=f;while(1){if((h|0)>=(f+g|0)){break}m=j;while(1){if((m|0)>=(j+g|0)){break}n=m+(ba(h,c[l+4924>>2]|0)|0)|0;o=(c[b+116>>2]|0)+(n*3|0)|0;x=(d[o]|d[o+1|0]<<8)<<16>>16&-9|(e&1)<<3;a[o]=x;x=x>>8;a[o+1|0]=x;m=m+1|0}h=h+1|0}i=k;return}function Ad(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0;g=a;a=(e>>c[g+4908>>2])+(ba(f>>c[g+4908>>2],c[g+4924>>2]|0)|0)|0;g=(c[b+116>>2]|0)+(a*3|0)|0;i=i;return((d[g]|d[g+1|0]<<8)<<16>>16&65535)>>>3&1|0}function Bd(b,e,f,g,h,j){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0;k=i;l=b;b=e;e=j;j=f>>c[b+4908>>2];f=g>>c[b+4908>>2];g=1<<h-(c[b+4908>>2]|0);h=f;while(1){if((h|0)>=(f+g|0)){break}m=j;while(1){if((m|0)>=(j+g|0)){break}n=m+(ba(h,c[b+4924>>2]|0)|0)|0;o=(c[l+116>>2]|0)+(n*3|0)|0;x=(d[o]|d[o+1|0]<<8)<<16>>16&-193|(e&255&3)<<6;a[o]=x;x=x>>8;a[o+1|0]=x;m=m+1|0}h=h+1|0}i=k;return}function Cd(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0;g=b;b=(e>>c[g+4908>>2])+(ba(f>>c[g+4908>>2],c[g+4924>>2]|0)|0)|0;g=(c[a+116>>2]|0)+(b*3|0)|0;i=i;return((d[g]|d[g+1|0]<<8)<<16>>16&65535)>>>6&3&255|0}function Dd(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0;j=i;k=b;b=e;e=f>>c[b+4908>>2];f=g>>c[b+4908>>2];g=1<<h-(c[b+4908>>2]|0);h=f;while(1){if((h|0)>=(f+g|0)){break}l=e;while(1){if((l|0)>=(e+g|0)){break}m=l+(ba(h,c[b+4924>>2]|0)|0)|0;n=(c[k+116>>2]|0)+(m*3|0)|0;x=(d[n]|d[n+1|0]<<8)<<16>>16&-4097|4096;a[n]=x;x=x>>8;a[n+1|0]=x;l=l+1|0}h=h+1|0}i=j;return}function Ed(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0;g=b;b=(e>>c[g+4908>>2])+(ba(f>>c[g+4908>>2],c[g+4924>>2]|0)|0)|0;g=(c[a+116>>2]|0)+(b*3|0)|0;i=i;return((d[g]|d[g+1|0]<<8)<<16>>16&65535)>>>12&1&255|0}function Fd(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0;j=i;k=b;b=e;e=f>>c[b+4908>>2];f=g>>c[b+4908>>2];g=1<<h-(c[b+4908>>2]|0);h=f;while(1){if((h|0)>=(f+g|0)){break}l=e;while(1){if((l|0)>=(e+g|0)){break}m=l+(ba(h,c[b+4924>>2]|0)|0)|0;n=(c[k+116>>2]|0)+(m*3|0)|0;x=(d[n]|d[n+1|0]<<8)<<16>>16&-2049|2048;a[n]=x;x=x>>8;a[n+1|0]=x;l=l+1|0}h=h+1|0}i=j;return}function Gd(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0;g=b;b=(e>>c[g+4908>>2])+(ba(f>>c[g+4908>>2],c[g+4924>>2]|0)|0)|0;g=(c[a+116>>2]|0)+(b*3|0)|0;i=i;return((d[g]|d[g+1|0]<<8)<<16>>16&65535)>>>11&1&255|0}function Hd(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0;g=b;b=(e>>c[g+4908>>2])+(ba(f>>c[g+4908>>2],c[g+4924>>2]|0)|0)|0;g=(c[a+116>>2]|0)+(b*3|0)|0;i=i;return(d[g]|d[g+1|0]<<8)<<16>>16&7&255|0}function Id(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;j=i;k=e;e=(f>>c[k+4908>>2])+(ba(g>>c[k+4908>>2],c[k+4924>>2]|0)|0)|0;k=(c[b+116>>2]|0)+(e*3|0)|0;x=(d[k]|d[k+1|0]<<8)<<16>>16&-8|h&255&7;a[k]=x;x=x>>8;a[k+1|0]=x;i=j;return}function Jd(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0;g=e+(ba(f,c[b+4924>>2]|0)|0)|0;b=(c[a+116>>2]|0)+(g*3|0)|0;i=i;return(d[b]|d[b+1|0]<<8)<<16>>16&7&255|0}function Kd(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;j=i;k=e;e=(f>>c[k+4908>>2])+(ba(g>>c[k+4908>>2],c[k+4924>>2]|0)|0)|0;k=(c[b+116>>2]|0)+(e*3|0)|0;x=(d[k]|d[k+1|0]<<8)<<16>>16&-1793|(h&255&7)<<8;a[k]=x;x=x>>8;a[k+1|0]=x;i=j;return}function Ld(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0;g=b;b=(e>>c[g+4908>>2])+(ba(f>>c[g+4908>>2],c[g+4924>>2]|0)|0)|0;g=(c[a+116>>2]|0)+(b*3|0)|0;i=i;return((d[g]|d[g+1|0]<<8)<<16>>16&65535)>>>8&7&255|0}function Md(b,e,f,g,h,j){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0;k=i;l=b;b=e;e=j;j=f>>c[b+4908>>2];f=g>>c[b+4908>>2];g=1<<h-(c[b+4908>>2]|0);h=f;while(1){if((h|0)>=(f+g|0)){break}m=j;while(1){if((m|0)>=(j+g|0)){break}n=m+(ba(h,c[b+4924>>2]|0)|0)|0;o=(c[l+116>>2]|0)+(n*3|0)|0;x=(d[o]|d[o+1|0]<<8)<<16>>16&-49|(e&255&3)<<4;a[o]=x;x=x>>8;a[o+1|0]=x;m=m+1|0}h=h+1|0}i=k;return}function Nd(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0;g=b;b=(e>>c[g+4908>>2])+(ba(f>>c[g+4908>>2],c[g+4924>>2]|0)|0)|0;g=(c[a+116>>2]|0)+(b*3|0)|0;i=i;return((d[g]|d[g+1|0]<<8)<<16>>16&65535)>>>4&3&255|0}function Od(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0;e=i;k=b;b=d;d=f;f=g;g=h;h=j;if((d|0)>=0){if((d|0)<(c[b+452>>2]|0)){}else{l=3}}else{l=3}if((l|0)==3){sa(9576,14128,507,14432)}if((f|0)>=0){if((f|0)<(c[b+456>>2]|0)){}else{l=6}}else{l=6}if((l|0)==6){sa(7344,14128,508,14432)}l=d>>c[b+4908>>2];d=f>>c[b+4908>>2];f=1<<g-(c[b+4908>>2]|0);g=d;while(1){if((g|0)>=(d+f|0)){break}j=l;while(1){if((j|0)>=(l+f|0)){break}m=j+(ba(g,c[b+4924>>2]|0)|0)|0;a[(c[k+116>>2]|0)+(m*3|0)+2|0]=h;j=j+1|0}g=g+1|0}i=e;return}function Pd(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;g=d;d=(e>>c[g+4908>>2])+(ba(f>>c[g+4908>>2],c[g+4924>>2]|0)|0)|0;i=i;return a[(c[b+116>>2]|0)+(d*3|0)+2|0]|0}function Qd(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0;j=e;e=(f>>c[j+4972>>2])+(ba(g>>c[j+4972>>2],c[j+4960>>2]|0)|0)|0;j=(c[b+144>>2]|0)+e|0;a[j]=d[j]|0|1<<h;i=i;return}function Rd(a,b,e,f,g){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;var h=0;h=b;b=(e>>c[h+4972>>2])+(ba(f>>c[h+4972>>2],c[h+4960>>2]|0)|0)|0;i=i;return(d[(c[a+144>>2]|0)+b|0]|0)&1<<g|0}function Sd(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0;j=i;k=b;b=e;e=f>>c[b+4972>>2];f=g>>c[b+4972>>2];g=1<<h-(c[b+4972>>2]|0);h=f;while(1){if((h|0)>=(f+g|0)){break}l=e;while(1){if((l|0)>=(e+g|0)){break}m=l+(ba(h,c[b+4960>>2]|0)|0)|0;n=(c[k+144>>2]|0)+m|0;a[n]=d[n]|0|128;l=l+1|0}h=h+1|0}i=j;return}function Td(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0;h=i;j=b;b=(e|0)/4|0;e=(f|0)/4|0;if((b|0)>=(c[j+160>>2]|0)){i=h;return}if((e|0)>=(c[j+164>>2]|0)){i=h;return}f=b+(ba(e,c[j+160>>2]|0)|0)|0;e=(c[j+152>>2]|0)+f|0;a[e]=d[e]|0|g&255;i=h;return}function Ud(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;g=b;b=(d|0)/4|0;d=(e|0)/4|0;if((b|0)<(c[g+160>>2]|0)){if((d|0)<(c[g+164>>2]|0)){}else{h=3}}else{h=3}if((h|0)==3){sa(5696,14128,582,15040);return 0}h=b+(ba(d,c[g+160>>2]|0)|0)|0;i=f;return a[(c[g+152>>2]|0)+h|0]|0}function Vd(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0;h=b;b=((e|0)/4|0)+(ba((f|0)/4|0,c[h+160>>2]|0)|0)|0;f=(c[h+152>>2]|0)+b|0;b=f;a[b]=(d[b]|0)&-4;b=f;a[b]=d[b]|0|g&255;i=i;return}function Wd(a,b,e){a=a|0;b=b|0;e=e|0;var f=0;f=a;a=((b|0)/4|0)+(ba((e|0)/4|0,c[f+160>>2]|0)|0)|0;i=i;return(d[(c[f+152>>2]|0)+a|0]|0)&3|0}function Xd(a,d,e,f,g){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0;h=i;j=a;a=d;d=e;e=f;f=d+(ba(e,c[a+4928>>2]|0)|0)|0;if((f|0)<(c[j+112>>2]|0)){}else{sa(4720,14128,603,14416)}f=d+(ba(e,c[a+4928>>2]|0)|0)|0;b[(c[j+108>>2]|0)+(f*24|0)>>1]=g;i=h;return}function Yd(a,b,d,f){a=a|0;b=b|0;d=d|0;f=f|0;var g=0;g=d+(ba(f,c[b+4928>>2]|0)|0)|0;i=i;return e[(c[a+108>>2]|0)+(g*24|0)>>1]|0|0}function Zd(a,b,d){a=a|0;b=b|0;d=d|0;i=i;return e[(c[a+108>>2]|0)+(d*24|0)>>1]|0|0}function _d(a,d,e,f,g){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;h=d;d=(e>>c[h+4912>>2])+(ba(f>>c[h+4912>>2],c[h+4928>>2]|0)|0)|0;b[(c[a+108>>2]|0)+(d*24|0)+2>>1]=g;i=i;return}function $d(a,b,d,f){a=a|0;b=b|0;d=d|0;f=f|0;var g=0;g=b;b=(d>>c[g+4912>>2])+(ba(f>>c[g+4912>>2],c[g+4928>>2]|0)|0)|0;i=i;return e[(c[a+108>>2]|0)+(b*24|0)+2>>1]|0|0}function ae(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=i;h=a;a=b;b=d;d=e;e=b+(ba(d,c[a+4928>>2]|0)|0)|0;if((e|0)<(c[h+112>>2]|0)){}else{sa(4720,14128,637,14360)}e=b+(ba(d,c[a+4928>>2]|0)|0)|0;Wh((c[h+108>>2]|0)+(e*24|0)+4|0,f|0,17)|0;i=g;return}function be(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;g=a;a=b;b=d;d=e;e=b+(ba(d,c[a+4928>>2]|0)|0)|0;if((e|0)<(c[g+112>>2]|0)){}else{sa(4720,14128,645,15024);return 0}e=b+(ba(d,c[a+4928>>2]|0)|0)|0;i=f;return(c[g+108>>2]|0)+(e*24|0)+4|0}function ce(a,b,c){a=a|0;b=b|0;c=c|0;var e=0,f=0;a=i;e=b;b=c;c=b*-2|0;while(1){if((c|0)>(b<<1|0)){break}do{if((c|0)==0){f=7}else{if((c|0)==1){f=7;break}if((c|0)==(-b|0)){f=7;break}if((c|0)==(b+1|0)){f=7;break}}}while(0);if((f|0)==7){f=0}do{if((e|0)==0){f=11}else{if((d[e+c|0]|0|0)!=0){f=11;break}}}while(0);if((f|0)==11){f=0}c=c+1|0}i=a;return}function de(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0;j=i;i=i+152|0;k=j+136|0;l=j+144|0;m=b;b=d;d=e;e=f;f=g;g=h;h=c[m+2243436>>2]|0;n=j+64|0;td(c[m+2287824>>2]|0,f,k,l);o=(f|0)==0?0:1;if((f|0)==0){p=c[h+4972>>2]|0}else{p=(c[h+4972>>2]|0)-1|0}q=p;if((f|0)==0){r=b}else{r=b<<1}p=r;if((f|0)==0){s=d}else{s=d<<1}r=s;if((f|0)==0){t=e}else{t=e<<1}s=t;t=c[h+4912>>2]|0;u=c[(c[m+2243436>>2]|0)+4928>>2]|0;v=c[m+2243440>>2]|0;w=1;x=1;y=1;z=1;if((p|0)==0){w=0;z=0;p=0}if((r|0)==0){x=0;z=0;y=0;r=0}if((p+s|0)>=(c[h+452>>2]|0)){y=0}A=p>>t;B=r>>t;C=p-1>>t;D=p+s>>t;s=r-1>>t;t=Yd(c[m+2287824>>2]|0,h,A,B)|0;if(w&1){E=Yd(c[m+2287824>>2]|0,h,C,B)|0}else{E=-1}if(x&1){F=Yd(c[m+2287824>>2]|0,h,A,s)|0}else{F=-1}G=F;if(y&1){H=Yd(c[m+2287824>>2]|0,h,D,s)|0}else{H=-1}F=H;if(z&1){I=Yd(c[m+2287824>>2]|0,h,C,s)|0}else{I=-1}H=I;I=A+(ba(B,u)|0)|0;J=c[(c[v+228>>2]|0)+(I<<2)>>2]|0;if(w&1){I=C+(ba(B,u)|0)|0;K=c[(c[v+228>>2]|0)+(I<<2)>>2]|0}else{K=-1}if(x&1){I=A+(ba(s,u)|0)|0;L=c[(c[v+228>>2]|0)+(I<<2)>>2]|0}else{L=-1}I=L;if(z&1){L=C+(ba(s,u)|0)|0;M=c[(c[v+228>>2]|0)+(L<<2)>>2]|0}else{M=-1}L=M;if(y&1){M=D+(ba(s,u)|0)|0;N=c[(c[v+228>>2]|0)+(M<<2)>>2]|0}else{N=-1}M=N;if((E|0)!=(t|0)){O=45}else{if((K|0)!=(J|0)){O=45}}if((O|0)==45){w=0}if((G|0)!=(t|0)){O=48}else{if((I|0)!=(J|0)){O=48}}if((O|0)==48){x=0}if((H|0)!=(t|0)){O=51}else{if((L|0)!=(J|0)){O=51}}if((O|0)==51){z=0}if((F|0)!=(t|0)){O=54}else{if((M|0)!=(J|0)){O=54}}if((O|0)==54){y=0}O=(p>>c[h+4972>>2])+(ba(r>>c[h+4972>>2],c[h+4960>>2]|0)|0)|0;r=c[(c[v+232>>2]|0)+(O<<2)>>2]|0;if((f|0)==0){P=d}else{P=d<<1}O=(c[h+456>>2]|0)-P|0;if((f|0)!=0){O=(O+1|0)/2|0}if((O|0)>(e<<1|0)){O=e<<1}if((f|0)==0){Q=b}else{Q=b<<1}P=(c[h+452>>2]|0)-Q|0;if((f|0)!=0){P=(P+1|0)/2|0}if((P|0)>(e<<1|0)){P=e<<1}f=0;Yh(n+(-(e<<1)|0)|0,0,(e<<2)+1|0)|0;Q=O-1|0;while(1){if((Q|0)<0){break}if(w&1){O=(b-1>>q)+(ba(d+Q>>q,c[h+4960>>2]|0)|0)|0;p=(c[(c[v+232>>2]|0)+(O<<2)>>2]|0)<(r|0)|0;if((a[(c[m+2243440>>2]|0)+12|0]|0)!=0){if((Cd(c[m+2287824>>2]|0,h,b-1<<o,d+Q<<o)|0)!=0){p=0}}if(p&1){if((f|0)==0){O=b-1+(ba(d+Q|0,c[l>>2]|0)|0)|0;R=a[(c[k>>2]|0)+O|0]|0}O=0;while(1){if((O|0)>=4){break}a[n+((-Q|0)+O-1)|0]=p&1;J=b-1+(ba(d+Q-O|0,c[l>>2]|0)|0)|0;a[g+((-Q|0)+O-1)|0]=a[(c[k>>2]|0)+J|0]|0;O=O+1|0}f=f+4|0}}Q=Q-4|0}if(z&1){z=(b-1>>q)+(ba(d-1>>q,c[h+4960>>2]|0)|0)|0;Q=(c[(c[v+232>>2]|0)+(z<<2)>>2]|0)<(r|0)|0;if((a[(c[m+2243440>>2]|0)+12|0]|0)!=0){if((Cd(c[m+2287824>>2]|0,h,b-1<<o,d-1<<o)|0)!=0){Q=0}}if(Q&1){if((f|0)==0){z=b-1+(ba(d-1|0,c[l>>2]|0)|0)|0;R=a[(c[k>>2]|0)+z|0]|0}z=b-1+(ba(d-1|0,c[l>>2]|0)|0)|0;a[g|0]=a[(c[k>>2]|0)+z|0]|0;a[n|0]=Q&1;f=f+1|0}}Q=0;while(1){if((Q|0)>=(P|0)){break}if((Q|0)<(e|0)){S=x&1}else{S=y&1}if(S&1){z=(b+Q>>q)+(ba(d-1>>q,c[h+4960>>2]|0)|0)|0;w=(c[(c[v+232>>2]|0)+(z<<2)>>2]|0)<(r|0)|0;if((a[(c[m+2243440>>2]|0)+12|0]|0)!=0){if((Cd(c[m+2287824>>2]|0,h,b+Q<<o,d-1<<o)|0)!=0){w=0}}if(w&1){if((f|0)==0){z=b+Q+(ba(d-1|0,c[l>>2]|0)|0)|0;R=a[(c[k>>2]|0)+z|0]|0}z=0;while(1){if((z|0)>=4){break}O=b+Q+z+(ba(d-1|0,c[l>>2]|0)|0)|0;a[g+(Q+z+1)|0]=a[(c[k>>2]|0)+O|0]|0;a[n+(Q+z+1)|0]=w&1;z=z+1|0}f=f+4|0}}Q=Q+4|0}if((f|0)==((e<<2)+1|0)){T=n;U=e;ce(T,0,U);V=g;W=e;ce(V,0,W);i=j;return}if((f|0)==0){Yh(g+(-(e<<1)|0)|0,1<<(c[h+480>>2]|0)-1&255|0,(e<<2)+1|0)|0}else{if((a[n+(e*-2|0)|0]|0)==0){a[g+(e*-2|0)|0]=R}R=(e*-2|0)+1|0;while(1){if((R|0)>(e<<1|0)){break}if((a[n+R|0]|0)==0){a[g+R|0]=a[g+(R-1)|0]|0}R=R+1|0}}T=n;U=e;ce(T,0,U);V=g;W=e;ce(V,0,W);i=j;return}function ee(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;h=i;i=i+136|0;j=h|0;k=b;b=e;e=f;f=g;do{if((f|0)==1){l=3}else{if((e|0)==4){l=3;break}if((f-26|0)<0){m=-(f-26|0)|0}else{m=f-26|0}if((f-10|0)<0){n=-(f-10|0)|0}else{n=f-10|0}if((m|0)<(n|0)){if((f-26|0)<0){o=-(f-26|0)|0}else{o=f-26|0}p=o}else{if((f-10|0)<0){q=-(f-10|0)|0}else{q=f-10|0}p=q}g=p;r=e;if((r|0)==8){s=(g|0)>7?1:0}else if((r|0)==16){s=(g|0)>1?1:0}else if((r|0)==32){s=(g|0)>0?1:0}else{s=-1;sa(7208,5616,306,14928)}}}while(0);if((l|0)==3){s=0}if((s|0)==0){t=b;u=e;ce(t,0,u);i=h;return}do{if((a[(c[k+2243436>>2]|0)+4865|0]|0)!=0){if((e|0)!=32){v=0;break}if(((d[b|0]|0)+(d[b+64|0]|0)-(d[b+32|0]<<1)|0)<0){w=-((d[b|0]|0)+(d[b+64|0]|0)-(d[b+32|0]<<1)|0)|0}else{w=(d[b|0]|0)+(d[b+64|0]|0)-(d[b+32|0]<<1)|0}if((w|0)>=(1<<(c[(c[k+2243436>>2]|0)+480>>2]|0)-5|0)){v=0;break}if(((d[b|0]|0)+(d[b-64|0]|0)-(d[b-32|0]<<1)|0)<0){x=-((d[b|0]|0)+(d[b-64|0]|0)-(d[b-32|0]<<1)|0)|0}else{x=(d[b|0]|0)+(d[b-64|0]|0)-(d[b-32|0]<<1)|0}v=(x|0)<(1<<(c[(c[k+2243436>>2]|0)+480>>2]|0)-5|0)}else{v=0}}while(0);k=j+64|0;if(((v?1:0)|0)!=0){a[k+(e*-2|0)|0]=a[b+(e*-2|0)|0]|0;a[k+(e<<1)|0]=a[b+(e<<1)|0]|0;a[k|0]=a[b|0]|0;v=1;while(1){if((v|0)>63){break}a[k+(-v|0)|0]=(d[b|0]|0)+((ba(v,(d[b-64|0]|0)-(d[b|0]|0)|0)|0)+32>>6);a[k+v|0]=(d[b|0]|0)+((ba(v,(d[b+64|0]|0)-(d[b|0]|0)|0)|0)+32>>6);v=v+1|0}}else{a[k+(e*-2|0)|0]=a[b+(e*-2|0)|0]|0;a[k+(e<<1)|0]=a[b+(e<<1)|0]|0;v=-((e<<1)-1|0)|0;while(1){if((v|0)>((e<<1)-1|0)){break}a[k+v|0]=(d[b+(v+1)|0]|0)+(d[b+v|0]<<1)+(d[b+(v-1)|0]|0)+2>>2;v=v+1|0}}Wh(b+(-(e<<1)|0)|0,k+(-(e<<1)|0)|0,(e<<2)+1|0)|0;t=b;u=e;ce(t,0,u);i=h;return}function fe(a){a=a|0;var b=0,c=0,d=0;b=i;c=a;do{if((c|0)<0){d=0}else{if((c|0)>255){d=255;break}else{d=c;break}}}while(0);i=b;return d|0}function ge(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;l=i;i=i+152|0;m=l+136|0;n=l+144|0;o=g;g=h;h=j;j=k;k=l+64|0;td(c[b+2287824>>2]|0,h,m,n);b=e+(ba(f,c[n>>2]|0)|0)|0;c[m>>2]=(c[m>>2]|0)+b;b=c[1752+(o<<2)>>2]|0;if(o>>>0>=18>>>0){f=0;while(1){if((f|0)>(g|0)){break}a[k+f|0]=a[j+f|0]|0;f=f+1|0}if((b|0)<0){f=c[1688+(o-11<<2)>>2]|0;if(((ba(g,b)|0)>>5|0)<-1){e=(ba(g,b)|0)>>5;while(1){if(!((e|0)<=-1)){break}a[k+e|0]=a[j+(-((ba(e,f)|0)+128>>8)|0)|0]|0;e=e+1|0}}}else{e=g+1|0;while(1){if((e|0)>(g<<1|0)){break}a[k+e|0]=a[j+e|0]|0;e=e+1|0}}e=0;while(1){if((e|0)>=(g|0)){break}f=0;while(1){if((f|0)>=(g|0)){break}p=(ba(e+1|0,b)|0)>>5;q=(ba(e+1|0,b)|0)&31;if((q|0)!=0){r=ba(32-q|0,d[k+(f+p+1)|0]|0)|0;s=r+(ba(q,d[k+(f+p+2)|0]|0)|0)+16>>5&255;q=f+(ba(e,c[n>>2]|0)|0)|0;a[(c[m>>2]|0)+q|0]=s}else{s=f+(ba(e,c[n>>2]|0)|0)|0;a[(c[m>>2]|0)+s|0]=a[k+(f+p+1)|0]|0}f=f+1|0}e=e+1|0}do{if((o|0)==26){if((h|0)!=0){break}if((g|0)>=32){break}e=0;while(1){if((e|0)>=(g|0)){break}f=(fe((d[j+1|0]|0)+((d[j+(-1-e)|0]|0)-(d[j|0]|0)>>1)|0)|0)&255;p=ba(e,c[n>>2]|0)|0;a[(c[m>>2]|0)+p|0]=f;e=e+1|0}}}while(0)}else{e=0;while(1){if((e|0)>(g|0)){break}a[k+e|0]=a[j+(-e|0)|0]|0;e=e+1|0}if((b|0)<0){e=c[1688+(o-11<<2)>>2]|0;if(((ba(g,b)|0)>>5|0)<-1){f=(ba(g,b)|0)>>5;while(1){if(!((f|0)<=-1)){break}a[k+f|0]=a[j+((ba(f,e)|0)+128>>8)|0]|0;f=f+1|0}}}else{f=g+1|0;while(1){if((f|0)>(g<<1|0)){break}a[k+f|0]=a[j+(-f|0)|0]|0;f=f+1|0}}f=0;while(1){if((f|0)>=(g|0)){break}e=0;while(1){if((e|0)>=(g|0)){break}p=(ba(e+1|0,b)|0)>>5;s=(ba(e+1|0,b)|0)&31;if((s|0)!=0){q=ba(32-s|0,d[k+(f+p+1)|0]|0)|0;r=q+(ba(s,d[k+(f+p+2)|0]|0)|0)+16>>5&255;s=e+(ba(f,c[n>>2]|0)|0)|0;a[(c[m>>2]|0)+s|0]=r}else{r=e+(ba(f,c[n>>2]|0)|0)|0;a[(c[m>>2]|0)+r|0]=a[k+(f+p+1)|0]|0}e=e+1|0}f=f+1|0}do{if((o|0)==10){if((h|0)!=0){break}if((g|0)>=32){break}f=0;while(1){if((f|0)>=(g|0)){break}k=(fe((d[j-1|0]|0)+((d[j+(f+1)|0]|0)-(d[j|0]|0)>>1)|0)|0)&255;a[(c[m>>2]|0)+f|0]=k;f=f+1|0}}}while(0)}m=0;while(1){if((m|0)>=(g|0)){break}j=0;while(1){if((j|0)>=(g|0)){break}j=j+1|0}m=m+1|0}i=l;return}function he(b,e,f,g,h,j){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0;k=i;i=i+16|0;l=k|0;m=k+8|0;n=g;g=j;td(c[b+2287824>>2]|0,h,l,m);h=e+(ba(f,c[m>>2]|0)|0)|0;c[l>>2]=(c[l>>2]|0)+h;h=og(n)|0;f=0;while(1){if((f|0)>=(n|0)){break}e=0;while(1){if((e|0)>=(n|0)){break}b=ba(n-1-e|0,d[g+(-1-f)|0]|0)|0;j=b+(ba(e+1|0,d[g+(n+1)|0]|0)|0)|0;b=j+(ba(n-1-f|0,d[g+(e+1)|0]|0)|0)|0;j=b+(ba(f+1|0,d[g+(-1-n)|0]|0)|0)+n>>h+1&255;b=e+(ba(f,c[m>>2]|0)|0)|0;a[(c[l>>2]|0)+b|0]=j;e=e+1|0}f=f+1|0}f=0;while(1){if((f|0)>=(n|0)){break}l=0;while(1){if((l|0)>=(n|0)){break}l=l+1|0}f=f+1|0}i=k;return}function ie(b,e,f,g,h,j){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0;k=i;i=i+16|0;l=k|0;m=k+8|0;n=g;g=h;h=j;td(c[b+2287824>>2]|0,g,l,m);b=e+(ba(f,c[m>>2]|0)|0)|0;c[l>>2]=(c[l>>2]|0)+b;b=og(n)|0;f=0;e=0;while(1){if((e|0)>=(n|0)){break}f=f+(d[h+(e+1)|0]|0)|0;f=f+(d[h+((-e|0)-1)|0]|0)|0;e=e+1|0}f=f+n|0;f=f>>b+1;do{if((g|0)==0){if((n|0)>=32){break}a[c[l>>2]|0]=(d[h-1|0]|0)+(f<<1)+(d[h+1|0]|0)+2>>2;b=1;while(1){if((b|0)>=(n|0)){break}a[(c[l>>2]|0)+b|0]=(d[h+(b+1)|0]|0)+(f*3|0)+2>>2;b=b+1|0}b=1;while(1){if((b|0)>=(n|0)){break}e=ba(b,c[m>>2]|0)|0;a[(c[l>>2]|0)+e|0]=(d[h+((-b|0)-1)|0]|0)+(f*3|0)+2>>2;b=b+1|0}b=1;while(1){if((b|0)>=(n|0)){break}e=1;while(1){if((e|0)>=(n|0)){break}j=e+(ba(b,c[m>>2]|0)|0)|0;a[(c[l>>2]|0)+j|0]=f;e=e+1|0}b=b+1|0}i=k;return}}while(0);h=0;while(1){if((h|0)>=(n|0)){break}g=0;while(1){if((g|0)>=(n|0)){break}b=g+(ba(h,c[m>>2]|0)|0)|0;a[(c[l>>2]|0)+b|0]=f;g=g+1|0}h=h+1|0}i=k;return}function je(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0;h=i;i=i+136|0;j=a;a=b;b=d;d=e;e=f;f=g;c[8094]=(c[8094]|0)+1;g=h+64|0;de(j,a,b,e,f,g);if((f|0)==0){ee(j,g,e,d)}k=d;if((k|0)==0){he(j,a,b,e,f,g);i=h;return}else if((k|0)==1){ie(j,a,b,e,f,g);i=h;return}else{ge(j,a,b,d,e,f,g);i=h;return}}function ke(a){a=a|0;var b=0;b=a;c[b+8>>2]=1732584193;c[b+12>>2]=-271733879;c[b+16>>2]=-1732584194;c[b+20>>2]=271733878;c[b>>2]=0;c[b+4>>2]=0;i=i;return}function le(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;f=a;a=b;b=d;d=c[f>>2]|0;g=d+b&536870911;c[f>>2]=g;if(g>>>0<d>>>0){g=f+4|0;c[g>>2]=(c[g>>2]|0)+1}g=f+4|0;c[g>>2]=(c[g>>2]|0)+(b>>>29);g=d&63;do{if((g|0)!=0){d=64-g|0;if(!(b>>>0<d>>>0)){Wh(f+24+g|0,a|0,d)|0;a=a+d|0;b=b-d|0;me(f,f+24|0,64)|0;break}Wh(f+24+g|0,a|0,b)|0;i=e;return}}while(0);if(b>>>0>=64>>>0){a=me(f,a,b&-64)|0;b=b&63}Wh(f+24|0,a|0,b)|0;i=e;return}function me(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;g=a;a=e;e=b;b=c[g+8>>2]|0;h=c[g+12>>2]|0;j=c[g+16>>2]|0;k=c[g+20>>2]|0;do{l=b;m=h;n=j;o=k;p=d[e|0]|0|(d[e+1|0]|0)<<8|(d[e+2|0]|0)<<16|(d[e+3|0]|0)<<24;c[g+88>>2]=p;b=b+((k^h&(j^k))+p-680876936)|0;b=b<<7|b>>>25;b=b+h|0;p=d[e+4|0]|0|(d[e+5|0]|0)<<8|(d[e+6|0]|0)<<16|(d[e+7|0]|0)<<24;c[g+92>>2]=p;k=k+((j^b&(h^j))+p-389564586)|0;k=k<<12|k>>>20;k=k+b|0;p=d[e+8|0]|0|(d[e+9|0]|0)<<8|(d[e+10|0]|0)<<16|(d[e+11|0]|0)<<24;c[g+96>>2]=p;j=j+((h^k&(b^h))+p+606105819)|0;j=j<<17|j>>>15;j=j+k|0;p=d[e+12|0]|0|(d[e+13|0]|0)<<8|(d[e+14|0]|0)<<16|(d[e+15|0]|0)<<24;c[g+100>>2]=p;h=h+((b^j&(k^b))+p-1044525330)|0;h=h<<22|h>>>10;h=h+j|0;p=d[e+16|0]|0|(d[e+17|0]|0)<<8|(d[e+18|0]|0)<<16|(d[e+19|0]|0)<<24;c[g+104>>2]=p;b=b+((k^h&(j^k))+p-176418897)|0;b=b<<7|b>>>25;b=b+h|0;p=d[e+20|0]|0|(d[e+21|0]|0)<<8|(d[e+22|0]|0)<<16|(d[e+23|0]|0)<<24;c[g+108>>2]=p;k=k+((j^b&(h^j))+p+1200080426)|0;k=k<<12|k>>>20;k=k+b|0;p=d[e+24|0]|0|(d[e+25|0]|0)<<8|(d[e+26|0]|0)<<16|(d[e+27|0]|0)<<24;c[g+112>>2]=p;j=j+((h^k&(b^h))+p-1473231341)|0;j=j<<17|j>>>15;j=j+k|0;p=d[e+28|0]|0|(d[e+29|0]|0)<<8|(d[e+30|0]|0)<<16|(d[e+31|0]|0)<<24;c[g+116>>2]=p;h=h+((b^j&(k^b))+p-45705983)|0;h=h<<22|h>>>10;h=h+j|0;p=d[e+32|0]|0|(d[e+33|0]|0)<<8|(d[e+34|0]|0)<<16|(d[e+35|0]|0)<<24;c[g+120>>2]=p;b=b+((k^h&(j^k))+p+1770035416)|0;b=b<<7|b>>>25;b=b+h|0;p=d[e+36|0]|0|(d[e+37|0]|0)<<8|(d[e+38|0]|0)<<16|(d[e+39|0]|0)<<24;c[g+124>>2]=p;k=k+((j^b&(h^j))+p-1958414417)|0;k=k<<12|k>>>20;k=k+b|0;p=d[e+40|0]|0|(d[e+41|0]|0)<<8|(d[e+42|0]|0)<<16|(d[e+43|0]|0)<<24;c[g+128>>2]=p;j=j+((h^k&(b^h))+p-42063)|0;j=j<<17|j>>>15;j=j+k|0;p=d[e+44|0]|0|(d[e+45|0]|0)<<8|(d[e+46|0]|0)<<16|(d[e+47|0]|0)<<24;c[g+132>>2]=p;h=h+((b^j&(k^b))+p-1990404162)|0;h=h<<22|h>>>10;h=h+j|0;p=d[e+48|0]|0|(d[e+49|0]|0)<<8|(d[e+50|0]|0)<<16|(d[e+51|0]|0)<<24;c[g+136>>2]=p;b=b+((k^h&(j^k))+p+1804603682)|0;b=b<<7|b>>>25;b=b+h|0;p=d[e+52|0]|0|(d[e+53|0]|0)<<8|(d[e+54|0]|0)<<16|(d[e+55|0]|0)<<24;c[g+140>>2]=p;k=k+((j^b&(h^j))+p-40341101)|0;k=k<<12|k>>>20;k=k+b|0;p=d[e+56|0]|0|(d[e+57|0]|0)<<8|(d[e+58|0]|0)<<16|(d[e+59|0]|0)<<24;c[g+144>>2]=p;j=j+((h^k&(b^h))+p-1502002290)|0;j=j<<17|j>>>15;j=j+k|0;p=d[e+60|0]|0|(d[e+61|0]|0)<<8|(d[e+62|0]|0)<<16|(d[e+63|0]|0)<<24;c[g+148>>2]=p;h=h+((b^j&(k^b))+p+1236535329)|0;h=h<<22|h>>>10;h=h+j|0;b=b+((j^k&(h^j))+(c[g+92>>2]|0)-165796510)|0;b=b<<5|b>>>27;b=b+h|0;k=k+((h^j&(b^h))+(c[g+112>>2]|0)-1069501632)|0;k=k<<9|k>>>23;k=k+b|0;j=j+((b^h&(k^b))+(c[g+132>>2]|0)+643717713)|0;j=j<<14|j>>>18;j=j+k|0;h=h+((k^b&(j^k))+(c[g+88>>2]|0)-373897302)|0;h=h<<20|h>>>12;h=h+j|0;b=b+((j^k&(h^j))+(c[g+108>>2]|0)-701558691)|0;b=b<<5|b>>>27;b=b+h|0;k=k+((h^j&(b^h))+(c[g+128>>2]|0)+38016083)|0;k=k<<9|k>>>23;k=k+b|0;j=j+((b^h&(k^b))+(c[g+148>>2]|0)-660478335)|0;j=j<<14|j>>>18;j=j+k|0;h=h+((k^b&(j^k))+(c[g+104>>2]|0)-405537848)|0;h=h<<20|h>>>12;h=h+j|0;b=b+((j^k&(h^j))+(c[g+124>>2]|0)+568446438)|0;b=b<<5|b>>>27;b=b+h|0;k=k+((h^j&(b^h))+(c[g+144>>2]|0)-1019803690)|0;k=k<<9|k>>>23;k=k+b|0;j=j+((b^h&(k^b))+(c[g+100>>2]|0)-187363961)|0;j=j<<14|j>>>18;j=j+k|0;h=h+((k^b&(j^k))+(c[g+120>>2]|0)+1163531501)|0;h=h<<20|h>>>12;h=h+j|0;b=b+((j^k&(h^j))+(c[g+140>>2]|0)-1444681467)|0;b=b<<5|b>>>27;b=b+h|0;k=k+((h^j&(b^h))+(c[g+96>>2]|0)-51403784)|0;k=k<<9|k>>>23;k=k+b|0;j=j+((b^h&(k^b))+(c[g+116>>2]|0)+1735328473)|0;j=j<<14|j>>>18;j=j+k|0;h=h+((k^b&(j^k))+(c[g+136>>2]|0)-1926607734)|0;h=h<<20|h>>>12;h=h+j|0;b=b+((h^j^k)+(c[g+108>>2]|0)-378558)|0;b=b<<4|b>>>28;b=b+h|0;k=k+((b^h^j)+(c[g+120>>2]|0)-2022574463)|0;k=k<<11|k>>>21;k=k+b|0;j=j+((k^b^h)+(c[g+132>>2]|0)+1839030562)|0;j=j<<16|j>>>16;j=j+k|0;h=h+((j^k^b)+(c[g+144>>2]|0)-35309556)|0;h=h<<23|h>>>9;h=h+j|0;b=b+((h^j^k)+(c[g+92>>2]|0)-1530992060)|0;b=b<<4|b>>>28;b=b+h|0;k=k+((b^h^j)+(c[g+104>>2]|0)+1272893353)|0;k=k<<11|k>>>21;k=k+b|0;j=j+((k^b^h)+(c[g+116>>2]|0)-155497632)|0;j=j<<16|j>>>16;j=j+k|0;h=h+((j^k^b)+(c[g+128>>2]|0)-1094730640)|0;h=h<<23|h>>>9;h=h+j|0;b=b+((h^j^k)+(c[g+140>>2]|0)+681279174)|0;b=b<<4|b>>>28;b=b+h|0;k=k+((b^h^j)+(c[g+88>>2]|0)-358537222)|0;k=k<<11|k>>>21;k=k+b|0;j=j+((k^b^h)+(c[g+100>>2]|0)-722521979)|0;j=j<<16|j>>>16;j=j+k|0;h=h+((j^k^b)+(c[g+112>>2]|0)+76029189)|0;h=h<<23|h>>>9;h=h+j|0;b=b+((h^j^k)+(c[g+124>>2]|0)-640364487)|0;b=b<<4|b>>>28;b=b+h|0;k=k+((b^h^j)+(c[g+136>>2]|0)-421815835)|0;k=k<<11|k>>>21;k=k+b|0;j=j+((k^b^h)+(c[g+148>>2]|0)+530742520)|0;j=j<<16|j>>>16;j=j+k|0;h=h+((j^k^b)+(c[g+96>>2]|0)-995338651)|0;h=h<<23|h>>>9;h=h+j|0;b=b+((j^(h|~k))+(c[g+88>>2]|0)-198630844)|0;b=b<<6|b>>>26;b=b+h|0;k=k+((h^(b|~j))+(c[g+116>>2]|0)+1126891415)|0;k=k<<10|k>>>22;k=k+b|0;j=j+((b^(k|~h))+(c[g+144>>2]|0)-1416354905)|0;j=j<<15|j>>>17;j=j+k|0;h=h+((k^(j|~b))+(c[g+108>>2]|0)-57434055)|0;h=h<<21|h>>>11;h=h+j|0;b=b+((j^(h|~k))+(c[g+136>>2]|0)+1700485571)|0;b=b<<6|b>>>26;b=b+h|0;k=k+((h^(b|~j))+(c[g+100>>2]|0)-1894986606)|0;k=k<<10|k>>>22;k=k+b|0;j=j+((b^(k|~h))+(c[g+128>>2]|0)-1051523)|0;j=j<<15|j>>>17;j=j+k|0;h=h+((k^(j|~b))+(c[g+92>>2]|0)-2054922799)|0;h=h<<21|h>>>11;h=h+j|0;b=b+((j^(h|~k))+(c[g+120>>2]|0)+1873313359)|0;b=b<<6|b>>>26;b=b+h|0;k=k+((h^(b|~j))+(c[g+148>>2]|0)-30611744)|0;k=k<<10|k>>>22;k=k+b|0;j=j+((b^(k|~h))+(c[g+112>>2]|0)-1560198380)|0;j=j<<15|j>>>17;j=j+k|0;h=h+((k^(j|~b))+(c[g+140>>2]|0)+1309151649)|0;h=h<<21|h>>>11;h=h+j|0;b=b+((j^(h|~k))+(c[g+104>>2]|0)-145523070)|0;b=b<<6|b>>>26;b=b+h|0;k=k+((h^(b|~j))+(c[g+132>>2]|0)-1120210379)|0;k=k<<10|k>>>22;k=k+b|0;j=j+((b^(k|~h))+(c[g+96>>2]|0)+718787259)|0;j=j<<15|j>>>17;j=j+k|0;h=h+((k^(j|~b))+(c[g+124>>2]|0)-343485551)|0;h=h<<21|h>>>11;h=h+j|0;b=b+l|0;h=h+m|0;j=j+n|0;k=k+o|0;e=e+64|0;o=a-64|0;a=o;}while((o|0)!=0);c[g+8>>2]=b;c[g+12>>2]=h;c[g+16>>2]=j;c[g+20>>2]=k;i=f;return e|0}function ne(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=i;f=b;b=d;d=c[b>>2]&63;g=d;d=g+1|0;a[b+24+g|0]=-128;g=64-d|0;if(g>>>0<8>>>0){Yh(b+24+d|0,0,g|0)|0;me(b,b+24|0,64)|0;d=0;g=64}Yh(b+24+d|0,0,g-8|0)|0;g=b|0;c[g>>2]=c[g>>2]<<3;a[b+80|0]=c[b>>2];a[b+81|0]=(c[b>>2]|0)>>>8;a[b+82|0]=(c[b>>2]|0)>>>16;a[b+83|0]=(c[b>>2]|0)>>>24;a[b+84|0]=c[b+4>>2];a[b+85|0]=(c[b+4>>2]|0)>>>8;a[b+86|0]=(c[b+4>>2]|0)>>>16;a[b+87|0]=(c[b+4>>2]|0)>>>24;me(b,b+24|0,64)|0;a[f|0]=c[b+8>>2];a[f+1|0]=(c[b+8>>2]|0)>>>8;a[f+2|0]=(c[b+8>>2]|0)>>>16;a[f+3|0]=(c[b+8>>2]|0)>>>24;a[f+4|0]=c[b+12>>2];a[f+5|0]=(c[b+12>>2]|0)>>>8;a[f+6|0]=(c[b+12>>2]|0)>>>16;a[f+7|0]=(c[b+12>>2]|0)>>>24;a[f+8|0]=c[b+16>>2];a[f+9|0]=(c[b+16>>2]|0)>>>8;a[f+10|0]=(c[b+16>>2]|0)>>>16;a[f+11|0]=(c[b+16>>2]|0)>>>24;a[f+12|0]=c[b+20>>2];a[f+13|0]=(c[b+20>>2]|0)>>>8;a[f+14|0]=(c[b+20>>2]|0)>>>16;a[f+15|0]=(c[b+20>>2]|0)>>>24;Yh(b|0,0,152)|0;i=e;return}function oe(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=a;a=b;Db(e,1);c[a>>2]=Cb(e,6)|0;c[a+4>>2]=Cb(e,6)|0;c[a+8>>2]=(Cb(e,3)|0)-1;i=d;return}function pe(a){a=a|0;var b=0,c=0;b=a;if((b&255|0)==19){c=1}else{c=(b&255|0)==20}i=i;return c|0}function qe(a){a=a|0;var b=0,c=0,d=0;b=i;c=a;do{if((c&255|0)==16){d=1}else{if((c&255|0)==17){d=1;break}d=(c&255|0)==18}}while(0);i=b;return d|0}function re(a){a=a|0;var b=0,c=0;b=a;if((b&255|0)==8){c=1}else{c=(b&255|0)==9}i=i;return c|0}function se(a){a=a|0;var b=0,c=0;b=a;if((b&255|0)>=16){c=(b&255|0)<=23}else{c=0}i=i;return c|0}function te(a){a=a|0;var b=0,c=0;b=a;if((b&255|0)==6){c=1}else{c=(b&255|0)==7}i=i;return c|0}function ue(a){a=a|0;var b=0,c=0,d=0,e=0;b=i;c=a;do{if((c&255|0)<=15){if(((c&255|0)%2|0|0)!=0){d=1}else{break}i=b;return d|0}}while(0);if((c&255|0)>=16){e=(c&255|0)<=23}else{e=0}d=e;i=b;return d|0}




// EMSCRIPTEN_END_FUNCS
var Xa=[wi,wi,Eh,wi,Ch,wi,sh,wi,Dh,wi,Bh,wi,th,wi,ph,wi,wh,wi,vh,wi,Fh,wi,uh,wi,mh,wi,zh,wi,yh,wi,rh,wi,Ah,wi,xh,wi,wi,wi,wi,wi,wi,wi,wi,wi,wi,wi,wi,wi,wi,wi,wi,wi,wi,wi,wi,wi,wi,wi,wi,wi,wi,wi,wi,wi];var Ya=[xi,xi,ag,xi,Fc,xi,bg,xi];var Za=[yi,yi,lh,yi];var _a=[zi,zi,dh,zi];var $a=[Ai,Ai,Gh,Ai,Mh,Ai,Lh,Ai,Jh,Ai,Nh,Ai,Ih,Ai,Ai,Ai];var ab=[Bi,Bi];var bb=[Ci,Ci,oh,Ci,kh,Ci,nh,Ci];var cb=[Di,Di,jh,Di];var db=[Ei,Ei];var eb=[Fi,Fi,Hh,Fi];return{_de265_get_error_text:Tb,_strlen:Zh,_de265_get_image_PTS:wc,_de265_release_next_picture:lc,_de265_free_decoder:Yb,_de265_get_image_plane:vc,_de265_get_parameter_bool:pc,_calloc:Qh,_de265_get_version:Rb,_de265_peek_next_picture:kc,_de265_get_image_width:sc,_de265_set_parameter_int:oc,_memset:Yh,_de265_isOK:Ub,_memcpy:Wh,_de265_get_chroma_format:uc,_de265_get_image_user_data:xc,_de265_get_version_number:Sb,_de265_get_number_of_input_bytes_pending:qc,_de265_flush_data:ac,_realloc:Rh,_de265_new_decoder:Xb,_de265_get_number_of_NAL_units_pending:rc,_de265_get_next_picture:jc,_de265_decode:bc,_de265_set_parameter_bool:nc,_de265_push_NAL:dc,_free:Ph,_memmove:Xh,_de265_get_image_height:tc,_de265_reset:ic,_malloc:Oh,_de265_get_warning:mc,_de265_push_data:$b,runPostSets:vb,stackAlloc:fb,stackSave:gb,stackRestore:hb,setThrew:ib,setTempRet0:lb,setTempRet1:mb,setTempRet2:nb,setTempRet3:ob,setTempRet4:pb,setTempRet5:qb,setTempRet6:rb,setTempRet7:sb,setTempRet8:tb,setTempRet9:ub,dynCall_viiiiiii:mi,dynCall_vi:ni,dynCall_viiiiiiiiiiii:oi,dynCall_ii:pi,dynCall_viii:qi,dynCall_v:ri,dynCall_viiiiiiiii:si,dynCall_viiiiii:ti,dynCall_iii:ui,dynCall_viiii:vi}})


// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_viiiiiii": invoke_viiiiiii, "invoke_vi": invoke_vi, "invoke_viiiiiiiiiiii": invoke_viiiiiiiiiiii, "invoke_ii": invoke_ii, "invoke_viii": invoke_viii, "invoke_v": invoke_v, "invoke_viiiiiiiii": invoke_viiiiiiiii, "invoke_viiiiii": invoke_viiiiii, "invoke_iii": invoke_iii, "invoke_viiii": invoke_viiii, "_llvm_va_end": _llvm_va_end, "___assert_fail": ___assert_fail, "_pthread_mutex_lock": _pthread_mutex_lock, "_pthread_cond_signal": _pthread_cond_signal, "_abort": _abort, "_fprintf": _fprintf, "_pthread_create": _pthread_create, "_fflush": _fflush, "__reallyNegative": __reallyNegative, "_sysconf": _sysconf, "___setErrNo": ___setErrNo, "_fwrite": _fwrite, "_send": _send, "_pthread_mutex_init": _pthread_mutex_init, "_write": _write, "_pthread_cond_init": _pthread_cond_init, "__formatString": __formatString, "_pthread_cond_broadcast": _pthread_cond_broadcast, "_vfprintf": _vfprintf, "_pthread_join": _pthread_join, "_emscripten_memcpy_big": _emscripten_memcpy_big, "_fileno": _fileno, "_pwrite": _pwrite, "_sbrk": _sbrk, "___errno_location": ___errno_location, "_pthread_mutex_destroy": _pthread_mutex_destroy, "_pthread_cond_wait": _pthread_cond_wait, "_pthread_mutex_unlock": _pthread_mutex_unlock, "_mkport": _mkport, "_time": _time, "_pthread_cond_destroy": _pthread_cond_destroy, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "NaN": NaN, "Infinity": Infinity, "_stderr": _stderr, "_stdout": _stdout }, buffer);
var _de265_get_error_text = Module["_de265_get_error_text"] = asm["_de265_get_error_text"];
var _strlen = Module["_strlen"] = asm["_strlen"];
var _de265_get_image_PTS = Module["_de265_get_image_PTS"] = asm["_de265_get_image_PTS"];
var _de265_release_next_picture = Module["_de265_release_next_picture"] = asm["_de265_release_next_picture"];
var _de265_free_decoder = Module["_de265_free_decoder"] = asm["_de265_free_decoder"];
var _de265_get_image_plane = Module["_de265_get_image_plane"] = asm["_de265_get_image_plane"];
var _de265_get_parameter_bool = Module["_de265_get_parameter_bool"] = asm["_de265_get_parameter_bool"];
var _calloc = Module["_calloc"] = asm["_calloc"];
var _de265_get_version = Module["_de265_get_version"] = asm["_de265_get_version"];
var _de265_peek_next_picture = Module["_de265_peek_next_picture"] = asm["_de265_peek_next_picture"];
var _de265_get_image_width = Module["_de265_get_image_width"] = asm["_de265_get_image_width"];
var _de265_set_parameter_int = Module["_de265_set_parameter_int"] = asm["_de265_set_parameter_int"];
var _memset = Module["_memset"] = asm["_memset"];
var _de265_isOK = Module["_de265_isOK"] = asm["_de265_isOK"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _de265_get_chroma_format = Module["_de265_get_chroma_format"] = asm["_de265_get_chroma_format"];
var _de265_get_image_user_data = Module["_de265_get_image_user_data"] = asm["_de265_get_image_user_data"];
var _de265_get_version_number = Module["_de265_get_version_number"] = asm["_de265_get_version_number"];
var _de265_get_number_of_input_bytes_pending = Module["_de265_get_number_of_input_bytes_pending"] = asm["_de265_get_number_of_input_bytes_pending"];
var _de265_flush_data = Module["_de265_flush_data"] = asm["_de265_flush_data"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _de265_new_decoder = Module["_de265_new_decoder"] = asm["_de265_new_decoder"];
var _de265_get_number_of_NAL_units_pending = Module["_de265_get_number_of_NAL_units_pending"] = asm["_de265_get_number_of_NAL_units_pending"];
var _de265_get_next_picture = Module["_de265_get_next_picture"] = asm["_de265_get_next_picture"];
var _de265_decode = Module["_de265_decode"] = asm["_de265_decode"];
var _de265_set_parameter_bool = Module["_de265_set_parameter_bool"] = asm["_de265_set_parameter_bool"];
var _de265_push_NAL = Module["_de265_push_NAL"] = asm["_de265_push_NAL"];
var _free = Module["_free"] = asm["_free"];
var _memmove = Module["_memmove"] = asm["_memmove"];
var _de265_get_image_height = Module["_de265_get_image_height"] = asm["_de265_get_image_height"];
var _de265_reset = Module["_de265_reset"] = asm["_de265_reset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _de265_get_warning = Module["_de265_get_warning"] = asm["_de265_get_warning"];
var _de265_push_data = Module["_de265_push_data"] = asm["_de265_push_data"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = asm["dynCall_viiiiiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_viiiiiiiiiiii = Module["dynCall_viiiiiiiiiiii"] = asm["dynCall_viiiiiiiiiiii"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = asm["dynCall_viiiiiiiii"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];

Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };

// TODO: strip out parts of this we do not need

//======= begin closure i64 code =======

// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */

var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };


  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.

    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };


  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.


  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};


  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }

    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };


  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };


  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };


  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }

    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }

    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));

    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };


  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.


  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;


  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);


  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);


  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);


  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);


  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);


  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);


  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };


  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };


  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (this.isZero()) {
      return '0';
    }

    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }

    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));

    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);

      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };


  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };


  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };


  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };


  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };


  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };


  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };


  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };


  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }

    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }

    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };


  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };


  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };


  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }

    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }

    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }

    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));

      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);

      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }

      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }

      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };


  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };


  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };


  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };


  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };


  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };


  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };

  //======= begin jsbn =======

  var navigator = { appName: 'Modern Browser' }; // polyfill a little

  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/

  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */

  // Basic JavaScript BN library - subset useful for RSA encryption.

  // Bits per digit
  var dbits;

  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);

  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }

  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }

  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.

  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }

  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);

  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;

  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }

  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }

  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }

  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }

  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }

  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }

  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }

  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }

  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }

  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }

  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }

  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }

  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }

  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }

  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }

  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }

  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }

  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }

  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;

  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }

  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }

  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }

  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }

  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }

  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;

  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }

  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }

  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;

  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;

  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);

  // jsbn2 stuff

  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }

  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }

  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }

  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }

  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }

  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }

  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;

  //======= end jsbn =======

  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();

//======= end closure i64 code =======



// === Auto-generated postamble setup entry stuff ===

if (memoryInitializer) {
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    var data = Module['readBinary'](memoryInitializer);
    HEAPU8.set(data, STATIC_BASE);
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      HEAPU8.set(data, STATIC_BASE);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);

  initialStackTop = STACKTOP;

  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    ensureInitRuntime();

    preMain();

    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;

  // exit the runtime
  exitRuntime();

  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371

  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }

  ABORT = true;
  EXITSTATUS = 1;

  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}

Module["noExitRuntime"] = true;

run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}





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
        callback(this, imageData);
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


