var restify = require('restify'),
    JSEPGateway = require('./lib/jsep-to-sip'),
    request = require('request'),
    logger = require('./lib/logwinston');

var env = process.env.NODE_ENV || 'development';
var config = require('./config')[env];
var server = restify.createServer({
    name: 'jsep-to-sip-gateway',
      version: '0.0.1'
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

var jsepSession = require('./controllers/session');

server.post('/session', jsepSession.create);
server.put('/session/:uuid', jsepSession.add);
server.del('/session/:uuid', jsepSession.remove);

server.listen(8080, function () {
    logger.log('info', 'JSEP to Sip Gateway ' + server.name + 'listening at '+ server.url);
});
