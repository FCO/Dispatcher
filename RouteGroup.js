Route = require("./Route.js");
function RouteGroup() {
	this.__routes__ = Array.prototype.slice.call(arguments || []);
}

RouteGroup.prototype = {
	addRoute:	function(route) {
		this.__routes__.push(route);
	},
};

var route = new Route();
for(var key in route) {
	if(typeof route[key] === typeof function(){}) {
		var group = this;
		RouteGroup.prototype[key] = function() {
			this.__routes__.forEach(function(route){
				route[key].apply(this === group ? route : this , arguments);
			}.bind(this));
			return this;
		};
	}
}

module.exports = RouteGroup;
