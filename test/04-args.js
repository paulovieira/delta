'use strict';

const Lab = require('lab');
const Code = require('code');
const Delta = require('../lib');

const lab = exports.lab = Lab.script();
const suite = lab.suite;
const test = lab.test;
const expect = Code.expect;

suite('parameters', () => {


    test('one custom parameter', (done) => {

        const input = `
@param firstName

hello {{ firstName }}!
        `;

        const idom = `
function (firstName) {

"use strict"
IncrementalDOM.text("hello " + (firstName) + "!")
}
        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.equal(idom.trim());
        done();
    });


    test('one custom parameter and some empty lines after it', (done) => {

        const input = `
@param firstName




hello {{ firstName }}   !
        `;

        const idom = `
function (firstName) {

"use strict"
IncrementalDOM.text("hello " + (firstName) + "   !")
}
        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.equal(idom.trim());
        done();
    });

    test('two custom parameter', (done) => {

        const input = `
@param $firstName
@param      _lastName

hello {{ $firstName }} {{ _lastName }}!
        `;

        const idom = `
function ($firstName,_lastName) {

"use strict"
IncrementalDOM.text("hello " + ($firstName) + " " + (_lastName) + "!")
}
        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.equal(idom.trim());
        done();
    });


    test('one custom parameter and some plain text before the first element', (done) => {

        const input = `
@param firstName

hello {{ firstName }}!

<b>are you there?</b>
        `;

        const idom = `
function (firstName) {

"use strict"
IncrementalDOM.text("hello " + (firstName) + "!")
IncrementalDOM.elementOpen("b")
IncrementalDOM.text("are you there?")
IncrementalDOM.elementClose("b")
}
        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.equal(idom.trim());
        done();
    });


    test('an empty template with a custom parameter is a noop', (done) => {

        const input = `
@param firstName

        `;

        const idom = `
function (firstName) {

"use strict"
}

        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.equal(idom.trim());
        done();
    });


    test('a line in a parameter declaration must start with @', (done) => {

        const input = `
param firstName

hello {{ firstName }}!
        `;

        const idom = `
function (ctx) {

"use strict"
IncrementalDOM.text("param firstName")
IncrementalDOM.text("hello " + (firstName) + "!")
}
        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.equal(idom.trim());
        done();
    });


    test('a line starting with "@param" after the parameters section will be treated as regular text', (done) => {

        const input = `
@param firstName

@param lastName!
        `;

        const idom = `
function (firstName) {

"use strict"
IncrementalDOM.text("@param lastName!")
}
        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.equal(idom.trim());
        done();
    });


    test('if an element is used before the parameters declaration block, the parameters will be considered regular text (exception is the comment element)', (done) => {

        const input = `
<span></span>

@param firstName
@param lastName

Hello {{ firstName }} {{ lastName }}
        `;

        const idom = `
function (ctx) {

"use strict"
IncrementalDOM.elementOpen("span")
IncrementalDOM.elementClose("span")
IncrementalDOM.text("@param firstName")
IncrementalDOM.text("@param lastName")
IncrementalDOM.text("Hello " + (firstName) + " " + (lastName))
}
        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.equal(idom.trim());
        done();
    });


    test('comments can be used before the parameters declaration block', (done) => {

        const input = `
<!--  a comment 
      some more comments
-->

@param firstName
@param lastName

Hello {{ firstName }} {{ lastName }}
        `;

        const idom = `
function (firstName,lastName) {

"use strict"
/*
a comment 
      some more comments
*/
IncrementalDOM.text("Hello " + (firstName) + " " + (lastName))
}
        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.equal(idom.trim());
        done();
    });


    test('parameters cannot be repeated', (done) => {

        const input = `
@param firstName
@param firstName

<b>this won't compile</b>
        `;

        const willThrow = function() {

            Delta.compile(input, { source: true });
        };

        expect(willThrow).to.throw('Parameter "firstName" is repeated');
        done();
    });


    test('a parameter declaration must start with "@param"', (done) => {

        const input = `
@param firstName
param lastName

<b>this won't compile</b>
        `;

        const willThrow = function() {

            Delta.compile(input, { source: true });
        };

        expect(willThrow).to.throw('Parameters should be declared in the form: "@param paramName"');
        done();
    });


    test('a parameter declaration must be in the format "@param paramName"', (done) => {

        const input = `
@param firstName lastName

<b>this won't compile</b>
        `;

        const willThrow = function() {

            Delta.compile(input, { source: true });
        };

        expect(willThrow).to.throw('Parameters should be declared in the form: "@param paramName"');
        done();
    });


    test('a parameter declaration must be in the format "@param paramName"', (done) => {

        const input = `
@param

<b>this won't compile</b>
        `;

        const willThrow = function() {

            Delta.compile(input, { source: true });
        };

        expect(willThrow).to.throw('Parameters should be declared in the form: "@param paramName"');
        done();
    });


    test('parameters declaration block must start with "@param" (otherwise will be trated as regular text)', (done) => {

        const input = `
param firstName
@param lastName

Hello {{ firstName }} {{ lastName }}
You are undefined, sir!
        `;

        const idom = `
function (ctx) {

"use strict"
IncrementalDOM.text("param firstName")
IncrementalDOM.text("@param lastName")
IncrementalDOM.text("Hello " + (firstName) + " " + (lastName))
IncrementalDOM.text("You are undefined, sir!")
}
        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.equal(idom.trim());
        done();
    });


    test('a parameter declaration must be be a valid identifier', (done) => {

        const input = `
@param @firstName


        `;

        const willThrow = function() {

            Delta.compile(input, { source: true });
        };

        expect(willThrow).to.throw('"@firstName" is not a valid identifier');
        done();
    });

});
