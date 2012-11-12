var sip = require('sip'),
uuid = require('node-uuid'),
util = require('util'),
EventEmitter = require('events').EventEmitter,
sdpParser = require('./sdpParser.js'),
sipHelper = require('./sip-helper.js'),
logger = require('./logwinston');

function rstring() {
	return Math.floor(Math.random() * 1e6).toString();
}
function Gateway(options) {
	options = options || {};
	this.sessions = {};
	this.dialogs = {};
	this.options = options;
  this.helper = new sipHelper(options);
	this.start();
	logger.log('info', 'JSEP/SIP Gateway created');
}

util.inherits(Gateway, EventEmitter);

Gateway.prototype.start =  function() {
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
  }
	sip.start({logger: siplog, useOutBoundProxy:true},
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
}

Gateway.prototype.AddJSEPSession = function(opts, callback) {
	var sess = uuid.v1();
	this.sessions[sess] = {};
	this.sessions[sess] = {
		cb: callback,
		msg: {
			sdp: '',
			candidates: []
		},
		jsepInitiated: true,
    inviteSent: false,
    id: null, 
    to: opts.to,
    from: opts.from,
    display: opts.display,
    cseq: null 
	};
	return sess;
}

Gateway.prototype.AddJSEPMessage = function(sess, message) {
	if (this.sessions[sess]) {
		if (message.sdp) {
			this.sessions[sess].msg.sdp = message.sdp;
		} else if (message.type == 'candidate') {
			if (message.last && !this.sessions[sess].inviteSent){
        this.sendToSipGW(this.sessions[sess].msg, sess);
        this.sessions[sess].inviteSent = true; 
      }
      else if (this.sessions[sess].inviteSent){
        logger.log('info', "invite already sent");
      }
			else {this.sessions[sess].msg.candidates.push({
				candidate: message.candidate,
				label: message.label,
				id: message.id
			});
      }
		}
	}
}

Gateway.prototype.sendToSipGW= function(msg, sess) {
  var session = sess;
	var sdp = new sdpParser(msg.sdp);
  var self = this;
	for (var x = 0; x < msg.candidates.length; x++) {
		sdp.addCandidate(msg.candidates[x],{'strip_video' :true});
	}
  sdp.strip('video');
  sdp.fixChromeSDP();	
  var sdpPayload = sdp.toString();
	
  var invite = this.helper.createInvite(this.sessions[sess].to, this.sessions[sess].from, this.sessions[sess].display,  sdpPayload);
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
      logger.log('info', 'Call answered with status ' + rs.status +' with tag ' + rs.headers.to.params.tag + 'session= ' + session);
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
      var id = [rs.headers['call-id'], rs.headers.from.params.tag, rs.headers.to.params.tag].join(':');
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
						sip.send(sip.makeRespinse(rq, 405, 'Method not allowed'));
					}
				}
			}
		}
	});
}
Gateway.prototype.EndJSEPSession = function(sessid){
  var bye = this.helper.createBye(this.sessions[sessid]); 
  sip.send(bye);
}
module.exports = Gateway;

