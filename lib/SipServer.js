var sip = require('sip'),
uuid = require('node-uuid'),
util = require('util'),
EventEmitter = require('events').EventEmitter,
logger = require('./logwinston'),
SessionController = require('../lib/SessionController');

function rstring() {
	return Math.floor(Math.random() * 1e6).toString();
}

function SipServer(options) {
  this.sc = require('../lib/SessionController').getInstance();
	logger.log('info', 'SipServer Listening...');
}


SipServer.prototype.start =  function() {
  var self = this;
	var siplog = {
		send: function(message, address) {
				logger.log('info', 'send to ' + address.address + ':' + address.port + '\n' + sip.stringify(message));
			},
			recv: function(message, address) {
				logger.log('info', 'recv from ' + address.address + ':' + address.port + '\n' + sip.stringify(message));
			},
      error: function(e){
        logger.log('error', e.stack);
      }
  };
	sip.start({logger: siplog},
	function(rq) {
		if (rq.headers.to.params.tag) {
			var id = [rq.headers['call-id'], rq.headers.to.params.tag, rq.headers.from.params.tag].join(':');
			if (self.dialogs[id]) 
        self.dialogs[id](rq);
			else
        sip.send(sip.makeResponse(rq, 481, "Call doesn't exists"));
		}
		else sip.send(sip.makeResponse(rq, 405, 'Method not allowed'));
	});
};
SipServer.prototype.stop = function(){
  sip.stop();

}
var serverInstance = null;

module.exports.getInstance = function(){
  if(serverInstance){
    return serverInstance;
  }else{
    serverInstance = new SipServer();
    return serverInstance;
  }
}

module.exports.start = function(){
  if(serverInstance){
    serverInstance.start();
  }else{
    serverInstance = new SipServer();
    serverInstance.start();
  }
}
module.exports.stop = function(){
  if(serverInstance){
    try{
      serverInstance.stop();
    }catch(e){
      console.log("stop requested, but sip server isn't running"); 
    }
  }else{
  }
}
