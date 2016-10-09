const Lab = require('lab');
const Code = require('code');
const Delta = require('../lib');

const lab = exports.lab = Lab.script();
const suite = lab.suite;
const test = lab.test;
const expect = Code.expect;

suite('comments', () => {


    test('comments in html will be included by default', (done) => {

        const input = `
<!-- some comment at the top -->
hello {{ ctx.name }}!
<!-- some comment in the middle -->
<b>hello <!-- this is bold -->again!</b>
        `;

        const idom = `
function (ctx) {

"use strict"
/*
some comment at the top
*/
IncrementalDOM.text("hello " + (ctx.name) + "!")
/*
some comment in the middle
*/
IncrementalDOM.elementOpen("b")
IncrementalDOM.text("hello ")
/*
this is bold
*/
IncrementalDOM.text("again!")
IncrementalDOM.elementClose("b")
}
        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.equal(idom.trim());
        done();
    });


    test('comments in html can be discarded with the "includeComments: false" option (default value is true)', (done) => {

        const input = `
<!-- some comment at the top -->
hello {{ ctx.name }}!
<!-- some comment in the middle -->
hello again! the comments are gone...
        `;

        const idom = `
function (ctx) {

"use strict"
IncrementalDOM.text("hello " + (ctx.name) + "!")
IncrementalDOM.text("hello again! the comments are gone...")
}
        `;

        const output = Delta.compile(input, { source: true, includeComments: false });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.equal(idom.trim());
        done();
    });

});

