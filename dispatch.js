#!/usr/bin/env node
var path = require("path");
var Dispatcher = require("./dispatcher.js");

dispatcher = new Dispatcher();

process.argv.slice(2).forEach(function(module){
	var file = path.resolve(module);
	console.log("importing " + file);
	var mod = require(file);
	if(typeof mod !== typeof [])
		mod = [ mod ];
	mod.forEach(function(func) {
		func(dispatcher);
	});
});

dispatcher.start();
