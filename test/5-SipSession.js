var mockery = require('mockery');
var assert = require('assert');
var EventEmitter = new require('events').EventEmitter;
var handler = new EventEmitter();
var i1;
var i2;

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
        'http': {
          'comcast.net:comcast.net' : { linker: 'basic', callee: 'http' },
          'ims.comcast.net:comcast.net' : { linker: 'basic', callee: 'http' },
          'comcast.net:ims.comcast.net' : { linker: 'basic', callee: 'http' },
          'x1.comcast.net:comcast.net' : { linker: 'basic', callee: 'http' },
        },
        'sip' : {
          'comcast.net:comcast.net' : { linker: 'basic', callee: 'http' },
          'ims.comcast.net:comcast.net' : { linker: 'basic', callee: 'http' },
          'x1.comcast.net:x1.comcast.net' : { linker: 'basic', callee: 'http' },
        }
      }
    }
  }
}

var registrarDb;
var SipSession;
var sipServer;
describe('Test SipSession', function(){
  before(function(done){
    mockery.enable({useCleanCache: true});
    mockery.warnOnReplace(false);
    mockery.warnOnUnregistered(false);
    mockery.registerMock('../config/conftool', mockConfig);
    mockery.registerMock('./config/conftool', mockConfig);
    //bootstrap libraries that require mocks
    SipSession = require('../lib/SipSession');
    sipServer = require('../lib/SipServer');
    sipServer.start({sipport: 6000});
    done();
  });
  after(function(done){
    mockery.disable();
    sipServer.stop(function(){
      done();
    });
  });
  it("SipSession constructor", function(done){
    i1 = new SipSession({role: 'caller', to: 'test@kabletown.com', 
                                           from: 'bryan@kabletown.com', display: 'rtcwithme', 
                                           callbackUrl: 'http://127.0.0.1:8081/session/', 
                                           sessid: '12382-238823-82388238-8234kjsdk-238234'});
    assert.equal(i1.role, 'caller');
    assert.equal(i1.sip, true);
    assert.equal(i1.linker, null);
    done();
  });
  
  it("SipSession messageEndpoint", function(done){
    done(); 
  });
  it("SipSession addMessage", function(done){
    done(); 
  });
});
