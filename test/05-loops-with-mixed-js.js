'use strict';

const Lab = require('lab');
const Code = require('code');
const Delta = require('../lib');

const lab = exports.lab = Lab.script();
const suite = lab.suite;
const test = lab.test;
const expect = Code.expect;

suite('loops with javascript mixed between elements', () => {

    test.only('plain old for loop', (done) => {

        // ctx.people would be an array of objects
        const input = `
<div>the names are:</div>
: for(var i = 0; i <ctx.people.length && j>0; i++) {
    <b>{{ ctx.people[i].firstName }} {{ ctx.people[i].lastName }}</b>
: }

        `;


        const idom = `

function (ctx) {

"use strict"
IncrementalDOM.elementOpen("div")
IncrementalDOM.text("the names are:")
IncrementalDOM.elementClose("div")
 for(var i = 0; i < ctx.people.length && j >0; i++) {
IncrementalDOM.elementOpen("b")
IncrementalDOM.text("" + (ctx.people[i].firstName) + " " + (ctx.people[i].lastName))
IncrementalDOM.elementClose("b")
 }
}

        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output.trim()).to.equal(idom.trim());
        done();
    });

/*
    test('plain old for loop (2)', (done) => {

        // ctx.people would be an array of objects
        const input = `
<div>the names are:</div>
<code> for(var i = 0; i <ctx.people.length && j>0; i++) { </code>
    <b>{{ ctx.people[i].firstName }} {{ ctx.people[i].lastName }}</b>
<code> } </code>

        `;


        const idom = `

function (ctx) {

"use strict"
IncrementalDOM.elementOpen("div")
IncrementalDOM.text("the names are:")
IncrementalDOM.elementClose("div")
 for(var i = 0; i < ctx.people.length && j >0; i++) {
IncrementalDOM.elementOpen("b")
IncrementalDOM.text("" + (ctx.people[i].firstName) + " " + (ctx.people[i].lastName))
IncrementalDOM.elementClose("b")
 }
}

        `;

        const output = Delta.compile(input, { source: true });
        console.log('\n-------\n' + output + '\n-------\n');
        expect(output.trim()).to.equal(idom.trim());
        done();
    });
*/

    test('forEach loop', (done) => {

        // ctx.people would be an array of objects
        const input = `
<div>the names are:</div>
: ctx.people.forEach(function(person){
    <b>{{ person.firstName }} {{ person.lastName }}</b>
: })

        `;

        const idom = `
function (ctx) {

"use strict"
IncrementalDOM.elementOpen("div")
IncrementalDOM.text("the names are:")
IncrementalDOM.elementClose("div")
 ctx.people.forEach(function(person){
IncrementalDOM.elementOpen("b")
IncrementalDOM.text("" + (person.firstName) + " " + (person.lastName))
IncrementalDOM.elementClose("b")
 })
}
        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output.trim()).to.equal(idom.trim());
        done();
    });


    test('lines with mixed js must start with ":" (no spaces before)', (done) => {

        // ctx.people would be an array of objects
        const input = `
<div>the names are:</div>
 : for(var i = 0; i < ctx.people.length; i++) {
    <b>{{ ctx.people[i].firstName }} {{ ctx.people[i].lastName }}</b>
 : }

        `;

        const idom = `
function (ctx) {

"use strict"
IncrementalDOM.elementOpen("div")
IncrementalDOM.text("the names are:")
IncrementalDOM.elementClose("div")
IncrementalDOM.text(" : for(var i = 0; i <  ctx.people.length; i++) {")
IncrementalDOM.elementOpen("b")
IncrementalDOM.text("" + (ctx.people[i].firstName) + " " + (ctx.people[i].lastName))
IncrementalDOM.elementClose("b")
IncrementalDOM.text(" : }")
}
        `;

        const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output.trim()).to.equal(idom.trim());
        done();
    });

});
