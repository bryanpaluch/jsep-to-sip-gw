var restify = require('restify');
var assert = require('assert');

before(function(done) {
    console.log('starting server');
    require('../server.js');
    done();
});
