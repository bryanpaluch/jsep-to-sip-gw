var uuid = require('node-uuid'),
util = require('util'),
EventEmitter = require('events').EventEmitter,
sdpParser = require('./SdpParser.js'),
logger = require('./logwinston'),
sipHelper = require('./sip-helper.js'),
SipServer = require('./SipServer');

function SipSession(opts){
		this.msg = {
			sdp: '',
			candidates: []
		};
    this.sessid = opts.sessid;
    //'caller' or 'callee'
    this.role = opts.role;
    this.inviteSent = false;
    this.id = null; 
    this.accepted = (this.role == 'caller') ? true : false;
    this.type = 'sip';
    this.to= opts.to;
    this.from= opts.from,
    this.display= opts.display;
    this.cseq= null;
    this.sip = true;
    this.linker = null;
    this.undelivered = [];
};

util.inherits(SipSession, EventEmitter);
//For the outbound leg, dips into DB to search for the endpoint, and reaches out if it exists
//Updates pass to linked Session
SipSession.prototype.initiateLeg = function(){
  var self = this;
  if(this.role == 'callee'){
  }else{
    logger.log('info', 'no to field in leg to be initiated ' + this.sessid);
  }
}

SipSession.prototype.messageLinkedSession = function(msg, cb){
  this.linker(msg);
  if(cb)
    cb();
}
//Wraps the linker function so that it always calls with a ref to the caller
SipSession.prototype.link = function(linker){
  var self = this;
  this.linker = linker;
}

SipSession.prototype.messageFromLinked = function(msg){
  //Only send messages to active sessions, unless its an offer then always send it.
  if(msg.type === 'offer' && !this.inviteSent){
    
    //initial Offer with Ice candidates
    this.messageEndpoint(msg, function(){
    });
  }else{
    this.undelivered.push(msg);
  }
}

SipSession.prototype.messageEndpoint = function(msg, cb){
  // SipServer wraps every sent SIP message with the same callback that hooks 
  // into the main SipServer instance of the individual SipSessions
  SipServer.send(msg, this.sessid);
}

SipSession.prototype.activate = function(){
  this.active = true;
  console.log('SipSession ' + this.sessid + ' activated');

  if(this.undelivered > 0){
    var self = this;
    this.undelivered.forEach(function(msg){
      self.messageEndpoint(msg);
    });
  }
}

SipSession.prototype.addMessage = function(message) {
      //test to see if the message is an answer to an offer, if it is, activate the session
      //and send undelivered
      if(message.type === 'answer'){
        console.log('got an answer unlocking session');
        this.activate();
      }

      this.messageLinkedSession(message);
}

SipSession.prototype.endSession = function(message){
  var message = {'type': 'bye'};
  this.messageLinkedSession(message);
  this.emit('deleteMe');
}

module.exports = SipSession;
