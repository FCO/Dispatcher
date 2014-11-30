Function.prototype.cba = function(cb, obj, onError) {
	return function() {
		var func_args = arguments;
		setTimeout(function(){
			try {
				var ret = this.apply(obj, func_args);
				if(ret !== undefined) cb.call(obj, ret);
			} catch(err) {
				if(onError) {
					var args = Array.prototype.slice.bind(func_args)();
					args.unshift(err);
					onError.apply(obj, args);
				} else {
					throw err;
				}
			}
		}.bind(this), 0);
	}.bind(this);
};
