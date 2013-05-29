//Http-Sip Sticher plugin, takes http JSEP type signaling and combines offer and candidates into combined sdp's

var config;
//Always called before anything happens to set the config
module.exports.configure = function(conf){
  config = conf;

}

module.exports.messageFromCallees = function(msg, callee) {
  this.caller.messageFromLinked(msg);
}


//
module.exports.messageFromCaller = function (msg, caller){
  
  if(!this.caller.offer) this.caller.offer = {
    msg : msg ,
    sent: false};
  
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
      this.caller.offer.msg.sdp = sdp;
      var newOffer = this.caller.offer.msg;
      this.callees.forEach(function(callee){
          callee.messageFromLinked(newOffer);
      });
      console.log('Sent Offer');

    }
  }else if(msg.type === "bye"){
    this.callees.forEach(function(callee){
        callee.messageFromLinked(msg);
    });
  }

}
