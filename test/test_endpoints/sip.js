var util = require('util');
var EventEmitter = new require('events').EventEmitter;
var assert = require('assert');
var sip = require('sip');
var video_audio_offer_sdp = 'v=0\r\no=- 7710115074099229709 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE audio video\r\na=msid-semantic: WMS 9E8jWf7qlPvumqWpMIcCwAllNthPDnJ9Bplr\r\nm=audio 1 RTP/SAVPF 111 103 104 0 8 107 106 105 13 126\r\nc=IN IP4 0.0.0.0\r\na=rtcp:1 IN IP4 0.0.0.0\r\na=ice-ufrag:Nbn+nE+m0vjm8Pgg\r\na=ice-pwd:SiMFJxeyQoitSRQoUV4dPENV\r\na=ice-options:google-ice\r\na=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\na=sendrecv\r\na=mid:audio\r\na=rtcp-mux\r\na=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:bqHRoewlqjAQJu+aYNA7pscrtvvgNg75ovyoRVVA\r\na=rtpmap:111 opus/48000/2\r\na=fmtp:111 minptime=10\r\na=rtpmap:103 ISAC/16000\r\na=rtpmap:104 ISAC/32000\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:8 PCMA/8000\r\na=rtpmap:107 CN/48000\r\na=rtpmap:106 CN/32000\r\na=rtpmap:105 CN/16000\r\na=rtpmap:13 CN/8000\r\na=rtpmap:126 telephone-event/8000\r\na=maxptime:60\r\na=ssrc:3919293467 cname:pPw5ZWB0U0fUlvwj\r\na=ssrc:3919293467 msid:9E8jWf7qlPvumqWpMIcCwAllNthPDnJ9Bplr 9E8jWf7qlPvumqWpMIcCwAllNthPDnJ9Bplra0\r\na=ssrc:3919293467 mslabel:9E8jWf7qlPvumqWpMIcCwAllNthPDnJ9Bplr\r\na=ssrc:3919293467 label:9E8jWf7qlPvumqWpMIcCwAllNthPDnJ9Bplra0\r\nm=video 1 RTP/SAVPF 100 116 117\r\nc=IN IP4 0.0.0.0\r\na=rtcp:1 IN IP4 0.0.0.0\r\na=ice-ufrag:Nbn+nE+m0vjm8Pgg\r\na=ice-pwd:SiMFJxeyQoitSRQoUV4dPENV\r\na=ice-options:google-ice\r\na=extmap:2 urn:ietf:params:rtp-hdrext:toffset\r\na=sendrecv\r\na=mid:video\r\na=rtcp-mux\r\na=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:bqHRoewlqjAQJu+aYNA7pscrtvvgNg75ovyoRVVA\r\na=rtpmap:100 VP8/90000\r\na=rtcp-fb:100 ccm fir\r\na=rtcp-fb:100 nack \r\na=rtcp-fb:100 goog-remb \r\na=rtpmap:116 red/90000\r\na=rtpmap:117 ulpfec/90000\r\na=ssrc:1036488746 cname:pPw5ZWB0U0fUlvwj\r\na=ssrc:1036488746 msid:9E8jWf7qlPvumqWpMIcCwAllNthPDnJ9Bplr 9E8jWf7qlPvumqWpMIcCwAllNthPDnJ9Bplrv0\r\na=ssrc:1036488746 mslabel:9E8jWf7qlPvumqWpMIcCwAllNthPDnJ9Bplr\r\na=ssrc:1036488746 label:9E8jWf7qlPvumqWpMIcCwAllNthPDnJ9Bplrv0\r\n';


