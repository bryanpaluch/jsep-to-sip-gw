var util = require('util')
  , _ = require('underscore');

function Sdp (rawsdp, options) {
  this.options = options || {};
  if(rawsdp){
    var sdpObj = {a:[]};
    var stream = -1;
    if(this.options.type == 'asterisk')
      stream = 0;
    var tmpSDP = rawsdp.split('\r\n');
    for(var x = 0; x < tmpSDP.length; x++){
        tmpLine = tmpSDP[x].split('=');
        switch(tmpLine[0]){
          case 'a':
            var tmpAttr = tmpLine[1].split(':');
            //Going on the assumption that this is the first attr line in a stream TODO: look at rfc
            if(tmpAttr[0] == 'rtcp')
              stream++;
            if(tmpAttr[0] != 'candidate')
              sdpObj.a.push({attrline : tmpLine[1], stream: stream, 
                            name: tmpAttr[0], values: _.rest(tmpAttr, 1).join(':').split(' '), type: 'stream'});
            else
              sdpObj.a.push({attrline : tmpLine[1], stream: stream, 
                            name: tmpAttr[0], values: _.rest(tmpAttr, 1).join(':').split(' '), type: 'candidate'});
            break;
          case 'v':
          case 'o':
          case 's':
          case 't':
          case 'm':
          case 'c':
            sdpObj[tmpLine[0]] = {line: tmpLine[1], values: tmpLine[1].split(' ')};
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
  var candidateLine = candidate.candidate.split('\r\n')[0].split('=')[1];
  this.sdp.a.push({attrline: candidateLine, stream: candidate.label, 
                 values: candidateLine.split(':')[1].split(' '), type:'candidate'});
}

Sdp.prototype.toJson = function() {
return this.sdp;
}
Sdp.prototype.toJSEP = function(){
  var candidates = _.filter(this.sdp.a, function(attr){ return attr.type == 'candidate'});
  var jsepCandidates = _.map(candidates, function(attr){ 
                          return {type : 'candidate', 
                                  label: attr.stream, 
                                  id: ( attr.stream == 0) ? 'audio' : 'video',
                                  candidate: 'a=' + attr.attrline + '\r\n'}
                          });
  var streamdata = _.filter(this.sdp.a, function(attr){ return attr.type == 'stream'});
  //overwrite attribute list with streamdata because we don't want candidates anymore
  this.sdp.a = streamdata;
  jsepObj = {sdp: this.toString(), candidates : jsepCandidates};
  return jsepObj;
}

Sdp.prototype.stripStream = function(streamid){
  this.sdp.a = _.filter(this.sdp.a, function(attr){ return attr.stream != streamid});
}
//***** fixChromeSDP(candidateType)
//Purpose is to fix a chrome sdp so that the m line and rtcp line match one of the candidates,
//currently chrome will put 0 for the port for the m line, c line and rtcp attr, most sip sbcs don't like this
//and can not guess it from the candidate list
//so the function can take a candidateType srflx or host and change the m and rtcp attribute to match the port
//***********************************
Sdp.prototype.fixChromeSDP= function (candidateType){
  var type = candidateType || 'srflx';
  //the value at position 7 in the values array of candidate holds the candidate type ['host', 'srflx']
  var candidate = _.find(this.sdp.a, function(candidate) { return candidate.values[7] == type});
  var port = candidate.values[5];
  var ip = candidate.values[4];
  //set M line
  this.setM(["audio",port,"RTP/SAVPF 103 104 0 8 106 105 13 126"]);
  //set C line
  this.sdp.c.values[2] = ip;
  this.setC(this.sdp.c.values);
  //find the rtcp elements
  var rtcpIndex = findIndex(this.sdp.a, function(attr){ return attr.name == 'rtcp'});
  this.sdp.a[rtcpIndex].values[0] = port;
  this.sdp.a[rtcpIndex].values[3] = ip;
  this.sdp.a[rtcpIndex].attrLine = this.sdp.a[rtcpIndex].values.join(' ');
}
function findIndex(collection, filter){
  for (var i = 0; i < collection.length; i++) {
    if(filter(collection[i], i, collection)) 
       return i;
  }
    return -1;
}
Sdp.prototype.setC = function(array){
  this.sdp.c.line = array.join(' ');
}
Sdp.prototype.setM = function(array){
  this.sdp.m.line= array.join(' ');
}

Sdp.prototype.toString = function() {
  //Print top level sdp first
  var tmp = '';
  tmp+= 'v' + '=' + this.sdp['v'].line + '\r\n';
  tmp+= 'o' + '=' + this.sdp['o'].line + '\r\n';
  tmp+= 's' + '=' + this.sdp['s'].line + '\r\n';
  tmp+= 't' + '=' + this.sdp['t'].line + '\r\n';
  tmp+= 'm' + '=' + this.sdp['m'].line + '\r\n';
  tmp+= 'c' + '=' + this.sdp['c'].line + '\r\n';
 
  //print bundle
  var bundle = _.filter(this.sdp.a, function(attr){ return attr.stream == -1});
  for(var y = 0; y < bundle.length; y++){
      tmp+= 'a' + '=' +bundle[y].attrline + '\r\n';
    }
  var candidates = _.filter(this.sdp.a, function(attr){ return attr.type == 'candidate'});
  for(var y = 0; y < candidates.length; y++){
      tmp+= 'a' + '=' +candidates[y].attrline + '\r\n';
    }
  var streams = _.filter(this.sdp.a, function(attr){ return attr.type == 'stream'});
  for(var y = 0; y < streams.length; y++){
      tmp+= 'a' + '=' +streams[y].attrline + '\r\n';
    }
  return tmp;
}

module.exports = Sdp;
