define([
       'jquery',
       'underscore',
       'backbone',
       'models/webRTCSession',
], function($, _, Backbone, WebRTCSession){
  var CallView = Backbone.View.extend({
    el: $('#caller'),
    events: {
      "click .call" : 'startCall'
    },
    initialize: function(){
      var self= this;
      this.dispatcher = this.options.dispatcher;
      console.log(this.dispatcher);
    },
    startCall: function(id){
      var self = this;
      var number = '2155544944';
      this.model = new WebRTCSession({voiceOnly: true});
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
      //Wait for the model to be ready
      this.model.bind('ready', function(){ 
        console.log('session ready. calling');
        //if we were doing a video call we could use localStream to bind to a video
        //tag now, but this is a voice only call
        self.model.call({number:number});
      });
      //catch any webrtc related errors 
      this.model.bind('error', function(error){
        console.log('ERROR!!!! something went wrong with the webrtc session' + error);
      });
    },
    renderState: function(model){
      var self = this;
      var state = this.model.get('state');
      if(state === 'waiting'){
        $("#callform").hide();
        $("#statusarea").animate({opacity:0},600, function(){
          $("#statusarea").html("<h3>Calling " + self.model.get('currentTarget') + "</h3>");
          $("#statusarea").animate({opacity:1},300);
        });
      }
      else if(state === 'connected'){
        $("#statusarea").animate({opacity:0},600, function(){
          $("#statusarea").html("<h1>Voice Only Call with " + self.model.get('currentTarget')+ "</h1>");
          $("#statusarea").animate({opacity:1},300);
        });
      }else if(state === 'disconnected'){
        $("#statusarea").animate({opacity: 1},600, function(){
          $("#statusarea").html("<h3>type in a phone number to start </h1>");
          $("#callform").show();
          $("#statusarea").show();
        });
        this.model = undefined; 
      }
    },
    renderRemoteStream: function(){
      var audioElement = document.createElement('audio');
      audioElement.setAttribute('autoplay', 'autoplay');
      this.$el.append(audioElement);
      this.model.attachMediaStream(audioElement, this.model.get('remoteStream'));
      console.log('added remote stream');
      console.log(this.model.toJSON());
    },
    renderLocalStream: function(){
      var audioElement = document.createElement('audio');
      audioElement.setAttribute('autoplay', 'autoplay');
      this.$el.append(audioElement);
      this.model.attachMediaStream(audioElement, this.model.get('localStream'));
      console.log('added local stream');
      console.log(this.model.toJSON());
    }
  });
  return CallView;
});
