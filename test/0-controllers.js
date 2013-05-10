var mockery = require('mockery');
var assert = require('assert');
var restify = require('restify');

var httpclient = restify.createJsonClient({
  version: '*',
  url: 'http://127.0.0.1:8080'
});

var mockConfig = {
  getConf: function(){
    return {
      httpport: 8080,
      outboundproxy: '127.0.0.1:5080',
      domain: 'cabletownlabs',
      localHost: '127.0.0.1:5060',
      org: 'cabletownlabs'
    }
  }
}

var SessionControllerMock =
{
    getInstance :  function(options){
      return {
        createSessions : function(options){
          return '8e183130-81b5-11e2-8507-c93c53794ef2';
        },
        addMessage : function(sess, data, cb){
          cb(true);
        },
        endSession : function(option){
          return;
        }
      }
    }
}

var instance;

describe('Test Rest Interface', function(){
  before(function(done){
    mockery.enable();
    mockery.registerMock('../lib/SessionController', SessionControllerMock);
    mockery.registerMock('../config/conftool', mockConfig);
    mockery.registerMock('./config/conftool', mockConfig);
    mockery.warnOnReplace(false);
    mockery.warnOnUnregistered(false);
    instance = require('../server.js');
    done();
  });
  after(function(done){
    instance.stop();
    mockery.deregisterMock('../lib/SessionController');
    mockery.disable();
    done();
  });
  it("Should respond 200 OK if it receives a post /session it should return a calldirection of sip for number based to field", function(done){
    var data = {
      callbackUrl: 'http://127.0.0.1:3000/session', 
      to: '2225553333',
      from: 'u--234kjwerlkjwer',
      fromDisplay: 'rtcgateway'
    }
    httpclient.post('/session', data,
      function(err, req, res, data){
        if(err){
          done(new Error("Problem with http POST " +JSON.stringify(data)));
        }else{
          assert.equal(res.statusCode, 200);
          assert.ok(data.uuid)
          assert.equal(data.session,'active');
          assert.equal(data.calldirection, 'sip');
          done();
        }
      }
    );
  });
  it("Should respond 200 OK if it receives a post /session it should return http direction for string based to field", function(done){
    var data = {
      callbackUrl: 'http://127.0.0.1:3000/session', 
      to: 'bryan@cable.net',
      from: 'u--234kjwerlkjwer',
      fromDisplay: 'rtcgateway'
    }
    httpclient.post('/session', data,
      function(err, req, res, data){
        if(err){
          done(new Error("Problem with http POST " +JSON.stringify(data)));
        }else{
          assert.equal(res.statusCode, 200);
          assert.ok(data.uuid)
          assert.equal(data.session,'active');
          assert.equal(data.calldirection, 'http');
          done();
        }
      }
    );
  });
  it("Should respond with a 400 Bad Request if it receives a POST /session with missing data", function(done){
    var data = {
      callbackUrl: 'http://127.0.0.1:3000/session', 
      fromDisplay: 'rtcgateway'
    }
    httpclient.post('/session',data,
      function(err, req, res, data){
        assert.equal(res.statusCode, 400);
        done();
      }
    );
  });
  it("Should respond with a 200 OK if it receives a PUT /session/:uuid", function(done){
    var data ={ type: 'candidate',
                label: 0,
                id: 'audio',
                candidate: 'a=candidate:105216196 2 tcp 1509957375 147.191.223.141 3770 typ host generation 0\r\n',
                target: '2155544944',
                from: 'uW-zIIrmhIWROp7Kec4V' };
    httpclient.put('/session/8e183130-81b5-11e2-8507-c93c53794ef2',data,
      function(err, req, res, data){
        if(err) 
          done(new Error("Problem with http POST " + JSON.stringify(data)));
        assert.equal(res.statusCode, 200);
        done();
      }
    );
  });
  it("Should respond with a 200 OK if it receives a DELETE /session/:uuid", function(done){
    httpclient.del('/session/8e183130-81b5-11e2-8507-c93c53794ef2',
      function(err, req, res, data){
        if(err) 
          done(new Error("Problem with http DELETE " + JSON.stringify(data)));
        assert.equal(res.statusCode, 200);
        done();
      }
    );
  });
  it("Should 200OK POST /reg with correct data", function(done){
    var data = {
      address: 'bryan@kabletown.com',
      callbackUrl: 'http://127.0.0.1:3000/session', 
      ttl: 60 
    }
    httpclient.post('/reg',data,
      function(err, req, res, data){
        console.log(res.body); 
        assert.equal(res.statusCode, 200);
        done();
      }
    );
  });
  it("Should 400 Bad Request POST /reg with incorrect data", function(done){
    var data = {
      callbackUrl: 'http://127.0.0.1:3000/session', 
      ttl: 60 
    }
    httpclient.post('/reg',data,
      function(err, req, res, data){
        console.log(res.body); 
        assert.equal(res.statusCode, 400);
        done();
      }
    );
  });
});