var video_audio_answer_sdp = 'v=0\r\no=- 8705885155034356649 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE audio video\r\na=msid-semantic: WMS qlt2IxMXsKxX9a4yaQ3PEZYSFxcSs1I23nhR\r\nm=audio 1 RTP/SAVPF 111 103 104 0 8 107 106 105 13 126\r\nc=IN IP4 0.0.0.0\r\na=rtcp:1 IN IP4 0.0.0.0\r\na=ice-ufrag:c4Z4z+6+PRyrgdaH\r\na=ice-pwd:4EXXHK1BxOkCfnwMPT5K77Et\r\na=sendrecv\r\na=mid:audio\r\na=rtcp-mux\r\na=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:4ZcAEApMHT/sXIAlhPGNVeVycWqfCU0EGjuxwLkZ\r\na=rtpmap:111 opus/48000/2\r\na=fmtp:111 minptime=10\r\na=rtpmap:103 ISAC/16000\r\na=rtpmap:104 ISAC/32000\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:8 PCMA/8000\r\na=rtpmap:107 CN/48000\r\na=rtpmap:106 CN/32000\r\na=rtpmap:105 CN/16000\r\na=rtpmap:13 CN/8000\r\na=rtpmap:126 telephone-event/8000\r\na=maxptime:60\r\na=ssrc:1323582053 cname:Cx6lKxgDcbSpCNIw\r\na=ssrc:1323582053 msid:qlt2IxMXsKxX9a4yaQ3PEZYSFxcSs1I23nhR qlt2IxMXsKxX9a4yaQ3PEZYSFxcSs1I23nhRa0\r\na=ssrc:1323582053 mslabel:qlt2IxMXsKxX9a4yaQ3PEZYSFxcSs1I23nhR\r\na=ssrc:1323582053 label:qlt2IxMXsKxX9a4yaQ3PEZYSFxcSs1I23nhRa0\r\nm=video 1 RTP/SAVPF 100 116 117\r\nc=IN IP4 0.0.0.0\r\na=rtcp:1 IN IP4 0.0.0.0\r\na=ice-ufrag:c4Z4z+6+PRyrgdaH\r\na=ice-pwd:4EXXHK1BxOkCfnwMPT5K77Et\r\na=sendrecv\r\na=mid:video\r\na=rtcp-mux\r\na=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:4ZcAEApMHT/sXIAlhPGNVeVycWqfCU0EGjuxwLkZ\r\na=rtpmap:100 VP8/90000\r\na=rtpmap:116 red/90000\r\na=rtpmap:117 ulpfec/90000\r\na=ssrc:156137930 cname:Cx6lKxgDcbSpCNIw\r\na=ssrc:156137930 msid:qlt2IxMXsKxX9a4yaQ3PEZYSFxcSs1I23nhR qlt2IxMXsKxX9a4yaQ3PEZYSFxcSs1I23nhRv0\r\na=ssrc:156137930 mslabel:qlt2IxMXsKxX9a4yaQ3PEZYSFxcSs1I23nhR\r\na=ssrc:156137930 label:qlt2IxMXsKxX9a4yaQ3PEZYSFxcSs1I23nhRv0\r\n'


function SipEndpoint(opts){
  this.port = opts.port || 9009;
  this.role = opts.role || 'answerer';
  
  var siplog = {
		send: function(message, address) {
				console.log('info', 'send to ' + address.address + ':' + address.port + '\n' + sip.stringify(message));
			},
			recv: function(message, address) {
				console.log('info', 'recv from ' + address.address + ':' + address.port + '\n' + sip.stringify(message));
			},
      error: function(e){
        console.log('error', e.stack);
      }
  }

  this.server = null; 
  
  this.registeredUsers = {};
  this.sessions = {};
}

util.inherits(SipEndpoint, EventEmitter);
SipEndpoint.prototype.start = function(cb){
  var siplog = {
		send: function(message, address) {
				console.log('info', 'send to ' + address.address + ':' + address.port + '\n' + sip.stringify(message));
			},
			recv: function(message, address) {
				console.log('info', 'recv from ' + address.address + ':' + address.port + '\n' + sip.stringify(message));
			},
      error: function(e){
        console.log('error', e.stack);
      }
  }
  var self = this;
  this.server = sip.create({port: this.port, logger: siplog}, self.handleRequest.bind(self));
  console.log(this.server);
}

SipEndpoint.prototype.handleRequest = function (rq){
  var self = this;
  console.log('Received Request');
  if(rq.method === "INVITE"){ 
    this.reportOffer(rq.headers);
    
    if(this.role == "answerer"){
      self.server.send(sip.makeResponse(rq, 180, "Ringing"));
      setTimeout(function(){
        var answer = sip.makeResponse(rq, 200, "OK");
        answer.headers.to.params.tag = Math.floor(Math.random() * 1e6).toString();
        answer.content = video_audio_answer_sdp; 
        self.server.send(answer);
      }, 200);
    }else{
      self.server.send(sip.makeResponse(rq, 404, "Not Found"));
    }

  }else if(rq.method === "BYE"){
      self.server.send(sip.makeResponse(rq, 200, "OK"));
  }else{
    self.server.send(sip.makeResponse(rq, 403, "Forbidden"));
    console.log('unsupported request method');
  }
}

