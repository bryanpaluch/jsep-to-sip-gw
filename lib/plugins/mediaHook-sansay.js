//Dialogic Sticher plugin, takes messages and if they have an SDP it will replace with its own sdp.
var request = require('request');
var uuid = require('node-uuid');
var config;
//Always called before anything happens to set the config
module.exports.configure = function(conf){
  config = conf;

}

module.exports.messageFromCallees = function(msg, callee) {
   
  this.caller.messageFromLinked(msg);

}

module.exports.messageFromCaller = function (msg, caller){
  console.log('Message from caller here');
  
  if(!this.caller.offer) this.caller.offer = {sent: false};

  if(msg.type === "offer"){
    if(!this.caller.offer.sdp) this.caller.offer.sdp = msg.sdp;
    
    console.log('saw the offer');
  }else if(msg.type === "candidate"){
      if(!this.caller.offer.candidates) this.caller.offer.candidates = [];
    
    if(!msg.last){
      this.caller.offer.candidates.push(msg.candidate);
    }else if(msg.last && !this.caller.offer.sent){
      console.log('got the last candidate');
      var sdp = this.caller.offer.sdp; 
      this.caller.offer.candidates.forEach(function(c){
        sdp += c;
      });
      console.log(sdp);
      this.caller.mr = new MediaRelay (sdp);
      this.caller.mr.requestRelay(function(sdps){
        console.log("Got sdps from mr");
        console.log(sdps);
        this.caller.answer = sdps.answer;
        //send the new offer to other side
      });
    }
  }

  console.log(msg); 
  this.callees.forEach(function(callee){
    callee.messageFromLinked(msg);
  });
}

function MediaRelay(origSDP){
  this.origSDP = origSDP;
	this.offererSessionId = uuid.v1();
  this.seq = 1;


}

MediaRelay.prototype.requestRelay = function(cb){
   var body = {
     offererSessionId : this.offererSessionId,
     seq : this.seq,
     services: {
       qos: "enabled",
       trace: "enabled",
       transcode: "none",
       record: "none",
       filter : "none"
    },
    session_descriptions : [
      { offererEndpointId: this.offererSessionId + "/1",
        nat : "enable",
        sdp: this.origSDP,
      },
      { offererEndpointId: this.offererSessionId + "/2",
        nat : "disable",
        sdp: "none",
      }
    ]
  }
  console.log("Sending this body");
  console.log('POST /media/relay');
  console.log(body);
  request.post({
    url : config.endpoint + "/media/relay",
    headers: {
      "Content-Type" : "application/sansay.websbc.Relay+json",
      "Accept" : "application/sansay.websbc.RelayResponse+json",
      "X-Sansay-API-Version" : "1.0",
      "Authorization" : 'blank'
    },
    body: JSON.stringify(body)
  }, function(e, r, body){
    console.log("response from media relay ");
    console.log(e);
    console.log(body);
      
  });

}


