var Dispatcher = require("./dispatcher.js");

dispatcher = new Dispatcher();

process.argv.slice(2).forEach(function(module){
	var mod = require(module);
	mod(dispatcher);
});

dispatcher.start();
