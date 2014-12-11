#!/usr/bin/env node
var path = require("path");
var fs = require("fs");
var Dispatcher = require("./main.js");

dispatcher = new Dispatcher();

var procs = process.argv.slice(2);
procs.push(function(){});
procs.push(function(){});
procs.push(function(){});
procs.push(function(){
	console.log();
	console.log("Routes:");
	this.printRouteTable();
	console.log();
});
procs.push(function(){});
procs.push(function(){});
procs.push(function(){});
procs.push(dispatcher.start);
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
	} else {
		var file = path.resolve(module);
		fs.exists(file, function(exists) {
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
				}.cba(next_file, dispatcher));
				return;
			} else {
				var mod = require(file);
				if(!(mod instanceof Array))
					mod = [ mod ];
				mod.forEach(function(func) {
					func.cba(next_file, this)(dispatcher);
				});
				return;
			}
		});
	}
	return true;
}
