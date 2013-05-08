var util = require('util'),
sdpParser = require('./SdpParser.js'),
logger = require('./logwinston'),



function Linker(opts){

};


Linker.prototype.messageLinkedSessions = function(msg){
  console.log(this);
  console.log(msg);
}

Linker.prototype.endSession = function(message){

}

module.exports = Linker;
