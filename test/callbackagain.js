var should = require("should");
require("../callBackAgain.js");

describe("Call Back Again" , function(){
	describe("requires" , function(){
		it("should require without throwing a error", function(){
			(function() {
				require("../callBackAgain.js");
			}).should.not.throw;
		});
	});
	describe("add cba on every array" , function(){
		it("should create a method cba()", function(){
			(function(){}).should.have.a.property("cba");
			(function(){}).cba.should.be.a.Function;
		});
		it("should call the callback after", function(done){
			this.timeout(5000);
			var did_it = false;
			(function(){
				did_it = true;
				return true;
			}).cba(function(){
				did_it.should.be.true;
				done();
			})();
		});
		it.skip("shouldn't call the callback after", function(done){
			this.timeout(5000);
			var did_it = false;
			(function(){
				did_it = true;
			}).cba(function(){
				did_it.should.be.false;
			})();
		});
		it("should use the right 'this'", function(done){
			this.timeout(5000);
			(function(){
				this.should.be.true;
				return true
			}).cba(function(){
				this.should.be.true;
				done();
			}, true)();
		});
		it("should use the right arguments", function(done){
			this.timeout(5000);
			(function(p1, p2, p3, p4){
				(p1 || "").should.be.equal("bla");
				(p2 || "").should.be.equal("ble");
				(p3 || "").should.be.equal(1);
				(p4 || "").should.be.equal(2);
				return 1234
			}).cba(function(ret){
				ret.should.be.equal(1234);
				done();
			})("bla", "ble", 1, 2);
		});
	});
});
