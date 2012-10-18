var sip = require('sip'),
uuid = require('node-uuid'),
util = require('util'),
EventEmitter = require('events').EventEmitter,
sdpParser = require('./sdpParser.js');

var dialogs = {};

function rstring() {
	return Math.floor(Math.random() * 1e6).toString();
}


function SipHelper(options) {
	options = options || {};
	this.outboundproxy = options.outboundproxy || 'localhost:5060';
  this.domain = options.domain || 'example.com';
  this.options = options;
}

SipHelper.prototype.createInvite =  function(to, from, sdpPayload){
  console.log('siphelper creating invite');
  var invite = {
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
  };
return invite;
}

SipHelper.prototype.createBye = function(dialogid){ 
  console.log('siphelper creating bye');

}
module.exports = SipHelper;

