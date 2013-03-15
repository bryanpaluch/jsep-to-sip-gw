var sip = require('sip'),
uuid = require('node-uuid'),
util = require('util'),
EventEmitter = require('events').EventEmitter,
logger = require('./logwinston'),
SipSession = require('./SipSession'),
HttpSession = require('./HttpSession');


function SessionController(options) {
  this.sessions = {}; 
  this.db = require('../lib/registrar_db').getDb();
  logger.log('info', 'Session Conttroller started ...');
}
//data is an {} with to, from, display, calldirection, maybe callbackUrl or contact
SessionController.prototype.createSessions = function(data){
  //Assume http
  if(data.callbackUrl){
    //Create Caller leg for HTTP Session 
	  var sessid = uuid.v1();
    data.role = "caller";
    data.sessid = sessid;
    var caller = new HttpSession(data);
	  this.sessions[sessid] = caller;
    this.listen(caller);

    //Create Callee leg for HTTP Session
	  var sessid = uuid.v1();
    data.role = "callee";
    data.sessid = sessid;
    data.callbackUrl = null;
    var callee = new HttpSession(data);
	  this.sessions[sessid] = callee;
    this.listen(callee); 

    //Link the two sessions, this initiates the other leg
    this.linkSessions(caller,callee);
  }else if(data.contact){

  }
  return caller.sessid;
}

//Holds clean up functions
SessionController.prototype.listen = function(session){
  var self = this; 
  session.on('deleteMe', function(){
    delete self.sessions[session.sessid];
  });
}

SessionController.prototype.linkSessions = function(caller, callee, linkDirection){
  caller.linkSession(callee);
  callee.linkSession(caller);
  callee.initiateLeg();
}

SessionController.prototype.addMessage = function(sessid, data){
	if (this.sessions[sess]) {
    this.sessions[sess].addMessage(message);
  }else{
    logger.log('error', 'Session not found' + sess);
  }
}



SessionController.prototype.endSession = function(uuid){
	if (this.sessions[sess]) {
    this.sessions[sess].endSession(function(){}); 
  }else{
    logger.log('error', 'Session not found' + sess);
  }
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

