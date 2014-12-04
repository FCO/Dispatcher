var Dispatcher;

function debug(level, msg) {
	if(level <= Dispatcher.logLevel)
		console.log(msg);
}

Route = function(router) {
	Dispatcher = router.constructor;
	debug(10, "Route()");
	Dispatcher.Route = Route;
	Dispatcher.Context = require("./Context.js");
	this.router = router;
	
	Dispatcher.render = function(template, data, cb) {
			debug(10, "Dispatch.render()");
		this.template.render(template, data, cb);
	};


};

Route.prototype = {
	_onError:	function(err, request, response) {
		console.log("error: ", err);
		return this.router.internalServerErrorHandler.call(this, request, response);
	},
	onError:	function(onError) {
		this._onError = onError;
	},
	toString:	function() {
		debug(10, "toString()");
		return this._method + " -> " + this._uri;
	},
	newRoute:	function() {
		debug(10, "newRoute()");
		return this.router.newRoute();
	},
	toHash:		function() {
		debug(10, "toHash()");
		var hash = {};
		for(var key in this) {
			if(key.substr(0, 1) === "_") {
				hash[key.substr(1)] = this[key];
			}
		}
		return hash;
	},
	render_json:	function(obj) {
		debug(10, "Dispatcher.Route.render_json()");
		if(typeof this._handler != typeof [])
			this._handler = [];
		if(!this.router.importedTemplates) {
			this.router.importTemplates();
		}
		if(typeof this._render != typeof [])
			this._render = [];

		this._render.push(function(request, response){
			response.writeHead(200, {'Content-Type': 'text/json'});
			response.end(JSON.stringify(obj));
			return true;
		});
		return this;
	},
	render:		function(template, fixedData) {
		debug(10, "Dispatcher.Route.render()");
		if(typeof this._handler != typeof [])
			this._handler = [];
		if(!this.router.importedTemplates) {
			this.router.importTemplates();
		}
		if(typeof this._render != typeof [])
			this._render = [];

		this._render.push(function(request, response){
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
				response.end(html);
			});
			return true;
		});
		return this;
	},
	request:	function(method, uri, data, mapper) {
		debug(10, "request()");
		if(typeof this._handler != typeof [])
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
		// Change to push on _render
		if(typeof this._handler != typeof [])
			this._handler = [];
		this._handler.push(function(request, response){
			var data;
			if(mapper === undefined) {
				data = this.stash;
			} else if(typeof mapper == typeof []) {
				mapper.forEach(function(key){
					data[key] = this.stash[key];
				});
			} else if(typeof mapper == typeof {}) {
				for(var key in mapper) {
          				if(mapper.hasOwnProperty(key))
						data[mapper[key]] = this.stash[key];
				}
			} else {
				data = this.stash[mapper];
			}
			response.end(JSON.stringify(data));
		});
		return this;
	},
};

function _setSetter(name) {
	this[name] = function(value){
		var attr = "_" + name;
		if(typeof this[attr] != typeof [])
			this[attr] = [];
		if(name == "handler" && typeof value == typeof "")
			value = require(value);
		this[attr].push(value);
		return this;
	};
}

_setSetter.call(Route.prototype, "method");
_setSetter.call(Route.prototype, "uri");
_setSetter.call(Route.prototype, "handler");

module.exports = Route;
