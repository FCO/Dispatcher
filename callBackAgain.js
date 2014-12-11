Function.prototype.cba = function(cb, obj, onError) {
	return function() {
		var func_args = arguments;
		setImmediate(function(){
			try {
				var ret = this.apply(obj, func_args);
				if(ret !== undefined) cb.call(obj, ret);
			} catch(err) {
				if(onError) {
					var args = Array.prototype.slice.call(func_args);
					args.unshift(err);
					onError.apply(obj, args);
				} else {
					console.error(err);
					process.exit(1);
				}
			}
		}.bind(this));
	}.bind(this);
};
