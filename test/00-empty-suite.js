'use strict';

const Lab = require('lab');
const Code = require('code');
const Delta = require('../lib');

const lab = exports.lab = Lab.script();
const suite = lab.suite;
const test = lab.test;
const expect = Code.expect;

suite('...', () => {

    test('...', (done) => {

        const input = `
        `;

        const idom = `

        `;

        //const output = Delta.compile(input, { source: true });
        //console.log('\n-------\n' + output + '\n-------\n');
        //expect(output.trim()).to.equal(idom.trim());
        expect(true).to.equal(true);
        done();
    });

});
