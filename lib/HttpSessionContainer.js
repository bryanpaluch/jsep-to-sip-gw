var uuid = require('node-uuid'),
util = require('util'),
EventEmitter = require('events').EventEmitter,
sdpParser = require('./sdpParser.js'),
logger = require('./logwinston'),
request = require('request'),
registrarDb = require('../lib/registrar_db').getDb();

function HttpSession(options){
		this.msg = {
			sdp: '',
			candidates: []
		};
    this.sessid = sess;
    this.role = opts.role;
		this.calldirection = opts.calldirection || 'sipbound';
    this.inviteSent = false;
    this.id = null; 
    this.accepted = (this.role == 'caller') : true ? false;
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
    registrardb.get(this.to, function(err, regs){
      if(regs){ 
        self.callbackUrl = regs[0].callbackUrl; 
        var msg = {to: self.to, from: self.from, type: 'invite', uuid: self.uuid};
      
      }else{
        this.linkedSession.emit('fromLinked', {type: 'invite', failure: true, reason:'404'});
      }
    });
  }
}

HttpSession.prototype.messageEndpoint = function(msg, cb){
  request({method: 'POST', uri: this.callbackUrl + this.sessid,
           json: true, body: msg},
          function(error, response, body){
            if(error)
              logger.log('Problem reaching endpoint');
            cb();
            });
}

HttpSessionContainer.prototype.AddMessage = function(sess, message) {
	if (this.sessions[sess]) {
    switch(this.sessions[sess].calldirection){
      //Call starts from HTTP ROAP needed to gather Offer candidates
      case 'sipbound':
        if (message.sdp) {
          this.sessions[sess].msg.sdp = message.sdp;
        }
        else if (message.type == 'candidate') {
          if (message.last && !this.sessions[sess].inviteSent){
            this.sendToSipGW(this.sessions[sess].msg, sess);
            this.sessions[sess].inviteSent = true; 
          }
          else if (this.sessions[sess].inviteSent){
            logger.log('info', "invite already sent");
          }
          else {

}

function HttpSessionContainer(options) {
	this.options = options || {};
	this.sessions = {};
	logger.log('info', 'HttpSessionContainer Created...');
}

util.inherits(HttpSessionContainer, EventEmitter);


HttpSessionContainer.prototype.addSession = function(opts, callback) {
	var sess = uuid.v1();
	this.sessions[sess] = {};
	this.sessions[sess] = new HttpSession(opts);
  if(opts.calldirection == 'httphttp'){
    var self = this;
    process.nextTick(self.handleHttpBoundCall(sess));
  }
	return this.sessions[sess];
};

HttpSessionContainer.prototype.AddMessage = function(sess, message) {
	if (this.sessions[sess]) {
    switch(this.sessions[sess].calldirection){
      //Call starts from HTTP ROAP needed to gather Offer candidates
      case 'sipbound':
        if (message.sdp) {
          this.sessions[sess].msg.sdp = message.sdp;
        }
        else if (message.type == 'candidate') {
          if (message.last && !this.sessions[sess].inviteSent){
            this.sendToSipGW(this.sessions[sess].msg, sess);
            this.sessions[sess].inviteSent = true; 
          }
          else if (this.sessions[sess].inviteSent){
            logger.log('info', "invite already sent");
          }
          else {
            this.sessions[sess].msg.candidates.push({
            candidate: message.candidate,
            label: message.label,
            id: message.id
            });
          }
      }
      break;
    //Call starts from SIP domain ROAP needed to gather Answer candidates
    case 'httpbound':
      break;
    //Short circuited use case, call orig from web and ends at web without hitting SIP domain, No ROAP
    case 'httphttp':
      break;
    }
  }
};

HttpSessionContainer.prototype.EndSession = function(sessid){
  //  var bye = this.helper.createBye(this.sessions[sessid]);
  //  sip.send(bye);
  delete this.sessions[sessid];
};
//Dips registrarDb if it gets endpoints continues call
//If it doesn't emit {type: 'notfound'} to the requesting session
HttpSessionContainer.prototype.HandleHTTPCall = function(sessid){
  if(this.sessions[sessid]){
    var self = this;
    registrarDb.get({userid: this.sessions[sessid].to},function(err, regs){  
      if(regs){
      }else{
        //Emit a not found to notify initiaiting session that this does't exist
        handler.emit(sessid, {type: 'notfound'});
      }
    });
  }else{
    handler.emit(sessid, {type: 'notfound'});
  }
}

module.exports = HttpSessionContainer;
