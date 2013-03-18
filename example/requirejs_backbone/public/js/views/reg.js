define([
       'jquery',
       'underscore',
       'backbone',
       'models/webRTCRegistration',
], function($, _, Backbone, WebRTCRegistration){
  var RegView = Backbone.View.extend({
    el: $('#registration'),
    events: {
      "click .register" : 'register'
    },
    initialize: function(){
      var self= this;
      this.dispatcher = this.options.dispatcher;
      console.log(this.dispatcher);
    },
    register: function(id){
      var self = this;
      var address = $('#regaddress').val(); 
      this.model = new WebRTCRegistration({});
      // map the dispatcher inbound signaling for this reg/presence
      this.dispatcher.on('reg_server_message', function(data){
                          self.model.onSignalingMessage(data)});
      // give the session a method for communicating to the server
      this.model.emitSignalingMessage = (function(data){
        self.dispatcher.trigger('reg_client_message',data);});
      this.model.bind('change:state', function(model){
        self.renderState(model);
      });
      //catch any reg related errors 
      this.model.bind('error', function(error){
        console.log('ERROR!!!! something went wrong with the registration' + error);
      });
      this.model.register({address: address});
    },
    renderState: function(model){
      var self = this;
      var state = this.model.get('state');
      console.log(state);
      if(state === 'registering'){
        console.log(self.model); 
        var target = self.model.get('alias');
        console.log('registering ' + target); 
        $("#regform").hide();
        $("#regstatus").animate({opacity:0},600, function(){
          $("#regstatus").html("<h3>Registering " + target + "</h3>");
          $("#regstatus").animate({opacity:1},300);
        });
      }
      else if(state === 'registered'){
        var target = self.model.get('alias');
        $("#regstatus").animate({opacity:0},600, function(){
          $("#regstatus").html("<h1>Registered " + target + "</h1>");
          $("#regstatus").animate({opacity:1},300);
        });
      }else if(state === 'unregistered'){
        $("#regstatus").animate({opacity: 1},600, function(){
          $("#regstatus").html("<h3>Registration </h1>");
          $("#regform").show();
          $("#regstatus").show();
        });
        this.model = undefined; 
      }
    },
  });
  return RegView;
});
