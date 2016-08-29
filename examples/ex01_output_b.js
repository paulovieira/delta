function anonymous(ctx
/**/) {

text('\n\nhello ' + (world) + '\n')
elementOpen('div', null, null)
text('\n  hello ' + (firstName) + '  ' + (lastName) + '\n  another line')
  for(var i=0, l=ctx.posts.length; i < l; i++){
elementOpen('div', ctx.posts[i].slug, null, 'id', 'my-id', 'data-something', (ctx.something) + '   x')
text('\n      content: \n      ' + (ctx.posts[i].content) + '\n      end\n    ')
elementClose('div')
  }
 ctx.posts.forEach(function(post){
elementOpen('div', post.slug, null)
text('\n      content: \n      ' + (post.content) + '\n      end\n    ')
elementClose('div')
 })
text('\n  ')
elementOpen('span', null, null, 'class', 'xyz')
skip()
elementClose('span')
elementClose('div')

}