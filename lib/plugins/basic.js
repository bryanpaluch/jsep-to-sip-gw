//Basic Sticher plugin, takes messages from one side of the session and throws it to the other side.

var config;
//Always called before anything happens to set the config
module.exports.configure = function(conf){
  config = conf;

}

module.exports.messageFromCallees = function(msg, callee) {
  this.caller.messageFromLinked(msg);
}

module.exports.messageFromCaller = function (msg, caller){
  this.callees.forEach(function(callee){
    callee.messageFromLinked(msg);
  });
}
