var fs = require('fs');
var config = require('../config/conftool').getConf();
var logger = require('./logwinston');

var plugins = {};
var plugin_path = __dirname + '/plugins';
config.plugins.forEach(function(plugin){
  if(plugin.run){
   logger.log("info" , "Loading sticher plugin " + plugin.name);
   plugins[plugin.name] = require(plugin_path + '/' + plugin.name);
   plugins[plugin.name].configure(plugin.config);
  }
});



module.exports = plugins;
