var sc = require('../lib/SessionController').getInstance();
var request = require('request');
var logger = require('../lib/logwinston.js');
var env = process.env.NODE_ENV || 'development';
var config = require('../config/conftool').getConf();


exports.create = function (req, res, next) {
    var callbackUrl = req.body.callbackUrl;
    var to = req.body.to;
    var from = req.body.from;
    var fromDisplay = req.body.fromDisplay;
    logger.log('info', 'create:', req.body); 
    if(callbackUrl && to && from){

      var data = {to: to, from: from, display: fromDisplay, 
                  originator: 'http', callbackUrl: callbackUrl};

      var uuid = sc.createSessions(data);
      if(uuid){
        logger.log('info', 'http session created with uuid ' + uuid);
        res.send({uuid : uuid, session: 'active', callbackUrl: callbackUrl});
      }else{
        logger.log('info', 'http session failed,  domains not in routing table ' + to + from);
        res.send(404, 'Can not route to domains');
      }
    }else{
      logger.log('error', 'missing body parameter', req.body);
      res.send(400);
      return next();
    }
};

exports.add = function(req, res, next){
    logger.log('info', 'request for session ' + req.params.uuid);
    logger.log('info', 'add:', req.body); 
    sc.addMessage(req.params.uuid,req.body, function(success){
      if(success)
        res.send(200);
      else
        res.send(404, 'Not Found');
      return next();
    });
};

exports.remove = function(req, res, next){
  logger.log('info', 'request to delete session ' + req.params.uuid);
  sc.endSession(req.params.uuid);
  res.send(200);
    return next();
};

