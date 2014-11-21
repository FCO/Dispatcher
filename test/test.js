var should = require("should");
var Router = require("../dispatcher.js");

describe("requires" , function(){
	it("should have the right classes", function(){
		(Router == null).should.not.be.true;
		Router.should.be.a.Function;
		(Router.Route == null).should.not.be.true;
		Router.Route.should.be.a.Function;
		(Router.Context == null).should.be.false;
		Router.Context.should.be.a.Function;
	});
	it("should have the right static methods", function(){
		Router.should.have.a.property("notFoundHandler");
		Router.notFoundHandler.should.be.a.Function;

		Router.should.have.a.property("_match_method");
		Router._match_method.should.be.a.Function;

		Router.should.have.a.property("_match_uri");
		Router._match_uri.should.be.a.Function;
	});
	it("should return 404", function(){
		var ended = false;
		Router.notFoundHandler({},
			{
				writeHead:	function(code, header) {
					code.should.be.equal(404);
				},
				end:		function(data) {
					ended = true;
				},
			}
		);
		ended.should.be.true;
	});
	it("should test method", function(){
		Router._match_method.call({method: ["XXX"]},			{method: "XXX"}).should.be.true;
		Router._match_method.call({method: ["XXX", "YYY", "ZZZ"]},	{method: "XXX"}).should.be.true;
		Router._match_method.call({method: ["XXX", "YYY", "ZZZ"]},	{method: "ZZZ"}).should.be.true;

		Router._match_method.call({method: ["XXX"]},			{method: "AAA"}).should.be.false;
		Router._match_method.call({method: ["XXX", "YYY", "ZZZ"]},	{method: "AAA"}).should.be.false;
	});
	it("should test uri and save params", function(){
		var sts = [{}, {}, {}, {}, null, null];
		var prm = [{}, {}, {}, {}, null, null];
		Router._match_uri.call({stash: sts[0], params: prm[0], uri: ["/bla/{id}"]}, 					{url: "/bla/123"}).should.be.true;
		Router._match_uri.call({stash: sts[1], params: prm[1], uri: ["/bla/{id}", "/ble/{par1}/{par2}", "/bli"]},	{url: "/bla/123"}).should.be.true;
		Router._match_uri.call({stash: sts[2], params: prm[2], uri: ["/bla/{id}", "/ble/{par1}/{par2}", "/bli"]},	{url: "/bli"}).should.be.true;
		Router._match_uri.call({stash: sts[3], params: prm[3], uri: ["/bla/{id}", "/ble/{par1}/{par2}", "/bli"]},	{url: "/ble/a/b"}).should.be.true;
                                                                    
		Router._match_uri.call({stash: sts[4], params: prm[4], uri: ["/bla/{id}", "/ble/{par1}/{par2}", "/bli"]},   	{url: "AAA"}).should.be.false;
		Router._match_uri.call({stash: sts[5], params: prm[5], uri: ["/bla/{id}", "/ble/{par1}/{par2}", "/bli"]},	{url: "AAA"}).should.be.false;

		sts[0].should.be.eql({id: "123"})		.and.be.eql(prm[0]);
		sts[1].should.be.eql({id: "123"})		.and.be.eql(prm[1]);
		sts[2].should.be.eql({})			.and.be.eql(prm[2]);
		sts[3].should.be.eql({par1: "a", par2: "b"})	.and.be.eql(prm[3]);

		(sts[4] == null).should.be.true;
		(sts[5] == null).should.be.true;
	});
	it("should create the right object", function(){
		var router = new Router();
		router.should.be.a.Object;
		router.should.be.an.instanceOf(Router);
		router.should.have.a.property("route");
		router.should.have.a.property("dispatch");
	});
	it("should create a route", function(){
		var router = new Router();
		router.route.should.be.a.Function;
		var route = router.route();
		route.should.be.a.Object;
	});
	it("should have a newRoute alias", function(){
		var router = new Router();
		router.route.should.be.equal(router.newRoute);
	});
	it("should have a router reference", function(){
		var router = new Router();
		(router.route().router == null).should.be.false;
		router.route().router.should.be.equal(router);
	});
});
describe("Router.Route" , function(){
	describe("methods" , function(){
		it("toHash()", function(){
			var route = new Router().route();
			route.should.have.a.property("toHash");
			route.toHash	.should.be.a.Function;
			route.toHash.call({_bla: "ble", _bli: "blo"}).should.be.eql({bla: "ble", bli: "blo"});
		});
		it("newRoute()", function(){
			var route = new Router().route();
			route.should.have.a.property("newRoute");
			route.newRoute	.should.be.a.Function;
		});
		describe("__setSetter methods" , function(){
			it("method()", function(){
				var route = new Router().route();
				route.should.have.a.property("method");
				route.method	.should.be.a.Function;
				route.method("XXX");
				route._method.should.be.a.Array.and.eql(["XXX"]);
			});
			it("uri()", function(){
				var route = new Router().route();
				route.should.have.a.property("uri");
				route.uri	.should.be.a.Function;
			});
			it("handler()", function(){
				var route = new Router().route();
				route.should.have.a.property("handler");
				route.handler	.should.be.a.Function;
			});
			it("name()", function(){
				var route = new Router().route();
				route.should.have.a.property("name");
				route.name	.should.be.a.Function;
			});
			it("should add one by one", function(){
				var route = new Router().route();
				route.method("XXX");
				route._method.should.be.a.Array.and.eql(["XXX"]);
				route.method("YYY");
				route._method.should.be.a.Array.and.eql(["XXX", "YYY"]);
			});
			it.skip("should ignore repeted values", function(){
				var route = new Router().route();
				route.method("XXX");
				route._method.should.be.a.Array.and.eql(["XXX"]);
				route.method("YYY");
				route._method.should.be.a.Array.and.eql(["XXX", "YYY"]);
				route.method("XXX");
				route._method.should.be.a.Array.and.eql(["XXX", "YYY"]);
			});
			it.skip("should accept a array", function(){
				var route = new Router().route();
				route.method("XXX");
				route._method.should.be.a.Array.and.eql(["XXX"]);
				var route = new Router().route();
				route.method(["YYY", "ZZZ"]);
				route._method.should.be.a.Array.and.eql(["XXX", "YYY", "ZZZ"]);
			});
			it.skip("should accept a array and ignore the repeted ones", function(){
				var route = new Router().route();
				route.method("XXX");
				route._method.should.be.a.Array.and.eql(["XXX"]);
				var route = new Router().route();
				route.method(["XXX", "YYY", "ZZZ"]);
				route._method.should.be.a.Array.and.eql(["XXX", "YYY", "ZZZ"]);
				route.method(["XXX", "YYY", "ZZZ", "YYY", "YYY"]);
				route._method.should.be.a.Array.and.eql(["XXX", "YYY", "ZZZ", "YYY"]);
			});
		});
	});
	describe("functionalities" , function(){
		var did_run, router;
		function runDispatcher(request, response) {
			var none = function(){};
			router.dispatch(request || {}, response || {writeHead: none, end: none});
		}

		it("not found", function(){
			router = new Router();
			router.newRoute().uri("/bla");
			runDispatcher({method: "XXX", url: "/ble"}, {writeHead: function(){}, end: function(data){
				data.should.be.equal("404 not found");
			}});
		});
		it("method", function(done){
			did_run = false;
			router = new Router();
			router.newRoute().method("YYY").handler(function(){
				did_run = true;
			});
			runDispatcher({method: "XXX", url: "/bla"});
			setTimeout(function(){
				did_run.should.be.false;
				runDispatcher({method: "YYY", url: "/bla"});
				setTimeout(function(){
					did_run.should.be.true;
					done();
				}, 10);
			}, 10);
		});
		it("uri", function(done){
			var did_after_run = false;
			did_run = false;
			router = new Router();
			router
				.newRoute()
					.handler(function(){
						did_run = true;
						return false;
					})
					.handler(function(){
						did_after_run = true;
					})
			;
			runDispatcher({method: "XXX", url: "/ble"});
			setTimeout(function(){
				did_run.should.be.true;
				setTimeout(function(){
					did_after_run.should.be.false;
					done();
				}, 10);
			}, 10);
		});
		it("handler", function(done){
			did_run = false;
			router = new Router();
			router.newRoute().uri("/bla").handler(function(){
				did_run = true;
			});
			runDispatcher({method: "XXX", url: "/ble"});
			setTimeout(function(){
				did_run.should.be.false;
				runDispatcher({method: "XXX", url: "/bla"});
				setTimeout(function(){
					did_run.should.be.true;
					done();
				}, 10);
			}, 10);
		});
		it("name", function(done){
			did_run = false;
			router = new Router();
			router.newRoute().name("test").handler(function(){
				did_run = true;
			});
			setTimeout(function(){
				router.namedRoutes.should.have.a.property("test");
				runDispatcher({method: "XXX", url: "/bla"});
				setTimeout(function(){
					did_run.should.be.true;
					done();
				}, 10);
			}, 10);
		});
		it("handler require", function(done){
			router = new Router();
			var did_run_obj = {run: false};
			router.newRoute()
				.handler(function(){
					this.stash.did_run_obj = did_run_obj
				})
				.handler("./testHandler.js")
			;
			runDispatcher({method: "XXX", url: "/ble"});
			setTimeout(function(){
				did_run_obj.run.should.be.true;
				done();
			}, 10);
		});
		it("render", function(done){
			this.timeout(5000);
			did_run = false;
			router = new Router();
			router.newRoute()
				.uri("/tmpl/{number}{?filter}")
				.render("test.tmpl", {data1: "bla", data2: "ble"})
			;

			runDispatcher({
				method:		"XXX",
				url:		"/tmpl/123?filter=test"
			}, {
				writeHead: 	function(){},
				end:		function(data){
					data.should.be.equal("<html>\n\t<body>\n\t\ttitle: <h1>bla ble</h1>\n\t\tnumber: 123 filter: test\n\t</body>\n</html>");
					done();
				}
			});
		});
		it("stash2json", function(done){
			did_run = false;
			router = new Router();
			router.newRoute().uri("/stash2json/{test}{?array*}").stash2json();
			runDispatcher({method: "XXX", url: "/stash2json/bla?array=a&array=b&array=c"}, {writeHead: function(){}, end: function(data){
				did_run = true;
				data.should.be.equal("{\"test\":\"bla\",\"array\":[\"a\",\"b\",\"c\"]}");
			}});
			setTimeout(function(){
				did_run.should.be.true;
				done();
			}, 10);
		});
	});
});

