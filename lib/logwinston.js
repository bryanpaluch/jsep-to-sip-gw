var winston = require('winston');

var logger = new(winston.Logger)({
	transports: [
	new(winston.transports.Console)({colorize: true, prettyPrint: true, json: false}), new(winston.transports.File)({
		filename: 'sipapp.log'
	})]
});

module.exports = logger;

