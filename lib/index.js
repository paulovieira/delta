'use strict';

const Htmlparser = require('htmlparser2');
const _ = require('underscore');
const Utils = require('./string-utilities');


const internals = {

    defaults: {

        deltaOptions: {
            trimText: false,
            includeEmptyLines: false,
            includeComments: true,
            name: '',  // name for renderer function (only used if source is true)
            source: false,  // output will be a string with the source of the renderer 
            interpolate : /{{([\s\S]+?)}}|$/g,

            global: 'IncrementalDOM', // global object (namespace) where the idom functions are can be found
            cjs: false  // the renderer will be the exported value of a common js module; either false (default value), true (will include "require('incremental-dom')" at the top) or a string (will include "require(...)" at the top, where  the string is the explicit path for require); must be used with source: true

        },

        // htmlparser options
        parserOptions: {
            //normalizeWhitespace: true,
            //xmlMode: false
            //decodeEntities: true,
            //lowerCaseTags
            //recognizeSelfClosing
        }
    },

    // private options
    depth: 0,
    args: [],
    source: [],
    inlineScript: [],
    nodeCount: {},
    boolAttribs: ['skip'],
    staticAttrs: []

};


module.exports = {

    compile: function (input, deltaOptions, parserOptions){

        internals.deltaOptions = _.extend({}, internals.defaults.deltaOptions, deltaOptions);
        internals.parserOptions = _.extend({}, internals.defaults.parserOptions, parserOptions);

        // the 'cjs' option must be used with 'source': true
        if (internals.deltaOptions.cjs){
            if (!internals.deltaOptions.source){
                throw new Error('The option "cjs" requires the option "source": true');    
            }

            internals.deltaOptions.global = '';
        }

        // the 'global' option can be disabled with false, undefined, or a simple empty string
        if (!internals.deltaOptions.global){
            internals.deltaOptions.global = '';
        }
        else {
            internals.deltaOptions.global += '.';
        }

        internals.resetInternals();
        input = internals.preProcess(input);
        
        // dom is an array containing the top-level elements 
        // (the 'parent' property is null in those objects)
        const dom = Htmlparser.parseDOM(input, internals.parserOptions);

        dom.forEach(internals.normalizeNode);
        dom.forEach(internals.handleNode);
        
        internals.createRenderer();
        return internals.deltaOptions.source ? internals.rendererSrc : internals.renderer;
    }

};


// make any necessary preliminary adjustments to the input template string

internals.preProcess = function (input){

    const inputLines = Utils.lines(input.trim());

    // for input lines that are mixed js code (loops), make sure occurrences of '<' or '>'
    // have a surrounding space, so that the Htmlparser won't consider it an html element

    for (let i = 0; i < inputLines.length; ++i){
        if (Utils.startsWith(inputLines[i].trim(), ':')){
            inputLines[i] = inputLines[i].replace(/</g, ' < ');
            inputLines[i] = inputLines[i].replace(/>/g, ' > ');
        }
    }

    return inputLines.join('\n');
};


// normalize and augment the properties for the different node types

internals.normalizeNode = function (node){

    // make sure all node types have the attribs object and children array;
    node.attribs = node.attribs || {};
    node.children = node.children || [];

    node.depth = internals.depth;

    // boolean attributes should actually have a boolean value;
    // example: <div skip></div> should  have node.attribs.skip === true
    // (instead of node.attribs.skip === '')
    for (const key in node.attribs){
        if (internals.isBoolAttrib(key) && node.attribs[key].trim() === ''){
            node.attribs[key] = true;
        }
    }

    // number of nodes per type
    if (internals.nodeCount[node.type] === undefined){
        internals.nodeCount[node.type] = 0;
    }

    // issues specific to text nodes
    if (node.type === 'text'){

        // if there's no text content, add a boolean flag signaling it
        // (by 'content' we mean anything other than white space)
        node.isEmpty = node.data.trim() === '' ? true : false;

        // if this is the first text node, it might have parameter declarations
        if (node.depth === 0){
            internals.handleArgs(node);
        }
    }


    internals.nodeCount[node.type]++;

    // recursive call - normalize the child nodes of this node
    if (node.children.length){
        internals.depth++;
        node.children.forEach(internals.normalizeNode);
        internals.depth--;
    }

};

internals.resetInternals = function (){

    // internal (private) state - changed everytime 'compile' is called
    internals.depth = 0;
    internals.args = [];
    internals.source = [];
    internals.inlineScript = [];
    internals.nodeCount = {};
};

