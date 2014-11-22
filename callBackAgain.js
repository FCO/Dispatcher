Function.prototype.cba = function(cb, obj) {
	return function() {
		var func_args = arguments;
		setTimeout(function(){
			var ret = this.apply(obj, func_args);
			if(ret !== undefined) cb.call(obj, ret);
		}.bind(this), 0);
	}.bind(this);
};
