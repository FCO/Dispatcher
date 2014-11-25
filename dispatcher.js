require("./asyncForEach.js");
var uriTemplate = require("uri-templates");

var _match_order = [
	"uri",
	"method",
];

function debug(level, msg) {
	if(level <= Dispatcher.logLevel)
		console.log(msg);
}

var Dispatcher = function(port, ip) {
	debug(10, "Dispatcher()");
	if(port !== undefined)
		this.port = port;
	if(ip !== undefined)
		this.ip = ip;
	this.routes = [];
	this.namedRoutes = {};
	this.importedTemplates = false;
};

Dispatcher.logLevel = 5;

Dispatcher.prototype = {
	port:	8080,
	ip:	'127.0.0.1',
	start:	function(port, ip) {
		debug(10, "start()");
		var http = require('http');
		
		http.createServer(function (req, res) {
		debug(10, "createServer()");
			try {
				this.dispatch(req, res);
			} catch(err) {
				this.internalServerErrorHandler(req, res);
			}
		}.bind(this)).listen(
			port || this.port,
			ip || this.ip
		);
		debug(2, "Connect at http://" + (ip || this.ip) + ":" + (port || this.port));
	},
	importTemplates:	function() {
		debug(10, "importTemplates()");
		Dispatcher.importTemplates.call(this);
		this.importedTemplates = true;
	},
	firstRoute:	function() {
		debug(10, "firstRoute()");
		var new_route = new Dispatcher.Route(this);
		this.routes.unshift(new_route);
		return new_route;
	},
	route:	function() {
		debug(10, "route()");
		var new_route = new Dispatcher.Route(this);
		this.routes.push(new_route);
		return new_route;
	},
	match:	function(request) {
		debug(10, "match()");
		var route;
		//console.log(request);
		var matches = this._prepare_routes(this.routes);
		_match_order.forEach(function(attr){
			debug(10, "match() forEach()");
			var newMatches = [];
			matches.forEach(function(proute){
				debug(10, "match() forEach() forEach()");
				if(proute.match(attr, request)) {
					newMatches.push(proute);
				}
			});
			matches = newMatches;
		});
		return matches;
	},

	dispatch:	function(request, response) {
			debug(10, "dispatch()");
		var matches = this.match(request);

		if(matches.length > 0) {
			route =  matches[0];
		} else {
			route = new Dispatcher.Context(new Dispatcher.Route(this).handler(this.notFoundHandler));
		}
		//console.log(route.toString());
		route.exec(request, response);
		return;
	},
	_prepare_routes:	function(routes) {
			debug(10, "_prepare_routes()");
		var prepared = [];
		routes.forEach(function(route){
			debug(10, "_prepare_routes() forEach()");
			this.push(new Dispatcher.Context(route));
		}.bind(prepared));
		return prepared;
	},
	getRouteByName:		function(name, data) {
			debug(10, "getRouteByName()");
		return new Dispatcher.Context(this.namedRoutes[name], data);
	},

	internalServerErrorHandler:	function(request, response) {
			debug(10, "internalServerErrorHandler()");
		response.writeHead(500, {'Content-Type': 'text/plain'});
		response.end("500 internal server error");
	},
	
	notFoundHandler:	function(request, response) {
			debug(10, "notFoundHandler()");
		response.writeHead(404, {'Content-Type': 'text/plain'});
		response.end("404 not found");
	},

	_match_method:	function(request) {
			debug(10, "_match_method()");
		//console.log(this.method + " == " + request.method);
		if(this.method === undefined || this.method.length === 0) return true;
		return this.method.indexOf(request.method) >= 0;
	},

	_match_uri:	function(request) {
			debug(10, "_match_uri()");
		//console.log(this.uri + " == " + request.url);
		if(this.uri === undefined || this.uri.length === 0) return true;
		var found = false;
		(this.uri || []).forEach(function(uri){
			debug(10, "_match_uri() forEach()");
			var data = uriTemplate(uri).fromUri(request.url);
			if(data !== undefined) {
				for(var key in data) {
	        			if(data.hasOwnProperty(key))
						this.params[key] = this.stash[key] = data[key];
				}
				found = true;
			}
		}.bind(this));
		return found;
	},

};

