var restify = require('restify');
var client = restify.createJsonClient({
	version: '*',
	url: 'http://127.0.0.1:8080'
});
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var app;
var sessions = {};
var targets = {};


function PhoneConnector() {
  var self = this;
  app.post('/session/:uuid', function(req, res){
    var message = req.body; 
    console.log('someone messaged phoneConnector back');
    console.log(message); 
    if(message){
      if(message.type == 'answer'){
        console.log('got message of answer type');
        message['target'] = targets[req.params.uuid];
        self.emit('event',message);
        }
      else if(message.type == 'candidates'){
        console.log('got candidates type');
        for(var i = 0; i < message.candidates.length; i++){
                var candidate = message.candidates[i];
                console.log(candidate);
                var target = targets[req.params.uuid];
                candidate['target'] = target;
                candidate['from'] = sessions[target].from;
                self.emit('event',candidate);
            } 
        }
      else if(message.type == 'bye'){
        var target = targets[req.params.uuid];
        message['target'] = target;
        message['from'] = sessions[target].from;
        self.emit('event',message);
      }
      else
        {
          console.log('no match for message type in phoneConnector');
        }
    }
    else
      console.log('no body');

    res.send(200);
  });
  console.log('Phone Connector established');

} 

util.inherits(PhoneConnector, EventEmitter);

PhoneConnector.prototype.send = function(data){
  	  switch (data.type) {
  	  case 'offer':
  	  	doOffer(data);
  	  	break;
  	  case 'candidate':
  	  	doCandidate(data);
  	  	break;
  	  case 'answer':
     		doAnswer(data);
  		  break;
      case 'icefinished':
        data.type = 'candidate';
        data['last'] = true;
        doCandidate(data);
        break;
      case 'bye':
        doBye(data);
        break;
  	  default:
  	  	console.log("Error no matching case for sendMessage data type" + data.type + " - phone Connector");
	   }
}

exports.PhoneConnector = PhoneConnector;

function doOffer(data) {
  var from = data.target;
  var offerData = data;
  var target = data.from;
  var toTN = data.toTN;
  var fromTN = data.fromTN;
  sessions[target] = {active : false, candidates: [], uuid : null, from: from};
	client.post('/session', {phoneNumber: '1002',
		callbackUrl: 'http://127.0.0.1:3000/session/',
    to: toTN,
    from: fromTN
	},
	function(err, req, res, data) {
		if (err) 
			return new Error(err);
		else {
			if (!data.session) {
        console.log(data);
				return new Error('phoneConnecter: invalid response from POST /session');
			}
      console.log('phoneConnect: Got a response from session POST');
      console.log(data);
			var uuid = data.uuid;
      console.log('phoneConnector: session created ' + uuid + ' for target ' + target);
      targets[uuid] = target;
      sessions[target].uuid = uuid;
      sessions[target].active = true;
      console.log(sessions[target]);
      if(sessions[target].candidates.length > 0)
        doCandidates(sessions[target].candidates);
      client.put('/session/' + uuid, offerData, function(err, req, res, data){
        if(err){
          console.log('phoneConnector: session SDP put failed');
          return new Error(err);
        }
        else{
          console.log('sent session sdp' + uuid);
        }
      });
		}
	});

}
function doCandidates(candidates){
  for (var x = 0; x < candidates.length; x++)
    doCandidate(candidates[x]);
}
function doCandidate(data) {
  var target = data.from;
  console.log('phoneConnector: new candidate for session ' + target);
  if(sessions[target]){
    if(sessions[target].active == true){
      client.put('/session/' + sessions[target].uuid,data, function (err, req, res, data){
        if(err)
          return new Error(err);
        else{
          console.log('sent candidate');
        }
      });
    }else{
      console.log('phoneConnector: pushing candidate');
      sessions[target].candidates.push(data);
    }
  }
}

function doAnswer(data) {

}
function doBye(data){
  var target = data.from;
  console.log('phoneConnector: request to end session ' + target);
  if(sessions[target]){
    if(sessions[target].active == true){
      client.del('/session/' + sessions[target].uuid, function (err, req, res, data){
        if(err)
          return new Error(err);
        else{
          console.log('sent session delete');
        }
      });
    }else{
      console.log('session was never started dropping');
    }
  }
}

exports.EndPoint = function(ExpressInstance, config){
  app = ExpressInstance; 
}

exports.createConnector = function(){
  var connector = new PhoneConnector();
  console.log(connector);
  return connector;
};
