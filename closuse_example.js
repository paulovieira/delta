function foo(){
	//var bar = 'bar1';
	var bar;
	function baz(){
		console.log(bar);
	}	

	bam(baz);
}

function bam(callback){
	var bar = 'bar2';
	callback();
}

foo();

