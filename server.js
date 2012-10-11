var restify = require('restify'),
    JSEPGateway = require('./lib/jsep-to-sip'),
    request = require('request');

var gw = new JSEPGateway();
console.log(gw);
var server = restify.createServer({
    name: 'jsep-to-sip-gateway',
      version: '0.0.1'
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

server.post('/session', function (req, res, next) {
    var callbackUrl = JSON.parse(req.body).callbackUrl;
    if(callbackUrl){
      var uuid = gw.AddJSEPSession( function(){
        console.log('Did callback ' + callbackUrl); 
      });
      gw.on(uuid,function(event){
        console.log('Did callback ' + callbackUrl); 
        console.log(event);
        request({ method: 'POST',
                  uri: callbackUrl + uuid,
                  json: true,
                  body: event}, function(error, response, body){
                    if(error) console.log(error); 
                    console.log('sent event back to web service');
                  });
      });
    console.log('jsep session created with uuid ' + uuid);
    res.send({uuid : uuid, session: 'active'});
    }else{
      console.log('No callbackUrl');
      console.log(req.body);
      res.send(400);
      return next();
    }
});

server.put('/session/:uuid', function (req, res, next){
    console.log('request for session ' + req.params.uuid); 
    gw.AddJSEPMessage(req.params.uuid,JSON.parse(req.body));
    res.send(200);
      return next();
});


server.listen(8080, function () {
    console.log('%s listening at %s', server.name, server.url);
});
