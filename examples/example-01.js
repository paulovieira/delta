
var renderer = function (ctx) {

    "use strict"
    IncrementalDOM.text("hello " + (ctx.name) + "!")
    IncrementalDOM.text("" + (ctx.name) + ", how are you?")
    IncrementalDOM.text("goodbye " + (ctx.name))
}

IncrementalDOM.patch(document.getElementsByTagName('body')[0], renderer, { name: 'plato' });