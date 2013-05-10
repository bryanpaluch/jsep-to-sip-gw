var restify = require('restify'),
    request = require('request'),
    logger = require('./lib/logwinston'),
    SipServer = require('./lib/SipServer');
var env = process.env.NODE_ENV || 'development';
var config = require('./config/conftool').getConf();
var httpserver = restify.createServer({
    name: 'jsep-to-sip-gateway',
      version: '0.0.1'
});

SipServer.start();

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

httpserver.listen(config.httpport, function () {
    logger.log('info', 'JSEP to Sip Gateway ' + httpserver.name + 'listening at '+ httpserver.url);
});

module.exports.stop = function(){
  try{
    SipServer.stop();
    httpserver.close();
  }catch(e){
   logger.log('stop requested, but servers did not finish starting up');
  }
}
