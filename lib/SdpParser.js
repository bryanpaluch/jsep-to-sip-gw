var util = require('util')
  , _ = require('underscore');

//Please don't take this parser very seriously. It's a hack, and not to spec
function Sdp (rawsdp, options) {
  this.options = options || {};
  if(rawsdp){
    var sdpObj = {a:[], m:[], c:[]};
    var stream = -1;
    var tmpSDP = rawsdp.split('\r\n');
    for(var x = 0; x < tmpSDP.length; x++){
        var tmpLine = tmpSDP[x].split('=');
        switch(tmpLine[0]){
          case 'a':
            var tmpAttr = tmpLine[1].split(':');
            //Going on the assumption that this is the first attr line in a stream TODO: look at rfc
            if(tmpAttr[0] != 'candidate'){
                sdpObj.a.push({attrline : tmpLine[1], stream: stream, 
                            name: tmpAttr[0], values: _.rest(tmpAttr, 1).join(':').split(' '), type: 'stream'});
              }
            else
              sdpObj.a.push({attrline : tmpLine[1], stream: stream, 
                            name: tmpAttr[0], values: _.rest(tmpAttr, 1).join(':').split(' '), type: 'candidate'});
            break;
          //Account that there could be multiple m lines now... 
          case 'm':
            stream++;
            var vals = tmpLine[1].split(' ');
            sdpObj.m.push({line: tmpLine[1], values: vals, type: vals[0], stream: stream});
            break;
          case 'v':
          case 'o':
          case 's':
          case 't':
            sdpObj[tmpLine[0]] = {line: tmpLine[1], values: tmpLine[1].split(' ')};
            break;
          case 'c':
            var vals = tmpLine[1].split(' ');
            sdpObj.c.push({line: tmpLine[1], values: vals, stream: stream});
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
  var self = this;
  var candidates = _.filter(this.sdp.a, function(attr){ return attr.type == 'candidate'});
  var jsepCandidates = _.map(candidates, function(attr){ 
                          if(self.options.type == 'asterisk'){
                            return {type : 'candidate', 
                                  label: attr.stream, 
                                  id: ( attr.stream == 0) ? 'audio' : 'video',
                                  candidate: 'a=' + attr.attrline  + '\r\n'}}
                          else{
                            return {type : 'candidate', 
                                  label: attr.stream, 
                                  id: ( attr.stream == 0) ? 'audio' : 'video',
                                  candidate: 'a=' + attr.attrline + ' generation 0\r\n'}
                            }
                          });
  var streamdata = _.filter(this.sdp.a, function(attr){ return attr.type == 'stream'});
  //overwrite attribute list with streamdata because we don't want candidates anymore
  this.sdp.a = streamdata;
  var jsepObj = {sdp: this.toString(), candidates : jsepCandidates};
  return jsepObj;
}
Sdp.prototype.strip = function (streamType){
  var self = this;
  var streamid = _.each(this.sdp.m, function(m, index){
    if(m.type == streamType){
    self.sdp.m.splice(index, 1);
    self.stripStream(index);
    return
    }});
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
  var type = candidateType || 'host';
  //the value at position 7 in the values array of candidate holds the candidate type ['host', 'srflx']
  var candidate = _.find(this.sdp.a, function(candidate) { return candidate.values[7] == type});
  var port = candidate.values[5];
  var ip = candidate.values[4];
  //set M line
  for(var m = 0; m < this.sdp.m.length;m++){
    this.sdp.m[m].values[1] = port;
    this.sdp.m[m].line = this.sdp.m[m].values.join(' ');
    this.sdp.c[m].values[2] = ip;
    this.sdp.c[m].line = this.sdp.c[m].values.join(' ');
  }
  //set C line
  //find the rtcp elements
  var rtcpIndex = findIndex(this.sdp.a, function(attr){ return attr.name == 'rtcp'});
  this.sdp.a[rtcpIndex].values[0] = port;
  this.sdp.a[rtcpIndex].values[3] = ip;
  this.sdp.a[rtcpIndex].attrLine = this.sdp.a[rtcpIndex].values.join(' ');
}
Sdp.prototype.fixAsteriskSDP = function(){
  //need to get the ip and the port first candidate will hold this
  var candidate = _.find(this.sdp.a, function(candidate) { return candidate.values[7] == 'host'});
  var port = candidate.values[5];
  var ip = candidate.values[4];
  for(var m = 0; m < this.sdp.m.length;m++){
    this.sdp.a.unshift({attrline : 'rtcp:' +port + ' IN IP4 ' + ip, stream: m, 
                              name: 'rtcp', values: '', type: 'stream'});
 //   this.sdp.a.push({attrline : 'rtcp-mux', stream: m, 
  //                            name: 'rtcp-mux', values: '', type: 'stream'});
      this.sdp.m[m].values[1] = port;
      this.sdp.m[m].line = this.sdp.m[m].values.join(' ');
  }
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
//**************** Copies SSRC from the parameters sdp object to the object own sdp
Sdp.prototype.copySSRC = function(from){
  var self = this;
  var ssrcs = _.filter(from.sdp.a, function(attr){ return attr.name == 'ssrc'});
  _.forEach(ssrcs, function(ssrc){
    self.sdp.a.push(ssrc);
  });
}
Sdp.prototype.toString = function() {
  //Print top level sdp first
  var tmp = '';
  tmp+= 'v' + '=' + this.sdp['v'].line + '\r\n';
  tmp+= 'o' + '=' + this.sdp['o'].line + '\r\n';
  tmp+= 's' + '=' + this.sdp['s'].line + '\r\n';
  tmp+= 't' + '=' + this.sdp['t'].line + '\r\n';
  var bundle = _.filter(this.sdp.a, function(attr){ return attr.stream == -1});
  for(var y = 0; y < bundle.length; y++){
       tmp+= 'a' + '=' +bundle[y].attrline + '\r\n';
      }

  for(var y = 0; y , y < this.sdp.m.length; y++){
    tmp+= 'm' + '=' + this.sdp.m[y].line + '\r\n';
    tmp+= 'c' + '=' + this.sdp.c[y].line + '\r\n';
    //print bundle
    var candidates = _.filter(this.sdp.a, function(attr){ return attr.type == 'candidate'});
    for(var y = 0; y < candidates.length; y++){
        tmp+= 'a' + '=' +candidates[y].attrline + '\r\n';
      }
    var streams = _.filter(this.sdp.a, function(attr){ return attr.type == 'stream'});
    for(var y = 0; y < streams.length; y++){
      tmp+= 'a' + '=' +streams[y].attrline + '\r\n';
    }
  }
  return tmp;
}

module.exports = Sdp;