internals.createRenderer = function (){

    let source = [];
    source.push('"use strict"');

    // 1 - inline scripts (code inside <script> elements)
    source = source.concat(internals.inlineScript);

    // 2 - arrays of static attributes (3rd argument to elementOpen)
    source = source.concat(internals.staticAttrs);

    // 3 - incremental dom functions
    source = source.concat(internals.source);

    // 4 - arguments
    if (internals.args.length === 0){
        internals.args.push('ctx');
    }

    internals.renderer = new Function(internals.args, source.join('\n'));
    internals.rendererSrc = internals.getCompiledSource(internals.renderer);

    if (internals.deltaOptions.cjs === true){
        internals.deltaOptions.cjs = 'incremental-dom';
    }

    if (internals.deltaOptions.cjs){

        internals.renderer = undefined;
        //const rendererSrcOriginal = internals.rendererSrc;
        const lines = Utils.lines(internals.rendererSrc);
        lines.forEach((line, i) => {

            ['elementOpen', 'elementClose', 'text', 'skip'].forEach((fn) => {

                if (Utils.startsWith(line, fn)){
                    lines[i] = lines[i].replace(fn, '__IDomLib__.' + fn);
                }                
            });
        });

        internals.rendererSrc = `
var __IDomLib__ = require("${ internals.deltaOptions.cjs }")
module.exports = ${ lines.join('\n') }
        `;

    }

};

internals.getCompiledSource = function (renderer){

    const source = renderer
                    .toString()
                    .trim()
                    .split('\n');

    // clean source
    if (source[1] === '/**/) {'){
        source[0] = source[0] + ') {\n';
        source.splice(1, 1);
    }

    internals.deltaOptions.name = internals.deltaOptions.name || '';
    source[0] = source[0].replace('anonymous', internals.deltaOptions.name);

///
/*
    for (let i = 0; i < source.length; i++){
        if (source[i].trim() === ''){
            source[i] = undefined;
        }
    }
*/

    return _.compact(source).join('\n');
};


// call the correct handling method for the given node

internals.handleNode = function (node){

    internals.handlers[node.type](node);
};


internals.isBoolAttrib = function (attrib){

    return _.includes(internals.boolAttribs, attrib);
};


internals.handleArgs = function (node){

    // to be considered as arguments, this text node must come before anything else
    // (except optional comments element)
    if (internals.nodeCount['text'] > 0 ||
        internals.nodeCount['tag'] > 0 ||
        internals.nodeCount['script'] > 0){
        return;
    }

    const lines = Utils.lines(node.data.trim()).map(Utils.clean);
///console.log("lines: ", lines)
    // the line with '@param' must come first, before any other contents
    // in this text element
    if (lines[0].indexOf('@param') === -1){
        return;
    }

    // find the index of the first blank line (marking the end of the parameter declaration)
    let i = 0;
    for (; i < lines.length; ++i){
        if (lines[i] === ''){
            break;
        }
    }

    // make sure all elements in the array before this index have the expected format
    let j = 0;
    for (; j < i; ++j){
        const words = lines[j].split(' ');

        if (words[0] !== '@param' || words.length !== 2){
            throw new Error('Arguments should be declared in the form: "@param argName"');
        }

        const argName = words[1];
        if (_.includes(internals.args, argName)){
            throw new Error('Argument names cannot be repeated');
        }

        internals.args.push(argName);
    }

    // for this text element, delete the lines relative to the arguments declaration
    // (and also the new line character which marks the end of the declaration)
    // we might have some plain text after the arguments
    node.data = lines.slice(i + 1).join('\n');

};

internals.hasContent = function (node){

    const n = _.where(node.children, { type: 'tag' }).length;
    const m = _.where(node.children, { type: 'text', isEmpty: false }).length;

    return !!(n + m);
};


