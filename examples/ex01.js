var Fs = require('fs');
var Delta = require("../lib/");

/*
var inputTemplate = `
<div class="xxx { foo.bar ? 'yyy' : 'zzz' }" >abc</div>

var x = require("xyz")

{" abc "}
<text>abc</text>
if(condition){ 
    <div id="x">
        <text>hello world</text>
        if(x(somethingElse)){
            <ul><li>abc</li></ul>
        }
        else{
            <ol><li>xyz</li></ol>
        }
    </div>
} 
else{
    <span>olá mundo</span> 
}
`;

var inputTemplate = `
: var x = 1;
: if(ctx.condition){
    xyz
    <div class="xxx" >
        abc
    </div>    
: } 
: // comment
: else {
    zyx
    <span class="yyy">
        xyz
    </span>
: } 
`;
*/

/*
var inputTemplate = `
@param data

<!-- arbitrary javascript to be injected at the beggining of the template -->
<script>
  var _s = require("underscore.string");

  var helpers = {};

  helpers.add = function(a, b){
    return a+b;
  };

</script>


xyz
: collection.forEach(function(obj){

    <div>
:   if(condition){
        aaaaaaaaaaaaaaaaaa
        bbb
  

        <span class="xxx" >
 
 :           // store the spans text in a temporary variable...
:           var message = ctx.xyz && obj.abc ? "hello" : "goodbye";
            abc {{ message }}   pp

:           // or use logic directly inside the interpolation tokens (pure javascript)
            abc {{ ctx.xyz &&           obj.abc ? "hello" : "goodbye" }} {{ ctx.yyy }} ii 






        </span>    
        <div skip>
            <!-- we cannot have children here, but a comment is ok -->






        </div>
:   } 

    </div>    
: })

    <input type="text">


`;
*/


var inputTemplate = `
@param  data
@param data2 

a aaa
b bbb

<script>
  //TODO - correct thisx casex and it seems we can't have 
  var _s = require("underscore.string");

  var helpers = {};

  helpers.add = function(a, b){
    return a+b;
  };
</script>
<div style="color: blue;">
abc
:var a = 1;
  
<!-- a comment 


another line--> 


:var b = 2;
def
hello   {{ ctx.planetName }}
</div>


`;



/*
var inputTemplate = `

<!-- some useful comment -->

hello {{ world }}
<div>
  hello {{ firstName }}  {{ lastName }}
  another line
:  for(var i=0, l=ctx.posts.length; i<l; i++){
    <div key='ctx.posts[i].slug' id="my-id" data-something="{{ ctx.something }}  abc ">
      content: 
      {{ ctx.posts[i].content }}
      end
    </div>
:  }

: ctx.posts.forEach(function(post){
    <div key='post.slug'>
      content: 
      {{ post.content }}
      end
    </div>
: })

  <span class="xyz" skip></span>
</div>
`;
*/

var renderer = Delta.compile(inputTemplate);
console.log(renderer.toString())
Fs.writeFileSync(__dirname + "/ex01_output.js", renderer.toString());
