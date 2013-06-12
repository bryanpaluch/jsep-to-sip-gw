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
        { name: 'basic', run: true, config : {}},
        { name: 'httpsip', run: true, config : {}}
      ],
      routing: {
        'http': {
          'example.net:example.net' : { linker: 'basic', callee: 'http' },
          'example.net:ims.example.net' : { linker: 'httpsip', callee: 'sip', 
            calleeOpts: {outboundproxy: '127.0.0.1:9009', localhost: '127.0.0.1:5063' }},
          'kabletown.com:kabletown.com' : { linker: 'basic', callee: 'http' },
          'x1.comcast.net:comcast.net' : { linker: 'basic', callee: 'http' },
        },
        'sip' : {
          'ims.example.net:example.net' : { linker: 'siphttp', callee: 'http' },
          'ims.comcast.net:comcast.net' : { linker: 'basic', callee: 'http' },
          'x1.comcast.net:x1.comcast.net' : { linker: 'basic', callee: 'http' },
        }
      }
    }
  }
}
var HttpEndpoint = require('./test_endpoints/http');
var SipEndpoint = require('./test_endpoints/sip');

var instance;
var he1;
var se1;

describe('End-To-End Functional tests', function(){
  before(function(done){
//    var serverp = path.resolve('../server.js');
//    delete require.cache[serverp];
    he1 = new HttpEndpoint({port: 9000, role: 'answerer'});
    mockery.deregisterAll();
    mockery.disable();
    mockery.enable({useCleanCache:true});
    mockery.warnOnReplace(false);
    mockery.warnOnUnregistered(false);
    mockery.registerMock('../config/conftool', mockConfig);
    mockery.registerMock('./config/conftool', mockConfig);
    //bootstrap libraries that require mocks
    he1.start(function(){ 
      done();
    });
    se1 = new SipEndpoint({port: 9009, role: 'answerer', outboundproxy: '127.0.0.1:5063', localhost: '127.0.0.1:9009'});
    se1.start();
  });
  after(function(done){
    se1.stop();
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
    console.log('starting http-http test');
    console.log(instance);
    var user1 = "test1@example.net";
    var user2 = "test2@example.net";
    he1.register(user1);
    he1.register(user2);
    var callbackCount = 0;
    var callbacksRequired = 4;
    var countAndExit = function(){
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
        setTimeout(function(){
          he1.endcall(user1, user2);
        }, 20);
      });
      he1.once('gotBye:' + user1 + ':' + user2, function(callInfo){
        console.log('got the bye'); 
        countAndExit();
      });
    });
  });
  it("End-to-End http to sip call", function(done){
    console.log('starting http to sip call');
    
    var user1 = "test3@example.net";
    var user2 = "test4@ims.example.net";
    
    he1.register(user1);
    
    var callbackCount = 0;
    var callbacksRequired = 3;
    var countAndExit = function(){
      callbackCount++;
      if(callbackCount == callbacksRequired)
        done();
    }
 
    se1.once('gotOffer:' + user2 + ':' + user1, function(callInfo){
      countAndExit();
    });

    he1.once('gotAnswer:' + user2 + ':' + user1, function(callInfo){
      countAndExit();
      setTimeout(function(){
        he1.endcall(user2, user1);
      }, 20);
    });
    
    he1.once('gotBye:' + user2 + ':' + user1, function(callInfo){
      countAndExit();
    });

    he1.call(user2, user1);
  });
});
