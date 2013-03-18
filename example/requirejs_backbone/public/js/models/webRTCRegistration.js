define([
       'jquery',
       'underscore',
       'backbone',
], function($, _, Backbone){
  var webRTCRegistration = Backbone.Model.extend({
    defaults: {
      state: 'unregistered' 
    },
    initialize: function(){
      //bind all functions to this!
      _.bindAll(this); 
    },
    register:function(regInfo){
      var self = this;
      this.set('alias', regInfo.address);
      this.set('state', 'registering'); 
      this.emitSignalingMessage({address: regInfo.address});
    },
    onSignalingMessage: function(msg){
      console.log('webrtcsession got a signaling message'); 
      if (msg.type === 'regsuccess') {
        console.log(msg);
        this.set('alias', msg.alias);
        this.set('state', 'registered');
      }
      else if (msg.type === 'regfailure' ) {
        this.set('state', 'regfailure');
      } 
      else if (msg.type === 'presence') {
        console.log(msg); 
      } else {
        console.log('unsupported registration message, try reloading browser');
      }
    },
  });
  return webRTCRegistration;
});


