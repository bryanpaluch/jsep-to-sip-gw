define([
       'jquery',
       'underscore',
       'backbone',
], function($, _, Backbone){
//polyfill from https://apprtc.appspot.com/js/adapter.js
  var RTCPeerConnection = null;
  var getUserMedia = null;
  var attachMediaStream = null;

  if (navigator.mozGetUserMedia) {
    console.log("This appears to be Firefox");

    // The RTCPeerConnection object.
    RTCPeerConnection = mozRTCPeerConnection;

    // Get UserMedia (only difference is the prefix).
    // Code from Adam Barth.
    getUserMedia = navigator.mozGetUserMedia.bind(navigator);

    // Attach a media stream to an element.
    attachMediaStream = function(element, stream) {
      console.log("Attaching media stream");
      element.mozSrcObject = stream;
      element.play();
    };
  } else if (navigator.webkitGetUserMedia) {
    console.log("This appears to be Chrome");

    // The RTCPeerConnection object.
    RTCPeerConnection = webkitRTCPeerConnection;
    
    // Get UserMedia (only difference is the prefix).
    // Code from Adam Barth.
    getUserMedia = navigator.webkitGetUserMedia.bind(navigator);

    // Attach a media stream to an element.
    attachMediaStream = function(element, stream) {
      element.src = webkitURL.createObjectURL(stream);
    };

    // The representation of tracks in a stream is changed in M26.
    // Unify them for earlier Chrome versions in the coexisting period.
    if (!webkitMediaStream.prototype.getVideoTracks) {
      webkitMediaStream.prototype.getVideoTracks = function() {
        return this.videoTracks;
      }
    }
    if (!webkitMediaStream.prototype.getAudioTracks) {
      webkitMediaStream.prototype.getAudioTracks = function() {
        return this.audioTracks;
      }
    }
  } else {
    console.log("Browser does not appear to be WebRTC-capable");
  }

  var webRTCSession = Backbone.Model.extend({
    defaults: {
     pc_config : {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]},
     pc_constraints : {"optional": []},
     setOpus: false,
     mediaConstraints : {'mandatory': {
                            'OfferToReceiveAudio':true, 
                            'OfferToReceiveVideo':true }},
     voiceOnly: false,
     capable: true
    },
    initialize: function(){
      if(this.get('voiceOnly')){
        this.set('mediaConstraints', {'mandatory': 
                 { 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': false}});
      }
      //bind all functions to this!
      _.bindAll(this); 
      
      //Fire get user Media as soon as the model is established.
      //trigger the ready event once this happens
      this._gUM();
    },
    attachMediaStream: attachMediaStream,
    _gUM: function(){
      self = this;
      var constraints = {"mandatory": {}, "optional": []}; 
      try {
        getUserMedia({'audio':true, 'video':constraints}, self._onUserMediaSuccess,
                     self._onUserMediaError);
        console.log("Requested access to local media with mediaConstraints:\n" +
                    "  \"" + JSON.stringify(constraints) + "\"");
      } catch (e) {
        this.trigger('error', "getUserMedia() failed. Is this a WebRTC capable browser?");
        console.log("getUserMedia failed with exception: " + e.message);
      }
    },
    //The session model will only set the stream, its left up to the view to the attach the stream
    //attachMediaStream poly is on the model for simplicity.
    _onUserMediaSuccess:function(stream) {
      console.log("User has granted access to local media.");
      this.set('localStream',stream); 
      this.trigger('localStreamAdded');
      this.trigger('ready'); 
    },
    _onUserMediaError:function(error){
      this.trigger('error', "Failed to get access to local media. Error code was " + error.code);
    },
    call:function(callerInfo){
      var self = this;
      this.set('state', 'waiting'); 
      this.set('currentTarget', callerInfo.number);
      var mc = self.get('mediaConstraints');
      console.log(mc);
      this._createPeerConnection(function(pc){
        self.pc = pc;
        self.pc.addStream(self.get('localStream'));
        pc.createOffer(self._setLocalAndSendMessage, null, self.get('mediaConstraints'));
      });
      this.set('started', true);
    },
    onSignalingMessage: function(msg){
      console.log('webrtcsession got a signaling message'); 
      if (msg.type === 'answer' && this.get('started')) {
        console.log('got answer setting remote description');
        this.pc.setRemoteDescription(new RTCSessionDescription(msg));
      } 
      else if (msg.type === 'candidate' && this.get('started')) {
        console.log('got a candidate adding it');
        var candidate = new RTCIceCandidate({sdpMLineIndex:msg.label,
                                             candidate:msg.candidate});
        this.pc.addIceCandidate(candidate);
      } else if (msg.type === 'bye' && this.get('started')) {
        this._onRemoteHangup();
      }
    },
    _setLocalAndSendMessage: function(sessionDescription){
      console.log(sessionDescription);
      if(this.get('setOpus')){
        sessionDescription.sdp = this._preferOpus(sessionDescription.sdp);
      }
      if(this.get('voiceOnly')){
        sessionDescription.sdp = sessionDescription.sdp.substring(0, 
                                  sessionDescription.sdp.indexOf('m=video')); 
      }
      this.pc.setLocalDescription(sessionDescription);
      sessionDescription.target = this.get('currentTarget');
      this.emitSignalingMessage(sessionDescription);
    },
    _createPeerConnection: function(cb){
      var pc;
      try{
        var pc_config = this.get('pc_config');
        var pc_constraints = this.get('pc_constraints');
        var pc = new RTCPeerConnection(pc_config, pc_constraints);
        pc.onicecandidate = this._onIceCandidate;
        console.log("Created RTCPeerConnnection with:\n" + 
                    "  config: \"" + JSON.stringify(pc_config) + "\";\n" + 
                    "  constraints: \"" + JSON.stringify(pc_constraints) + "\".");
      }
      catch(e){
        this.trigger('error', "Failed to create PeerConnection, exception: " + e.message);
      }
      pc.onconnecting = this._onSessionConnecting;
      pc.onopen = this._onSessionOpened;
      pc.onaddstream = this._onRemoteStreamAdded;
      pc.onremovestream = this._onRemoteStreamRemoved;
      cb(pc);
    },
    _onIceCandidate: function(event){
      console.log('got another ice candidate');
      console.log(event);
      if(event.candidate){
        this.emitSignalingMessage({target: this.get('currentTarget'), 
                                  type: 'candidate',
                                  label: event.candidate.sdpMLineIndex,
                                  id: event.candidate.sdpMid,
                                  candidate: event.candidate.candidate
                                  });
        } else {
        this.emitSignalingMessage({target: this.get('currentTarget'), type: 'icefinished'});
        console.log('end of candidates');
        }
    },
    _onSessionConnection: function(message){
      console.log("session connecting");
    },
    _onSessionOpened: function(message){
      console.log('session opened');
    },
    _onRemoteStreamAdded:function(event){
      console.log('remote stream added');
      this.set('remoteStream', event.stream);
      this.trigger('remoteStreamAdded');
      this._waitForRemoteVideo();
     // this.set('state', 'connected');
    },
    _onRemoteStreamRemoved: function(event){
      console.log('remote stream removed');
      this.set('state', 'disconnected');
      this.set('remoteStream', null);
      this.trigger('remoteStreamRemoved');
    },
    _onRemoteHangup: function(event){
      this.set('state', 'disconnected');
      this.trigger('remoteHangup'); 
    },
    _waitForRemoteVideo: function(){
      var remoteStream = this.get('remoteStream');
      var videoTracks = remoteStream.getVideoTracks();
      console.log(videoTracks);
      if(  videoTracks.length === 0
        || this.get('remoteVideoTag').currentTime > 0
        || this.get('voiceOnly'))
      {
        this.set('state', 'connected');
        this.trigger('remoteStreamReady');
      } else{
        setTimeout(this._waitForRemoteVideo, 100);
      }
    }
  });
  return webRTCSession;
});


