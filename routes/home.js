var urlParser = require('url');
var querystring = require('querystring');
var httpsLoader = require('../lib/httpsLoader');
var constants = require('../private/constants');
var users = require('../lib/users');

getUserTotal = function (user) {
	var path = '/v1/users/' + user.user_id + '/?access_token=' + user.access_token;
	httpsLoader.httpsGet(path, function (parsed, err, callback) {
		if (err) {
			console.log('Error fetching extra user info: ' + err);
		}
		else {
			if (parsed.data !== undefined) {
				user.mediaCount = parsed.data.counts.media;
				user.full_name = parsed.data.full_name;
				user.profile_picture = parsed.data.profile_picture;
				user.follows = parsed.data.counts.follows;
				user.followed_by = parsed.data.counts.followed_by;
				users.saveUser(user);
			}
		}
	});
};

exports.loadData = function(req, res, next){
  	var code = '';
  	var user = '';
	var username = '';
	var userLoginURI = "https://api.instagram.com/oauth/authorize/?client_id=" + constants.client_id + "&redirect_uri=http://" + constants.address + "/home&response_type=code";
	var userMessage = 'Please log in: ';
	if (req.url !== undefined && urlParser.parse(req.url).query !== null) {
		code = urlParser.parse(req.url).query.toString().replace(/code=/, '');
		var sendData = {
			'client_id' : constants.client_id,
			'client_secret' : constants.client_secret,
			'grant_type' : 'authorization_code',
			'redirect_uri' : 'http://' + constants.address + '/home',
			'code' : code
		}
		httpsLoader.httpsPost('/oauth/access_token', sendData, function (parsed, err) { 
			if (err) {
				console.log('Error fetching initial user data & access token from instagram: ' + err);
				res.render('home', {"message": "Error connecting to Instagram. Please try again: ", "hrefAddress": userLoginURI});
			}
			else if (parsed !== undefined && parsed['user'] !== undefined) {
				var user = {
					'user_id' : parsed['user']['id'],
					'username' : parsed['user']['username'],
					'access_token' : parsed['access_token'],
					'imgLinks' : [],
					'next_url' : '',
					'mediaCount' : 0,
					'profile_picture': '',
					'full_name' : '',
					'follows' : 0,
					'followed_by' : 0,
					'zipfile' : '',
					'zipStage': '',
					'zipPercent': 0,
					'zipReqNum' : 0
				};
				users.saveUser(user);
				getUserTotal(user);
				req.session.user_id = user.user_id;
				res.redirect('/photos');
			}
			else {
				res.redirect(constants.address + '/home', {"message": userMessage, 'hrefAddress': userLoginURI});
			}
		});
	}
	else {
		res.render('./home', {"message": userMessage, "hrefAddress": userLoginURI});
	}
};
