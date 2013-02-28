var env = process.env.NODE_ENV || 'development';
var config = require('./config')[env];

function getConf(){
  return config;
}

module.exports.getConf = getConf;


