var restify = require('restify'),
    JSEPGateway = require('./lib/jsep-to-sip'),
    request = require('request'),
    logger = require('./lib/logwinston');

var env = process.env.NODE_ENV || 'development';
var config = require('./config/conftool').getConf();
var server = restify.createServer({
    name: 'jsep-to-sip-gateway',
      version: '0.0.1'
});

require('./lib/registrar_db').connect();


server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser({mapParams: false}));

var jsepSession = require('./controllers/session');
var user = require('./controllers/user');

//inbound calls
server.post('/session', jsepSession.create);
server.put('/session/:uuid', jsepSession.add);
server.del('/session/:uuid', jsepSession.remove);


//registration
server.post('/registration', user.register);

server.listen(config.httpport, function () {
    logger.log('info', 'JSEP to Sip Gateway ' + server.name + 'listening at '+ server.url);
});
