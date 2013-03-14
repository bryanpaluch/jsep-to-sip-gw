var mockery = require('mockery');
var assert = require('assert');
var restify = require('restify'),
var handler = new require('events').EventEmitter();
var HttpSession = require('../lib/HttpSession');
var mockConfig = {
  getConf: function(){
    return {
      httpport: 8080,
      outboundproxy: '127.0.0.1:5080',
      domain: 'cabletownlabs',
      localHost: '127.0.0.1:5060',
      org: 'cabletownlabs'
    }
  }
}

var i1;
var i2;

var httpserver = restify.createServer({
    name: 'jsep-to-sip-gateway',
      version: '0.0.1'
});
var testController = function(req, res){
  handler.emit('message', req);
  res.send(200, 'OK');
}

describe('Test HttpSession', function(){
  before(function(done){
    mockery.enable();
    mockery.registerMock('../config/conftool', mockConfig);
    mockery.registerMock('./config/conftool', mockConfig);
    mockery.warnOnReplace(false);
    mockery.warnOnUnregistered(false);

    httpserver.post('/session', testController);
    httpserver.listen(8080, function () {
      done();
    });
  });
  after(function(done){
    mockery.disable();
    done();
  });
  it("HttpSession constructor", function(done){
    i1 = new HttpSession({role: 'caller', to: 'test@kabletown.com', 
                                           from: 'bryan@kabletown.com', display: 'rtcwithme', 
                                           callbackUrl: 'http://127.0.0.1:8080/session/', 
                                           calldirection: 'httphttp',
                                           sess: '12382-238823-82388238-8234kjsdk-238234'});
    assert.equal(i1.role, 'caller');
    assert.equal(i1.http, true);
    assert.equal(i1.linkedSession, null);
    done();
  });
  it("HttpSession linkSession", function(done){
    i2 = new HttpSession({role: 'callee', to: 'test@kabletown.com', 
                                           from: 'bryan@kabletown.com', display: 'rtcwithme', 
                                           callbackUrl: 'http://127.0.0.1:8080/session/', 
                                           calldirection: 'httphttp',
                                           sess: '123x22-238823-82388238-8234kjsdk-238234'});
    i1.linkSession(i2);
    i2.linkSession(i1);
    assert.equal(i1.linkedSession, i2);
    done();
  });
  it("HttpSession initiateLeg", function(done){

    done();
  });
  it("HttpSession messageLinkedSession", function(done){

    done();
  });
  it("HttpSession messageEndpoint", function(done){

    done();
  });
  it("HttpSession AddMessage", function(done){

    done();
  });
});
