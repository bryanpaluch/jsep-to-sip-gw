var sip = require('sip'),
uuid = require('node-uuid'),
util = require('util'),
EventEmitter = require('events').EventEmitter,
logger = require('./logwinston'),
Linker = require('./Linker'),
HttpSession = require('./HttpSession'),
SipSession = require('./SipSession'),
config = require('../config/conftool').getConf();


function SessionController(options) {
  this.sessions = {}; 
  this.db = require('../lib/registrar_db').getDb();
  logger.log('info', 'Session Conttroller started ...');
}
//data is an {} with to, from, display,  maybe callbackUrl or contact
SessionController.prototype.createSessions = function(data){
  var direction = getDomain(data.from) + ":" + getDomain(data.to);

  //Return a null session id if the to and from aren't in routing table 
  if(!config.routing[data.originator][direction]){
    logger.log('info', direction + " not in routing table");
    return null;
  }

  //Create the originator leg
  var caller; 
  if(data.originator == 'http'){
    //Create Caller leg for HTTP Session 
	  logger.log('info', "originator is an http session");
    var sessid = uuid.v1();
    data.role = "caller";
    data.sessid = sessid;
    caller = new HttpSession(data);
  }else if(data.originator == 'sip'){


  }

  if(!caller) return null;

  this.sessions[sessid] = caller;
  this._listen(caller);
  caller.activate();
  
  var calleeType = config.routing[data.originator][direction].callee;
  var callee; 
  if(calleeType == 'http'){
  
    var sessid = uuid.v1();
    data.role = "callee";
    data.sessid = sessid;
    data.callbackUrl = null;
    data.options = config.routing[data.originator][direction].calleeOpts;
    var callee = new HttpSession(data);

  }else if(calleeType == 'sip'){
    var sessid = uuid.v1();
    data.role = "callee";
    data.sessid = sessid;
    data.options = config.routing[data.originator][direction].calleeOpts;
    var callee = new SipSession(data);

  }
  
  if(!callee) return null;

  this.sessions[sessid] = callee;
  this._listen(callee);
  
  var type = this.getLinkerType(data.originator, direction);
  logger.log('info', 'Call from '  + data.originator  + 'endpoint using ' + type + ' call linker to link to '  + calleeType);
  //Link the two sessions, this initiates the other leg
  this._linkSessions(caller,callee, type);

  return caller.sessid;
}

SessionController.prototype.getLinkerType = function(originator, direction){
  if(!config.routing[originator][direction]) 
    throw new Error('direction not in routing table ' + originator + " " +direction);

  var type = config.routing[originator][direction].linker;
  
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
    logger.log('info', 'DELETING session ' + session.sessid, self.sessions);
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
      //Make sure to and from come from the original session 
      data.to = self.sessions[sessid].to;
      data.from = self.sessions[sessid].from;
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
    var data = {}; 
    data.to = this.sessions[uuid].to;
    data.from = this.sessions[uuid].from;
    this.sessions[uuid].endSession(data);
  }else{
    logger.log('error', 'Session not found' + sess);
  }
}

function getDomain(alias){
    return alias.substring(alias.lastIndexOf("@") + 1);
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

