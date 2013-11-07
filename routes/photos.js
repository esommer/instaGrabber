var urlParser = require('url');
var querystring = require('querystring');
var httpsGet = require('../lib/httpsLoader').httpsGet;
var fs = require('fs');
var users = require('../lib/users');

exports.loadData = function(req, res, callback, appVars){
	var body = '';
	var pageRequested = null;
	var path = '';
	var username = ''; 
	var user = {};
	var requestor = req.session.user_id;
	req.on('data', function (chunk) {
		body += chunk;
	});
	req.on('end', function () {
		pageRequested = JSON.parse(body).page;
		//username = urlParser.parse(req.url).query.toString().replace(/username=/, '');
		//var user = users.getUser(requestor);
		if (requestor !== undefined) {
			user = users.getUser(requestor);
			user.imgLinks = [];
			if (pageRequested === 0) {
				path = '/v1/users/' + user.user_id + '/media/recent/?access_token=' + user.access_token;
			}
			else if (pageRequested > 0) {
				path = user.next_url;
			}
			var getNextFeed = function (parsed,callback) {
				nextStatus = null;
				var toSendImgs = [];
				if (parsed !== undefined && parsed.data !== undefined) {
					receivedImgs = parsed.data;
					for (var i=0; i < receivedImgs.length; i++) {
						user.imgLinks.push(receivedImgs[i].images);
						toSendImgs.push(receivedImgs[i].images);
					}
					if (parsed.pagination !== undefined && parsed.pagination.next_url !== undefined) {
						user.next_url = parsed.pagination.next_url.replace('https://api.instagram.com','');
						nextStatus = 'continue';
					} else {
						nextStatus = 'done';
						user.next_url = '';
					}
				}
				else {
					nextStatus = 'error';
					toSendImgs = null;
				}
				res.write(JSON.stringify({'status':nextStatus, 'data' : toSendImgs}));
				res.end();
			};
			if (path !== '') {
				httpsGet(path, function (parsed, err, callback) { 
					if (err) {
						res.render('error', {'data': 'Instagram appears to be temporarily unavailable. Please try again.'});
					} else {
						getNextFeed(parsed);
					}
				});
			}
		} // end if username and id match session vars
		else {
			res.write(JSON.stringify({'status':'error', 'data' : null}));
			res.end();
		} // end else (user not logged in)
	}); // end req.on('end')
};
