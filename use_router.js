var Dispatcher = require("./dispatcher.js");

router = new Dispatcher();
router
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

var http = require('http');

http.createServer(function (req, res) {
	this.dispatch(req, res);
}.bind(router)).listen(8080, '127.0.0.1');

