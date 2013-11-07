
var constants = require('./private/constants');
var express = require('express');
var routes = require('./routes/index');
var home = require('./routes/home');
var photos = require('./routes/photos');
var zipper = require('./routes/zipper');
var users = require('./lib/users');

var path = require('path');
var urlParser = require('url');
var cons = require('consolidate');
var port = process.env.PORT || 3000;
var app = express();

app.listen(port,constants.address.replace(':3000',''));
console.log('Server running on ' + constants.address + "; Process: " + process.pid);

process.stdout.pause();
app.set('port', port);
app.engine('html', cons.swig);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));
app.use(express.favicon());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.cookieParser());
app.use(express.cookieSession({
	cookieName: constants.cookieName,
	secret: constants.cookieSecret
}));
app.use(app.router);
process.stdout.resume();
process.stdin.resume();
process.stdin.setEncoding('utf8');
console.log('reset users? Y/N');
process.stdin.on('data', function(response) {
	if (response === 'Y\n' || response === 'y\n') {
		users.setup('reset');
		process.stdin.pause();
	}
	else {
		users.setup();
		process.stdin.pause();
	}
});

app.get('/', routes.index);

app.get('/home', function (req, res, next) {
	home.checkUser(req, res, function (req, res, callback) {
		home.loadData(req, res, undefined);
	});
});

app.get('/photos', function (req, res, next) {
	res.render('photos', {'address':constants.address});
});

app.post('/photos', function (req, res, next) {
	photos.loadData(req, res, undefined);
});

app.post('/zipper', function (req, res, next) {
	zipper.zipFiles(req, res, undefined);
});

app.get('/public/temp/*', function (req, res, next) {
	var filepath = urlParser.parse(req.url).pathname;
	res.download(__dirname + filepath);
});
