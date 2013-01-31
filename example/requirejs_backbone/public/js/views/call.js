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
      this.model.emitSignalingMessage = (function(data){
        self.dispatcher.trigger('rtc_client_message',data);}); 
      this.model.bind('change:state', function(model){
        self.renderState(model);
      });
      this.model.bind('remoteStreamAdded', function(model){
        self.renderStream(model);
      }, this);

      this.model.bind('ready', function(){ 
        //if we were doing a video call we could use localStream to bind to a video
        //tag now, but this is a voice only call
        self.model.call({number:number});
      });
      this.model.bind('error', function(error){
        console.log('ERROR!!!! something went wrong with the webrtc session' + error);
      });
    },
    renderState: function(model){
      console.log(model.toJSON());
    },
    renderStream: function(){
      var audioElement = document.createElement('audio');
      audioElement.setAttribute('autoplay', 'autoplay');
      this.$el.append(audioElement);
      this.model.attachMediaStream(audioElement, this.model.get('remoteStream'));
      console.log('added remote stream');
      console.log(model.toJSON());
    }
  });
  return CallView;
});
