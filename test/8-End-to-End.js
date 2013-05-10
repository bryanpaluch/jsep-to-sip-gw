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
      ]
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
var instance;

describe('End-To-End Functional tests', function(){
  before(function(done){
    mockery.deregisterAll();
    mockery.disable();
    mockery.enable();
    mockery.warnOnReplace(false);
    mockery.warnOnUnregistered(false);
    mockery.registerMock('../config/conftool', mockConfig);
    mockery.registerMock('./config/conftool', mockConfig);
    //bootstrap libraries that require mocks
    httpserver.use(restify.acceptParser(httpserver.acceptable));
    httpserver.use(restify.queryParser());
    httpserver.use(restify.bodyParser({mapParams: false}));
    httpserver.post('/session/:uuid', testController);
    httpserver.listen(8082, function () {
      done();
    });


  });
  after(function(done){
    instance.stop();
    mockery.deregisterAll();
    mockery.disable();
    done();
  });
  it("End-to-End start server", function(done){
    instance = require('../server.js');
    done(); 
  });
});
