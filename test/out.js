function anonymous(ctx
/**/) {

elementOpen("div", null, null)
text('\n    hello world!\n    ')
elementOpen("span", null, null)
text('i should remain untouched!')
elementClose("span")
elementClose("div")

}