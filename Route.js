var Dispatcher;

function debug(level, msg) {
	if(level <= Dispatcher.logLevel)
		console.log(msg);
}

Route = function(router) {
	this._id = Route.next_id++;
	if(router !== undefined)
		Dispatcher = router.constructor;
	debug(10, "Route()");
	Dispatcher.Route = Route;
	Dispatcher.Context = require("./Context.js");
	Dispatcher.RouteGroup = require("./RouteGroup.js");
	this.router = router;
	
	Dispatcher.render = function(template, data, cb) {
			debug(10, "Dispatch.render()");
		this.template.render(template, data, cb);
	};
};

Route.next_id = 1;

Route.prototype = {
	clone:		function() {
		var clone = new Route(this.router);
		for(var key in this) {
			//if(this.hasOwnProperty(key)) {
				if(key !== "_id")
					if(this[key] instanceof Array)
						clone[key] = this[key].slice();
					else
						clone[key] = this[key];
			//}
		}
		return clone;
	},
	_onError:	function(err, request, response) {
		console.log("error: ", err);
		return this.router.internalServerErrorHandler.call(this, request, response);
	},
	onError:	function(onError) {
		this._onError = onError;
	},
	toString:	function() {
		debug(10, "toString()");
		var str = "";
		if(this._name !== undefined && this._name !== null)
			str = this._name + ": ";
		return str + (this._method ? this._method : "NO_METHOD") + " -> " + this._uri;
	},
	newRoute:	function() {
		debug(10, "newRoute()");
		return this.router.newRoute();
	},
	toHash:		function(keys) {
		debug(10, "toHash()");
		var hash = {};
		if(arguments[1] !== undefined) {
			keys = Array.prototype.slice.call(arguments);
		}
		if(keys !== undefined && !(keys instanceof Array)) {
			keys = [ keys ];
		}
		if(keys === undefined) {
			for(var key in this) {
				if(key.substr(0, 1) === "_") {
					hash[key.substr(1)] = this[key];
				}
			}
			return hash;
		}
		keys.forEach(function(key) {
			hash[key] = this["_" + key];
		}.bind(this));
		return hash;
	},
	render:		function(func) {
		debug(10, "Dispatcher.Route.render()");
		if(!(this._handler instanceof Array))
			this._handler = [];
		if(!this.router.importedTemplates) {
			this.router.importTemplates();
		}
		if(!(this._render instanceof Array))
			this._render = [];

		this._render.push(func);
		return this;
	},
	render_json:	function(obj) {
		debug(10, "Dispatcher.Route.render_json()");
		return this.render(function(request, response){
			response.writeHead(200, {'Content-Type': 'text/json'});
			response.write(JSON.stringify(_get_value.call(this, obj)));
			return true;
		});
	},
	render_text:	function(obj) {
		debug(10, "Dispatcher.Route.render_text()");
		return this.render(function(request, response){
			response.writeHead(200, {'Content-Type': 'text/plan'});
			response.write(_get_value.call(this, obj));
			return true;
		})
	},
	render_template:	function(template, fixedData) {
		debug(10, "Dispatcher.Route.render()");
		return this.render(function(request, response){
			debug(10, "render() func");
			var data = {};
			for(var key_fd in fixedData) {
        			if(fixedData.hasOwnProperty(key_fd))
					data[key_fd] = fixedData[key_fd];
			}
			for(var key_s in this.stash) {
        			if(this.stash.hasOwnProperty(key_s))
					data[key_s] = this.stash[key_s];
			}
			Dispatcher.render.call(this.router, template, data, function(err, html){
				if(err) throw err;
				response.writeHead(200, {'Content-Type': 'text/html'});
				response.write(html);
			});
			return true;
		});
	},
	request:	function(method, uri, data, mapper) {
		debug(10, "request()");
		if(! this._handler instanceof Array)
			this._handler = [];
		this._handler.push(function(request, response){
			this.request(method, uri, data, mapper);
		});
		return this;
	},
	name:		function(name) {
		debug(10, "name()");
		this._name = name;
		this.router.namedRoutes[name] = this;
		return this;
	},
	stash2json:	function(mapper) {
		debug(10, "stash2json()");
		if(arguments[1] !== undefined)
			mapper = Array.prototype.slice.call(arguments);
		if(mapper instanceof Array) {
			var tmp = {};
			mapper.forEach(function(key){
				tmp[key] = key;
			});
			mapper = tmp;
		}
		if(mapper === undefined || mapper === null) {
			this.render_json(function(){return this.stash});
		} else if(mapper instanceof Object) {
			this.render_json(function(){
				var data = {};
				for(var key in mapper) {
          				if(mapper.hasOwnProperty(key)) {
						data[mapper[key]] = this.stash[key];
					}
				}
				return data;
			});
		} else
			this.render_json(function(){return this.stash[mapper]});
		return this;
	},
	subRoutes:	function() {
		var subRoutes = arguments[0] instanceof Array
			? arguments[0]
			: Array.prototype.slice.call(arguments)
		;
		var group = new Dispatcher.RouteGroup();
		for(var i = subRoutes.length - 1; i >= 0 ; i--) {
			(function(){
				var clone;
				if(i > 0) {
					clone = this.clone()
					this.router.registerRoute(clone);
				} else
					clone = this;
				subRoutes[i].call(clone, clone);
				group.addRoute(clone);
			}).call(this);
		}
		
		return group;
	},
	log:		function(msg) {
		this.handler(function() {
			var date = new Date();
			if(msg === undefined) {
				msg = this.route.toString();
			} else if(msg instanceof Function) {
				msg = msg.call(this);
			}
			console.log("%s: %s", date.toString(), msg);
			return true;
		});
		return this;
	}
};

function _setSetter(name) {
	this[name] = function(value, other){
		var attr = "_" + name;
		if(!(this[attr] instanceof Array))
			this[attr] = [];
		if(name == "handler" && typeof value == "string")
			value = require(value);
		if(other)
			this[attr].push([value, other]);
		else
			this[attr].push(value);
		return this;
	};
}

_setSetter.call(Route.prototype, "method");
_setSetter.call(Route.prototype, "uri");
_setSetter.call(Route.prototype, "header");
_setSetter.call(Route.prototype, "handler");

function _get_value(obj) {
	var value;
	if(obj instanceof Function)
		value = obj.call(this);
	else
		value = obj;
	return value;
}
module.exports = Route;
