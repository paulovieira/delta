const Lab = require('lab');
const Code = require('code');
const Delta = require('../lib');

const lab = exports.lab = Lab.script();
const suite = lab.suite;
const test = lab.test;
const expect = Code.expect;

suite('attributes', () => {


    test.skip('...', (done) => {

        const input = `
        `;

        const idom = `

        `;

        const output = Delta.preCompile(input);
        //console.log('\n-------\n' + output + '\n-------\n');
        expect(output.trim()).to.equal(idom.trim());
        done();
    });

});
