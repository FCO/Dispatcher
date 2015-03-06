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
	"header",
	"uri",
	"method",
];

Dispatcher.logLevel = 5;

Dispatcher.resource_next_id = 1;

Dispatcher.prototype = {
	port:	8080,
	ip:	'0.0.0.0',
	start:	function(port, ip) {
		debug(10, "start()");
		var http = require('http');
		
		this.server = http.createServer(function (req, res) {
		debug(10, "createServer()");
			try {
				this.dispatch(req, res);
			} catch(err) {
				console.error(err);
				this.internalServerErrorHandler(req, res);
			}
		}.bind(this));
		this.server.listen(
			port	|| this.port,
			ip	|| this.ip
		);
		debug(2, "Connect at http://" + (ip || this.ip) + ":" + (port || this.port));
	},
	default_resource: {
		"id":		"id",
		"class":	undefined,
		"get":		function(id) {
			console.log("get:", this.stash.id);
			return {get: this.stash.id};
		},
		"change":	function(id, del) {
			console.log("change:", this.stash.id);
			return {change: this.stash.id};
		},
		"delete":	function(id) {
			console.log("delete:", this.stash.id);
			return {"delete": this.stash.id};
		},
		// generic
		"list":		function() {
			console.log("list");
			return {list: null};
		},
		"create":	function(data){
			console.log("create:", data);
			return {create: null};
		},
	},
	resource:		function() {
		require("./asyncForEach.js");
		var id = Dispatcher.resource_next_id++;
		var obj = {};
		var url_specific, url_generic, obj, obj_class;
		var args = Array.prototype.slice.call(arguments);
		if(typeof args[args.length - 1] !== "string") obj = args.pop();
		if(obj.url_specific === undefined && typeof args[0] == "string")
			obj.url_specific = args.shift();
		if(obj.url_generic === undefined && typeof args[0] == "string")
			obj.url_generic = args.shift();
		if(obj.name === undefined && typeof args[0] == "string")
			obj.name = args.shift();
		//if(obj.url_generic === undefined) {
		//	var path = require("path");
		//	obj.url_generic = path.resolve(url_specific + "/..");
		//}
		if(obj instanceof Function) {
			obj.class = obj;
		}
		obj.name = obj.name || id.toString();
		obj.__proto__ = Dispatcher.prototype.default_resource;
		return this
			.newRoute()
			//.log()
			.subRoutes(
				function(route){
					route
						.uri(obj.url_specific)
						.subRoutes(
							function(route){
								route
									.name("get_" + obj.name)
									.method("GET")
									.handler(function(){
										obj.stash = this.stash;
										return true;
									})
									.render_json(obj.get)
								;
							}, function(route) {
								route
									.name("change_" + obj.name)
									.method("POST")
									.handler(function(){
										obj.stash = this.stash;
										return true;
									})
									.render_json(obj.change)
								;
							}, function(route) {
								route
									.name("delete_" + obj.name)
									.method("DELETE")
									.handler(function(){
										obj.stash = this.stash;
										return true;
									})
									.render_json(obj.delete)
								;
							}
						)
					;
				}, function(route){
					route
						.uri(obj.url_generic)
						.subRoutes(
							function(route){
								route
									.name("list_" + obj.name)
									.method("GET")
									.handler(function(){
										obj.stash = this.stash;
										return true;
									})
									.render_json(obj.list)
								;
							}, function(route) {
								route
									.name("create_" + obj.name)
									.method("POST")
									.handler(function(){
										obj.stash = this.stash;
										return true;
									})
									.render_json(obj.create)
								;
							}
						)
					;
				}
			).log()
	},
	importTemplates:	function() {
		debug(10, "importTemplates()");
		Dispatcher.importTemplates.call(this);
		this.importedTemplates = true;
	},
	printRouteTable:	function() {
		this.routes.forEach(function(route){
			console.log(route.toString());
		});
	},
	firstRoute:	function() {
		debug(10, "firstRoute()");
		var new_route = new Dispatcher.Route(this);
		this.routes.unshift(new_route);
		return new_route;
	},
	registerRoute:	function(route) {
		this.routes.push(route);
	},
	route:	function() {
		debug(10, "route()");
		var val, args = Array.prototype.slice.call(arguments);
		if(args.length == 1) {
			val = args.shift();
		} else if(args.length > 1){
			val = args;
		}
		if(val === undefined) {
			var new_route = new Dispatcher.Route(this);
			this.registerRoute(new_route);
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
					if(route[key] === undefined || typeof route[key] !== typeof function(){}) {
						console.error("Method '" + key + "' not found");
						process.exit();
					}
					route[key](val[key]);
				}
			}
		}
	},
	match:	function(request) {
		debug(10, "match()");
		var route;
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
		response.write("500 internal server error");
	},
	
	notFoundHandler:	function(request, response) {
		debug(10, "notFoundHandler()");
		response.writeHead(404, {'Content-Type': 'text/plain'});
		response.end("404 not found");
	},
	_match_:	function(conf, req, cmp, stash) {
		if(conf === undefined || conf === null || (conf instanceof Array && conf.length == 0)) return true;
		if(!(conf instanceof Array)) conf = [ conf ];
		var match = false;
		conf.forEach(function(confItem){
			if(match) return;
			var value;
			if(confItem instanceof Array) {
				value		= confItem[1];
				confItem	= confItem[0];
			}
			if(value == undefined) {
				match = true;
			} else if(req[confItem] != undefined) {
				if(value instanceof Function) {
					match = value.call(this, req[confItem]);
				} else {
					match = req[confItem] == value;
				}
			}
			if(match && stash != undefined) {
				if(stash instanceof Function)
					stash = stash.call(this, confItem);
				this.stash[stash] = req[confItem];
			}
		}.bind(this));
		return match;
	},

	_match_header:	function(request) {
		debug(10, "_match_method()");
		return Dispatcher.prototype._match_.call(this, this.header, request.headers, function(item1, item2){
					return item1 == item2;
		}, function(field){return "header:" + field});
	},

	_match_method:	function(request) {
		debug(10, "_match_method()");
		if(this.method === undefined || this.method.length === 0) return true;
		var match = false;
		this.method.forEach(function(meth){
			if(match) return;
			if(meth instanceof Function) {
				match = meth.call(this, request.method);
			} else {
				match = request.method == meth;
			}
		});
		return match;
	},

	_match_uri:	function(request) {
		debug(10, "_match_uri()");
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


