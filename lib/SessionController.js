var sip = require('sip'),
uuid = require('node-uuid'),
util = require('util'),
EventEmitter = require('events').EventEmitter,
logger = require('./logwinston'),
SipSessionContainer = require('./SipSessionContainer');
HttpSessionContainer = require('./HttpSessionContainer');


function SessionController(options) {
  this.http = new HttpSessionContainer();
  this.sip = new SipSessionContainer();
  this.db = require('../lib/registrar_db').getDb();
  logger.log('info', 'Session Container Started...');
}



var instance = null;

module.exports.getInstance = function(){
  if(instance){
    return instance;
  }else{
    instance = new SessionController();
    return instance;
  }
}

