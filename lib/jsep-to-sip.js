var sip = require('sip'),
uuid = require('node-uuid'),
util = require('util');

var dialogs = {};

function rstring() { return Math.floor(Math.random()*1e6).toString();}
function start(){
sip.start({}, function(rq) {
  if(rq.headers.to.params.tag){
    var id = [rq.headers['call-id'], rq.headers.to.params.tag, rq.headers.from.params.tag].join(':');
    
    if(dialogs[id])
      dialogs[id](rq);
    else
      sip.send(sip.makeResponse(rq, 481, "Call doesn't exists"));
  }
  else
    sip.send(sip.makeResponse(rq, 405, 'Method not allowed'));
});
}
var Gateway = exports.Gateway = function (options) {
    options = options || {};
    this.sessions = {}; 
    this.dialogs = {};
    this.options = options;
    start();
    util.log('JSEP/SIP Gateway created');
}

Gateway.prototype.AddJSEPSession = function (callback) {
    util.log(sdp);
    var sess = uuid.v1();
    this.sessions[sess] = {};
    this.sessions[sess] = {cb: callback, msg : {sdp: null, candidates : []}, jsepInitiated : true};
    return sess;
}

Gateway.prototype.AddJSEPMessage = function (sess, message){
    util.log([sess, message]);
    if(sessions[sess]){
      if(message.sdp){
        this.sessions[sess].msg.sdp = message.sdp;
      }else if(message.iceCandidate){
        this.sessions[sess].msg.candidates.push(message.iceCandidate);
        if(message.last)
          sendToSipGW(msg);
      }
    }
}

function sendToSipGW(msg) {
  util.log(msg);
}
