var express = require('express');
var session = require('express-session');
var compression = require('compression');
var cookieParser = require('cookie-parser');
//var cookieSession = require('cookie-session');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var csrf = require('csurf');
var multer = require('multer');
var swig = require('swig');
var mongoStore = require('connect-mongo')(session);
var flash = require('connect-flash');
var winston = require('winston');
var helpers = require('view-helpers');
var config = require('config');
var pkg = require('../package.json');

var env = process.env.NODE_ENV || 'development';

module.exports = function (app, passport) {

  app.use(compression({
    threshold: 512
  }));

  app.use(express.static(config.root + '/public'));
  express.static.mime.define({'application/application/vnd.ms-fontobject': ['eot']});
  express.static.mime.define({'application/x-font-woff': ['woff']});
  express.static.mime.define({'application/x-font-ttf': ['ttf']});
  express.static.mime.define({'image/svg+xml': ['svg']});


  var log;
  if (env !== 'development') {
    log = {
      stream: {
        write: function (message, encoding) {
          winston.info(message);
        }
      }
    };
  } else {
    log = 'dev';
  }

  if (env === 'development' || env === 'test') {
    swig.setDefaults({
      cache: false
    });
  }

  app.engine('html', swig.renderFile);
  app.set('views', config.root + '/app/views');
  app.set('view engine', 'html');

  app.use(function (req, res, next) {
    res.locals.pkg = pkg;
    res.locals.env = env;
    next();
  });

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(multer());
  app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      var method = req.body._method;
      delete req.body._method;
      return method;
    }
  }));

  app.use(cookieParser());
  //app.use(cookieSession({ secret: 'secret22' }));
  app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: pkg.name,
    store: new mongoStore({
      url: config.db,
      collection : 'sessions'
    })
  }));

  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(helpers(pkg.name));

  if (process.env.NODE_ENV !== 'test') {
    app.use(csrf());
    app.use(function (req, res, next) {
      res.locals.csrf_token = req.csrfToken();
      next();
    });
  }
};
