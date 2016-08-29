var _s = require("underscore.string");

var helpers = {};

helpers.add = function (a, b) {
  return a + b;
};

// end of prologue scripts

elementOpen('div')
text('\n  hello   ' + (ctx.planetName) + ' x \n')
elementClose('div')
