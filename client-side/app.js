var express = require('express');
var logger = require('morgan');
var fs = require('fs');
var rfs = require('rotating-file-stream')
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var route = require('./routes/route');

var app = express();

switch(app.get('env')) {
  case 'development':
    app.use(logger('dev'));
    break;

  case 'production':
    var logDirectory = path.join(__dirname, 'log')

    // ensure log directory exists
    fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)

    // create a rotating write stream
    var accessLogStream = rfs('access.log', {
      interval: '1d', // rotate daily
      path: logDirectory
    })

    // setup the logger
    app.use(logger('combined', {stream: accessLogStream}));
    break;
}



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser('mingdongoa'));
app.use(express.static(path.join(__dirname, 'public')));

// session support
app.use(session({
  resave: false,            // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  secret: 'some secret here'
}));

// main route
route.registerRoutes(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  console.log(err)
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
