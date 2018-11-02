'use strict';

const Lab = require('lab');
const Code = require('code');
const Delta = require('../lib');

const lab = exports.lab = Lab.script();
const suite = lab.suite;
const test = lab.test;
const expect = Code.expect;

suite('library prefix', () => {

    test('output a custom prefix (global namespace object) for the incremental dom functions' , (done) => {

        const input = `
hello {{ ctx.name }}!
<b>hello again {{ ctx.name }}!</b>
        `;

        const idom = `
function (ctx) {

"use strict"
MyIncrementalDOM.text("hello " + (ctx.name) + "!")
MyIncrementalDOM.elementOpen("b")
MyIncrementalDOM.text("hello again " + (ctx.name) + "!")
MyIncrementalDOM.elementClose("b")
}
        `;

        const output = Delta.compile(input, { source: true, global: 'MyIncrementalDOM' });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output.trim()).to.equal(idom.trim());
        done();
    });


    test('remove the custom prefix (no global namespace)' , (done) => {

        const input = `
hello {{ ctx.name }}!
<b>hello again {{ ctx.name }}!</b>
        `;

        const idom = `
function (ctx) {

"use strict"
text("hello " + (ctx.name) + "!")
elementOpen("b")
text("hello again " + (ctx.name) + "!")
elementClose("b")
}
        `;

        const output = Delta.compile(input, { source: true, global: undefined });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output.trim()).to.equal(idom.trim());
        done();
    });


    test('can output a common js module using the option "cjs": true (and global will be ignored)'  , (done) => {

        // will require "incremental-dom", the official name in npm, 
        // will ignore the the "global" option (if it was set)
        const input = `
hello {{ name }}!
<b>hello again {{ name }}!</b>
        `;

        const idom = `
var __IDomLib__ = require("incremental-dom")
module.exports = function (ctx) {

"use strict"
__IDomLib__.text("hello " + (name) + "!")
__IDomLib__.elementOpen("b")
__IDomLib__.text("hello again " + (name) + "!")
__IDomLib__.elementClose("b")
}
        `;

        const output = Delta.compile(input, { source: true, cjs: true, global: 'MyIncrementalDOM' });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output.trim()).to.equal(idom.trim());
        done();
    });


    test('The "cjs" option requires the option "source": true' , (done) => {

        const input = `
hello {{ name }}!
<b>hello again {{ name }}!</b>
        `;

        const willThrow = function (){

            Delta.compile(input, { cjs: true });
        };

        expect(willThrow).to.throw('The option "cjs" requires the option "source": true');
        done();
    });


    test('output a common js module with a custom path in require using the option "cjs": "..."', (done) => {

        const input = `
hello {{ name }}!
<b>hello again {{ name }}!</b>
        `;

        const idom = `
var __IDomLib__ = require("../incremental-dom-xyz")
module.exports = function (ctx) {

"use strict"
__IDomLib__.text("hello " + (name) + "!")
__IDomLib__.elementOpen("b")
__IDomLib__.text("hello again " + (name) + "!")
__IDomLib__.elementClose("b")
}
        `;

        const output = Delta.compile(input, { source: true, cjs: '../incremental-dom-xyz' });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output.trim()).to.equal(idom.trim());
        done();
    });


});
