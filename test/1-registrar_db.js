var mockery = require('mockery');
var assert = require('assert');

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
var registrarDb;
describe('Test Memory-RegistrarDB', function(){
  before(function(done){
    mockery.enable();
    mockery.warnOnReplace(false);
    mockery.warnOnUnregistered(false);
    mockery.registerMock('../config/conftool', mockConfig);
    mockery.registerMock('./config/conftool', mockConfig);
    require('../lib/registrar_db').connect();
    registrarDb = require('../lib/registrar_db').getDb();
    done();
  });
  after(function(done){
    mockery.disable();
    done();
  });
  it("memoryDb.save(obj,cb) should save a registration", function(done){
    var obj = {userid: 'bryan@cable.net', callbackUrl: 'http://127.0.0.1:3000/session', ttl: 30};
    registrarDb.save(obj, function(err){
      assert.equal(err, null);
      assert.ok(registrarDb.db[obj.userid]);
      done();
    });
  });
  it("memoryDb.get(obj,cb) should return (null, null) for an item that does not exist", function(done){
    var obj = {userid: 'bryan@cable.net', callbackUrl: 'http://127.0.0.1:3000/session', ttl: 30};
    registrarDb.save(obj, function(err){
      assert.equal(err, null);
      assert.ok(registrarDb.db[obj.userid]);
    });
    registrarDb.get({userid: 'notbryan@cable.net'}, function(err, regs){
      assert.equal(err, null);
      assert.equal(regs, null);
      done();
    });
  });
  it("memoryDb.get(obj,cb) should return (null, [regs]) for an registration that exists", function(done){
    var obj = {userid: 'bryan@cable.net', callbackUrl: 'http://127.0.0.1:3000/session', ttl: 30};
    registrarDb.save(obj, function(err){
      assert.equal(err, null);
      assert.ok(registrarDb.db[obj.userid]);
    });
    registrarDb.get({userid: 'bryan@cable.net'}, function(err, regs){
      assert.equal(err, null);
      assert.ok(regs);
      assert.equal(regs[0].callbackUrl, 'http://127.0.0.1:3000/session');
      done();
    });
  });
  it("memoryDb.get(obj,cb) should return (null, null) if registrations have expired", function(done){
    var obj = {userid: 'bryan@cable.net', callbackUrl: 'http://127.0.0.1:3000/session', ttl: 30};
    registrarDb.save(obj, function(err){
      assert.equal(err, null);
      assert.ok(registrarDb.db[obj.userid]);
    });
    setTimeout(function(){
      registrarDb.get({userid: 'bryan@cable.net'}, function(err, regs){
        assert.equal(err, null);
        assert.equal(regs, null);
        done();
      });
    }, 50);
  });
  it("memoryDb.save(obj,cb) should save multiple registrations", function(done){
    var obj = {userid: 'bryan@cable.net', callbackUrl: 'http://127.0.0.1:3000/session', ttl: 1000};
    registrarDb.save(obj, function(err){
      assert.equal(err, null);
      assert.ok(registrarDb.db[obj.userid]);
    });
    obj = {userid: 'bryan@cable.net', callbackUrl: 'http://192.168.1.2:3000/session', ttl: 1000};
    registrarDb.save(obj, function(err){
      assert.equal(err, null);
      assert.ok(registrarDb.db[obj.userid]);
    });
    registrarDb.get({userid: 'bryan@cable.net'}, function(err, regs){
      assert.equal(err, null);
      assert.ok(regs);
      assert.equal(regs.length, 2);
      done();
    });
  });
  it("memoryDb.save(obj,cb) should save multiple registrations, but if any expire only return valid ones", function(done){
    var obj = {userid: 'bryan@cable.net', callbackUrl: 'http://127.0.0.1:3000/session', ttl: 1000};
    registrarDb.save(obj, function(err){
      assert.equal(err, null);
      assert.ok(registrarDb.db[obj.userid]);
    });
    obj = {userid: 'bryan@cable.net', callbackUrl: 'http://192.168.1.2:3000/session', ttl: 30};
    registrarDb.save(obj, function(err){
      assert.equal(err, null);
      assert.ok(registrarDb.db[obj.userid]);
    });
    setTimeout(function(){
      registrarDb.get({userid: 'bryan@cable.net'}, function(err, regs){
        assert.equal(err, null);
        assert.ok(regs);
        assert.equal(regs.length, 1);
        done();
      });
    }, 50);
  });
});
