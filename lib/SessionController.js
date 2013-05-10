var sip = require('sip'),
uuid = require('node-uuid'),
util = require('util'),
EventEmitter = require('events').EventEmitter,
logger = require('./logwinston'),
Linker = require('./Linker'),
HttpSession = require('./HttpSession'),
config = require('../config/conftool').getConf();


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
    this._listen(caller);
    caller.activate();

    //Create Callee leg for HTTP Session
	  var sessid = uuid.v1();
    data.role = "callee";
    data.sessid = sessid;
    data.callbackUrl = null;
    var callee = new HttpSession(data);
	  this.sessions[sessid] = callee;
    this._listen(callee);

    var type = this.getLinkerType(caller);
    logger.log('info', 'Using ' + type + ' call linker');
    //Link the two sessions, this initiates the other leg
    this._linkSessions(caller,callee, type);
  }else if(data.contact){

  }
  return caller.sessid;
}
SessionController.prototype.getLinkerType = function(session){
  function getDomain(alias){
    return alias.substring(alias.lastIndexOf("@") + 1);
  }
  var fromdomain = getDomain(session.from);
  var todomain = getDomain(session.to);
  console.log(fromdomain, todomain);
  var type = config.routing[[fromdomain,todomain].join(':')];
  if (type){
    return type;
  }
  else{
    return 'basic'
  }
}
//Holds clean up functions
SessionController.prototype._listen = function(session){
  var self = this; 
  session.on('deleteMe', function(){
    delete self.sessions[session.sessid];
  });
}

SessionController.prototype._linkSessions = function(caller, callee, linkType){
  logger.log('info', 'linking sessions ' + caller.sessid + ' and ' + callee.sessid);
  var linker = new Linker ({
    caller: caller,
    callees: [callee],
    type: linkType
  });
  callee.initiateLeg();
}

SessionController.prototype.addMessage = function(sessid, data, cb){
	if (this.sessions[sessid]) {
    var self = this; 
    process.nextTick(function(){
      self.sessions[sessid].addMessage(data)
    });
    if(cb)
      cb(true);
  }else{
    if(cb)
      cb(false);
    logger.log('error', 'Session not found' + sessid);
  }
}



SessionController.prototype.endSession = function(uuid){
	if (this.sessions[uuid]) {
    this.sessions[uuid].endSession(function(){}); 
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

