'use strict';

const Htmlparser = require('htmlparser2');
const _ = require('underscore');
const Utils = require('./utils');
const StringUtils = require('./string-utils');

const internals = {

    defaults: {

        deltaOptions: {
            trimText: false,
            includeEmptyLines: false,
            includeCommentsInJs: true,
            name: '',  // name for renderer function (only used if source is true) TODO: in webpack, use the filepath
            source: false,  // output will be a string with the source of the renderer 
            expressionStart: '{{',
            expressionEnd: '}}',
            global: 'IncrementalDOM', // global object (namespace) where the idom functions are can be found
            cjs: false,  // the renderer will be the exported value of a common js module; either false (default value), true (will include "require('incremental-dom')" at the top) or a string (will include "require(...)" at the top, where  the string is the explicit path for require); must be used with source: true
            statementStart: '{%',
            statementEnd: '{%',

            pattern: '.'

        },g

        // htmlparser options
        parserOptions: {
            //normalizeWhitespace: true,
            //xmlMode: false
            //decodeEntities: true,
            //lowerCaseTags
            //recognizeSelfClosing
        }
    },

    deltaOptions: {},
    parserOptions: {},

    // private options
    staticAttrs: [],
    interpolate: undefined  // default interpolation reg exp is /{{([\s\S]+?)}}|$/g
};

// internal state  - changed everytime 'compile' is called
internals.params = [];
internals.idomSrc = [];
internals.inlineScripts = [];
internals.nodeCount = {
    tag: 0,
    text: 0,
    script: 0,
    comment: 0
};

module.exports = {

    compile: function (input, deltaOptions, parserOptions){

        var expressionStart = '{{'
        var expressionEnd = '}}'
        var pattern = `${ expressionStart }([\\s\\S]+?)${ expressionEnd }|$`;
        var regexp = new RegExp(pattern, 'g');
        var s = `xyz {{ hello}} abc`;
        //var out = Utils.decompose(s, regexp);

        let i = 0;
        let components = [];

        s.replace(regexp, (match, interpolate, offset) => {

            // the callback will be executed even if interpolationRegEx was not matched
            // ('match' will be undefined and offset will be the length of the text)
            if (!match){
                return;
            }
            console.log(match)
            console.log(interpolate)
            components.push({ type: 'text', text: s.slice(i, offset) });
            components.push({ type: 'variable', text: interpolate });

            i = offset + match.length;
        });



        console.log(components)
        return;

        internals.resetInternals();
        internals.parseOptions();

        input = Utils.preProcess(input);
        
        // dom is an array containing the top-level elements 
        // (the 'parent' property is null in those objects)
        const dom = Htmlparser.parseDOM(input, internals.parserOptions);

        dom.forEach(internals.normalizeNode);
        dom.forEach(internals.handleParams);
        dom.forEach(internals.handleNode);
        
        return internals.createOutput(internals.deltaOptions.source);
    }

};


internals.resetInternals = function (){

    // internal (private) state - changed everytime 'compile' is called
    internals.params = [];
    internals.idomSrc = [];
    internals.inlineScripts = [];
    internals.nodeCount = {
        tag: 0,
        text: 0,
        script: 0,
        comment: 0
    };
};


internals.parseOptions = function () {

    internals.deltaOptions = _.extend({}, internals.defaults.deltaOptions, deltaOptions);
    internals.parserOptions = _.extend({}, internals.defaults.parserOptions, parserOptions);

    // the 'cjs' option must be used with 'source': true

    // TODO: remove the 'cjs' option? the library should just output the renderer function
    // (as string or as a function); the task of creating an umd module should be done by
    // by some external tool

    if (internals.deltaOptions.cjs){
        if (internals.deltaOptions.source !== true){
            throw new Error('The option "cjs" requires the option "source": true');    
        }

        internals.deltaOptions.global = '';
    }


    internals.deltaOptions.global = (internals.deltaOptions.global || '') + '.';
    if (internals.deltaOptions.global === '.') {
        internals.deltaOptions.global = '';
    }

    ///var expressionStart = internals.deltaOptions.expressionStart;
    ///var expressionEnd = internals.deltaOptions.expressionEnd;
    ///var pattern = expressionStart + '([\\s\\S]+?)' + expressionEnd + '|$';
    var pattern = `${ internals.deltaOptions.expressionStart }([\\s\\S]+?)${ internals.deltaOptions.expressionEnd }|$`;
    internals.deltaOptions.interpolate = new RegExp(pattern, 'g');

    // TODO
    var random = 'foiwenfuwenfuiwfiuwefwef';

    var pattern = internals.deltaOptions.pattern;
    if (typeof pattern === 'string') {
        expStart = pattern + random + 'start';
        expEnd = pattern + random + 'end';

        internals.deltaOptions.interpolate = new RegExp(`${ expStart }([\\s\\S]+?)${ expEnd }|$`, 'g');
    }

};


// make any necessary preliminary adjustments to the input string

