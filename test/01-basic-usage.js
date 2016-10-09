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
hello {{ name }}!
{{ name }}, how are you?
        `;

        const idom = `
function (ctx) {

"use strict"
IncrementalDOM.text("hello " + (name) + "!")
IncrementalDOM.text("" + (name) + ", how are you?")
}
        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
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
hello {{ name }}!
hello again {{ name }}!
        `;

        const idom = `
function anonymous(ctx
/**/) {
"use strict"
IncrementalDOM.text("hello " + (name) + "!")
IncrementalDOM.text("hello again " + (name) + "!")
}
        `;

        const output = Delta.compile(input);
        //console.log('\n-------\n' + output.toString() + '\n-------\n');
        expect(output).to.be.a.function();
        expect(output.toString()).to.equal(idom.trim());
        done();
    });


    test('custom function name (default is undefined, which will output an anonymous function)', (done) => {

        const input = `
hello {{ name }}!
        `;

        const idom = `
function helloFn(ctx) {

"use strict"
IncrementalDOM.text("hello " + (name) + "!")
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
    hello {{ name }}!


    <span>empty lines between elements will be ignored</span>
    goodbye {{ name }}
</div>
        `;

        const idom = `
function (ctx) {

"use strict"
IncrementalDOM.elementOpen("div")
IncrementalDOM.text("    hello " + (name) + "!")
IncrementalDOM.elementOpen("span")
IncrementalDOM.text("empty lines between elements will be ignored")
IncrementalDOM.elementClose("span")
IncrementalDOM.text("    goodbye " + (name))
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


    test('empty lines can be taken into account using "includeEmptyLines": true (default value is false)', (done) => {

        const input = `
hello {{ name }}!


hello again {{ name }}!
        `;

        const idom = `
function (ctx) {

"use strict"
IncrementalDOM.text("hello " + (name) + "!")
IncrementalDOM.text("")
IncrementalDOM.text("")
IncrementalDOM.text("hello again " + (name) + "!")
}
        `;

        const output = Delta.compile(input, { source: true, includeEmptyLines: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        //expect(output).to.equal(idom.trim());
        done();
    });


    test('custom interpolation tokens', (done) => {

        const input = `
hello { name }!
hello again { name }!
        `;

        const idom = `
function (ctx) {

"use strict"
IncrementalDOM.text("hello " + (name) + "!")
IncrementalDOM.text("hello again " + (name) + "!")
}
        `;

        const output = Delta.compile(input, { source: true, interpolate : /{([\s\S]+?)}|$/g });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.be.a.string();
        expect(output).to.equal(idom.trim());
        done();
    });
});

