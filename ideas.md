-arbitrary js statements can be inserted in 2 ways:
    -1) using a line prefix. Example: ".  var i = 0; i++;" (the whole line must consist in the prefix followed by the statement)
    -2) using interpolation tokens: {% var i = 0; i++; %}
    -note: using tokens we could have: <code> var i = 0; i++; </code>


TODO: 
1) if we have both statementStart and statementEnd, in the preprocessing just replace all ocurrences of those tags with "<code>" and "</code>". The DOM parser will then create a "code" tag in the tree.
2) if we have just statementStart, in the preprocessing find all lines that start with that tag (after trim?), replace it the <code> and append </code> in the end of the line


-since the html tags and text will be cnverted into js calls, we can also insert arbitrary js code inside the html; that code will simply be copied as is into the renderer function. 
This can be done in 2 ways
-using a marker at the begginig of the string (which can be a unicode character, like a bullet)
-using regular tokens (like the classic string template libraries, underscore)

-handle cases of nested tokens  {{ xyz {{ abb }} }}   {% for {% something %} %}

-include comments: would make sense to have the comments in the dom, instead of as js comments in the template
there's an issue in github about this


-documentation: http://coffeescript.org/


-is we have static properties, we should return a function with an outer source
```js
function(ctx){
    // here we create a new statics array everytime the function is executed 
    // this is not what we want
    var statics = [...]

    (function(){
        IDom.elementOpen(...)
    })()
}
```

```js
(function(ctx){
    
    var statics = [...]

    return function(ctx){
        IDom.elementOpen(...)
    }
})()
```



var s = `
console.log(x);
console.log(Date.now());
`

var s2 = `
var statics = ['ooo']
return function(){
  console.log(statics[0]);
  console.log(Date.now());    
}
`

-placing the statics array in the scope
    -in cjs mode: there's no need, just export the function; the statics will be private to the module
    -in non-cjs mode: if there is no 

-delta-precompile: similar to nunjucks-precompile
    -give a directory with delta templates (in separate files)
    -read the file contents
    -create an object where the key is the path of the file, the value is the renderer function (Delta.compile(..., {source: true}))
    -export using UMD (will create a global object if webpack is not used)
    -we can then load this UMD module in webpack (so it will be all part of 1 application bundle, as before)
-we can also call Delta.compile everytime the application is loaded (Delta.compile(..., {source: false}))
-webpack loader: later
...
template: require('!delta./abc/xyz.html')

this would load the contents of the file, call delta precompile and return the function


-test "includeEmptyLines", "trimText"

-test: empty attribute


-use the options to domparser to define other tokens (instead of "< !--", for comments, etc )

-using nunjucks with delta? we would use the template inheritance, blocks, includes, imports, etc to reuse helper functions or common html. We would have to change the escape characters from {{ ... }} to something else, so that it wouldn't clash

-add the functionality for the 2nd argument to text (formatters)


-definition: "parameters section": the first section of text in the template (after any eventual comments)
examples: ...
if the first line in the parameters section doesn't start with '@param', it will be considered regular text contents


more tests
-flexible parsing of elements (div without ending)
-th option for the character that signals mixed js code (for loops) should be configurable



-analogy with traditional text-based template systems
```js
var el = document.getElementBy('foo')
var renderer = Handlerbars.compile(`<div>hello {{ name }}</div>`);
$(el).html(renderer({ name: "paulo "}))

// calling renderer will return the html string with the given data interpolated;
// calling jquery's html will update the inner html of el
```

```js
var el = document.getElementBy('foo')
var renderer = Delta.compile(`<div>hello {{ name }}</div>`);
IncrementalDOM.patch(el, renderer, { name: "paulo"})

// here we don't call the renderer; instead we pass it to IDom's patch function, will will execute it to update the inner html of el
```

-name: incremental-dom-delta

-set default options (options that don't change after multiple calls to Delta.compile)


Template.configure({
    // reference to the incremental dom library
    idom: require("incremental-dom")
})


sweet spot between using the raw js api to create the render function, and using abstractions for adding logic to a new template language (loops, conditionals, etc - might as well use pure js)

delta 


var input = `
<div class={{ status }}>
    hello {{ name }}
</div>


var context = {
    status: "active",
    name: "paulo"
}

with a string based template engine it is usually a 3-step procedure

```js
// 1) compile the input template (written with Handlebars syntax) into a template function:
var t = handlebars.compile(input);

// 2) call the template with some context object to get the output string (the final html string)
var s = t(context)

// 3) update the DOM; the whole innerHtml of the #xyz element will be replaced, even if we are just changing a little part of it;
$("#xyz").html(s);
```

using incremental dom it is a 2-step procedure
```js
// 1) compile the input template (written with Delta syntax) into an idom renderer function
var renderer = delta.compile(input);

// 2) update the DOM using idom's patch function
IncrementalDOM.patch($("#xyz")[0], renderer, context)
```

The fundamental advantage using IncrementalDOM is that it will only change the elements that actually have to be changed

--


send the output to the process.stdout.write stream instead of console.log everything

when there are errors, try to give the line number in the template

remove dependencias (extract methods from underscore string and underscore)

-document: what if we want to ouput the text ":" ?

delta options:
    -escape html
    -user define the delemiters of the regexp
    -name of the function produced 
    -define the symbol that indicates js code (default is ":")


- when used as module:
    + input is given as a string
    + output is given as a string (the definition of the function) or as a function (the function itself, created with "new Function(arg1, ... argN, source);" )
    + 
-can be used as a stand-alone command-line utility or as a module
    -as a command line utility: 
        input is given either by a command-line argument (path to the file with the input); if not given, stdin is used
        output is similar: if the command line argument with the output file is not given, send the output to stdout; 
    -as a module:
        input is given as a string passed as the 1st argument to Delta.compile
        output is a string returned from Delta.compile (equivalent to stdout); if the options object has the "output" key, then it will save to a file

        if input is null and the options object has the "input" key, it will read from file

example usage:


var input = "...";

```js
var renderer = Delta.compile(input)
// returns the renderer function
// if we want the source code, call renderer.toString()
```




-the special sttributes should be options:
skip
key


---

170810

The usage of arbitrary js code inside the html could be done in 3 ways, depending on the option jsDelimiter

3) jsDelimiter is an empty string

this is minimal approach:
the convention is that any line that doesn't start with an empty space or tab is javacsript code.

Exemplo:

    <ul>
for(var i = 0; i < 10; i++){
        <li>
            {{ ctx.users[i].name }}
        </li>
}
    </ul>


this means that all html will necessarily have to idented.


1) jsDelimiter is a regexp

this is the familiar way, works like in underscore templates

<ul>
{%  for(var i = 0; i < 10; i++){  %}
    <li>
            {{ ctx.users[i].name }}
    </li>
{%  }  %}
</ul>

compiles to:



2) jsDelimiter is a string

Make the code cleaner. Works well if the string is a character that easily gets the attention. Example


<ul>
⨁ for(var i = 0; i < 10; i++){
    <li>
            {{ ctx.users[i].name }}
    </li
⨁ }
</ul>

 
⇒
⇝
⇨
⇾

↦
→
⨁
✋
☞ 

---

170810

the module just returns the renderer function (as a string or as a function). The integration with the toolchain uses this output in a simple way (in webpack we can write a loader that)