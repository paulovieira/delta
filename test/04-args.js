const Lab = require('lab');
const Code = require('code');
const Delta = require('../lib');

const lab = exports.lab = Lab.script();
const suite = lab.suite;
const test = lab.test;
const expect = Code.expect;

suite('args', () => {


    test('one custom  argument', (done) => {

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


    test('one custom argument and some new lines after it', (done) => {

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

    test('two custom arguments', (done) => {

        const input = `
@param firstName
@param lastName

hello {{ firstName }} {{ lastName }}!
        `;

        const idom = `
function (firstName,lastName) {

"use strict"
IncrementalDOM.text("hello " + (firstName) + " " + (lastName) + "!")
}
        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.equal(idom.trim());
        done();
    });


    test('one custom argument and some text before an element', (done) => {

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


    test('an empty template with a custom argument is a noop', (done) => {

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


    test('the parameter line must start with the correct prefix', (done) => {

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


    test('if there is line starting with "@param" after the parameters section, it will be considered as regular text', (done) => {

        const input = `
@param firstName

@param i-will-be-a-regular-text-element!
        `;

        const idom = `
function (firstName) {

"use strict"
IncrementalDOM.text("@param i-will-be-a-regular-text-element!")
}
        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.equal(idom.trim());
        done();
    });


    test('if an element is used before the parameters section, the parameters will be regular text elements (exception is the comment element, see the next test)', (done) => {

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


    test('comments can be used before the parameters section', (done) => {

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


    test('the names of the arguments cannot be repeated', (done) => {

        const input = `
@param firstName
@param firstName

an error will be thrown...
        `;

        const willThrow = function() {

            Delta.compile(input, { source: true });
        };

        expect(willThrow).to.throw('Argument names cannot be repeated');
        done();
    });


    test('the names of the arguments must start with "@param"', (done) => {

        const input = `
@param firstName
param secondName

an error will be thrown...
        `;

        const willThrow = function() {

            Delta.compile(input, { source: true });
        };

        expect(willThrow).to.throw('Arguments should be declared in the form: "@param argName"');
        done();
    });


    test('arguments must be declared in the format "@param argName"', (done) => {

        const input = `
@param firstName secondName

an error will be thrown...
        `;

        const willThrow = function() {

            Delta.compile(input, { source: true });
        };

        expect(willThrow).to.throw('Arguments should be declared in the form: "@param argName"');
        done();
    });


    test('arguments must be declared in the format "@param argName" (2)', (done) => {

        const input = `
@param

an error will be thrown...
        `;

        const willThrow = function() {

            Delta.compile(input, { source: true });
        };

        expect(willThrow).to.throw('Arguments should be declared in the form: "@param argName"');
        done();
    });


    test('if the first line of the parameters section does not start with "@param", it will be considered regular text (and the other lines too)', (done) => {

        const input = `
param firstName
@param lastName

Hello {{ firstName }} {{ lastName }}
You are undefined!
        `;

        const idom = `
function (ctx) {

"use strict"
IncrementalDOM.text("param firstName")
IncrementalDOM.text("@param lastName")
IncrementalDOM.text("Hello " + (firstName) + " " + (lastName))
IncrementalDOM.text("You are undefined!")
}
        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output).to.equal(idom.trim());
        done();
    });
});
