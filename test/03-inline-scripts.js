'use strict';

const Lab = require('lab');
const Code = require('code');
const Delta = require('../lib');

const lab = exports.lab = Lab.script();
const suite = lab.suite;
const test = lab.test;
const expect = Code.expect;

suite('inline scripts', () => {


    test('simple helper function defined inside a "script" element', (done) => {

        const input = `
<script>

function toUpper(s){

    return s.toUpperCase();
}

</script>


hello {{ toUpper(ctx.name) }}!
        `;

        const idom = `
function (ctx) {

"use strict"
/*  begin inline script  */
function toUpper(s){
    return s.toUpperCase();
}
/*  end inline script  */
IncrementalDOM.text("hello " + (toUpper(ctx.name)) + "!")
}
        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.equal(idom.trim());
        done();
    });


    test('code inside a "script" element will be placed at the top', (done) => {

        const input = `
hello {{ toLower(ctx.name) }}!

<script>

var toLower = function(s){

    return s.toLowerCase();
}

</script>

hello again!

<script>

var toUpper = function(s){

    return s.toUpperCase();
}

</script>

goodbye!

        `;

        const idom = `
function (ctx) {

"use strict"
/*  begin inline script  */
var toLower = function(s){
    return s.toLowerCase();
}
/*  end inline script  */
/*  begin inline script  */
var toUpper = function(s){
    return s.toUpperCase();
}
/*  end inline script  */
IncrementalDOM.text("hello " + (toLower(ctx.name)) + "!")
IncrementalDOM.text("hello again!")
IncrementalDOM.text("goodbye!")
}
        `;

        const output = Delta.compile(input, { source: true });
        console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.equal(idom.trim());
        done();
    });


    test('"script" element with empty contents is ignored', (done) => {

        const input = `
<script>

</script>


hello {{ toUpper(ctx.name) }}!
        `;

        const idom = `
function (ctx) {

"use strict"
IncrementalDOM.text("hello " + (toUpper(ctx.name)) + "!")
}
        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.equal(idom.trim());
        done();
    });

});

