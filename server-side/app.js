var express = require('express');
var logger = require('morgan');
var fs = require('fs');
var rfs = require('rotating-file-stream')
var path = require('path');
var bodyParser = require('body-parser');
var router = require('./routes/route.js');

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


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// router
app.use('/api', router);


// start server
function startServer() {
	app.set('port', process.env.PORT || 8081);
	app.listen(app.get('port'), function() {
		console.log('Server started in ' + app.get('env') + ' mode on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
	})
}

if (require.main === module) {
	// application run directly; start app server
	startServer();
} else {
	// application imported as a module via "require": export function
	// to create server
	module.exports = startServer;
}