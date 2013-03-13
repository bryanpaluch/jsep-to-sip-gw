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
    if(callbackUrl && to && from){

      var calldirection;
        if(/^[0-9]+$/.test(to))
          calldirection = 'sipbound';
        else
          calldirection = 'httphttp';

      var data = {to: to, from: from, display: fromDisplay, calldirection: calldirection, callbackUrl: callbackUrl};
      var uuid = sc.addSession(data);
      logger.log('info', 'http session created with uuid ' + uuid);
      res.send({uuid : uuid, session: 'active', calldirection: calldirection, callbackUrl: callbackUrl});
    }else{
      logger.log('error', 'missing body parameter', req.body);
      res.send(400, new Error('missing body parameter'));
      return next();
    }
};

exports.add = function(req, res, next){
    logger.log('info', 'request for session ' + req.params.uuid);
    sc.addMessage(req.params.uuid,req.body);
    res.send(200);
      return next();
};

exports.remove = function(req, res, next){
  logger.log('info', 'request to delete session ' + req.params.uuid);
  logger.log('info', sc); 
  sc.endSession(req.params.uuid);
  res.send(200);
    return next();
};

