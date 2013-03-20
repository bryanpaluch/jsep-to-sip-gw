define([
  'app/connection',
  'views/call',
  'views/reg',
  'backbone',
  'underscore',
  'localStorageHook'
],function(Connection, CallView,RegView, Backbone, _, LocalStorageHook){
  var init = function(){
    var dispatcher = _.clone(Backbone.Events);
    //Pass the callView a new WebRTCConnection for 1:1 calling, WebRTCConnection needs to be plumbed
    //with a dispatcher for sending messages to socket.io and processing signaling from socket.io
    var callView = new CallView({dispatcher: dispatcher});
    var regView = new RegView({dispatcher: dispatcher});
    Connection.connect(dispatcher);
    dispatcher.on('connect', function(){
      console.log('connected to socket.io');
    });
    dispatcher.on('disconnect', function(){
      console.log('disconnected from socket.io');
    });
    LocalStorageHook.hook();
  };
return {init:init};
});
