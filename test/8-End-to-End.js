var mockery = require('mockery');
var assert = require('assert');
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
var HttpEndpoint = require('./test_endpoints/http');

var instance;
var he1;

describe('End-To-End Functional tests', function(){
  before(function(done){
    he1 = new HttpEndpoint({port: 9000, role: 'answerer'});
    mockery.deregisterAll();
    mockery.disable();
    mockery.enable();
    mockery.warnOnReplace(false);
    mockery.warnOnUnregistered(false);
    mockery.registerMock('../config/conftool', mockConfig);
    mockery.registerMock('./config/conftool', mockConfig);
    //bootstrap libraries that require mocks
    he1.start(function(){ 
      done();
    });
  });
  after(function(done){
    instance.stop();
    mockery.deregisterAll();
    mockery.disable();
    he1.stop(function(){
      done();
    });
  });
  it("End-to-End start server", function(done){
    instance = require('../server.js');
    console.log('starting server'); 
    setTimeout(function(){
      done();
    }, 100);
  });
  it("End-to-End basic http-http call", function(done){
    var user1 = "test1@example.net";
    var user2 = "test2@example.net";
    he1.register(user1);
    he1.register(user2);
    var callbackCount = 0;
    var callbacksRequired = 3;
    var countAndExit = function(){
      console.log('count and exit called', callbackCount, callbacksRequired);
      callbackCount++;
      if(callbackCount == callbacksRequired)
        done();
    }
    he1.on('registered:' + user2, function(){
      countAndExit();
      he1.call(user1, user2);
      he1.once('gotOffer:' + user1 + ':' + user2, function(callInfo){
        countAndExit();
      });
      he1.once('gotAnswer:' + user1 + ':' + user2, function(callInfo){
        countAndExit();
      });
    });
  });
});
