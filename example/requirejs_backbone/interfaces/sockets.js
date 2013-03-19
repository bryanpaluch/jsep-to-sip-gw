var webrtcConnector = require("./phoneConnector"),
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
      data.from = this.id;
      pc.reg(data);
    });
		
    socket.on('rtc_client_message', function(data) {
			var target = data.target;
			data.from = this.id;
			if (data.type == 'offer' || data.type == 'answer') {
				socket.legs[target] = true;
			}
      if(data.type == 'offer'){
              data.toTN = data.target;
              data.fromTN = '8605818926';
			        console.log(data);
              pc.send(data);
      }else{
			        console.log(data);
              pc.send(data);
      }
		});
	});

  pc.on('regevent', function(data){
    var target = data.target;
    io.sockets.socket(target).emit('reg_server_message', data);
    console.log('sent reg event to client ' + target);
  });
  pc.on('event', function(data){
      var target = data.target;
      io.sockets.socket(target).emit('rtc_server_message', data);
      console.log('sent to client ' + target);
  });
}

