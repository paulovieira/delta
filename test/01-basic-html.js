const Lab = require('lab');
const Code = require('code');
const Delta = require('../lib');

const lab = exports.lab = Lab.script();
const suite = lab.suite;
const test = lab.test;
const expect = Code.expect;


/*
const input = `

hello {{ name }}!
hello again {{ name }}!

`;
const output = Delta.compile(input, { source: true });
console.log('\n-------\n' + output + '\n-------\n');
*/

suite('basic usage', () => {


    test('plain interpolation, no html', (done) => {

        const input = `

hello {{ name }}!
hello again {{ name }}!

        `;

        const idom = `

function anonymous(ctx) {

'use strict'
text('hello ' + (name) + '!')
text('hello again ' + (name) + '!')
}

        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
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

function anonymous(ctx) {

'use strict'
elementOpen("div", null, null)
text('    hello world!')
elementOpen("span", null, null)
text('nothing much around here!')
elementClose("span")
elementClose("div")
}

        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.equal(idom.trim());
        done();
    });



    test('plain html and interpolation', (done) => {

        const input = `

<div>
    hello {{ name }}!


    <span>how do we handle several new lines?</span>
    goodbye {{ name }}
</div>

        `;

        const idom = `

function anonymous(ctx) {

'use strict'
elementOpen("div", null, null)
text('    hello ' + (name) + '!')
elementOpen("span", null, null)
text('how do we handle several new lines?')
elementClose("span")
text('    goodbye ' + (name) )
elementClose("div")
}


        `;

        const output = Delta.compile(input, { source: true });
        console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.equal(idom.trim());
        done();
    });


    test('custom function name', (done) => {

        const input = `

hello {{ name }}!

        `;

        const idom = `

function helloFn(ctx) {

'use strict'
text('hello ' + (name) + '!')
}

        `;

        const output = Delta.compile(input, { source: true, name: 'helloFn' });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.equal(idom.trim());
        done();
    });

});
