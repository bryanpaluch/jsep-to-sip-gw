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


SipServer.prototype.start =  function(opts) {
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
  logger.log('info', "Sip server starting on port " + opts.sipport);
	sip.start({port: opts.sipport, logger: siplog},
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
  sip.stop(function(){
  });
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

module.exports.start = function(opts){
  if(serverInstance){
    serverInstance.start(opts);
  }else{
    serverInstance = new SipServer();
    serverInstance.start(opts);
  }
}
module.exports.stop = function(cb){
  if(serverInstance){
    try{
      serverInstance.stop();
      cb();
    }catch(e){
      cb();
      console.log("stop requested, but sip server isn't running"); 
    }
  }else{
    cb();
  }
}
