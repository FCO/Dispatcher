#!/usr/bin/env node
var path = require("path");
var fs = require("fs");
var Dispatcher = require("./main.js");

dispatcher = new Dispatcher();

var procs = process.argv.slice(2);
procs.push(function(){
	console.log("\nRoutes:");
	this.printRouteTable();
	console.log();
});
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
		return true;
	} else {
		var file = path.resolve(module);
		fs.exists(file, function(exists) {
			fs.stat(file, function(err, stat) {
				if(stat.isDirectory()) {
					fs.readdir(file, function(err, files) {
						var new_procs = files.map(function(dir, file){
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
