var JSEPGateway = require('../lib/jsep-to-sip'),
    request = require('request');

var env = process.env.NODE_ENV || 'development';
var config = require('../config')[env];
var gw = new JSEPGateway(config);


exports.create = function (req, res, next) {
    var body = JSON.parse(req.body);
    var callbackUrl = body.callbackUrl;
    var to = body.to;
    var from = body.from;
    if(callbackUrl && to && from){
      var uuid = gw.AddJSEPSession({to: to, from: from});
      if(gw.listeners(uuid).length === 0){
      gw.on(uuid,function(event){
        console.log('Did callback ' + callbackUrl); 
        console.log(event);
        request({ method: 'POST',
                  uri: callbackUrl + uuid,
                  json: true,
                  body: event}, function(error, response, body){
                    if(error) 
                      return next(error); 
                    console.log('sent event back to web service');
                  });
      });
      }else{
        return(new Error('event already subscribed'));
        console.log('event already subscribed');
      }
      console.log('jsep session created with uuid ' + uuid);
      res.send({uuid : uuid, session: 'active'});
    }else{
      console.log('missing body parameter');
      console.log(req.body);
      res.send(400, new Error('missing body parameter'));
      return next();
    }
}

exports.add = function(req, res, next){
    console.log('request for session ' + req.params.uuid); 
    gw.AddJSEPMessage(req.params.uuid,JSON.parse(req.body));
    res.send(200);
      return next();
}

exports.remove = function(req, res, next){
  console.log('request to delete session ' + req.params.uuid);
  gw.EndJSEPSession(req.params.uuid);
  res.send(200);
    return next();
}

