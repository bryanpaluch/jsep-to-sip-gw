//Dialogic Sticher plugin, takes messages and if they have an SDP it will replace with its own sdp.

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
  console.log(msg); 
  this.callees.forEach(function(callee){
    callee.messageFromLinked(msg);
  });
}
