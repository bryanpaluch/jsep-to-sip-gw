var util = require('util'),
sdpParser = require('./SdpParser.js'),
logger = require('./logwinston'),
linkPlugins = require('./linkPlugins');



function Linker(opts){
  if (!opts || !opts.type || !opts.caller || !opts.callees) throw new Error("Linker missing options");
  
  //Object that has the caller interfaces
  this.caller = opts.caller;
  //Array that has the callee interfaces
  this.callees = opts.callees;
  this.type = opts.type;
  
  if(linkPlugins[this.type]) 
    this.sessionSticher = linkPlugins[this.type];
  else
    throw new Error("Unsupported sessionSticher");

  this.linkSessions();
};

Linker.prototype.linkSessions = function(){
  var self = this;
  //Pass the linking function to the Session
  this.caller.link(
   function(msg){ 
    self.messageFromCaller(msg, self.caller)
    }
  );
  this.callees.forEach(function(callee){
    callee.link(
      function(msg){ 
      self.messageFromCallees(msg, callee);
      }
    );
  });
}

Linker.prototype.messageFromCaller = function(msg, caller){
  logger.log('info', "Linker got a message from caller");  
  this.sessionSticher.messageFromCaller.apply(this, [msg, caller]);
}

Linker.prototype.messageFromCallees = function(msg, callee){
  logger.log('info', "Linker got a message from callee");  
  this.sessionSticher.messageFromCallees.apply(this, [msg, callee]);
}

Linker.prototype.endSession = function(message){

}

module.exports = Linker;
