var uuid = require('node-uuid'),
util = require('util'),
EventEmitter = require('events').EventEmitter,
sdpParser = require('./sdpParser.js'),
logger = require('./logwinston'),
request = require('request'),
registrarDb = require('../lib/registrar_db').getDb(),
HttpSession = require('./HttpSession.js');

function HttpSessionContainer(options) {
	this.options = options || {};
	this.sessions = {};
	logger.log('info', 'HttpSessionContainer Created...');
}

util.inherits(HttpSessionContainer, EventEmitter);


HttpSessionContainer.prototype.addSession = function(opts, callback) {
	var sess = uuid.v1();
	this.sessions[sess] = {};
	this.sessions[sess] = new HttpSession(opts);
  if(opts.calldirection == 'httphttp'){
    var self = this;
    process.nextTick(self.handleHttpBoundCall(sess));
  }
	return this.sessions[sess];
};

HttpSessionContainer.prototype.AddMessage = function(sess, message) {
	if (this.sessions[sess]) {
    this.sessions[sess].AddMessage(message);
  }else{
    logger.log('error', 'Session not found' + sess);
  }
};

HttpSessionContainer.prototype.EndSession = function(sessid){
	if (this.sessions[sess]) {
    this.sessions[sess].EndSession(function(){
      delete this.sessions[sessid];
    }); 
  }else{
    logger.log('error', 'Session not found' + sess);
  }
};

module.exports = HttpSessionContainer;
