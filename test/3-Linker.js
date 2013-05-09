
var assert = require('assert');
var Linker = require('../lib/Linker.js');

describe('Test Linker', function(){
  before(function(done){
    done();
  });
  after(function(done){
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

