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

Dispatcher.importTemplates = function() {
		debug(10, "importTemplates()");
	var Template = require("template");
	this.template = new Template();
	this.template.pages("templates/*.tmpl");
};

require("./asyncForEach.js");
Dispatcher.Context = require("./Context.js");
Dispatcher.Route = require("./Route.js");
var uriTemplate = require("uri-templates");

var _match_order = [
	"uri",
	"method",
];

Dispatcher.logLevel = 5;

Dispatcher.prototype = {
	port:	8080,
	ip:	'127.0.0.1',
	start:	function(port, ip) {
		debug(10, "start()");
		var http = require('http');
		
		this.server = http.createServer(function (req, res) {
		debug(10, "createServer()");
			try {
				this.dispatch(req, res);
			} catch(err) {
				this.internalServerErrorHandler(req, res);
			}
		}.bind(this));
		this.server.listen(
			port	|| this.port,
			ip	|| this.ip
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
	route:	function(val) {
		debug(10, "route()");
		if(val === undefined) {
			var new_route = new Dispatcher.Route(this);
			this.routes.push(new_route);
			return new_route;
		} else if(typeof val === typeof "") {
			var context = this.getRouteContextByName(val);
			if(context !== undefined)
				return context.route;
			return this.route().name(val);
		} else if(val instanceof Array) {
			val.forEach(function(route){
				this.route(route);
			}.bind(this));
		} else if(typeof val === typeof {}) {
			var route = this.route();
			for(var key in val){
				if(val.hasOwnProperty(key)) {
					if(route[key] === undefined || typeof route[key] !== typeof function(){})
						throw "Method '" + key + "' not found";
					route[key](val[key]);
				}
			}
		}
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
		debug(11, "match() returning");
		return matches;
	},

	dispatch:	function(request, response) {
		debug(10, "dispatch()");
		var matches = this.match(request);
		debug(15, matches);

		if(matches.length > 0) {
			debug(10, "dispatch() match!");
			route =  matches[0];
		} else {
			debug(10, "dispatch() didn't match");
			route = new Dispatcher.Context(new Dispatcher.Route(this).handler(this.notFoundHandler));
		}
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
	getRouteContextByName:		function(name, data) {
		debug(10, "getRouteContextByName()");
		var route = this.namedRoutes[name];
		if(route !== undefined)
			return new Dispatcher.Context(route, data);
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

Dispatcher.prototype.newRoute = function(){
	return this.route();
};

module.exports = Dispatcher;


