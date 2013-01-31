define([
  'app/connection',
  'views/call',
  'backbone',
  'underscore'
],function(Connection, CallView, Backbone, _){
  var init = function(){
    var dispatcher = _.clone(Backbone.Events);
    //Pass the callView a new WebRTCConnection for 1:1 calling, WebRTCConnection needs to be plumbed
    //with a dispatcher for sending messages to socket.io and processing signaling from socket.io
    var callView = new CallView({dispatcher: dispatcher});
    Connection.connect(dispatcher);
    dispatcher.on('connect', function(){
      console.log('connected to socket.io');
    });
    dispatcher.on('disconnect', function(){
      console.log('disconnected from socket.io');
    });
  };
return {init:init};
});
