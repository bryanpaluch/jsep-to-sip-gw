define([
       'jquery',
       'underscore',
       'backbone',
       'models/webrtcSession',
], function($, _, Backbone, WebRTCSession){
  var CallView = Backbone.View.extend({
    el: $('#caller'),
    events: {

    },
    initialize: function(){
      var self= this;
      var this.dispatcher = this.options.dispatcher;
      console.log(this.dispatcher);
    },
    startCall: function(id){
      var self = this;
      var number = '2155544944';
      this.model = new webRTCSession();
      // map the dispatcher inbound signaling for this webrtc session
      dispatcher.on('rtc_server_message', this.model.onSignalingMessage);
      this.model.emitSignalingMessage = (function(data){
        this.dispatcher.trigger('rtc_client_message',data);}); 
      this.model.bind('change:state', function(model){
        self.renderState(model);
      });
      this.model.bind('change:remoteStreamSrc', function(model){
        self.renderStream(model);
      });

      this.model.bind('ready', function(){ 
        self.model.call({number:number});
      });
    },
    renderState: function(model){
      console.log(model.toJSON());
    },
    renderStream: function(model){
      console.log(model.toJSON());
    }
  });
  return CallView;
});
