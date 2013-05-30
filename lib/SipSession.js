var uuid = require('node-uuid'),
util = require('util'),
EventEmitter = require('events').EventEmitter,
sdpParser = require('./SdpParser.js'),
logger = require('./logwinston'),
SipHelper = require('./SipHelper.js'),
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
    //The sip id of the sessions current dialog, created after the first invite
    this.id = null; 
    //Use passed in options to form a SipHelper suited for proper routing
    this.helper = new SipHelper(opts.options);
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
    var invite = this.helper.createInvite(this.to, this.from, this.display, msg.sdp);
    this.id = this.helper.getLocalId(invite);
    logger.log('info', "Created invite with sip Id of " + this.id); 
    this.cseq = invite.headers.cseq.seq;

    //initial Offer with Ice candidates
    this.messageEndpoint(invite);
  }else if(msg.type === 'bye'){
    
    var bye = this.helper.createBye(this);
    this.messageEndpoint(bye);
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
// addMessage will take parsed sip objects, and turn them into JSEP messaging.
SipSession.prototype.addMessage = function(message) {
  var type = (message.method) ? message.method : message.status ;
  var newMessage = null;
  logger.log('info', " SipSession.addMessage got a message " + type, message);
  switch(type){
    case "INVITE":
      newMessage = {
        sdp : message.content,
        type: 'offer',
        to: message.to,
        from: message.from
      }
    break;

    case 200:
      //Update the sip ID of the session when we get a response
      logger.log('info', 'SipSession: ' + this.id  + ' old id'); 
      this.id = this.helper.getRemoteId(message);
      logger.log('info', 'SipSession: ' + this.id  + ' new id'); 
      newMessage = {
        sdp : message.content,
        type: 'answer',
        to: message.to,
        from: message.from
      }

    break;
    default:
      logger.log('error', 'Unsupported add message type');
    break;
  }

  if (!newMessage) return;

  this.messageLinkedSession(newMessage);

}

SipSession.prototype.endSession = function(message){
  var message = {'type': 'bye'};
  message.to = this.to;
  message.from = this.from;
  this.messageLinkedSession(message);
  this.emit('deleteMe');
}

module.exports = SipSession;
