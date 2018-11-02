'use strict';

const _ = require('underscore');
const StringUtils = require('./string-utils');

const internals = {};

internals.boolAttribs = ['skip'];

internals.validIdentifier = /^(?!(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$)[$A-Z\_a-z]*$/;

module.exports.decompose = function(text, interpolationRegEx){

    let i = 0;
    let components = [];

    text.replace(interpolationRegEx, (match, interpolate, offset) => {

        // the callback will be executed even if interpolationRegEx was not matched
        // ('match' will be undefined and offset will be the length of the text)
        if (!match){
            return;
        }

        components.push({ type: 'plain', text: text.slice(i, offset) });
        components.push({ type: 'code', text: interpolate });

        i = offset + match.length;
    });

    // add the tail of the text (or the complete text if there is no match for interpolate)
    components.push({ type: 'plain', text: text.slice(i) });

    // remove the components whose text is empty (doesn't make sense 
    // to make a call to idom like: text("something" + (x) + "" + (y)) )
    components = components.filter(component => component.text.length > 0);

    // make sure we have at least one empty component 
    if (components.length === 0){
        components.push({ type: 'plain', text: '' });
    }

    return components;
};

module.exports.compose = function(components, shouldTrim){

    let line = '';
    const encloseInQuotes = true;  // to be removed later?

    components.forEach((component, i) => {

        let text = component.text;
        let type = component.type;

        if (type === 'plain'){
            if (shouldTrim){
                //text = text.trim() + ' ';
                text = text.trim();
            }

            if (encloseInQuotes){
                text = `"${ text }"`;
            }
            ///line += `${ encloseInQuotes ? JSON.stringify(text) : text }`;
            ///line += text;
        }
        else if (type === 'code') {
            text = `(${ text.trim() })`;
        }

        line += text + ' + ';
    });

    // add string coercion to the start of the line
    // TODO: this wouldn't work if we had encloseInQuotes false
    if (StringUtils.startsWith(line, '(')) {
        line = `"" + ${ line }`;
    }

    // final cleaning: remove the extra '+ ', trim
    return line.slice(0, -2).trim();
};


// get function source (cleaned)

module.exports.getFunctionSource = function(fn, fnName){

    const source = fn.toString()
                    .trim()
                    .split('\n');

    /*
    in nodejs / v8, the output from the toString() call above will be something like
    
        --- begin ---

        function (ctx
        / *``* /) {
            <actual code here>
        }

        --- end ---

    */

    if (StringUtils.startsWith(source[1], '/*')) {
        source[1] = undefined;
        source[0] = source[0] + ') {\n';
    }

    fnName = fnName || '';
    source[0] = source[0].replace('anonymous', fnName);

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

module.exports.isBoolAttrib = function(attrib){

    return _.includes(internals.boolAttribs, attrib);
};

module.exports.hasContent = function(node){

    const n = _.where(node.children, { type: 'tag' }).length;
    const m = _.where(node.children, { type: 'text', isEmpty: false }).length;

    return !!(n + m);
};

module.exports.compactLines = function(lines){

    // auxiliary array with flags indicating if the line with the respective
    // index (in the lines array) is text (true) or mixed js code (false)
    const isText = [];

    for (let i = 0; i < lines.length; ++i){
        isText.push(StringUtils.startsWith(lines[i], ':') ? false : true);
        
        // if (StringUtils.startsWith(lines[i], ':')){
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

module.exports.buildIDomCall = function(obj){

    let line = `${ obj.method }(`;

    if (obj.args.length === 0){
        line += ')';

        return line;
    }

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

    let i = 0;
    for (; i < obj.args.length - 1; ++i){
        line += `${ obj.args[i] }, `;
    }
    line += `${ obj.args[i] })`;        

    return line;
};

module.exports.isValidIdentifier = function(s) {

    return internals.validIdentifier.test(s);
};

