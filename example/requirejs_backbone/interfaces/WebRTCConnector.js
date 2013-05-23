var request = require('request');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var app;
var sessions = {};
var registeredClients = {};
var targets = {};
var url = '';
function PhoneConnector() {
  var self = this;
  app.post('/session/:uuid', function(req, res, err){
    var message = req.body; 
    console.log('someone messaged phoneConnector back');
    console.log(req.method + ' ' + req.path); 
    console.log(message); 
    if(message){
      if(message.type == 'answer' && !message.failure){
        console.log('got message of answer type');
        message['target'] = targets[req.params.uuid];
        message['clientSessionId'] = sessions[message['target']].clientSessionId;
        console.log('answer with clientSessionId', message);
        self.emit('event',message);
        }
      else if(message.type == 'candidates'){
        console.log('got candidates type');
        for(var i = 0; i < message.candidates.length; i++){
                var candidate = message.candidates[i];
                console.log(candidate);
                var target = targets[req.params.uuid];
                candidate['target'] = target;
                candidate['remoteTarget'] = sessions[target].remoteTarget;
                candidate['clientSessionId'] = sessions[target].clientSessionId;
                self.emit('event',candidate);
            } 
      }else if(message.type == 'candidate'){
        console.log('got candidate type');
        var target = targets[req.params.uuid];
        message['target'] = target;
        message['remoteTarget'] = sessions[target].remoteTarget;
        message['clientSessionId'] = sessions[target].clientSessionId;
        self.emit('event', message);
      }
      else if(message.type == 'bye'){
        var target = targets[req.params.uuid];
        message['target'] = target;
        message['remoteTarget'] = sessions[target].remoteTarget;
        message['clientSessionId'] = sessions[target].clientSessionId;
        self.emit('event',message);
      }
      else if(message.type == 'answer' && message.failure){
        console.log('answer failed, stopping session' + req.params);
        message['target'] = targets[req.params.uuid];
        message['clientSessionId'] = sessions[message['target']].clientSessionId;
        self.emit('event',message);
        console.log(sessions);
        delete sessions[req.params.uuid];
      }
      else if(message.type == 'offer'){
        var alias = message.target;
        console.log('got an offer, seeing if we have anyone registered');
        if(registeredClients[alias]){
          console.log('client ' + alias + 'is registered');
          message.target = registeredClients[alias];
          targets[req.params.uuid] = registeredClients[alias];
          sessions[message.target] = {active : true, candidates: [], clientSessionId: req.params.uuid, uuid : req.params.uuid, remoteTarget: message.from};
          self.emit('event', message);
        }else{
          console.log('client ' + alias + 'is not registered failing');
        }
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
PhoneConnector.prototype.getAliasFromId = function(id){

}
util.inherits(PhoneConnector, EventEmitter);
PhoneConnector.prototype.reg = function(data){
  console.log("WebRTC Connector sending Registration"); 
  data.ttl = 60000;
	data.callbackUrl = 'http://127.0.0.1:3000/session/';
  var self = this;
  request.post({url: url + '/reg', json: data}, function (err, res){
    if(err){
      return new Error(err);
    }
    else{
      if(res.statusCode == 200){
        console.log('Registered Client');
        //Pass a successful registration object
        self.emit('regevent',{ type: 'regsuccess', alias: data.address, contact: data.contact});
        registeredClients[data.address] = data.contact;
      }else{
        if(registeredClients[data.address])
          delete registeredClients[data.address];
        console.log(res.statusCode);
        console.log('Registration Failed');
      }
    }
  });
}
PhoneConnector.prototype.dereg = function(data){
  console.log("WebRTC Connector sending deregistration"); 
  data.ttl = 60000;
	data.callbackUrl = 'http://127.0.0.1:3000/session/';
  var self = this;
  request.del({url: url + '/reg', json: data}, function (err, res){
    if(err){
      return new Error(err);
    }
    else{
      if(res.statusCode == 200){
        console.log('deregistered Client');
        //Pass a successful registration object
        self.emit('regevent',{ type: 'deregsuccess', alias: data.address, contact: data.contact});
      }else{
        console.log(res.statusCode);
        console.log('deregistration Failed');
      }
    }
  });
}

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
  var remoteTarget = data.target;
  var offerData = data;
  var target = data.clientid;
  var toAlias = data.to;
  var fromAlias = data.from;
  var clientSessionId = data.clientSessionId || 'default';
  console.log('Doing offer data:', data);
  sessions[target] = {active : false, candidates: [], clientSessionId: clientSessionId, uuid : null, remoteTarget: remoteTarget};
	request.post({url: url + '/session',json: {
		callbackUrl: 'http://127.0.0.1:3000/session/',
    to: toAlias,
    from: fromAlias,
    fromDisplay: 'rtcgateway'
	}},
	function(err,res, data) {
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
      //Add session to targets 
      targets[uuid] = target;
      //Add uuid id to sessions
      sessions[target].uuid = uuid;
      sessions[target].active = true;
      console.log(sessions[target]);
      if(sessions[target].candidates.length > 0)
        doCandidates(sessions[target].candidates);
      request.put({url : url + '/session/' + uuid,json: offerData}, function(err, res, data){
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
  var target = data.clientid;
  console.log('phoneConnector: new candidate for session ' + target);
  if(sessions[target]){
    if(sessions[target].active == true){
      request.put({url: url + '/session/' + sessions[target].uuid,json: data}, function (err, res, data){
        if(err){
          return new Error(err);
        }
        else{
          if(res.statusCode == 200){
            console.log('sent candidate');
          }else{
            console.log('got a different response, canceling session');
            delete sessions[target];
          }
        }
      });
    }else{
      console.log('phoneConnector: pushing candidate');
      console.log(target);
      console.log(sessions);
      sessions[target].candidates.push(data);
    }
  }else{
    console.log('Session not active, dropping');
  }
}

function doAnswer(data) {
  var target = data.clientid;
  console.log('WebRTCConnector: sending answer for session ' + target);
  if(sessions[target]){
    request.put({url: url + '/session/' + sessions[target].uuid, json: data}, function( err, res, data){
      if(err){
        return new Error(err);
      }
      else{
        if(res.statusCode == 200){
          console.log('sent answer');
        }else{
          console.log('got a bad response, canceling session');
          delete sessions[target];
        }
      }
    });
  }else{
    console.log('session not active, dropping');
  }
}
function doBye(data){
  var target = data.clientid;
  console.log('phoneConnector: request to end session ' + target);
  if(sessions[target]){
    if(sessions[target].active == true){
      request.del({url: url + '/session/' + sessions[target].uuid}, function (err, res, data){
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
  url = config.jsep2sipgw || "http://127.0.0.1:8080";
  app = ExpressInstance; 
}

exports.createConnector = function(){
  var connector = new PhoneConnector();
  console.log(connector);
  return connector;
};
