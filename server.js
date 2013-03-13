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

var jsepSession = require('./controllers/session');
var user = require('./controllers/user');

//inbound calls
httpserver.post('/session', jsepSession.create);
httpserver.put('/session/:uuid', jsepSession.add);
httpserver.del('/session/:uuid', jsepSession.remove);


//registration
httpserver.post('/registration', user.register);

httpserver.listen(config.httpport, function () {
    logger.log('info', 'JSEP to Sip Gateway ' + httpserver.name + 'listening at '+ httpserver.url);
});
