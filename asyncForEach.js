require("./callBackAgain.js");
Array.prototype.asyncForEach = function(cb, cba) {
	var func = cba;
	for(var i = this.length - 1; i >= 0; i--) {
		(function(val){
			func = cb.bind(this, val).cba(func);
		})(this[i]);
	}
	setTimeout(func, 0);
};
