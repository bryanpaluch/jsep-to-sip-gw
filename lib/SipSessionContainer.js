var sip = require('sip'),
uuid = require('node-uuid'),
util = require('util'),
EventEmitter = require('events').EventEmitter,
sdpParser = require('./sdpParser.js'),
sipHelper = require('./sip-helper.js'),
logger = require('./logwinston'),
registrarDb = require('../lib/registrar_db').getDb();

function rstring() {
	return Math.floor(Math.random() * 1e6).toString();
}
function SipSessionContainer(options) {
	this.options = options || {};
	this.sessions = {};
	this.dialogs = {};
  this.helper = new sipHelper(options);
	logger.log('info', 'SipSessionContainer created');
}

util.inherits(SipSessionContainer, EventEmitter);


SipSessionContainer.prototype.AddSession = function(opts, callback) {
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

SipSessionContainer.prototype.AddMessage = function(sess, message) {
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

SipSessionContainer.prototype.sendToSipGW= function(msg, sess) {
  var session = sess;
	var sdp = new sdpParser(msg.sdp);
  var self = this;
	for (var x = 0; x < msg.candidates.length; x++) {
		sdp.addCandidate(msg.candidates[x],{'strip_video' :true});
	}
  sdp.strip('video');
  sdp.fixChromeSDP();	
  var sdpPayload = sdp.toString();
	
  var invite = this.helper.createInvite(this.sessions[sess].to, 
                                        this.sessions[sess].from, this.sessions[sess].display,  sdpPayload);
  this.sessions[session].id = [invite.headers['call-id'], 
                               invite.headers.to, 
                               invite.headers.from.params.tag].join(':');
  this.sessions[sess].cseq = invite.headers.cseq.seq;
  sip.send(invite,
	function(rs) {
		if (rs.status >= 300) {
			logger.log('error', 'call failed with status ' + rs.status + ' session= ' + session);
		}
		else if (rs.status < 200) {
			logger.log('info', 'Call progress status ' + rs.status + ' session= ' + session);
		}
		else if (rs.status == 200){
      logger.log('info', 'Call answered with status ' + 
                 rs.status +' with tag ' + rs.headers.to.params.tag + 'session= ' + session);
      var sipTrunksdp = new sdpParser(rs.content, {type : 'asterisk'});
      var jsepAnswer =  sipTrunksdp.toJSEP();
      self.emit(session, {type: 'answer', sdp:jsepAnswer.sdp, voiceOnly: true});
      setTimeout(function(){self.emit(session, {type: 'candidates', candidates:jsepAnswer.candidates});}, 50);
      sip.send({
				method: 'ACK',
				uri: rs.headers.contact[0].uri,
				headers: {
					to: rs.headers.to,
					from: rs.headers.from,
					'call-id': rs.headers['call-id'],
					cseq: {
						method: 'ACK',
						seq: rs.headers.cseq.seq
					},
					via: []
				}
			});
      var id = [rs.headers['call-id'],
                rs.headers.from.params.tag,
                rs.headers.to.params.tag].join(':');
      self.sessions[session].id = id;
      if (!self.dialogs[id]) {
        //Set the callback to handle later requests
				self.dialogs[id] = function(rq) {
					if (rq.method === 'BYE') {
						logger.log('info', 'call received bye ' + session);
            self.emit(session, {type: 'bye'});
						delete self.dialogs[id];
						sip.send(sip.makeResponse(rq, 200, 'Ok'));
					}
					else {
						sip.send(sip.makeResponse(rq, 405, 'Method not allowed'));
					}
				};
			}
		}
	});
};
SipSessionContainer.prototype.EndSession = function(sessid){
  var bye = this.helper.createBye(this.sessions[sessid]);
  sip.send(bye);
  delete this.sessions[sessid];
};
//Dips registrarDb if it gets endpoints continues call
//If it doesn't emit {type: 'notfound'} to the requesting session
SipSessionContainer.prototype.LinkCall = function(sessid){
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

module.exports = SipSessionContainer;
