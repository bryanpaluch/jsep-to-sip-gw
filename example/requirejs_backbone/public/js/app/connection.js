define([
       '/socket.io/socket.io.js',
       'jquery'
], function(io){
  var connect = function(dispatcher, $){
    $(document).ready(function (){
      var socket = io.connection('/');
      socket.on('connect', function(){
        dispatcher.trigger('connect');
      });
      socket.on('disconnect', function(){
        dispatcher.trigger('disconnect');
      });
      socket.on('rtc_server_message', function(data){
        dispatcher.trigger('rtc_server_message', data);
      });
      dispatcher.on('rtc_client_message', function(data){
        socket.emit('rtc_client_message', data);
      });
    });
  }
  return {connect:connect};
});

