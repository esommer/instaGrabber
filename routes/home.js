var urlParser = require('url');
var querystring = require('querystring');
var httpsPost = require('../lib/httpsLoader').httpsPost;
var constants = require('../private/constants');
var users = require('../lib/users');


exports.loadData = function(req, res, next){
  	var code = '';
	var username = '';
	var userLoginURI = "https://api.instagram.com/oauth/authorize/?client_id=" + constants.client_id + "&redirect_uri=http://" + constants.address + "/home&response_type=code";
	var userMessage = 'Please log in: ';
	if (req.url !== undefined && urlParser.parse(req.url).query) { 
		code = urlParser.parse(req.url).query.toString().replace(/code=/, '');
		var sendData = {
			'client_id' : constants.client_id,
			'client_secret' : constants.client_secret,
			'grant_type' : 'authorization_code',
			'redirect_uri' : 'http://' + constants.address + '/home',
			'code' : code
		}
		httpsPost('/oauth/access_token', sendData, function (parsed, err) { 
			if (err) {
				res.render('home', {"message": err, "hrefAddress": userLoginURI});
			}
			else {
				var access_token = parsed['access_token'];
				var user_id = parsed['user']['id'];
				username = parsed['user']['username'];
				req.session.user_id = user_id;
				users.saveUser({
					'user_id' : user_id,
					'username' : username,
					'access_token' : access_token,
					'imgLinks' : [],
					'next_url' : ''
				});
				userLoginURI = "/photos?username=" + username;
				userMessage = 'Thanks for logging in! Click here to see your shots:';
				res.render('home', {"message": userMessage, "hrefAddress": userLoginURI});
			}
		});
	}
	else {
		res.render('./home', {"message": userMessage, "hrefAddress": userLoginURI});
	}
};


exports.checkUser = function (req, res, callback) {
	if (req.session !== undefined && req.session.user_id !== undefined && users.getUser(req.session.user_id) !== false) {
		res.redirect('../photos');
	} else {
		callback(req, res, undefined);
	}
};

