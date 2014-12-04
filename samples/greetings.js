module.exports = function(dispatcher) {
	dispatcher.route()
		.name("greetings")
		.uri("/greetings")
		.method("GET")
		.handler(function(req, res){
			//res.end("Helo World!");
			this.render_json({"hello": "world"});
			return true;
		})
	;
};
