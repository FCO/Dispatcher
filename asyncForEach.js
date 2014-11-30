require("./callBackAgain.js");
Array.prototype.asyncForEach = function(cb, cba) {
	var func = cba;
	var cbcba = function(val){
		func = cb.bind(this, val).cba(func);
	};
	for(var i = this.length - 1; i >= 0; i--) {
		cbcba(this[i]);
	}
	setImmediate(func);
};
