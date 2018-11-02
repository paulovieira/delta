'use strict';

const Lab = require('lab');
const Code = require('code');
const Delta = require('../lib');

const lab = exports.lab = Lab.script();
const suite = lab.suite;
const test = lab.test;
const expect = Code.expect;

suite('basic usage', () => {


    test('plain interpolation, no html', (done) => {

        const input = `
hello {{ ctx.name }}!
{{ ctx.name }}, how are you?
goodbye {{ ctx.name }}
        `;

        const idom = `
function (ctx) {

"use strict"
IncrementalDOM.text("hello " + (ctx.name) + "!")
IncrementalDOM.text("" + (ctx.name) + ", how are you?")
IncrementalDOM.text("goodbye " + (ctx.name))
}
        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n--- actual output ---\n' + output + '\n--- actual output ---\n');

        expect(output).to.be.a.string();
        expect(output).to.equal(idom.trim());
        done();
    });


    test('plain html, no interpolation', (done) => {

        const input = `
<div>
    hello world!
    <span>nothing much around here!</span>
</div>
        `;

        const idom = `
function (ctx) {

"use strict"
IncrementalDOM.elementOpen("div")
IncrementalDOM.text("    hello world!")
IncrementalDOM.elementOpen("span")
IncrementalDOM.text("nothing much around here!")
IncrementalDOM.elementClose("span")
IncrementalDOM.elementClose("div")
}
        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.equal(idom.trim());
        done();
    });


    test('default output will be the rendered function (omitting the "source" option)', (done) => {

        const input = `
hello {{ ctx.name }}!
hello again {{ ctx.name }}!
        `;

        const output = Delta.compile(input);
        expect(output).to.be.a.function();
        done();
    });


    test('custom function name (default is undefined, which will output an anonymous function)', (done) => {

        const input = `
hello {{ ctx.name }}!
        `;

        const idom = `
function helloFn(ctx) {

"use strict"
IncrementalDOM.text("hello " + (ctx.name) + "!")
}
        `;

        const output = Delta.compile(input, { source: true, name: 'helloFn' });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.equal(idom.trim());
        done();
    });


    test('plain html and interpolation', (done) => {

        const input = `
<div>
    hello {{ ctx.name }}!


    <span>empty lines between elements will be ignored</span>
    goodbye {{ ctx.name }}
</div>
        `;

        const idom = `
function (ctx) {

"use strict"
IncrementalDOM.elementOpen("div")
IncrementalDOM.text("    hello " + (ctx.name) + "!")
IncrementalDOM.elementOpen("span")
IncrementalDOM.text("empty lines between elements will be ignored")
IncrementalDOM.elementClose("span")
IncrementalDOM.text("    goodbye " + (ctx.name))
IncrementalDOM.elementClose("div")
}
        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.equal(idom.trim());
        done();
    });

    
    test('an empty template results in a noop', (done) => {

        // empty string
        const input = `
        `;

        const idom = `
function (ctx) {

"use strict"
}
        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.equal(idom.trim());
        done();
    });


    test('empty lines can be included using "includeEmptyLines": true (default value is false)', (done) => {

        const input = `
hello {{ ctx.name }}!


hello again {{ ctx.name }}!
        `;

        const idom = `
function (ctx) {

"use strict"
IncrementalDOM.text("hello " + (ctx.name) + "!")
IncrementalDOM.text("")
IncrementalDOM.text("")
IncrementalDOM.text("hello again " + (ctx.name) + "!")
}
        `;

        const output = Delta.compile(input, { source: true, includeEmptyLines: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        //expect(output).to.equal(idom.trim());
        done();
    });


    test('custom interpolation tokens for expressions', (done) => {

        const input = `
hello { ctx.name }!
hello again { ctx.name }!
        `;

        const idom = `
function (ctx) {

"use strict"
IncrementalDOM.text("hello " + (ctx.name) + "!")
IncrementalDOM.text("hello again " + (ctx.name) + "!")
}
        `;

        const output = Delta.compile(input, { source: true, expressionStart: '{', expressionEnd: '}' });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.be.a.string();
        expect(output).to.equal(idom.trim());
        done();
    });
});