Dispatcher.importTemplates = function() {
			debug(10, "importTemplates()");
	var Template = require("template");
	this.template = new Template();
	this.template.pages("templates/*.tmpl");
};

Dispatcher.render = function(template, data, cb) {
			debug(10, "Dispatch.render()");
	this.template.render(template, data, cb);
};

Dispatcher.prototype.newRoute = Dispatcher.prototype.route;

Dispatcher.Context = function(route, data) {
			debug(10, "Context()");
	this.route	= route;
	this.router	= route.router;
	this.stash	= data || {};
	this.params	= {};
	this._handlers	= [];
	this._renderes	= [];
	this._request	= null;
	this._response	= null;
	this._cb	= null;
};

Dispatcher.Context.prototype = {
	clone:	function(fixedData) {
			debug(10, "clone()");
			var data = {};
			for(var key_s in this.stash) {
				if(this.stash.hasOwnProperty(key_s))
					data[key_s] = this.stash[key_s];
			}
			for(var key_fd in fixedData) {
				if(fixedData.hasOwnProperty(key_fd))
					data[key_fd] = fixedData[key_fd];
			}
		return new Dispatcher.Context(this.route, data);
	},
	match:	function(attr, request) {
			debug(10, "match()");
		var hash	= this.route.toHash();
		hash.stash	= this.stash;
		hash.params	= this.params;
		return this.route.router["_match_" + attr].call(hash, request);
	},
	exec:		function(request, response, fixedData) {
			debug(10, "exec()");
		var context;
		if(fixedData !== undefined) {
			context = this.clone(fixedData);
		} else {
			context = this.clone();
		}
		context._request = request;
		context._response = response;
		context._cb = this.next_render;
		context._handlers = (context.route._handler	|| []).slice();
		context._renderes = (context.route._render	|| []).slice();
		context.next_handler();
	},
	next_handler:	function(resp) {
			debug(10, "next_handler()");
		if(resp !== false) this.handle();
	},
	next_render:	function(resp) {
			debug(10, "next_render()");
		if(resp !== false) this.render();
	},
	request: function(method, uri, data, mapper) {
			debug(10, "request()");
		console.log(method, uri, data, mapper);
		throw "request not implemented yet";
	},
	handle: 	function() {
			debug(10, "handle()");
		var handler = this._handlers.shift();
		debug(10, "handler:", handler);
		if(handler) {
			setTimeout(function(){
				debug(10, "handle() setTimeout()");
				handler.cba(this.next_handler, this, this.route.onError)(this._request, this._response);
			}.bind(this), 0);
			return;
		}
		first_time = true;
		this._cb.cba(function(req, res){res.end();}, this, this.route.onError).call(this, this._request, this._response);
	},
	render:		function() {
			debug(10, "Dispatcher.Context.render()");
		var render = this._renderes.shift();
		debug(10, "render:", render);
		if(render) {
			setTimeout(function(){
				debug(10, "render() setTimeout()");
				render.cba(this.next_render, this, this.route.onError)(this._request, this._response);
			}.bind(this), 0);
			return;
		}
		first_time = true;
	},
};

Dispatcher.Route = function(router) {
			debug(10, "Route()");
	this.router = router;
};

Dispatcher.Route.prototype = {
	onError:	function(err, request, response) {
		return this.router.internalServerErrorHandler.call(this, request, response);
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
	_handler:	function(request, response) {
			debug(10, "_handler()");
		//console.log("custom handler");
		response.writeHead(200, {'Content-Type': 'text/plain'});
		response.end("DEFAULT HANDLER: " + this.route.toString());
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

_setSetter.call(Dispatcher.Route.prototype, "method");
_setSetter.call(Dispatcher.Route.prototype, "uri");
_setSetter.call(Dispatcher.Route.prototype, "handler");

module.exports = Dispatcher;


