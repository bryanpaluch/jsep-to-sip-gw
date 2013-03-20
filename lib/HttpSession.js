var uuid = require('node-uuid'),
util = require('util'),
EventEmitter = require('events').EventEmitter,
sdpParser = require('./SdpParser.js'),
logger = require('./logwinston'),
request = require('request'),
registrarDb = require('../lib/registrar_db').getDb();

function HttpSession(opts){
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
    this.to= opts.to;
    this.from= opts.from,
    this.display= opts.display;
    this.cseq= null;
    this.http= true;
    this.callbackUrl= opts.callbackUrl;
    this.linkedSession = null;
    this.undelivered = [];
};

util.inherits(HttpSession, EventEmitter);
//For the outbound leg, dips into DB to search for the endpoint, and reaches out if it exists
//Updates pass to linked Session
HttpSession.prototype.initiateLeg = function(){
  var self = this;
  if(this.to){
    registrarDb.get({userid: this.to}, function(err, regs){
      if(regs){ 
        self.callbackUrl = regs[0].callbackUrl; 
        var msg = {to: self.to, from: self.from, type: 'invite', uuid: self.uuid};
        self.messageEndpoint(msg);
      }else{
        logger.log('info', self.toString());
        logger.log('info', 'user ' + self.to + ' not registered messaging failure to linked session ' + self.linkedSession.sessid);
        self.messageLinkedSession({type: 'answer', failure: true, reason: 404});
        self.endSession();
      }
    });
  }else{
    logger.log('info', 'no to field in leg to be initiated ' + this.sessid);
  }
}

HttpSession.prototype.messageLinkedSession = function(msg, cb){
  logger.log('info', 'messaging linked session ' + this.linkedSession.sessid);
  this.linkedSession.emit('fromLinked', msg);
  if(cb)
    cb();
}

HttpSession.prototype.linkSession = function(linkedSession){
  this.linkedSession = linkedSession;
  this.linkedSession.on('fromLinked', this.messageFromLinkedSession);
}

HttpSession.prototype.messageFromLinkedSession = function(msg){
  //Only send messages to active sessions, unless its an offer then always send it.
  if(this.active || msg.type === 'offer' ){
    this.messageEndpoint(msg, function(){
    });
  }else{
    this.undelivered.push(msg);
    console.log('queuing message');
  }
}

HttpSession.prototype.messageEndpoint = function(msg, cb){
  request({method: 'POST', uri: this.callbackUrl + this.sessid,
           json: true, body: msg},
          function(error, response, body){
            if(error)
              logger.log('Problem reaching endpoint');
            if(cb)
              cb();
            });
}

HttpSession.prototype.activate = function(){
  this.active = true;

  if(this.undelivered > 0){
    var self = this;
    this.undelivered.forEach(function(msg){
      self.messageEndpoint(msg);
    });
  }
}

HttpSession.prototype.addMessage = function(message) {
      console.log('sending message  to linkedSession' + this.sessid)
      console.log(message);
      //test to see if the message is an answer to an offer, if it is, activate the session
      //and send undelivered
      if(message.type === 'answer'){
        console.log('got an answer unlocking session');
        this.activate();
      }

      this.messageLinkedSession(message);
}

HttpSession.prototype.endSession = function(message){
  this.emit('deleteMe');
}

module.exports = HttpSession;