SipEndpoint.prototype.stop = function(cb){
  this.server.destroy();
}


SipEndpoint.prototype.processSignaling= function( uuid, data){
  data.uuid  = uuid;
  switch(data.type){
  /*
    case 'invite':

    break;
  */
    case 'offer':
      this.reportOffer(data);
      if(this.role == 'answerer'){
        this.answerOffer(data);
      }
      else{
      }
    break;
    case 'answer':
      this.reportAnswer(data);
    break;
    case 'candidate':
      this.reportCandidate(data);
    break;
  }
}
SipEndpoint.prototype.reportOffer = function (data){
  var to = data.to.uri.split(':')[1]; 
  var from = data.from.uri.split(':')[1]; 
  console.log('gotOffer:' +  to + ':' + from);
  this.emit('gotOffer:' +  to + ':' + from, data);
}
SipEndpoint.prototype.reportAnswer= function (data){
  var to = data.to.uri.split(':')[1]; 
  var from = data.from.uri.split(':')[1]; 
  this.emit('gotAnswer:' +  to + ':' + from , data);
}
SipEndpoint.prototype.reportCandidate = function (data){
  if(data.last)
    this.emit('gotLastCandidate:' +  data.to + ':' + data.from  , data);
  else
    this.emit('gotCandidate:' +  data.to + ':' + data.from  , data);
}
SipEndpoint.prototype.answerOffer = function(offer){
  var answer = {
    sdp: video_audio_answer_sdp,
    type: 'answer'
  }
  var adds = [
        {
           type: 'candidate',
           label: 0,
           id: 'audio',
           candidate: 'a=candidate:1220969524 1 udp 2113937151 10.253.24.165 3894 typ host generation 0\r\n',
        },
        {
          type: 'candidate',
          last: true
        }
    ];
  httpclient.put('/session/' + offer.uuid, answer, function(err, req, res, data){
    var sendAdds;
    sendAdds = function(cb){
      httpclient.put('/session/' + offer.uuid, adds.shift(), function(err, req, res, data){
        if(adds.length > 0) 
          cb(sendAdds);
        else
          return
      });
    }
    sendAdds(sendAdds);


  });

}


SipEndpoint.prototype.register = function( alias) {
  console.log('attempting to register'); 
  var self= this;
  var data = {
    address: alias,
    callbackUrl: 'http://127.0.0.1:' + this.port + '/session',
    ttl: 60
  };
  httpclient.post('/reg', data, function(err, req, res, data){
    console.log("registered a user");
    self.registeredUsers[alias] = {};
    self.emit('registered:' + alias);
  });

}

SipEndpoint.prototype.call = function( to, from){
  var self = this; 
  var create = {
    callbackUrl: 'http://127.0.0.1:' + this.port + '/session/',
    to: to,
    from: from,
    fromDisplay: 'rtcgateway'
    };

  var adds = [{
        sdp: video_audio_offer_sdp,
        type: 'offer',
        clientid: 'OfoUhO8m7R7lGc3Vdev3'
        }, 
        {
           type: 'candidate',
           label: 0,
           id: 'audio',
           candidate: 'a=candidate:1220969524 1 udp 2113937151 147.191.223.141 3894 typ host generation 0\r\n',
        },
        {
          type: 'candidate',
          last: true
        }
    ];
  httpclient.post('/session', create, function(err, req, res, data){
    assert.ok(data.uuid);
    self.sessions[data.uuid] = create;
    var sendAdds;
    sendAdds = function(cb){
      httpclient.put('/session/' + data.uuid, adds.shift(), function(err, req, res, data){
        if(adds.length > 0) 
          cb(sendAdds); 
        else
          return
      });
    }
    sendAdds(sendAdds);
  });

}

module.exports = SipEndpoint;