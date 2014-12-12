#!/usr/bin/env node

var argv = require('yargs')
	.demand(1)
	.boolean("route-table-only")
	.alias({"r": "route-table-only", "s": "stash", "n": "run-route"})
	.argv
;

var path = require("path");
var fs = require("fs");
var Dispatcher = require("./main.js");
require("console.table");

dispatcher = new Dispatcher();

var procs = argv._;
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
if(argv["run-route"] !== undefined) {
	if(argv["stash"] !== undefined) {
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
