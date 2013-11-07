var appVars = {
	connectedUsers : {},
};
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

app.set('port', port);
app.engine('html', cons.swig);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.cookieParser());
app.use(express.cookieSession({
	cookieName: constants.cookieName,
	secret: constants.cookieSecret
}));
app.use(app.router);

users.setup();

app.get('/', routes.index);

app.get('/home', function (req, res, next) {
	home.loadData(req, res, undefined);
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
