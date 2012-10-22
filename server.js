var restify = require('restify'),
    JSEPGateway = require('./lib/jsep-to-sip'),
    request = require('request');

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
    console.log('JSEP to Sip Gateway %s listening at %s', server.name, server.url);
});
