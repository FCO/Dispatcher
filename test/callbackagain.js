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
		it("should call the callback after", function(){
			var did_it = false;
			(function(){return did_it = true}).cba(function(){did_it.should.be.true;})();
		});
		it("should use the right 'this'", function(){
			(function(){
				this.should.be.true;
				return true
			}).cba(function(){
				this.should.be.true;
			}, true)();
		});
		it("should use the right arguments", function(){
			(function(p1, p2, p3, p4){
				(p1 || "").should.be.equal("bla");
				(p2 || "").should.be.equal("ble");
				(p3 || "").should.be.equal(1);
				(p4 || "").should.be.equal(2);
				return 1234
			}).cba(function(ret){
				ret.should.be.equal(1234);
			})("bla", "ble", 1, 2);
		});
	});
});
