var config = require('../config/conftool').getConf();
var logger = require('../lib/logwinston.js');
var registrarDb = require('../lib/registrar_db').getDb();
//****************************************
//Takes json payload
//{ id: 'bkp@cable.net,
//  callbackUrl: 'http://example.com/session', 
//  ttl: 0} 
//****************************************

exports.register = function(req, res, next){
  var userid = req.body.id;
  var callbackUrl = req.body.callbackUrl;
  var ttl = req.body.ttl;
  if(userid && callbackUrl && ttl){
    registarDb.save({userid: userid,callbackUrl: callbackUrl, ttl: ttl}, function(err){
      if(err){
        return next(err);
      }else{
        res.send(200);
        return next();
      }
    });
  }else{
    logger.log('error', 'missing body parameter', req.body);
    res.send(400, new Error('missing body parameter'));
    return next();
  }
};

exports.deregister = function(req, res, next){
  var userid = req.body.id;
  if(userid){
    registrarDb.delete({userid: userid, callbackUrl: callbackUrl});
    res.send(200);
    return next();
  }else{
    logger.log('error', 'missing body parameter', req.body);
    res.send(400, new Error('missing body parameter'));
    return next();
  }
};

