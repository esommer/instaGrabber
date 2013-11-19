// SET VARS & REQUIRE MODULES:

var express = require('express');
var routes = require('./routes');
var home = require('./routes/home');
var photos = require('./routes/photos');
var zipper = require('./routes/zipper');
var users = require('./lib/users');
var path = require('path');
var urlParser = require('url');
var cons = require('consolidate');
var port = process.env.PORT || 5000;
var app = express();

// FIRE UP THE ENGINES:
app.listen(port);
console.log('Server running on ' + process.env.ADDRESS + process.env.PORT + "; Process: " + process.pid);

// SET SOME DEFAULTS:
app.set('port', port);
app.set('views', path.join(__dirname, 'views'));
app.engine('html', cons.swig);
app.set('view engine', 'html');

app.use(express.logger('dev'));
app.use(express.favicon());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.cookieSession({
	cookieName: process.env.COOKIE_NAME,
	secret: process.env.COOKIE_SECRET
}));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

//IF DEV MODE, ON APP START, PROMPT TERMINAL USER FOR RESETTING USER FILE:
if (process.env.DEV_MODE === 'dev') {
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
}
else {
	users.setup('reset');
}


// ROUTING FTW:
// app.get('/', routes.index);

// HANDLE STATIC FILES:
// serveStatic = function (req, res) {
// 	var filepath = './public' + urlParser.parse(req.url).pathname;
// 	res.sendfile(filepath);
// };

// app.get('/js/*', function (req, res, callback) {
// 	serveStatic(req, res);
// });

// app.get('/css/*', function (req, res, callback) {
// 	serveStatic(req, res);
// });

// app.get('/imgs/*', function (req, res, callback) {
// 	serveStatic(req, res);
// });

// app.get('/favicon.ico', function (req, res, callback) {
// 	serveStatic('./public/imgs/favicon.ico');
// });

checkUser = function (req) {
	if (req.session !== undefined && req.session.user_id !== undefined && users.getUser(req.session.user_id) !== false) {
		return true;
	}
};

// HANDLE DOWNLOAD REQUEST: 
app.get('/public/temp/*', function (req, res, callback) {
	var filepath = urlParser.parse(req.url).pathname;
	var filename = filepath.replace('/public/temp/', '');
	res.sendfile(__dirname + filepath, filename, function (err) {
		if (err) {
			console.log(err);
		}
	});
});

//HANDLE SPECIFIC LOCATIONS & ROUTES:
app.get('/home', function (req, res, callback) {
	if (checkUser(req) === true ) {
		res.render('photos');
	}
	else {
		home.loadData(req, res, undefined);
	}
});

//HANDLE SPECIFIC LOCATIONS & ROUTES:
app.get('/photos', function (req, res, callback) {
	if (checkUser(req) === true ) {
		res.render('photos');
	}
	else {
		home.loadData(req, res, undefined);
	}
});

app.post('/zip', function (req, res, callback) {
	var requestor = req.session.user_id;
	var user = users.getUser(requestor);
	var body = '';
	var data = '';
	req.on('data', function (chunk) {
		body += chunk;
	});
	req.on('end', function () {
		try {
			data = JSON.parse(body);
		}
		catch (e) {
			console.log('error parsing zip request data: '+ e);
		}
		if (data !== '') {
			switch (data.action) {
				case ('startZip'):
					zipper.zipFiles(req, res, data, user, undefined);
					break;
				case ('fetchingFiles'):
				case ('zipping'):
					zipper.zipUpdate(req, res, data, user, undefined);
					break;
				default:
					break;
			}
		}
	});
});

app.post('/photos', function (req, res, callback) {
	var requestor = req.session.user_id;
	var user = users.getUser(requestor);
	var body = '';
	var data = '';
	req.on('data', function (chunk) {
		body += chunk;
	});
	req.on('end', function () {
		try {
			data = JSON.parse(body);
		}
		catch (e) {
			console.log("error parsing request data: "+ e);
		}
		if (data !== '') {
			switch (data.action) {
				case ('getPhotos'):
					photos.getPhotos(req, res, data, user, undefined);
					break;
			}
		}
		else {
			console.log('received empty post from: '+user.username);
		}
	});
});




