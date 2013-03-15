var config = require('../config/conftool').getConf();
var _ = require('underscore');
var registrarDb = null;


function MemoryDb(){
  this.db = {};

}

MemoryDb.prototype.save = function(data, cb){
  if(!this.db[data.userid]){
    this.db[data.userid] = {};
  }
  if(!this.db[data.userid][data.callbackUrl]){
    this.db[data.userid][data.callbackUrl] = {};
  }
  if(data.ttl != -1){
    this.db[data.userid][data.callbackUrl] = data.ttl + Date.now();
  }else{
    this.db[data.userid][data.callbackUrl] = -1;
  }
  if(cb)
    cb(null);
};

MemoryDb.prototype.delete = function(data, cb){
  if(this.db[data.userid]){
    if(this.db[data.userid][data.callbackUrl]){
      delete this.db[data.userid][data.callbackUrl];
      if(_.isEmpty(this.db[data.userid])){
        delete this.db[data.userid];
      }
    }
  }
  if(cb)
    cb(null);
};

MemoryDb.prototype.get = function(data, cb){
  if(this.db[data.userid]){
    //Only return registrations if they are up to date 
    var registrations = [];
    _.each(this.db[data.userid], function(ttl, callbackUrl){
      if(ttl > Date.now())
        registrations.push({callbackUrl: callbackUrl, userid: data.userid});
    });
    if(registrations.length > 0)
      cb(null, registrations);
    else
      cb(null, null);
  }else{
    cb(null,null);
  }
};

module.exports.connect = function(){
  if(!registrarDb){
    if(config.redisDb){
     registrarDb = new RedisDb(config.redisDb);
    }else{
     registrarDb = new MemoryDb();
     console.log('created memory Db');
    }
  }else{
  }
};

module.exports.getDb =  function() {
  if(registrarDb){
    return registrarDb;
  }else{
    this.connect();
    return registrarDb;
  }
};
