var webrtcConnector = require("./WebRTCConnector"),
util = require('util'),
pc = webrtcConnector.createConnector();

module.exports = function(server) {
	io = require('socket.io').listen(server);
	io.sockets.on('connection', function(socket) {
		socket.legs = {};
	
		socket.on('disconnect', function() {
		
    });
    socket.on('reg_client_message', function(data){
      console.log('client attempting to register ' + data.address + ' ' + this.id);
      data.contact = this.id;
      pc.reg(data);
    });
		
    socket.on('rtc_client_message', function(data) {
			var target = data.target;
			data.from = this.id;
			if (data.type == 'offer' || data.type == 'answer') {
				socket.legs[target] = true;
			}
      if(data.type == 'offer'){
              data.toAlias = data.target;
              data.fromAlias = (socket.alias) ? socket.alias : 'unknown';
              pc.send(data);
      }else{
			        console.log(data);
              pc.send(data);
      }
		});
	});

  pc.on('regevent', function(data){
    var contact = data.contact;
    io.sockets.socket(contact).emit('reg_server_message', data);
    //Save the returned Alias to the socket Id for use in outbound calls;
    io.sockets.socket(contact).alias = data.alias;
    console.log('sent reg event to client ' + contact);
  });
  pc.on('event', function(data){
      var target = data.target;
      io.sockets.socket(target).emit('rtc_server_message', data);
      console.log('sent to client ' + target);
  });
}

