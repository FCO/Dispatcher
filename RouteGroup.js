Route = require("./Route.js");
function RouteGroup() {
	this.__routes__ = Array.prototype.slice.call(arguments || []);
}

RouteGroup.prototype = {
	addRoute:	function(route) {
		this.__routes__.push(route);
	},
	forEachRoute:	function(func) {
		this.__routes__.forEach(func);
	},
};

var route = Route.prototype;
for(var key in route) {
	if(typeof route[key] === typeof function(){}) {
		RouteGroup.prototype[key] = function() {
			this.__routes__.forEach(function(route){
				route[key].apply(route, arguments);
			}.bind(this));
			return this;
		};
	}
}

module.exports = RouteGroup;
