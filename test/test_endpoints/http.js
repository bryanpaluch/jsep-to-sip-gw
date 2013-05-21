var util = require('util');
var restify = require('restify');
var EventEmitter = new require('events').EventEmitter;
var httpclient = restify.createJsonClient({
  version: '*',
  url: 'http://127.0.0.1:8080'
});
var video_audio_offer_sdp = 'v=0\r\no=- 7710115074099229709 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE audio video\r\na=msid-semantic: WMS 9E8jWf7qlPvumqWpMIcCwAllNthPDnJ9Bplr\r\nm=audio 1 RTP/SAVPF 111 103 104 0 8 107 106 105 13 126\r\nc=IN IP4 0.0.0.0\r\na=rtcp:1 IN IP4 0.0.0.0\r\na=ice-ufrag:Nbn+nE+m0vjm8Pgg\r\na=ice-pwd:SiMFJxeyQoitSRQoUV4dPENV\r\na=ice-options:google-ice\r\na=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\na=sendrecv\r\na=mid:audio\r\na=rtcp-mux\r\na=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:bqHRoewlqjAQJu+aYNA7pscrtvvgNg75ovyoRVVA\r\na=rtpmap:111 opus/48000/2\r\na=fmtp:111 minptime=10\r\na=rtpmap:103 ISAC/16000\r\na=rtpmap:104 ISAC/32000\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:8 PCMA/8000\r\na=rtpmap:107 CN/48000\r\na=rtpmap:106 CN/32000\r\na=rtpmap:105 CN/16000\r\na=rtpmap:13 CN/8000\r\na=rtpmap:126 telephone-event/8000\r\na=maxptime:60\r\na=ssrc:3919293467 cname:pPw5ZWB0U0fUlvwj\r\na=ssrc:3919293467 msid:9E8jWf7qlPvumqWpMIcCwAllNthPDnJ9Bplr 9E8jWf7qlPvumqWpMIcCwAllNthPDnJ9Bplra0\r\na=ssrc:3919293467 mslabel:9E8jWf7qlPvumqWpMIcCwAllNthPDnJ9Bplr\r\na=ssrc:3919293467 label:9E8jWf7qlPvumqWpMIcCwAllNthPDnJ9Bplra0\r\nm=video 1 RTP/SAVPF 100 116 117\r\nc=IN IP4 0.0.0.0\r\na=rtcp:1 IN IP4 0.0.0.0\r\na=ice-ufrag:Nbn+nE+m0vjm8Pgg\r\na=ice-pwd:SiMFJxeyQoitSRQoUV4dPENV\r\na=ice-options:google-ice\r\na=extmap:2 urn:ietf:params:rtp-hdrext:toffset\r\na=sendrecv\r\na=mid:video\r\na=rtcp-mux\r\na=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:bqHRoewlqjAQJu+aYNA7pscrtvvgNg75ovyoRVVA\r\na=rtpmap:100 VP8/90000\r\na=rtcp-fb:100 ccm fir\r\na=rtcp-fb:100 nack \r\na=rtcp-fb:100 goog-remb \r\na=rtpmap:116 red/90000\r\na=rtpmap:117 ulpfec/90000\r\na=ssrc:1036488746 cname:pPw5ZWB0U0fUlvwj\r\na=ssrc:1036488746 msid:9E8jWf7qlPvumqWpMIcCwAllNthPDnJ9Bplr 9E8jWf7qlPvumqWpMIcCwAllNthPDnJ9Bplrv0\r\na=ssrc:1036488746 mslabel:9E8jWf7qlPvumqWpMIcCwAllNthPDnJ9Bplr\r\na=ssrc:1036488746 label:9E8jWf7qlPvumqWpMIcCwAllNthPDnJ9Bplrv0\r\n';


function HttpEndpoint(opts){
  this.port = opts.port || 9000;
  this.role = opts.role || 'answerer';
  this.server = restify.createServer({
    name: 'http-endpoint'
  });
  this.server.use(restify.acceptParser(this.server.acceptable));
  this.server.use(restify.queryParser());
  this.server.use(restify.bodyParser({mapParams: false}));
  this.server.post('/session/:uuid', this.controller);
  this.registeredUsers = {};
}

util.inherits(HttpEndpoint, EventEmitter);

HttpEndpoint.prototype.controller = function (req, res){
  handler.emit(req.params.uuid, req);
  res.send(200);
  this.processCall(req.params.uuid, req.body);
}

HttpEndpoint.prototype.processCall = function( uuid, data){
  console.log("data:", data);
  console.log("uuid:", uuid);

}

HttpEndpoint.prototype.register = function( alias) {
  
  console.log('Registered ' + alias); 
  var self= this;
  var data = {
    address: alias,
    callbackUrl: 'http://127.0.0.1: ' + this.port + '/session',
    ttl: 60
  };
  httpclient.post('/reg', data, function(err, req, res, data){
    self.registeredUsers[alias] = {};
    self.emit('registered:' + alias);
    console.log('Registered ' + alias);
  });

}

HttpEndpoint.prototype.call = function( to, from){


}

module.exports = HttpEndpoint;
