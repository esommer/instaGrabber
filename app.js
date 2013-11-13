// SET VARS & REQUIRE MODULES:
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

// FIRE UP THE ENGINES:
app.listen(port,constants.address.replace(':3000',''));
console.log('Server running on ' + constants.address + "; Process: " + process.pid);

// SET SOME DEFAULTS:
app.set('port', port);
app.engine('html', cons.swig);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));
app.use(express.logger('dev'));
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

// ON APP START, PROMPT TERMINAL USER FOR RESETTING USER FILE:
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


// ROUTING FTW:
// app.get('/', routes.index);

// HANDLE STATIC FILES:
serveStatic = function (req) {
	var filepath = urlParser.parse(req.url).pathname;
	res.sendfile(filepath);
};

app.get('/js/*', function (req, res, callback) {
	serveStatic(req);
});

app.get('/css/*', function (req, res, callback) {
	serveStatic(req);
});

app.get('/img/*', function (req, res, callback) {
	serveStatic(req);
});

checkUser = function (req) {
	if (req.session !== undefined && req.session.user_id !== undefined && users.getUser(req.session.user_id) !== false) {
		return true;
	}
};

// HANDLE DOWNLOAD REQUEST: 
app.get('/public/temp/*', function (req, res, callback) {
	var filepath = urlParser.parse(req.url).pathname;
	var filename = filepath.replace('/public/temp/', '');
	console.log(filename);
	// res.type('application/x-gzip');
	// res.attachment(filename);
	res.sendfile(__dirname + filepath, filename, function (err) {
		if (err) {
			console.log(err);
		}
	});
});

//HANDLE SPECIFIC LOCATIONS & ROUTES:
app.get('/*', function (req, res, callback) {
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
		zipper.zipFiles(req, res, data, user, undefined);
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
				case ('loadPhotoLinks'):
					console.log('headed to photos');
					photos.loadData(req, res, data, user, undefined);
					break;
				case ('fetchingFiles'):
				case ('zipping'):
					console.log('status is fetching or zipping, sending to zipUpdate');
					zipper.zipUpdate(req, res, data, user, undefined);
					break;
				default:
					photos.loadData(req, res, data, user, undefined);
			}
		}
		else {
			console.log('received empty post from: '+user.username);
		}
	});
});




