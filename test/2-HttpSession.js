var mockery = require('mockery');
var assert = require('assert');
var restify = require('restify');
var EventEmitter = new require('events').EventEmitter;
var handler = new EventEmitter();
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
  process.nextTick(function(){
                  handler.emit(req.params.uuid, req);
  });
  res.send(200);
}
var registrarDb;
var HttpSession;
describe('Test HttpSession', function(){
  before(function(done){
    mockery.enable();
    mockery.warnOnReplace(false);
    mockery.warnOnUnregistered(false);
    mockery.registerMock('../config/conftool', mockConfig);
    mockery.registerMock('./config/conftool', mockConfig);
    //bootstrap libraries that require mocks
    HttpSession = require('../lib/HttpSession');
    registrarDb = require('../lib/registrar_db').getDb();
    httpserver.use(restify.acceptParser(httpserver.acceptable));
    httpserver.use(restify.queryParser());
    httpserver.use(restify.bodyParser({mapParams: false}));
    httpserver.post('/session/:uuid', testController);
    httpserver.listen(8081, function () {
      done();
    });
  });
  after(function(done){
    mockery.disable();
    httpserver.close();
    done();
  });
  it("HttpSession constructor", function(done){
    i1 = new HttpSession({role: 'caller', to: 'test@kabletown.com', 
                                           from: 'bryan@kabletown.com', display: 'rtcwithme', 
                                           callbackUrl: 'http://127.0.0.1:8081/session/', 
                                           sessid: '12382-238823-82388238-8234kjsdk-238234'});
    assert.equal(i1.role, 'caller');
    assert.equal(i1.http, true);
    assert.equal(i1.linker, null);
    done();
  });
  it("HttpSession link", function(done){
    i2 = new HttpSession({role: 'callee', to: 'test@kabletown.com', 
                                           from: 'bryan@kabletown.com', display: 'rtcwithme', 
                                           callbackUrl: 'http://127.0.0.1:8081/session/', 
                                           sessid: '123x22-238823-82388238-8234kjsdk-238234'});
    i1.link(function(msg){
      i2.messageFromLinked(msg);
    });
    i1.activate();
    i2.link(function(msg){
      i1.messageFromLinked(msg);
    });
    i2.activate();
    done();
  });
  it("HttpSession messageLinkedSession", function(done){
    handler.once(i2.sessid, function(req){
      assert.equal(req.body.foo, 'bar');
      assert.equal(req.params.uuid, i2.sessid);
      done();
    });
    i1.messageLinkedSession({foo: 'bar'}); 
  });
  it("HttpSession messageEndpoint", function(done){
    handler.once(i1.sessid, function(req){
      assert.ok(req.body.foo, 'bar');
      assert.ok(req.params.uuid, i1.sessid);
      done();
    });
    i1.messageEndpoint({foo: 'bar'}); 
  });
  it("HttpSession addMessage", function(done){
    handler.once(i2.sessid, function(req){
      assert.ok(req.body.foo, 'bar');
      assert.ok(req.params.uuid, i2.sessid);
      done();
    });
    i1.addMessage({foo: 'bar'}); 
  });
  it("HttpSession initiateLeg client not registered, will send message to linked session about error", function(done){
    handler.once(i1.sessid, function(req){
      assert.ok(req.body, {type: 'invite', failure: true, reason: 404});
      assert.ok(req.params.uuid, i1.sessid);
      done();
    });
    i2.initiateLeg(); 
  });
/*  it("HttpSession initiateLeg client is registered, will send message to registered endpoints callbackurl", function(done){
    handler.once(i2.sessid, function(req){
      done();
    });
    var obj = {userid: 'test@kabletown.com', callbackUrl: 'http://127.0.0.1:8081/session/', ttl: 5000};
    registrarDb.save(obj, function(){
      i2.initiateLeg(); 
    });
  });
*/
});
