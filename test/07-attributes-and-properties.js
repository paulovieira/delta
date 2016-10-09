const Lab = require('lab');
const Code = require('code');
const Delta = require('../lib');

const lab = exports.lab = Lab.script();
const suite = lab.suite;
const test = lab.test;
const expect = Code.expect;

suite('attributes and properties', () => {

    test.only('simple dynamic attribute' , (done) => {

        const input = `
<p class="c" key="{{ ctx.id }}">
<div skip=true data-bar="xyz" data-foo="abc-{{ ctx.foo }}">
<!--
    hello {{ name }}!
-->
</div>
</p>
        `;

        const idom = `
function (ctx) {

"use strict"
MyIncrementalDOM.text("hello " + (name) + "!")
MyIncrementalDOM.elementOpen("b")
MyIncrementalDOM.text("hello again " + (name) + "!")
MyIncrementalDOM.elementClose("b")
}
        `;

        const output = Delta.compile(input, { source: true });
        console.log('\n-------\n' + output + '\n-------\n');
        expect(output.trim()).to.equal(idom.trim());
        done();
    });


    test('simple static attribute' , (done) => {

        const input = `
<div data-foo="my-foo" data-bar=123>
    hello {{ name }}!
</div>
        `;

        const idom = `
function (ctx) {

"use strict"
MyIncrementalDOM.text("hello " + (name) + "!")
MyIncrementalDOM.elementOpen("b")
MyIncrementalDOM.text("hello again " + (name) + "!")
MyIncrementalDOM.elementClose("b")
}
        `;

        const output = Delta.compile(input, { source: true });
        console.log('\n-------\n' + output + '\n-------\n');
        expect(output.trim()).to.equal(idom.trim());
        done();
    });

});
