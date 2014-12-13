#!/usr/bin/env node

var yargs = require('yargs')
	.usage(
		"Runs the Dispatcher server with configuration files.\n" +
		"Usage: $0 [--route-table-only] [--run-route ROUTE_NAME [--stash JSON]] [--port PORT] [--host HOST] files"
	)
	.boolean("route-table-only")
	.describe({
		"route-table-only":	"Only prints the route table, do not tart the server.",
		"stash":		"JSON to use with route. (only usable with -n)",
		"run-route":		"The name of the route to be runned. (dont start the server)",
		"eval":			"Run a given code, the var 'this' is defined as the dispatcher.",
	})
	.default({
		"route-table-only":	false,
		"stash":		null,
		"run-route":		null,
		"host":			"0.0.0.0",
		"port":			8080,
		"eval":			null,
	})
	.string(["route-table-only", "stash", "run-route", "host"])
	.alias({
		"r":	"route-table-only",
		"s":	"stash",
		"n":	"run-route",
		"h":	"host",
		"p":	"port",
		"e":	"eval",
	})
	.strict()
;
var argv = yargs.argv;

if(argv._.length == 0 && argv.eval === null) {
	console.log(yargs.help());
	process.exit(1);
}

var path = require("path");
var fs = require("fs");
var Dispatcher = require("./main.js");
require("console.table");

dispatcher = new Dispatcher();

var procs = argv._;

if(argv.eval !== null) {
	procs.push(new Function(argv.eval).bind(dispatcher));
}

procs.push(function(){
	console.log();
	console.table("Routes", this.routes.map(function(route){
		var obj = {}, hash = route.toHash();
		["name", "method", "uri"].forEach(function(key){
			obj[key] = hash[key];
		});
		return obj;
	}));
	console.log();
	return true;
});
if(argv["host"] !== undefined) {
	procs.push(function(){
		this.ip = argv["host"];
	});
}
if(argv["port"] !== undefined) {
	procs.push(function(){
		this.port = argv["port"];
	});
}
if(argv["run-route"] !== null) {
	if(argv["stash"] !== null) {
		var stash = JSON.parse(argv["stash"]);
	}

	var req = {};
	var res = {
		'writeHead':	console.log.bind(console, "HEADER: "),
		'write':	console.log.bind(console, "BODY:   "),
		'end':		console.log.bind(console, "BODY:   "),
	};

	procs.push(function(){
		this.getRouteContextByName(argv["run-route"]).exec(req, res, stash);
	});
} else if(!argv["route-table-only"]) {
	procs.push(dispatcher.start);
}
next_file();

function next_file() {
	var proc = procs.shift();
	if(proc) {
		setImmediate(handle_routes.cba(next_file, this).bind(this, proc));
		return true;
	}
}

function handle_routes(module) {
	if(module instanceof Function) {
		module.call(dispatcher);
		return true;
	} else {
		var file = path.resolve(module);
		fs.exists(file, function(exists) {
			fs.stat(file, function(err, stat) {
				if(stat.isDirectory()) {
					fs.readdir(file, function(err, files) {
						var new_procs = files.filter(function(file){
							return path.extname(file) == ".js" || path.extname(file) == ".json";
						}).map(function(dir, file){
							return dir + "/" + file;
						}.bind(this, file));
						procs = new_procs.concat(procs);
						return true;
					}.cba(next_file, this));
				} else {
					if(!exists) {
						console.error("File '" + file + "' do not exist.");
						process.exit();
					}
					console.log("importing " + file);
					if(path.extname(file) == ".json") {
						fs.readFile(file, function(err, data){
							if(err) {
								console.error(err);
								process.exit();
							}
							this.route(JSON.parse(data));
							return true;
						}.cba(next_file, dispatcher));
					} else {
						var mod = require(file);
						if(!(mod instanceof Array))
							mod = [ mod ];
						mod.asyncForEach(function(func) {
							func.call(this, dispatcher);
							return true;
						}, next_file);
					}
				}
			});
		});
	}
}
