
var httpserver;
var sipServer;
var logger = require('./lib/logwinston');

module.exports.start = function (cb){
  var restify = require('restify'),
      sipServer = require('./lib/SipServer');
  var config = require('./config/conftool').getConf();
  httpserver = restify.createServer({
      name: 'jsep-to-sip-gateway',
        version: '0.0.1'
  });


  require('./lib/registrar_db').connect();

  httpserver.use(restify.acceptParser(httpserver.acceptable));
  httpserver.use(restify.queryParser());
  httpserver.use(restify.bodyParser({mapParams: false}));

  var call = require('./controllers/call');
  var reg = require('./controllers/reg');

  //inbound calls
  httpserver.post('/session', call.create);
  httpserver.put('/session/:uuid', call.add);
  httpserver.del('/session/:uuid', call.remove);


  //registration
  httpserver.post('/reg', reg.register);

//change for easier testingc
  logger.log('info', 'starting sip server on port ' + config.sipport);
  sipServer.start({sipport: config.sipport});
  httpserver.listen(config.httpport, function () {
      logger.log('info', 'JSEP to Sip Gateway ' + httpserver.name + 'listening at '+ httpserver.url);
      cb();
  });
}

module.exports.stop = function(cb){
  var enableDestroy = require('server-destroy');
  try{
    enableDestroy(httpserver);
    var stops = 0;
    var maybeCb = function(){
      stops++;
      if (stops > 1)
        cb();
    }
    sipServer.stop(function(){
      logger.log('info', 'sip server stopped'); 
      maybeCb(); 
    });
    httpserver.destroy()
    maybeCb(); 
  }catch(e){
    cb();
   logger.log('stop requested, but servers did not finish starting up');
  }
}
