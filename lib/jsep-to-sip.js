var sip = require('sip'),
uuid = require('node-uuid'),
util = require('util'),
EventEmitter = require('events').EventEmitter,
sdpParser = require('./sdpParser.js');

var dialogs = {};

function rstring() {
	return Math.floor(Math.random() * 1e6).toString();
}

function start() {
	sip.start({},
	function(rq) {
		if (rq.headers.to.params.tag) {
			var id = [rq.headers['call-id'], rq.headers.to.params.tag, rq.headers.from.params.tag].join(':');
			if (dialogs[id]) dialogs[id](rq);
			else sip.send(sip.makeResponse(rq, 481, "Call doesn't exists"));
		}
		else sip.send(sip.makeResponse(rq, 405, 'Method not allowed'));
	});
}

function Gateway(options) {
	options = options || {};
	this.sessions = {};
	this.dialogs = {};
	this.options = options;
	start();
	util.log('JSEP/SIP Gateway created');
}

util.inherits(Gateway, EventEmitter);

Gateway.prototype.AddJSEPSession = function(callback) {
	var sess = uuid.v1();
	this.sessions[sess] = {};
	this.sessions[sess] = {
		cb: callback,
		msg: {
			sdp: '',
			candidates: []
		},
		jsepInitiated: true
	};
	return sess;
}

Gateway.prototype.AddJSEPMessage = function(sess, message) {
	util.log([sess, util.inspect(message, 3)]);
	if (this.sessions[sess]) {
		if (message.sdp) {
			this.sessions[sess].msg.sdp = message.sdp;
		} else if (message.type == 'candidate') {
			if (message.last) sendToSipGW(this.sessions[sess].msg);
			else this.sessions[sess].msg.candidates.push({
				candidate: message.candidate,
				label: message.label,
				id: message.id
			});
		}
	}
}

function sendToSipGW(msg) {
	var sdp = new sdpParser(msg.sdp);
	for (var x = 0; x < msg.candidates.length; x++) {
		sdp.addCandidate(msg.candidates[x],{'strip_video' :true});
	}
	var sdpPayload = sdp.toString();
  console.log(sdpPayload);	
  sip.send({
		method: 'INVITE',
		uri: 'sip:101@comcastlabs.com',
		headers: {
			to: {
				uri: 'sip:101@comcastlabs.com'
			},
			from: {
				uri: 'sip:1062@comcastlabs.com',
				params: {
					tag: rstring()
				}
			},
			'call-id': rstring(),
			cseq: {
				method: 'INVITE',
				seq: Math.floor(Math.random() * 1e5)
			},
			'Content-Type': 'application/sdp',
      route: [{
            name: undefined,
            uri: 'sip:10.255.132.183:5060' , params: {lr: undefined}}],
			contact: [{
				uri: 'sip:1062@10.255.132.197:5060'
			}],
      'User-Agent': 'JSEP2SIPGW',
			'Organization': 'ComcastLabs'
		},
		content: sdpPayload
	},
	function(rs) {
		if (rs.status >= 300) {
			console.log('call failed with status ' + rs.status);
		}
		else if (rs.status < 200) {
			console.log('Call progress status ' + rs.status);
		}
		else {
			console.log('Call answered with tag ' + rs.headers.to.params.tag);

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

			if (!dialogs[id]) {
				dialogs[id] = function(rq) {
					if (rq.method === 'BYE') {
						console.log('call received bye');

						delete dialogs[id];

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
module.exports = Gateway;

