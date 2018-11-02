## delta

Delta - template engine for incremental dom

### Introduction 

This library compiles plain old html strings into the corresponding [incremental dom](http://google.github.io/incremental-dom/) renderer function (to used with the [patch](http://google.github.io/incremental-dom/#api/patch) method). 

Here is the Hello World example:

```js
const html = `
<div style="color: {{ ctx.color }}">
  hello {{ ctx.name }}
</div>
`;

const renderer = Delta.compile(html);
```

The output from `Delta.compile` is the renderer function to be given to `IncrementalDOM.patch`:
```js
const renderer = Delta.compile(html);

const el = document.getElementsByTagName("body");
const context = { name: "earth", color: "blue"  };

IncrementalDOM.patch(el, renderer, context);  // change the DOM
```

We can also obtain the `renderer` source with the option `{ source: true }`:
```js
var rendererSrc = Delta.compile(html, { source: true });
```

In this case `rendererSrc` is the following string:
```js
function anonymous(ctx) {

  elementOpen('div', null, null, 'style', 'color: ' + (ctx.color))
  text('  hello ' + (ctx.name) )
  elementClose('div')
}
```


### API

The library exports an object with a single method: `compile`.
```
Delta.compile(input, [options], [parserOptions])
```
where:
- `input`: an html string using the Delta template syntax (see below)
- `options`: object with options for Delta
- `parserOptions`: object with options for the [htmlparser2](https://github.com/fb55/htmlparser2) options

The method returns either the "compiled template" (that is, the renderer function to be used with the `patch` function) or the respective source code (if the option `source` is true).

### Options

- `source`: if true, returns the source code (string) of the renderer instead of the renderer itself. Use this option for template pre-compilation. Default: true.
- `name`: name of the renderer function (useful for debugging purposes). Only has effect when retrieving the source.
- `skipAttribute`: name of the attribute used to signal 


### Parser options


### examples





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