describe("dispatch" , function(){
	describe("change the default behavior" , function(){
		var did_run, router;
		function runDispatcher(request) {
			var none = function(){};
			router.dispatch(request || {}, {writeHead: none, end: none});
		}
		beforeEach("Create router", function(){
			did_run = false;
			router = new Router();
			router.newRoute().handler(function(){
				did_run = true;
			});
		});
		it("no arguments", function(){
			runDispatcher();
			setTimeout(function(){did_run.should.be.true;}, 10);
		});
		it("with method and url", function(){
			runDispatcher({method: "XXX", url: "/yyy"});
			setTimeout(function(){did_run.should.be.true;}, 10);
		});
		it("with another route", function(){
			var did_bla_run = false;
			router.firstRoute().uri("/bla").handler(function(){
				did_bla_run = true;
			});
			runDispatcher({method: "XXX", url: "/bla"});
			setTimeout(function(){did_bla_run.should.be.true;}, 10);
			setTimeout(function(){did_run.should.be.false;}, 10);
			runDispatcher({method: "XXX", url: "/ble"});
			setTimeout(function(){did_run.should.be.true;}, 10);
		});
		it.skip("with another route, with any order", function(){
			var did_bla_run = false;
			router.newRoute().uri("/bla").handler(function(){
				did_bla_run = true;
			});
			runDispatcher({method: "XXX", url: "/bla"});
			setTimeout(function(){did_bla_run.should.be.true;}, 10);
			setTimeout(function(){did_run.should.be.false;}, 10);
			runDispatcher({method: "XXX", url: "/ble"});
			setTimeout(function(){did_run.should.be.true;}, 10);
		});
	});
});
