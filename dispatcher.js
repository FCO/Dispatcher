require("./asyncForEach.js");
var uriTemplate = require("uri-templates");

var _match_order = [
	"uri",
	"method",
];

var Dispatcher= function(port, ip) {
	if(port !== undefined)
		this.port = port;
	if(ip !== undefined)
		this.ip = ip;
	this.routes = [];
	this.namedRoutes = {};
	this.importedTemplates = false;
};

Dispatcher.prototype = {
	port:	8080,
	ip:	'127.0.0.1',
	start:	function(port, ip) {
		var http = require('http');
		
		http.createServer(function (req, res) {
			try {
				this.dispatch(req, res);
			} catch(err) {
				Dispatcher.internalServerError(req, res);
			}
		}.bind(this)).listen(
			port || this.port,
			ip || this.ip
		);
		console.log("Connect at http://" + (ip || this.ip) + ":" + (port || this.port));
	},
	importTemplates:	function() {
		Dispatcher.importTemplates.call(this);
		this.importedTemplates = true;
	},
	firstRoute:	function() {
		var new_route = new Dispatcher.Route(this);
		this.routes.unshift(new_route);
		return new_route;
	},
	route:	function() {
		var new_route = new Dispatcher.Route(this);
		this.routes.push(new_route);
		return new_route;
	},
	dispatch:	function(request, response) {
		var route;
		//console.log(request);
		var matches = this._prepare_routes(this.routes);
		_match_order.forEach(function(attr){
			var newMatches = [];
			matches.forEach(function(proute){
				if(proute.match(attr, request)) {
					newMatches.push(proute);
				}
			});
			matches = newMatches;
		});

		if(matches.length > 0) {
			route =  matches[0];
		} else {
			route = new Dispatcher.Context(new Dispatcher.Route().uri("").handler(Dispatcher.notFoundHandler));
		}
		//console.log(route.toString());
		route.exec(request, response);
		return;
	},
	_prepare_routes:	function(routes) {
		var prepared = [];
		routes.forEach(function(route){
			this.push(new Dispatcher.Context(route));
		}.bind(prepared));
		return prepared;
	},
};

Dispatcher.internalServerError = function(request, response) {
	response.writeHead(500, {'Content-Type': 'text/plain'});
	response.end("500 internal server error");
};

Dispatcher.notFoundHandler = function(request, response) {
	response.writeHead(404, {'Content-Type': 'text/plain'});
	response.end("404 not found");
};

Dispatcher._match_method	= function(request) {
	//console.log(this.method + " == " + request.method);
	if(this.method === undefined || this.method.length === 0) return true;
	return this.method.indexOf(request.method) >= 0;
};

Dispatcher._match_uri	= function(request) {
	//console.log(this.uri + " == " + request.url);
	if(this.uri === undefined || this.uri.length === 0) return true;
	var found = false;
	(this.uri || []).forEach(function(uri){
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
};

Dispatcher.importTemplates = function() {
	var Template = require("template");
	this.template = new Template();
	this.template.pages("templates/*.tmpl");
};

Dispatcher.render = function(template, data, cb) {
	this.template.render(template, data, cb);
};

Dispatcher.prototype.newRoute = Dispatcher.prototype.route;

Dispatcher.Context = function(route, data) {
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
			var data = {};
			for(var key_s in this.stash) {
				if(this.stash.hasOwnProperty(key_s))
					data[key_s] = this.stash[key_s];
			}
			for(var key_fd in fixedData) {
				if(fixedData.hasOwnProperty(key_fd))
					data[key_fd] = fixedData[key_fd];
			}
		return new Dispatcher.Context(this.route, this.stash);
	},
	match:	function(attr, request) {
		var hash	= this.route.toHash();
		hash.stash	= this.stash;
		hash.params	= this.params;
		return Dispatcher["_match_" + attr].call(hash, request);
	},
	exec:		function(request, response, fixedData) {
		var context;
		if(fixedData !== undefined) {
			context = this.clone(data);
		} else {
			context = this.clone();
		}
		context._request = request;
		context._response = response;
		context._cb = this.next_render;
		context._handlers = context.route._handler;
		context._renderes = context.route._render;
		context.next_handler();
	},
	next_handler:	function(resp) {
		if(resp !== false) this.handle();
	},
	next_render:	function(resp) {
		if(resp !== false) this.render();
	},
	request: function(method, uri, data, mapper) {
		console.log(method, uri, data, mapper);
		throw "request not implemented yet";
	},
	handle: 	function() {
		var handler = this._handlers.shift();
		if(handler) {
			setTimeout(function(){
				handler.cba(this.next_handler, this)(this._request, this._response);
			}.bind(this), 0);
			return;
		}
		first_time = true;
		this._cb.cba(function(req, res){res.end();}, this).call(this, this._request, this._response);
	},
	render:		function() {
		var render = this._renderes.shift();
		if(render) {
			setTimeout(function(){
				render.cba(this.next_render, this)(this._request, this._response);
			}.bind(this), 0);
			return;
		}
		first_time = true;
	},
};

Dispatcher.Route = function(router) {
	this.router = router;
};

Dispatcher.Route.prototype = {
	toString:	function() {
		return this._method + " -> " + this._uri;
	},
	newRoute:	function() {
		return this.router.newRoute();
	},
	toHash:		function() {
		var hash = {};
		for(var key in this) {
			if(key.substr(0, 1) === "_") {
				hash[key.substr(1)] = this[key];
			}
		}
		return hash;
	},
	_handler:	function(request, response) {
		//console.log("custom handler");
		response.writeHead(200, {'Content-Type': 'text/plain'});
		response.end("DEFAULT HANDLER: " + this.route.toString());
	},
	render:		function(template, fixedData) {
		if(typeof this._handler != typeof [])
			this._handler = [];
		if(!this.router.importedTemplates) {
			this.router.importTemplates();
		}
		if(typeof this._render != typeof [])
			this._render = [];

		this._render.push(function(request, response){
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
		if(typeof this._handler != typeof [])
			this._handler = [];
		this._handler.push(function(request, response){
			this.request(method, uri, data, mapper);
		});
		return this;
	},
	name:		function(name) {
		this._name = name;
		this.router.namedRoutes[name] = this;
		return this;
	},
	stash2json:	function(mapper) {
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