internals.preProcess = function(input){

    const inputLines = StringUtils.lines(input.trim());

    var pattern = internals.deltaOptions.pattern;



    // for input lines that are mixed statements and expressions (loops), make sure occurrences of '<' or '>'
    // have a surrounding space, so that Htmlparser won't consider it as an html element

    for (let i = 0; i < inputLines.length; ++i){
        if (StringUtils.startsWith(inputLines[i].trim(), ':')){
            inputLines[i] = inputLines[i].replace(/</g, '< ');
            inputLines[i] = inputLines[i].replace(/>/g, ' >');
        }
    }

    return inputLines.join('\n');
};

// normalize and augment the properties for the node objects produced by Htmlparser

internals.normalizeNode = function (node){

    // make sure all nodes have the attribs object and children array;
    node.attribs = node.attribs || {};
    node.children = node.children || [];

    // elements with boolean attributes should actually have a boolean value in the attribs; example:
    // <div skip></div> should  have node.attribs.skip === true (and not  node.attribs.skip === '')
    for (const key in node.attribs){
        if (Utils.isBoolAttrib(key) && node.attribs[key].trim() === ''){
            node.attribs[key] = true;
        }
    }

    if (node.type === 'text'){

        // if there's no text content, add a boolean flag signaling it
        // (by 'content' we mean anything other than white space)
        node._isEmpty = node.data.trim() === '';
    }

    // recursive call - normalize the child nodes of this node
    node.children.forEach(internals.normalizeNode);

};

internals.handleParams = function (node){

    // if this is the first text node, it might have parameter declarations;
    // it must come before any other node (except comments)

    var extract = true;

    if (node.type !== 'text') { 
        extract = false 
    };

    if (internals.nodeCount['text'] > 0 || internals.nodeCount['tag'] > 0 || internals.nodeCount['script'] > 0) {
        extract = false 
    };

    internals.nodeCount[node.type]++;

    if (extract === true) {
        internals.extractParams(node);
    }
};


internals.extractParams = function (node){

    const cleanLines = true;
    var lines = StringUtils.lines(node.data.trim(), cleanLines);

    // if the first line doesn't have '@param', abort parameter parsing
    if (lines[0].indexOf('@param') === -1){
        return;
    }

    // find the index of the first blank line (marking the end of the parameter declaration)
    var i = 0;
    for (; i < lines.length; ++i){
        if (lines[i] === ''){
            break;
        }
    }

    // make sure all elements in the array before this index have the expected format
    for (let j = 0; j < i; ++j){
        const words = lines[j].split(' ');

        if (words[0] !== '@param' || words.length !== 2){
            throw new Error('Parameters should be declared in the form: "@param paramName"');
        }

        const paramName = words[1];

        if (!Utils.isValidIdentifier(paramName)){
            throw new Error(`"${paramName}" is not a valid identifier`);
        }

        if (_.includes(internals.params, paramName)){
            throw new Error(`Parameter "${ paramName }" is repeated`);
        }

        internals.params.push(paramName);
    }

    // for this text element, delete the lines relative to the parameters declaration block
    // (as well as the new line character which marks the end of the declaration);
    // we might have some plain text after the parameters block, which is kept;

    // extract lines again, this time without the cleanLines parameter
    lines = StringUtils.lines(node.data.trim());
    node.data = lines.slice(i + 1).join('\n');
    

};


internals.createOutput = function (outputSource){

    let source = [];
    source.push('"use strict"');

    // 1 - inline scripts (code inside <script> elements)
    source = source.concat(internals.inlineScripts);

    // 2 - arrays of static attributes (3rd argument to elementOpen)
    source = source.concat(internals.staticAttrs);

    // 3 - incremental dom functions
    source = source.concat(internals.idomSrc);

    // 4 - arguments
    if (internals.params.length === 0){
        internals.params.push('ctx');
    }

    // create a function dynamically to make sure there are no basic errors
    var renderer = new Function(internals.params, source.join('\n'));
    if (outputSource === false) {
        return renderer;
    }

    // will return source code

    var rendererSrc = Utils.getFunctionSource(renderer, internals.deltaOptions.name);

    if (internals.deltaOptions.cjs === true){
        internals.deltaOptions.cjs = 'incremental-dom';
    }

    if (internals.deltaOptions.cjs){

        ///renderer = undefined;
        //const rendererSrcOriginal = rendererSrc;
        const lines = StringUtils.lines(rendererSrc);
        lines.forEach((line, i) => {

            ['elementOpen', 'elementClose', 'text', 'skip'].forEach((fn) => {

                if (StringUtils.startsWith(line, fn)){
                    lines[i] = lines[i].replace(fn, '__IDomLib__.' + fn);
                }                
            });
        });

        rendererSrc = `
var __IDomLib__ = require("${ internals.deltaOptions.cjs }")
module.exports = ${ lines.join('\n') }
        `;

    }

    return rendererSrc;

};


// call the correct handling method for the given node

