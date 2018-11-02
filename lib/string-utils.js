'use strict';

var internals = {};

// string utilities grabbed from underscore.string

internals.makeString = function(object) {
    
    if (object === null){
        return '';
    }

    return '' + object;
};

internals.toPositive = function (number) {

    return number < 0 ? 0 : (+number || 0);
};

internals.chars = function (str) {

    return internals.makeString(str).split('');
};

/*
module.exports.capitalize = function (str, lowercaseRest) {
  str = internals.makeString(str);
  var remainingChars = !lowercaseRest ? str.slice(1) : str.slice(1).toLowerCase();

  return str.charAt(0).toUpperCase() + remainingChars;
};
*/

module.exports.startsWith = function (str, starts, position) {

    str = internals.makeString(str);
    starts = '' + starts;
    position = position === null ? 0 : Math.min(internals.toPositive(position), str.length);

    return str.lastIndexOf(starts, position) === position;
};

module.exports.lines = function (str, cleanLines) {

    if (str === null){
        return [];
    }

    if (!cleanLines) {
        return String(str).split(/\r\n?|\n/);
    }

    return String(str).split(/\r\n?|\n/).map(module.exports.clean);
};
/*
module.exports.splice = function (str, i, howmany, substr) {
  var arr = internals.chars(str);
  arr.splice(~~i, ~~howmany, substr);

  return arr.join('');
};
*/
module.exports.clean = function (str) {

    return str.trim().replace(/\s\s+/g, ' ');
};
