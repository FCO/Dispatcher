module.exports = function(dispatcher) {
	dispatcher.route()
		.name("greetings_chained_methods")
		.uri("/greetings_chained_methods")
		.method("GET")
		.handler(function(req, res){
			this.render_json({"hello": "greetings_chained_methods"});
			return true;
		})
	;
	dispatcher.route("greetings_name")
		.uri("/greetings_name")
		.method("GET")
		.render_json({"hello": "greetings_name"})
	;
	dispatcher.route({
		"name":		"greetings_obj",
		"uri":		"/greetings_obj",
		"method":	"GET",
		"handler":	function(req, res){
			this.render_json({"hello": "greetings_obj"});
			return true;
		}
	});
	dispatcher.route([{
		"name":		"greetings_array_1",
		"uri":		"/greetings_array_1",
		"method":	"GET",
		"render_json":	{"hello": "greetings_array_1"}
	}, {
		"name":		"greetings_array_2",
		"uri":		"/greetings/{name}",
		"method":	"GET",
		"render_json":	function(){
			return {"hello": this.stash.name}
		}
	}]);
};
