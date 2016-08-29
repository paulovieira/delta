## delta

Delta - template engine for incremental dom

### Introduction 

This library compiles plain old html strings into the corresponding (incremental dom)[http://google.github.io/incremental-dom/] renderer function (to used with the (patch)[http://google.github.io/incremental-dom/#api/patch] function). 

Here is the hello world example:

```js
var html = `
<div style="color: {{ ctx.color }}">
  hello {{ ctx.name }}
</div>
`;

var el = document.getElementByTagName("body");
var renderer = Delta.compile(html);
var context = { name: "earth", color: "blue"  };

IncrementalDOM.patch(el, renderer, context);
```

The `renderer` function returned by `Delta.compile`...



### API

The library exports only a single method: `compile`. 

Delta.compile(input, [options])

input: an html string using the Delta template syntax (see below)
options: ...

The method returns either the "compiled template" (that is, the renderer function to be used with the patch function), or the respective source code (if the option `source` is true).

### compile options

### examples



## options for the compile method

source: if true, returns the function source code (string) instead of the function object. Use this option if you're pre-compiling directly the templates. 

Example:

```js

var input = `
<div style="color: {{ color }}">
  hello {{ name }}
</div>
`

var rendererSrc = Delta.compile(input, { source: true})
```

`rendererSrc` is a string with the following contents: 
```
(function () {

  return function (ctx) {

    var internals = {};
    elementOpen('div')
    text()
    elementClose('div')
  
  };
})()

```

## arguments of the renderer functions

By default the renderer function takes one argument, named `ctx` (which should be an object). This can be changed by adding one or more `@param` directives in the first line of the template.

Example without @param:

```html
<div>
  hello world 
</div>
```

```js
function anonymous(ctx
/**/) {

  elementOpen('div')
  text('\n  hello world \n')
  elementClose('div')
}
```


Example with @param:

```html
<div>
  hello world 
</div>
```

```js
function anonymous(ctx
/**/) {

  elementOpen('div')
  text('\n  hello world \n')
  elementClose('div')
}
```


```html
@param firstName
@param lastName

<div>
  hello {{ firstName }}  {{ lastName }}
</div>
```

```js
function anonymous(firstName,lastName
/**/) {
elementOpen('div')
text('\n  hello ' + (firstName) + '  ' + (lastName) + '\n')
elementClose('div')

}
```

### Arguments

default argument: ctx

custom argumen names

must be declared at the beggining of the file
one per line with the format "@param argName"
terminate the declaration of arguments with a blank line

example

```html
@param arg1
@param arg2

hello {{ world }}
```

It's ok to have comments or a script before the argments
```html
<!-- some useful comments here -->
@param arg1
@param arg2

hello {{ world }}
```


