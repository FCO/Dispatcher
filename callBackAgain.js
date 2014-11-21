Function.prototype.cba = function(cb, obj) {
	return function() {
		var ret = this.apply(obj, arguments);
		if(ret !== undefined) cb.call(obj, ret);
	}.bind(this)
};
