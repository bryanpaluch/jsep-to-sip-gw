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
      org: 'Kabletownlabs'
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
describe('Test SessionController', function(){
  before(function(done){
    mockery.enable();
    mockery.warnOnReplace(false);
    mockery.warnOnUnregistered(false);
    mockery.registerMock('../config/conftool', mockConfig);
    mockery.registerMock('./config/conftool', mockConfig);
    //bootstrap libraries that require mocks
    var SessionController = require('../lib/SessionController');
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
  it("SessionController listen", function(done){
    //TODO
    done(); 
  });
  it("SessionController linkSessions", function(done){
    //TODO
    done(); 
  });
  it("SessionController createSessions http to http", function(done){
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
