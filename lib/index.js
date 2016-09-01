'use strict';

const Htmlparser = require('htmlparser2');
const _ = require('underscore');
const Utils = require('./string-utilities');


const internals = {

    deltaOptions: {
        ignoreEmptyLines: true,
        reuseHtmlComments: true
    },

    // htmlparser options
    parserOptions: {
        //normalizeWhitespace: true,
        //xmlMode: false
        //decodeEntities: true,
        //lowerCaseTags
        //recognizeSelfClosing
    },

    depth: 0,

    args: [],
    source: [],
    inlineScript: [],

    boolAttribs: ['skip'],

    matcher: RegExp((/{{([\s\S]+?)}}/g || /(.)^/).source + '|$', 'g'),

    textNodesFound: false
};

// container object to store methods that will handle the different
// node types ('tag', 'text', 'comment' and 'script')
internals.handlers = {};

internals.handlers.tag = function(node){

    var skipAttr = node.attribs['skip'];
    delete node.attribs['skip'];

    // for more details see: http://google.github.io/incremental-dom/#api/elementOpen

    var elementOpen = {
        method: 'elementOpen',
        args: [null, null, null]
    }

    // 1) tagname (string)
    var tagname = node.name;
    elementOpen.args[0] = JSON.stringify(tagname);

    // 2) key (string)
    var key = node.attribs['key'];
    delete node.attribs['key'];
    if(key){
        elementOpen.args[1] = JSON.stringify(key)

        console.log("TO BE DONE: the key is usually an expression, so it should be given inside interpolation tokens, just like the other attributes")
    }


    // 3) staticPropertyValuePairs (array) - to be done


    // 4) propertyValuePairs (vargs)
    var i, value, valueTemp;
    for(var attr in node.attribs){

        i=0; value = node.attribs[attr]; valueTemp = '';
        value.replace(internals.matcher, function(match, interpolate, offset) {

            if(!match){ return }
            //console.log("match: $" + match + "$")
            //console.log("interpolate: $" + interpolate + "$")

            var hardcoded = value.slice(i, offset);

            // requires trim() ?
            if(hardcoded){
                valueTemp += `${ JSON.stringify(hardcoded) } + `;
            }
            valueTemp += `(${ interpolate.trim() }) +`;

            i = offset + match.length;
        });

        // if there are interpolation tokens, add the hardcoded contents in the tail (after the last
        // token)
        if(i > 0){
            var tail = value.slice(i);
            if(tail){
                valueTemp += `${ JSON.stringify(tail) }`;
            }
            else{
                // if no tail, remove the last '+ '
                valueTemp = valueTemp.slice(0, -2);
            }
        }
        else{
            valueTemp = `${ JSON.stringify(value) }`;
        }

        elementOpen.args.push(JSON.stringify(attr));
        elementOpen.args.push(valueTemp);
    }
    

    internals.writeIDomMethod(elementOpen);

    if(skipAttr){
        if(internals.hasContent(node)){
           throw new Error("an element with the skip attribute cannot have children");
        }

        var skip = {
            method: 'skip',
            args: []
        };
        internals.writeIDomMethod(skip);
    }


    // if skipAttr is true, we have checked above that node.children is empty
    node.children.forEach(internals.handleNode);

    var elementClose = {
        method: 'elementClose',
        args: [JSON.stringify(tagname)]
    }
    internals.writeIDomMethod(elementClose);
};




internals.writeIDomMethod = function (options){

    var line, args = options.args;

    line = `${ options.method }`;
    line += `(`;
    for(var i=0, l=args.length; i < l; i++){
        line += `${ args[i] }${ (i+1 < l) ? ', ' : '' }`;
    }
    line += `)`;
    //console.log("line2: " + line)
    internals.source.push(line)
};




internals.createRenderer = function (){

    internals.source.unshift('');
    internals.source.push('');

    if (internals.args.length === 0){
        internals.args.push('ctx');
    }

    if (internals.inlineScript.length){
        internals.inlineScript.unshift('', '/*  begin inline script  */');
        internals.inlineScript.push('/*  end inline script  */');
    }

    const source = internals.inlineScript.concat(internals.source);

    // console.log('---')
    // console.log(source.join('\n'))
    // console.log('---')

    return new Function(internals.args, source.join('\n'));
};



module.exports = {

    compile: function (input, deltaOptions, parserOptions){
        
        /*
        debugger;
        var line = 'xyz {{  }} qwe {{ def }}'
        var i = 0, lineTemp = '';
        line.replace(internals.matcher, function(match, interpolate, offset) {
            debugger;
            //console.log("match: $" + match + "$")
            //console.log("interpolate: $" + interpolate + "$")
            if(match===''){ return }

            //lineTemp += `'${ line.slice(i, offset) }' + (${ interpolate.trim() }) + `;
            lineTemp += "'" + line.slice(i, offset) + "' + (" + interpolate.trim() + ") + ";
            i = offset + match.length;
        });
        debugger;
*/

        internals.deltaOptions = _.extend({}, internals.deltaOptions, deltaOptions);
        internals.parserOptions = _.extend({}, internals.parserOptions, parserOptions);
        
        input = internals.preProcess(input);
        
        // dom is an array containing the top-level elements ("parent" property is null in those objects)
        const dom = Htmlparser.parseDOM(input, internals.parserOptions);

        internals.source = [];
        dom.forEach(internals.normalizeNode);
        dom.forEach(internals.handleNode);
        
        return internals.createRenderer();
    },

    preCompile: function (input, deltaOptions, parserOptions){

        const source = module.exports
                        .compile(input, deltaOptions, parserOptions)
                        .toString()
                        .trim()
                        .split('\n');

        if (source[1] === '/**/) {'){
            source[0] = source[0] + ') {\n';
            source.splice(1, 1);
        }

        for (let i = 0; i < source.length; i++){
            if (source[i].trim() === ''){
                source[i] = undefined;
            }
        }

        return _.compact(source).join('\n');
    }
};


