var mockery = require('mockery');
var assert = require('assert');
var path = require('path');
var mockConfig = {
  getConf: function(){
    return {
      httpport: 8082,
      sipport: 5063,
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
//    var serverp = path.resolve('../server.js');
//    delete require.cache[serverp];
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
    instance.stop(function(){
      he1.stop(function(){
        mockery.deregisterAll();
        mockery.disable();
        done();
      });
    });
  });
  it("End-to-End start server", function(done){
    console.log('starting server'); 
    instance = require('../server.js');
    instance.start(function(){
      console.log('server started');
      done();
    });
  });
  it("End-to-End basic http-http call", function(done){
    console.log('starting functional test');
    console.log(instance);
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
        console.log('got the offer'); 
        countAndExit();
      });
      he1.once('gotAnswer:' + user1 + ':' + user2, function(callInfo){
        console.log('got the answer');
        countAndExit();
      });
    });
  });
});
