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
    done();
  });
  after(function(done){
    instance.stop();
    mockery.deregisterAll();
    mockery.disable();
    done();
  });
  it("End-to-End start server", function(done){
    instance = require('../server.js');
    console.log('starting server'); 
    setTimeout(function(){
      done();
    }, 100);
  });
  it("End-to-End basic http-http call", function(done){
    he1.register("test1@example.net");
    he1.register("test2@example.net");
    he1.on('registered:test2@example.net', function(){
      he1.call("test1@example.net", "test2@example.net");
      he1.once('connected:test1:test2', function(callInfo){
        assert.ok(callInfo);
        done();
      });
    });
  });
});
