#!/usr/bin/env node
var path = require("path");
var fs = require("fs");
var Dispatcher = require("./main.js");

dispatcher = new Dispatcher();

process.argv.slice(2).forEach(function(module){
	var file = path.resolve(module);
	fs.exists(file, function(exists) {
		if(!exists) {
			console.error("File '" + file + "' do not exist.");
			process.exit();
		}
		console.log("importing " + file);
		var mod = require(file);
		if(typeof mod !== typeof [])
			mod = [ mod ];
		mod.forEach(function(func) {
			func(dispatcher);
		});
	});
});

dispatcher.start();
