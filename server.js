var fs = require('fs');
var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var config = require('config');

var app = express();
var port = process.env.PORT || 3000;

var connect = function () {
  var options = { server: { socketOptions: { keepAlive: 1 } } };
  mongoose.connect(config.db, options);
};
connect();
console.log("process.env.MONGOLAB_URI")
console.log(process.env.MONGOLAB_URI)
console.log("process.env.MONGOLAB_URI")
mongoose.connection.on('error', console.log);
mongoose.connection.on('disconnected', connect);

fs.readdirSync(__dirname + '/app/models').forEach(function (file) {
  if (~file.indexOf('.js')) require(__dirname + '/app/models/' + file);
});

require('./config/passport')(passport, config);

require('./config/express')(app, passport);

require('./config/routes')(app, passport);

app.listen(port);
console.log('Express app started on port ' + port);

module.exports = app;
