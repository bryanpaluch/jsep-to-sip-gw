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
var Linker;
describe('Test Linker', function(){
  before(function(done){    
    mockery.enable();
    mockery.warnOnReplace(false);
    mockery.warnOnUnregistered(false);
    mockery.registerMock('../config/conftool', mockConfig);
    mockery.registerMock('./config/conftool', mockConfig);
    Linker = require('../lib/Linker.js');
 
    done();
  });
  after(function(done){
    mockery.disable();
    done();
  });

  it("Linker constructor, throws if opts are missing", function(done){
   assert.throws(function(){
      console.log('creating bad linker');   
      var linker = new Linker();
    });
    done();
  });
  var session1;
  var session2;
  var linker;
  it("Linker constructor,  takes endpoints and calls thier link functions" , function(done){
    var sessionsLinked = 0; 
    session1 = {
      linker : null,
      link : function(linker){
        this.linker = linker;
        sessionsLinked++;
        if(sessionsLinked === 2) done()
      },
      messageLinked : function(msg){
        this.linker(msg);
      }
    }
    session2 = {
      linker : null,
      link : function(linker){
        this.linker = linker;
        sessionsLinked++;
        if(sessionsLinked === 2) done()
      },
    }
    linker = new Linker({
      caller: session1,
      callees: [session2],
      type: 'basic'
    });
  });
  it("Basic linker sends messages between links without messing with the message" , function(done){
    var testmsg = { foobar: 'foo' }; 
    session2.messageFromLinked = function(msg){
      assert.equal(msg, testmsg); 
      done();
    }
    session1.messageLinked(testmsg);
  });
});

