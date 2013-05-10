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
      domain: 'Kabletownlabs',
      localHost: '127.0.0.1:5060',
      org: 'Kabletownlabs',
      plugins: [
        { name: 'basic', run: true, config : {}}
      ],
      routing: {
        'example.net:example.net' : 'basic', 
        'ims.example.net:example.net' : 'siphttp',
        'example.net:ims.example.net' : 'httpsip',
        'x1.example.net:example.net' : 'mediaHook-dialogic',
        'x1.example.net:example.net' : 'mediaHook-dialogic',
      }
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
  console.log(req.params.uuid); 
  handler.emit(req.params.uuid, req);
  res.send(200);
}
var registrarDb;
var sc;
var HttpSession;
describe('Test SessionController', function(){
  before(function(done){
    mockery.enable();
    mockery.warnOnReplace(false);
    mockery.warnOnUnregistered(false);
    mockery.registerMock('../config/conftool', mockConfig);
    mockery.registerMock('./config/conftool', mockConfig);
    //bootstrap libraries that require mocks
    var SessionController = require('../lib/SessionController');
    HttpSession = require('../lib/HttpSession');
    sc = SessionController.getInstance();
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
    done();
  });
  it("SessionController getLinkerType returns the correct linker", function(done){
    var callerBasic = new HttpSession({role: 'caller', to: 'test@example.net', 
                                           from: 'bryan@example.net', display: 'rtcwithme', 
                                           callbackUrl: 'http://127.0.0.1:8081/session/', 
                                           sessid: '12382-238823-82388238-8234kjsdk-238234'});
    var type = sc.getLinkerType(callerBasic);
    assert.equal(type, 'basic');
    var callerSiphttp = new HttpSession({role: 'caller', to: 'test@example.net', 
                                           from: 'bryan@ims.example.net', display: 'rtcwithme', 
                                           callbackUrl: 'http://127.0.0.1:8081/session/', 
                                           sessid: '12382-238823-82388238-8234kjsdk-238234'});
    var type = sc.getLinkerType(callerSiphttp);
    assert.equal(type, 'siphttp');
    var callerHttpSip = new HttpSession({role: 'caller', to: 'test@ims.example.net', 
                                           from: 'bryan@example.net', display: 'rtcwithme', 
                                           callbackUrl: 'http://127.0.0.1:8081/session/', 
                                           sessid: '12382-238823-82388238-8234kjsdk-238234'});
    var type = sc.getLinkerType(callerHttpSip);
    assert.equal(type, 'httpsip');

    done();  
  });
  it("SessionController _listen", function(done){
    var i1 = new HttpSession({role: 'caller', to: 'test@kabletown.com', 
                                           from: 'bryan@kabletown.com', display: 'rtcwithme', 
                                           callbackUrl: 'http://127.0.0.1:8081/session/', 
                                           sessid: '12382-238823-82388238-8234kjsdk-238234'});
    sc.sessions[i1.sessid] = i1;
    //sanity check
    assert.equal(sc.sessions[i1.sessid], i1);
    sc._listen(i1);
    i1.emit('deleteMe');
    setTimeout(function(){
      //if listener was set up correctly session should be deleted from sessions
      assert.equal(sc.sessions[i1.sessid], null);
      done();
    }, 50);
  });
  it("SessionController _linkSessions", function(done){
    var i1 = new HttpSession({role: 'caller', to: 'test@kabletown.com', 
                                           from: 'bryan@kabletown.com', display: 'rtcwithme', 
                                           callbackUrl: 'http://127.0.0.1:8081/session/', 
                                           sessid: '12383-238823-82388238-8234kjsdk-238234'});
    var i2 = new HttpSession({role: 'callee', to: 'test@kabletown.com', 
                                           from: 'bryan@kabletown.com', display: 'rtcwithme', 
                                           callbackUrl: 'http://127.0.0.1:8081/session/', 
                                           sessid: '12384-238823-82388238-8234kjsdk-238234'});
    sc.sessions[i1.sessid] = i1;
    sc.sessions[i2.sessid] = i2;
    sc._listen(i1);
    sc._listen(i2);
    sc._linkSessions(i1, i2, 'basic');
    i1.emit('deleteMe');
    i2.emit('deleteMe');
    done();
  });
  it("SessionController createSessions http to http", function(done){
    var obj = {userid: 'test@kabletown.com', callbackUrl: 'http://127.0.0.1:8081/session/', ttl: 5000};
    registrarDb.save(obj, function(){
    });
    var uuid = sc.createSessions({to: 'test@kabletown.com',
                       from: 'bryan@kabletown.com', display: 'rtcwithme',
                       callbackUrl: 'http://127.0.0.1:8081/session/'});
    assert.ok(sc.sessions[uuid]);
    assert.ok(sc.sessions[uuid].http);
    done();
  });
  it("SessionController createSessions http to sip", function(done){
    //TODO
    done(); 
  });
  it("SessionController createSessions sip to sip", function(done){
    //TODO
    done(); 
  });
  it("SessionController createSessions sip to http", function(done){
    //TODO
    done(); 
  });
  it("SessionController addMessage", function(done){
    //TODO
    done(); 
  });
  it("SessionController endSession", function(done){
    //TODO
    done(); 
  });
});
