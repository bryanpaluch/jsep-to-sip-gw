var phoneConnector = require("./phoneConnector"),
util = require('util'),
pc = phoneConnector.createConnector();

module.exports = function(server) {
	io = require('socket.io').listen(server);
	io.sockets.on('connection', function(socket) {
		socket.legs = {};
	
		socket.on('disconnect', function() {
		
    });
		
    socket.on('rtc_request', function(data) {
			console.log("user id of this message is " + this.handshake.sessionID);
			console.log(data);
			var target = data.target;
			data.from = this.id;
			if (data.type == 'offer' || data.type == 'answer') {
				socket.legs[target] = true;
			}
      if(data.type == 'offer'){
              data.toTN = data.target;
              data.fromTN = '8605818926';
              pc.send(data);
      }else{
              pc.send(data);
        }
		});
	});
  pc.on('event', function(data){
      var target = data.target;
      io.sockets.socket(target).emit('rtc_request', data);
      console.log('sent to client ' + target);
  });
}

