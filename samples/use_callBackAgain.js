require("./callBackAgain.js");
require("./asyncForEach.js");

setTimeout(function(){
	return "bla";
}.cba(console.log.bind(console), this));


[1, 2, 3, 4, 5].asyncForEach(function(val){
	console.log(val);
	return null;
}.bind({test: "ok"}), console.log.bind(console));
