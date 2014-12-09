#!/usr/bin/env node
var path = require("path");
var fs = require("fs");
var Dispatcher = require("./main.js");

dispatcher = new Dispatcher();

var procs = process.argv.slice(2);
next_file();

function next_file() {
	var proc = procs.shift();
	if(proc)
		setImmediate(function(proc){
			return handle_routes.cba(next_file, this)(proc);
		}.call(this, proc));
	console.log("will start");
	dispatcher.start();
}

function handle_routes(module) {
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
		} else {
			var mod = require(file);
			if(typeof mod !== typeof [])
				mod = [ mod ];
			mod.forEach(function(func) {
				func.cba(next_file, this)(dispatcher);
			});
		}
	});
}