// make any necessary preliminary adjustments to the input string

internals.preProcess = function (input){

    const a = input.trim().split('\n');

    // for input lines that are mixed js code, make sure occurrences of '<' or '>'
    // have a surrounding space, so that the Htmlparser won't confuse with an html element

    for (let i = 0; i < a.length; ++i){
        if (Utils.startsWith(a[i].trim(), ':')){
            a[i] = a[i].replace(/</g, ' < ');
            a[i] = a[i].replace(/>/g, ' > ');
        }
    }

    return a.join('\n');
};


// normalize and augment the properties for the different node types

internals.normalizeNode = function (node){

    // make sure all node types have the attribs object and children array;
    node.attribs = node.attribs || {};
    node.children = node.children || [];

    node.depth = internals.depth;

    // boolean attributes should actually have a boolean value;
    // example: for "<div skip></div>"" we should  have
    // node.attribs.skip === true (instead of node.attribs.skip === "")
    for (const key in node.attribs){
        if (internals.isBoolAttrib(key) && node.attribs[key].trim() === ''){
            node.attribs[key] = true;
        }
    }

    // issues specific to text nodes
    if (node.type === 'text'){

        // if there's no text content, add a boolean flag signaling it
        // (by "content" we mean anything other than white space)
        node.empty = node.data.trim() === '' ? true : false;

        // if this is the first text node, it have parameter declarations
        if (node.depth === 0 && !internals.textNodesFound){
            internals.handleArgs(node);
        }

        internals.textNodesFound = true;
    }

    // recursive call for the children of this node
    if (node.children.length){
        internals.depth++;
        node.children.forEach(internals.normalizeNode);
        internals.depth--;
    }

};


// call the correct handling method for the given node

internals.handleNode = function (node){

    internals.handlers[node.type](node);
};


internals.isBoolAttrib = function (attrib){

    return _.includes(internals.boolAttribs, attrib);
};


internals.handleArgs = function (node){

    const lines = Utils.lines(node.data.trim()).map(Utils.clean);

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

    // for this text element, delete the contents relative to the arguments declaration
    // (and also the new line character which marks the end of the declaration)
    node.data = lines.slice(i + 1).join('\n');
};

internals.hasContent = function (node){

    const n = _.where(node.children, { type: 'tag' }).length;
    const m = _.where(node.children, { type: 'text', empty: false }).length;

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


internals.handlers.text = function (node){

    if (node.empty){
        return;
    }

    // TODO: 2 consecutive lines of text should be concatenated (make only 1 call to text())
    //const lines = internals.compactLines(Utils.lines(node.data));
    const lines = Utils.lines(node.data);

    lines.forEach(function (line){

        if (line.trim() === '' && internals.deltaOptions.ignoreEmptyLines){
            return;
        }

        // line is mixed code: just copy it as is
        if (Utils.startsWith(line, ':')){

            // the native .replace() will only affect the first occurrence of ':'
            // (which is what we want)
            internals.source.push(line.replace(':', ''));
            return;

            // console.log("---")
            // console.log("line: $" + line + "$")
            // console.log("---")

        }

        // line is text: handle any eventual interpolation tokens (variables)

        let i = 0, lineTemp = '';
        line.replace(internals.matcher, function (match, interpolate, offset) {

            if (!match){
                return;
            }
            //console.log("match: $" + match + "$")
            //console.log("interpolate: $" + interpolate + "$")

            lineTemp += `'${ line.slice(i, offset) }' + (${ interpolate.trim() }) + `;
            i = offset + match.length;
        });

        // if the line doesn't have interpolation tokens, just copy it as is
        if (i === 0){
            lineTemp = `'${ line }'`;
        }
        // otherwise, we must take care of the tail
        else {
            const tail = line.slice(i);

            if (tail){
                // if there is tail, append it
                lineTemp += `'${ tail }'`;
            }
            else {
                // otherwise, remove the '+ ' at the end
                lineTemp = lineTemp.slice(0, -2);
            }

            // console.log("---")
            // console.log("line: $" + line + "$")
            // console.log("lineTemp: $" + lineTemp + "$")
            // console.log("tail: $" + tail + "$")
            // console.log("---")
        }

        internals.source.push(`text(${ lineTemp })`);
    });
};


internals.handlers.script = function (node){

    if (node.children.length !== 1){
        throw new Error('script nodes should have just one children (?)');
    }

    // inline js code: just copy it as is
    internals.inlineScript.push(node.children[0].data.trim());
};


internals.handlers.comment = function (node){

    if (internals.deltaOptions.reuseHtmlComments){
        internals.source.push(`\n/*\n${ node.data }\n*/\n`);
    }
};

