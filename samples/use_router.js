var Dispatcher = require("./main.js");

dispatcher = new Dispatcher();
dispatcher
	.newRoute()
		.method("GET")
		.uri("/bla/{id}")
		.uri("/bli{?id}")
		.handler(function(req, res){
			console.log("custom handler");
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.write("ID: " + this.stash.id + "\n");
			res.end("HANDLER: " + this.route.toString());
		})
	.newRoute()
		.name("ble")
		.method("GET")
		.uri("/ble")
	.newRoute()
		.method("GET")
		.uri("/template/{number}{?filter}")
		.render("test.tmpl", {data1: "bla", data2: "ble"})
	.newRoute()
		.method("GET")
		.uri("/request")
		.request("POST", "/bla", {key: "value"}, {from: "to"})
		.stash2json()
;

dispatcher.start();