internals.compactLines = function (lines){

    // auxiliary array with flags indicating if the line with the respective
    // index (in the lines array) is text (true) or mixed js code (false)
    const isText = [];

    for (let i = 0; i < lines.length; ++i){
        isText.push(Utils.startsWith(lines[i], ':') ? false : true);
        
        // if (Utils.startsWith(lines[i], ':')){
        //     isText.push(false);
        // }
        // else {
        //     isText.push(true);
        // }
    }

    // two consecutive lines of text should be concatenated and placed
    // in just one element in the array
    for (let i = 0; i < lines.length - 1; ++i){
        if (isText[i] && isText[i + 1]){
            lines[i + 1] = `${ lines[i] } \\n ${ lines[i + 1] }`;
            // lines[i + 1] = `${ lines[i] }`;
            // lines[i + 1] += '\n';
            // lines[i + 1] += `${ lines[i + 1] }`;
            lines[i] = undefined;
        }
    }

    // return a new array with undefined entried removed
    return _.compact(lines);
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

    if (skipAttr && internals.hasContent(node)){
        throw new Error('an element with the "skip" attribute cannot have children');
    }


    // for more details see: http://google.github.io/incremental-dom/#api/elementOpen

    const elementOpen = {
        method: internals.deltaOptions.global + 'elementOpen',
        args: [null, null, null]
    };
    
    // 1) tagname (string)
    const tagname = node.name;
    elementOpen.args[0] = JSON.stringify(tagname);

    // 2) key (string)
    if (keyAttr){

        const attrComponents = internals.decompose(keyAttr);
        elementOpen.args[1] = internals.compose(attrComponents);
    }

    // 3) other attributes and properties (except key)
    const staticAttrs = [];
    for (const attr in node.attribs){

        const attrComponents = internals.decompose(node.attribs[attr]);
        console.log('\nattrComponents\n', attrComponents)

        const isDynamic = !!attrComponents
                            .filter((component) => component.type === 'code')
                            .length;

        if (isDynamic){

            // 4) propertyValuePairs (vargs)
            elementOpen.args.push(JSON.stringify(attr));
            elementOpen.args.push(internals.compose(attrComponents));
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
        const i = internals.staticAttrs.length;
        internals.staticAttrs.push(`var statics${ i } = ${ JSON.stringify(staticAttrs) }`);

        // 3) staticPropertyValuePairs (array, or in this case, a reference to an array)
        elementOpen.args[2] = 'statics' + i;
    }

    console.log("elementOpen.args: \n", elementOpen.args);
    let line = internals.buildIDomCall(elementOpen);
    internals.source.push(line);
    
    if (skipAttr){

        var skip = {
            method: internals.deltaOptions.global + 'skip',
            args: []
        };
        line = internals.buildIDomCall(skip);
        internals.source.push(line);
    }

    // if skipAttr is true, the node cannot have elements or text as children
    node.children.forEach(internals.handleNode);


    const elementClose = {
        method: internals.deltaOptions.global + 'elementClose',
        args: [JSON.stringify(tagname)]
    };
    line = internals.buildIDomCall(elementClose);
    internals.source.push(line);
};


internals.handlers.text = function (node){

    if (node.isEmpty){
        return;
    }

    // TODO: two consecutive lines of text should be concatenated so that only 1 call 
    // to text() is done
    //const lines = internals.compactLines(Utils.lines(node.data));

    const lines = Utils.lines(node.data);

    lines.forEach((line) => {

        if (line.trim() === '' && internals.deltaOptions.includeEmptyLines === false){
            return;
        }

        // case 1) line is mixed js code (loops): just copy it as is
        if (Utils.startsWith(line, ':')){

            // native .replace() affects only the first occurrence of ':', which is what we want
            line = Utils.clean(line.replace(':', ''));
            internals.source.push(line);
            return;
        }

        // case 2) line is regular text with interpolation tokens (js expressions)
        const components = internals.decompose(line);
        //console.log('\ncomponents\n', components)

        const elementText = {
            method: internals.deltaOptions.global + 'text',
            args: [internals.compose(components)]
        };

        line = internals.buildIDomCall(elementText);
        internals.source.push(line);
    });
};

internals.decompose = function (line){

    let i = 0;
    let components = [];

    line.replace(internals.deltaOptions.interpolate, (match, interpolate, offset) => {

        // the callback will be executed even if interpolate was not matched
        // ('match' will be undefined and offset will be the length of line)
        if (!match){
            return;
        }

        components.push({ type: 'plain', text: line.slice(i, offset) });
        components.push({ type: 'code', text: interpolate });

        i = offset + match.length;
    });

    // add the tail of the line (or the complete line if there is no match for interpole)
    components.push({ type: 'plain', text: line.slice(i) });

    // remove the components whose text is empty (doesn't make sense 
    // to make a call to idom like: text("something" + (x) + "" + (y)) )
    components = components.filter((component) => component.text.length > 0);

    // make sure we have at least one empty component 
    if (components.length === 0){
        components.push({ type: 'plain', text: '' });
    }

    return components;
};

internals.compose = function (components){

    let line = '';
    const encloseInQuotes = true;  // to be removed later?

    components.forEach((component, i) => {

        let text = component.text;
        if (component.type === 'plain'){
            if (internals.deltaOptions.trimText){
                text = text.trim() + ' ';
            }
            line += encloseInQuotes ? `${ JSON.stringify(text) } + ` : `${ text } + `;
        }
        else if (component.type === 'code') {
            line += `(${ text.trim() }) + `;
        }
    });

    // string coercion
    if (Utils.startsWith(line, '(')){
        line = `"" + ${ line }`;
    }

    // remove the extra '+ ' at the end
    return line.slice(0, -2).trim();
};

internals.handlers.script = function (node){

    if (node.children.length !== 1){
        throw new Error('script nodes should have just one children (?)');
    }

    // inline js code, just copy it as it is
    internals.inlineScript.push('/*  begin inline script  */');
    internals.inlineScript.push(node.children[0].data.trim());
    internals.inlineScript.push('/*  end inline script  */');
};


internals.handlers.comment = function (node){

    if (internals.deltaOptions.includeComments){
        internals.source.push(`/*\n${ node.data.trim() }\n*/`);
    }
};

internals.buildIDomCall = function (obj){

    let line = `${ obj.method }(`;

    // handle the common cases of an element without key and static attributes
    // (or with key but without statics)
    if (obj.args.length === 3){
        if (obj.args[1] === null && obj.args[2] === null){
            obj.args.pop();
            obj.args.pop();
        }
        else if (obj.args[2] === null){
            obj.args.pop();
        }
    }

    if (obj.args.length === 0){
        line += ')';
    }
    else{
        let i = 0;
        for (; i < obj.args.length - 1; ++i){
            line += `${ obj.args[i] }, `;
        }
        line += `${ obj.args[i] })`;        
    }

    return line;
};
