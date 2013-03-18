define([
       '/socket.io/socket.io.js',
       'jquery'
], function(io, $){
  var connect = function(dispatcher){
    $(document).ready(function (){
      var socket = io.connect('/');
      socket.on('connect', function(){
        dispatcher.trigger('connect');
      });
      socket.on('disconnect', function(){
        dispatcher.trigger('disconnect');
      });
      socket.on('rtc_server_message', function(data){
        console.log('received message ' + JSON.stringify(data));
        dispatcher.trigger('rtc_server_message', data);
      });
      dispatcher.on('rtc_client_message', function(data){
        console.log('sending message ' + JSON.stringify(data));
        socket.emit('rtc_client_message', data);
      });
      socket.on('reg_server_message', function(data){
        console.log('received message ' + JSON.stringify(data));
        dispatcher.trigger('reg_server_message', data);
      });
      dispatcher.on('reg_client_message', function(data){
        console.log('sending message ' + JSON.stringify(data));
        socket.emit('reg_client_message', data);
      });
    });
  }
  return {connect:connect};
});

