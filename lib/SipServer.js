var sip = require('sip'),
uuid = require('node-uuid'),
util = require('util'),
EventEmitter = require('events').EventEmitter,
logger = require('./logwinston'),
SessionController = require('../lib/SessionController'),
SipHelper = require('./SipHelper.js'),
helper = new SipHelper();

function rstring() {
	return Math.floor(Math.random() * 1e6).toString();
}

function SipServer(options) {
  this.sc = require('../lib/SessionController').getInstance();
	logger.log('info', 'SipServer Listening...');
  this.sessions = {};
}


SipServer.prototype.start =  function(opts) {
  var self = this;
	var siplog = {
		send: function(message, address) {
				logger.log('info', 'send to ' + address.address + ':' + address.port + '\n' + sip.stringify(message));
			},
			recv: function(message, address) {
				logger.log('info', 'recv from ' + address.address + ':' + address.port + '\n' + sip.stringify(message));
			},
      error: function(e){
        logger.log('error', e.stack);
      }
  };
  logger.log('info', "Sip server starting on port " + opts.sipport);
	self.server = sip.create({port: opts.sipport, logger: siplog},
	function(rq) {
		if (rq.headers.to.params.tag) {
			var id = [rq.headers['call-id'], rq.headers.to.params.tag, rq.headers.from.params.tag].join(':');
			if (self.dialogs[id]) 
        self.dialogs[id](rq);
			else
        sip.send(sip.makeResponse(rq, 481, "Call doesn't exists"));
		}
		else sip.send(sip.makeResponse(rq, 405, 'Method not allowed'));
	});
};
SipServer.prototype.sendMessage = function(msg, sessid){
  var self = this;
  if(msg.method === "INVITE"){
    var id = helper.getLocalId(msg);
    logger.log('info', 'Setting session in sip server ' + id); 
    self.sessions[id] = sessid;
  }
  logger.log('info', null, self.sessions);
  logger.log('info', null, msg);
  self.server.send(msg, self.handleResponses.bind(self));
}
SipServer.prototype.handleResponses = function(rs){
  var self = this;
  var sessid;
  //grab the sessionid and then update its pointer with the remoteId
  if(rs.headers.cseq.method === "INVITE"){
    var id = helper.getLocalId(rs);
    sessid = self.sessions[id];
    logger.log('info', "Got an invite changing the sip id " + id + " " + helper.getRemoteId(rs)); 
    self.sessions[helper.getRemoteId(rs)] = sessid;
  }

  if(!sessid) sessid = self.sessions[helper.getRemoteId(rs)];
  console.log(helper.getRemoteId(rs));
  console.log(self.sessions); 
  console.log(sessid);
 if(rs.headers.cseq.method === "INVITE"){
    if(rs.status >= 300){
      logger.log('error', 'call failed with status ' + rs.status + ' session ' + sessid);
      //TODO add error message to SessionController
      self.sc.addMessage(sessid, rs);
    }else if ( rs.status < 200 ){
      logger.log('info', 'Call progress status ' + rs.status + ' session ' + sessid);
      //TODO add update message to SessionController
    }else if (rs.status == 200){
      logger.log('info', 'Call Answered status ' + rs.status + ' session ' + sessid);
      self.sc.addMessage(sessid, rs);
    }
  }else if(rs.headers.cseq.method === "BYE"){
    if(rs.status >= 300){
      logger.log('error', 'call failed with status ' + rs.status + ' session ' + sessid);
      //TODO add error message to SessionController
      self.sc.addMessage(sessid, rs);
    }else if ( rs.status < 200 ){
      logger.log('info', 'Call progress status ' + rs.status + ' session ' + sessid);
      //TODO add update message to SessionController
    }else if (rs.status == 200){
      logger.log('info', 'Call Answered status ' + rs.status + ' session ' + sessid);
      self.sc.endSession(sessid);
    }
  }
}

SipServer.prototype.stop = function(){
  sip.stop(function(){
  });
}


var serverInstance = null;


module.exports.getInstance = function(){
  if(serverInstance){
    return serverInstance;
  }else{
    throw new Error('Instance hasnt been created yet, reorder requires!')
  }
}

module.exports.send = function(msg, sessid){
  if(serverInstance){
    serverInstance.sendMessage(msg, sessid);
  }else{
    throw new Error('Instance hasnt been created yet, reorder requires!')
  }
}

module.exports.start = function(opts){
  if(serverInstance){
    serverInstance.start(opts);
  }else{
    serverInstance = new SipServer();
    serverInstance.start(opts);
  }
}
module.exports.stop = function(cb){
  if(serverInstance){
    try{
      serverInstance.stop();
      cb();
    }catch(e){
      cb();
      console.log("stop requested, but sip server isn't running"); 
    }
  }else{
    cb();
  }
}
