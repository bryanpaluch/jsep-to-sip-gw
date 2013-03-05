var uuid = require('node-uuid'),
util = require('util'),
EventEmitter = require('events').EventEmitter,
sdpParser = require('./sdpParser.js'),
logger = require('./logwinston'),
registrarDb = require('../lib/registrar_db').getDb();

function HttpSessionContainer(options) {
	this.options = options || {};
	this.sessions = {};
	this.start();
	logger.log('info', 'JSEP/SIP Gateway created');
}

util.inherits(HttpSessionContainer, EventEmitter);


HttpSessionContainer.prototype.AddJSEPSession = function(opts, callback) {
	var sess = uuid.v1();
	this.sessions[sess] = {};
	this.sessions[sess] = {
		cb: callback,
		msg: {
			sdp: '',
			candidates: []
		},
		calldirection: opts.calldirection || 'sipbound',
    inviteSent: false,
    id: null, 
    to: opts.to,
    from: opts.from,
    display: opts.display,
    cseq: null
	};
  if(opts.calldirection == 'httphttp'){
    var self = this;
    process.nextTick(self.handleHttpBoundCall(sess));
  }
	return sess;
};

HttpSessionContainer.prototype.AddJSEPMessage = function(sess, message) {
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

HttpSessionContainer.prototype.EndJSEPSession = function(sessid){
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
module.exports = Gateway;

