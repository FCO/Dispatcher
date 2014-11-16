var Router = require("./Router.js");

router = new Router();
var r = router;
r
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
;
console.log(r);

//var m = r.choose({method: "GET", uri: "bla"});
//console.log(m.toString());

var http = require('http');

http.createServer(function (req, res) {
	this.dispatch(req, res);
}.bind(r)).listen(8080, '127.0.0.1');

