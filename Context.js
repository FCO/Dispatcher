var Dispatcher;
function debug(level, msg) {
	if(level <= Dispatcher.logLevel)
		console.log(msg);
}

var Context = function(route, data) {
	Dispatcher = route.router.constructor;
	debug(10, "Context()");
	Dispatcher.Route = require("./Route.js");
	Dispatcher.Context = Context;
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

Context.prototype = {
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
		context._handlers = (context.route._handler	|| [
			function(request, response) {
				debug(10, "_handler()");
				//console.log("custom handler");
				response.writeHead(200, {'Content-Type': 'text/plain'});
				response.end("DEFAULT HANDLER: " + this.route.toString());
			}
		]).slice();
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
		if(handler) {
			setImmediate(function(){
				debug(10, "handle() setImmediate()");
				handler.cba(this.next_handler, this, this.route._onError)(this._request, this._response);
			}.bind(this));
			return;
		}
		this._cb.cba(function(req, res){res.end();}, this, this.route._onError).call(this, this._request, this._response);
	},
	render:		function() {
		debug(10, "Dispatcher.Context.render()");
		var render = this._renderes.shift();
		if(render) {
			setImmediate(function(){
				debug(10, "render() setImmediate()");
				render.cba(this.next_render, this, this.route._onError)(this._request, this._response);
			}.bind(this));
			return;
		}
	},
};

module.exports = Context
