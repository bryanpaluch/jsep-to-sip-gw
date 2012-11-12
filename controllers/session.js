var JSEPGateway = require('../lib/jsep-to-sip'),
    request = require('request');
var logger = require('../lib/logwinston.js');
var env = process.env.NODE_ENV || 'development';
var config = require('../config')[env];
var gw = new JSEPGateway(config);


exports.create = function (req, res, next) {
    var callbackUrl = req.body.callbackUrl;
    var to = req.body.to;
    var from = req.body.from;
    var fromDisplay = req.body.fromDisplay;
    if(callbackUrl && to && from){
      var uuid = gw.AddJSEPSession({to: to, from: from, display: fromDisplay});
      if(gw.listeners(uuid).length === 0){
      gw.on(uuid,function(event){
        request({ method: 'POST',
                  uri: callbackUrl + uuid,
                  json: true,
                  body: event}, 
                  function(error, response, body){
                    if(error) 
                      return next(error); 
                  });
      });
      }else{
        return(new Error('event already subscribed'));
        logger.log('info', 'event already subscribed');
      }
      logger.log('info', 'jsep session created with uuid ' + uuid);
      res.send({uuid : uuid, session: 'active'});
    }else{
      logger.log('error', 'missing body parameter', req.body);
      res.send(400, new Error('missing body parameter'));
      return next();
    }
}

exports.add = function(req, res, next){
    logger.log('info', 'request for session ' + req.params.uuid);
    console.log(req.path);
    console.log(req.body);
    gw.AddJSEPMessage(req.params.uuid,req.body);
    res.send(200);
      return next();
}

exports.remove = function(req, res, next){
  logger.log('info', 'request to delete session ' + req.params.uuid);
  gw.EndJSEPSession(req.params.uuid);
  res.send(200);
    return next();
}

