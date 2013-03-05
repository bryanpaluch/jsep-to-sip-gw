var assert = require('assert');
var mockery = require('mockery');
var EventEmitter = require('events').EventEmitter;
var handler = new EventEmitter();
var sip = require('sip');

var mockConfig ={ 
  getConf : function(){
    return {
      httpport: 8080,
      outboundproxy: '127.0.0.1:5080',
      domain: 'cabletownlabs',
      localHost: '127.0.0.1:5060',
      org: 'cabletownlabs'
    }
  }
}
var conf = mockConfig.getConf();
console.log(conf);
function SipServer(opts){
  var handler = opts.eventHandler; 
  var onRequest = function(rq, remote){
    if(rq.method === 'INVITE'){
      var rs = sip.makeResponse(rq, 180, 'Ringing');
      handler.emit('invite_received', rq);
      server.send(rs); 
      handler.on('send_200',function(){
      var rs =  sip.makeResponse(rq, 200, 'OK');
      rs.content = 'v=0\r\no=root 277472264 277472265 IN IP4 10.255.132.180\r\ns=Asterisk PBX SVN-trunk-r378374M\r\nc=IN IP4 10.255.132.180\r\nt=0 0\r\nm=audio 14484 RTP/SAVPF 8 101\r\na=rtpmap:8 PCMA/8000\r\na=rtpmap:101 telephone-event/8000\r\na=fmtp:101 0-16\r\na=silenceSupp:off - - - -\r\na=ptime:20\r\na=ice-ufrag:239a765901a1036a6f032c7335b785d6\r\na=ice-pwd:7d1e7f7f481dfa6b051f003a6931d93f\r\na=candidate:Haff84b4 1 UDP 2130706431 10.255.132.180 14484 typ host\r\na=candidate:Haff84b4 2 UDP 2130706430 10.255.132.180 14485 typ host\r\na=sendrecv\r\na=crypto:0 AES_CM_128_HMAC_SHA1_32 inline:StodWdrJ3GozUZzr4NzLrjGRIY51Ju8u0sQEDfxo\r\n'
      rs.headers['content-type'] = 'application/sdp'; 
      rs.headers['contact'] = "sip:" + conf.outboundproxy;
      server.send(rs);
      });
    }
    if(rq.method === 'BYE'){
      var rs = sip.makeResponse(rq, 200, 'OK');
      handler.emit('bye_received', rq);
      server.send(rs);
    }
  }
  var server = sip.create({port: opts.port}, onRequest);
  this.stop = function(){
    server.destroy();
  }
}

describe('jsep-to-sip', function(){
  var server;
  var uuid;
  var gw;
  var JSEPGateway;
  before(function(done){
    mockery.enable();
    mockery.registerMock('../config/conftool', mockConfig);
    mockery.registerMock('./config/conftool', mockConfig);
    mockery.warnOnReplace(false);
    mockery.warnOnUnregistered(false);
    server = new SipServer({eventHandler: handler, port: 5080});
    JSEPGateway = require('../lib/jsep-to-sip');
    done();
  });
  after(function(done){
    server.stop();
    mockery.deregisterAll(); 
    mockery.disable();
    done();
  });
  it("Constructor should create a new gateway", function(done){
    gw = new JSEPGateway(conf);
    assert.ok(gw); 
    done();
  });
  it("AddJSEPSession() should create a new session, and return a UUID", function(done){
    uuid = gw.AddJSEPSession({to: '1111', from: 'test', display: 'rtcwithme', calldirection: 'sipbound'});
    assert.ok(uuid);
    assert.ok(gw.sessions);
    done();
  });
  it("AddJSEPMessage(uuid, data) with data being an offer should add an sdp object to session it created", function(done){
    var data = { sdp: 'v=0\r\no=- 1315412197 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE audio\r\na=msid-semantic: WMS 92uS1PAPUopFEMSAUxIIJAPTYOYvOgGFMEAc\r\nm=audio 1 RTP/SAVPF 103 104 111 0 8 107 106 105 13 126\r\nc=IN IP4 0.0.0.0\r\na=rtcp:1 IN IP4 0.0.0.0\r\na=ice-ufrag:afCuavcKNpRZzjLd\r\na=ice-pwd:46N8KN5HWE/+s+oLe6ECJ5pB\r\na=ice-options:google-ice\r\na=sendrecv\r\na=mid:audio\r\na=rtcp-mux\r\na=crypto:0 AES_CM_128_HMAC_SHA1_32 inline:l08Dqd55mmg0E7YcU3ZAoBzQ8MceEGVmhMXANxnM\r\na=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:EBH0NlNoflx7Ab6alRqhOpq8X85KCjpbEuX8Fuc7\r\na=rtpmap:103 ISAC/16000\r\na=rtpmap:104 ISAC/32000\r\na=rtpmap:111 opus/48000/2\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:8 PCMA/8000\r\na=rtpmap:107 CN/48000\r\na=rtpmap:106 CN/32000\r\na=rtpmap:105 CN/16000\r\na=rtpmap:13 CN/8000\r\na=rtpmap:126 telephone-event/8000\r\na=ssrc:970058572 cname:OpAOYymcrkr1jmZO\r\na=ssrc:970058572 msid:92uS1PAPUopFEMSAUxIIJAPTYOYvOgGFMEAc a0\r\na=ssrc:970058572 mslabel:92uS1PAPUopFEMSAUxIIJAPTYOYvOgGFMEAc\r\na=ssrc:970058572 label:92uS1PAPUopFEMSAUxIIJAPTYOYvOgGFMEAca0\r\n',
        type: 'offer',
        target: '1111',
        from: '1EZokdVhBaV6MzGMsRCe',
        toTN: '1111',
        fromTN: '8605818926' };
    gw.AddJSEPMessage(uuid,data);
    console.log(gw);
    assert.ok(gw.sessions[uuid].msg.sdp);
    done();
  });
  it("AddJSEPMessage(uuid, data) with data being a candidate should add candidate", function(done){
    var data = { 
      type: 'candidate',
      label: 0,
      id: 'audio',
      candidate: 'a=candidate:1220969524 2 udp 2113937151 147.191.223.141 3753 typ host generation 0\r\n',
    }; 
    gw.AddJSEPMessage(uuid, data);
    assert.equal(gw.sessions[uuid].msg.candidates.length, 1);
    data = { 
      type: 'candidate',
      label: 0,
      id: 'audio',
      candidate: 'a=candidate:1220969524 1 udp 2113937151 147.191.223.141 3753 typ host generation 0\r\n',
    }; 
    gw.AddJSEPMessage(uuid, data);
    assert.equal(gw.sessions[uuid].msg.candidates.length, 2);
    done();
  });
  it("AddJSEPMessage(uuid, data) with last flag true will send a SIP message to outbound proxy", function(done){
    handler.on("invite_received", function(invite){
      assert.ok(invite);
      done();
    });
    var data = {
      type: 'candidate',
      target: '1111',
      from: '1EZokdVhBaV6MzGMsRCe',
      last: true
    };
    gw.AddJSEPMessage(uuid,data);
  });
  it("on(\"event\") fires when the other end picks up and returns an answer and candidates", function(done){
    gw.once(uuid, function(event){
      assert.ok(event);
      done();
    });
    handler.emit("send_200");
  });
  it("EndJSEPSession sends a bye if the session is active", function(done){
    gw.EndJSEPSession(uuid);
    handler.on('bye_received', function(bye){
      assert.ok(bye);
      done();
    });
  });
});
