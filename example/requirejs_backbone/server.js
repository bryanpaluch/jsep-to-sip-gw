
/**
 * Module dependencies.
 */

var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , routes = require('./routes')
  , path = require('path');


app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static('./public'));
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
require('./interfaces/WebRTCConnector').EndPoint(app, {jsep2sipgw: "http://127.0.0.1:8080"});
//make sure to intialize phoneConnector before sockets because the routes need to be populated with the express app first.
//And sockets uses phoneConnector for events
require('./interfaces/sockets')(server);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