internals.handleNode = function (node){

    internals.handlers[node.type](node);
};







// container object to store methods that will handle the different
// node types (should be 'tag', 'text', 'comment' or 'script')
internals.handlers = {};

internals.handlers.tag = function (node){

    // special attributes: key, skip
    const skipAttr = node.attribs['skip'];
    delete node.attribs['skip'];

    const keyAttr = node.attribs['key'];
    delete node.attribs['key'];

    if (skipAttr && Utils.hasContent(node)){
        throw new Error('an element with the "skip" attribute cannot have children');
    }


    // for more details see: http://google.github.io/incremental-dom/#api/elementOpen

    const elementOpen = {
        method: internals.deltaOptions.global + 'elementOpen',
        args: [null, null, null]
    };
    
    // 1) tagname (string)
    const tagname = node.name;
    elementOpen.args[0] = `"${ tagname}"`;

    // 2) key (string)
    if (keyAttr){

        const attrComponents = Utils.decompose(keyAttr, internals.deltaOptions.interpolate);
        elementOpen.args[1] = Utils.compose(attrComponents, internals.deltaOptions.trim);
    }

    // 3) other attributes and properties (except key)
    const staticAttrs = [];
    for (const attr in node.attribs){

        const attrComponents = Utils.decompose(node.attribs[attr], internals.deltaOptions.interpolate);

        console.log('\nattrComponents\n', attrComponents)

        const isDynamic = attrComponents.filter(component => component.type === 'code').length > 0;

        if (isDynamic){

            // 4) propertyValuePairs (vargs)
            elementOpen.args.push(`"${ attr }"`);
            elementOpen.args.push(Utils.compose(attrComponents, internals.deltaOptions.trim));
        }
        else {
            // non-dynamic attributes  should have just 1 plain text component
            // (this condition should never happpen)
            if(attrComponents.length !== 1){
                throw new Error('Attribute value has unexpected format');
            }

            staticAttrs.push(attr);
            staticAttrs.push(attrComponents[0].text);
        }
    }

    if (staticAttrs.length){

        // the static attributes will be in the upper scope
        const i = internals.staticAttrs.length;
        internals.staticAttrs.push(`var statics${ i } = ${ JSON.stringify(staticAttrs) }`);

        // 3) staticPropertyValuePairs (array, or in this case, a reference to an array)
        elementOpen.args[2] = 'statics' + i;
    }

    console.log("elementOpen.args: \n", elementOpen.args);
    let line = Utils.buildIDomCall(elementOpen);
    internals.idomSrc.push(line);
    
    if (skipAttr){

        var skip = {
            method: internals.deltaOptions.global + 'skip',
            args: []
        };
        line = Utils.buildIDomCall(skip);
        internals.idomSrc.push(line);
    }

    // if skipAttr is true, the node cannot have elements or text as children
    node.children.forEach(internals.handleNode);


    const elementClose = {
        method: internals.deltaOptions.global + 'elementClose',
        args: [JSON.stringify(tagname)]
    };
    line = Utils.buildIDomCall(elementClose);
    internals.idomSrc.push(line);
};


internals.handlers.text = function (node){

    if (node._isEmpty){
        return;
    }

    // TODO: two consecutive lines of text should be concatenated so that only 1 call 
    // to text() is done
    //const lines = Utils.compactLines(StringUtils.lines(node.data));

    const lines = StringUtils.lines(node.data);

    lines.forEach((line) => {

        if (line.trim() === '' && internals.deltaOptions.includeEmptyLines === false){
            return;
        }

        // case 1) line is mixed js code (loops): just copy it as is
        if (StringUtils.startsWith(line, ':')){

            // native .replace() affects only the first occurrence of ':', which is what we want
            line = line.replace(':', '');
            internals.idomSrc.push(line);
            return;
        }
        else{
            // TODO: check if the line starts with "{%""
        }

        // case 2) line is regular text with interpolation tokens (js expressions)
        const components = Utils.decompose(line, internals.deltaOptions.interpolate);
//console.log("xxx", Utils.compose(components, internals.deltaOptions.trim))
        const elementText = {
            method: internals.deltaOptions.global + 'text',
            args: [Utils.compose(components, internals.deltaOptions.trim)]
        };

        line = Utils.buildIDomCall(elementText);
        internals.idomSrc.push(line);
    });
};


internals.handlers.script = function (node){

    if (node.children.length !== 1){
        throw new Error('script nodes should have just one children');
    }

    const code = node.children[0].data.trim();
    if (!code){
        return;
    }

    // inline js code, just copy it as it is
    internals.inlineScripts.push('/*  begin inline script  */');
    internals.inlineScripts.push(code);
    internals.inlineScripts.push('/*  end inline script  */');
};


internals.handlers.comment = function (node){

    if (internals.deltaOptions.includeCommentsInJs){
        internals.idomSrc.push(`/*\n${ node.data.trim() }\n*/`);
    }
};

module.exports.compile()