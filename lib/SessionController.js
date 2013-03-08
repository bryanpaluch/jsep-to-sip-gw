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
//data is an {} with to, from, display, calldirection, maybe callbackUrl or contact
SessionController.prototype.addSession = function(data){
  //Assume http 
  if(data.callbackUrl){
    data.role = "caller";
    var caller = this.http.addSession(data);
    data.role = "callee";
    var callee = this.http.addSession(data);
    this.link(caller,callee);
  }else if(data.contact){

  }
  return callerid.sessid;
}

SessionController.prototype.link = function(caller, callee, linkDirection){
  caller.linkedSession = callee;
  callee.linkedSession = caller;
  callee.initiateLeg();

}

SessionController.prototype.addMessage = function(sessid, data){


}

SessionController.prototype.endSession = function(uuid){


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

