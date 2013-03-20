define([
       'jquery',
       'underscore',
       'backbone',
       'models/webRTCSession',
], function($, _, Backbone, WebRTCSession){
  var CallView = Backbone.View.extend({
    el: $('#caller'),
    events: {
      "click .call" : 'startCall',
      "click .answer" : 'answerCall'
    },
    initialize: function(){
      var self= this;
      this.dispatcher = this.options.dispatcher;
      console.log(this.dispatcher);
      this.model = new WebRTCSession({voiceOnly: false});
      // map the dispatcher inbound signaling for this webrtc session
      this.dispatcher.on('rtc_server_message', function(data){
                          self.model.onSignalingMessage(data)});
      // give the session a method for communicating to the server
      this.model.emitSignalingMessage = (function(data){
        self.dispatcher.trigger('rtc_client_message',data);}); 
      this.model.bind('change:state', function(model){
        self.renderState(model);
      });
      //bind to the remoteStreamAdded event so you can render the video or audio
      this.model.bind('remoteStreamAdded', function(model){
        self.renderRemoteStream(model);
      }, this);
      this.model.bind('localStreamAdded', function(model){
        self.renderLocalStream(model);
      }, this);
    },
    startCall: function(id){
      var self = this;
      var address = $('#address').val(); 
      //catch any webrtc related errors 
      this.model.bind('error', function(error){
        console.log('ERROR!!!! something went wrong with the webrtc session' + error);
      });
      self.model.call({address:address});
    },
    answerCall: function(){
      this.model.answer();
    },
    renderState: function(model){
      var self = this;
      var state = this.model.get('state');
      console.log(state);
      if(state === 'waiting'){
        console.log(self.model); 
        var target = self.model.attributes.currentTarget;
        console.log('Calling ' + target); 
        $("#callform").hide();
        $("#answerfrom").hide();
        $("#statusarea").animate({opacity:0},600, function(){
          $("#statusarea").html("<h3>Calling " + target + "</h3>");
          $("#statusarea").animate({opacity:1},300);
        });
      }
      else if(state === 'connected'){
        $("#answerfrom").hide();
        $("#statusarea").animate({opacity:0},600, function(){
          $("#statusarea").html("<h1>Voice Only Call with " + self.model.get('currentTarget')+ "</h1>");
          $("#statusarea").animate({opacity:1},300);
        });
      }else if(state === 'disconnected'){
        $("#answerfrom").hide();
        $("#statusarea").animate({opacity: 1},600, function(){
          $("#statusarea").html("<h3>type in a phone number to start </h1>");
          $("#callform").show();
          $("#statusarea").show();
        });
        //Reset Model
      }else if(state === 'incomingCall'){
        var target = self.model.attributes.currentTarget;
        $("#callform").hide();
        $("#statusarea").animate({opacity:0},600, function(){
          $("#answerform").show();
          $("#statusarea").html("<h3>Call From " + target + "</h3>");
          $("#statusarea").animate({opacity:1},300);
        });
      }
    },
    renderRemoteStream: function(){
      var audioElement = document.createElement('video');
      audioElement.setAttribute('autoplay', 'autoplay');
      this.$el.append(audioElement);
      this.model.attachMediaStream(audioElement, this.model.get('remoteStream'));
      console.log('added remote stream');
      console.log(this.model.toJSON());
    },
    renderLocalStream: function(){
      var audioElement = document.createElement('audio');
      audioElement.setAttribute('autoplay', 'autoplay');
      audioElement.setAttribute('mute', 'true');
      this.$el.append(audioElement);
      this.model.attachMediaStream(audioElement, this.model.get('localStream'));
      console.log('added local stream');
      console.log(this.model.toJSON());
    }
  });
  return CallView;
});
