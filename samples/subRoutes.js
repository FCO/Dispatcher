module.exports = function(dispatcher) {
	dispatcher.route()
		.handler(function(){
			console.log("request to " + this.route.toString() + "\t\t=> " + JSON.stringify(this.stash));
			return true;
		})
		.subRoutes(
			function(route) {
				route
					.uri("/user")
					.name("get_user")
					.method("GET")
					.render_text(function(){return this.stash.user_id + " was gotten\n"})
				;
			},
			function(route) {
				route
					.uri("/user/{user_id}")
					.name("del_user")
					.method("DELETE")
					.render_text(function(){return this.stash.user_id + " was deleted\n"})
				;
			}
		)
	;
};
