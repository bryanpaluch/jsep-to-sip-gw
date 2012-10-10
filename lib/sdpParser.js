var util = require('util');

function Sdp (rawsdp, options) {
  this.options = options || {};
  var strip_video = this.options.strip_video || false;
  if(rawsdp){
    var sdpObj = {a:[]};
    var stream = -1;
    var tmpSDP = rawsdp.split('\r\n');
    for(var x = 0; x < tmpSDP.length; x++){
        tmpLine = tmpSDP[x].split('=');
        switch(tmpLine[0]){
          case 'a':
            var tmpAttr = tmpLine[1].split(':');
            if(tmpAttr[0] == 'rtcp')
              stream++;
            //console remove the first element which will be the key, then join the rest for the value.
            var name = tmpAttr.shift();
            sdpObj.a.push({attrline : tmpLine[1], stream: stream, name: tmpAttr[0], value: tmpAttr.join(':')});
            break;
          case 'v':
          case 'o':
          case 's':
          case 't':
          case 'm':
          case 'c':
            sdpObj[tmpLine[0]] = tmpLine[1];
            break;
          default:
            break;
        }
    }
    this.rawsdp = rawsdp;
    this.sdp = sdpObj;
  }
}
Sdp.prototype.addCandidate= function(candidate, options){
  console.log(candidate);
  if(options.strip_video == true){
    if(candidate.id == 'video'){
      return;
    }
  }
  //parses candidate from RTCPeerConnection and strips the cr from the end and a= from front
  this.sdp.a.push(candidate.candidate.split('\r\n')[0].split('=')[1]);
}
Sdp.prototype.toJson = function() {
return this.sdp;
}
Sdp.prototype.toString = function() {
  var tmp = '';
  tmp+= 'v' + '=' + this.sdp['v'] + '\r\n';
  tmp+= 'o' + '=' + this.sdp['o'] + '\r\n';
  tmp+= 's' + '=' + this.sdp['s'] + '\r\n';
  tmp+= 't' + '=' + this.sdp['t'] + '\r\n';
  tmp+= 'm' + '=' + this.sdp['m'] + '\r\n';
  tmp+= 'c' + '=' + this.sdp['c'] + '\r\n';
  
  for(var y = 0; y < this.sdp.a.length; y++){
      tmp+= 'a' + '=' + this.sdp.a[y].attr + '\r\n';
    }

  return tmp;
}


module.exports = Sdp;
