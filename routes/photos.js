var urlParser = require('url');
var querystring = require('querystring');
var httpsGet = require('../lib/httpsLoader').httpsGet;
var fs = require('fs');
var users = require('../lib/users');

jsonSend = function (res, data) {
	console.log(data);
	res.write(JSON.stringify(data));
	res.end();
};

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
		if (requestor !== undefined) {
			user = users.getUser(requestor);
			user.imgLinks = [];
			if (pageRequested === 0) {
				path = '/v1/users/' + user.user_id + '/media/recent/?access_token=' + user.access_token;
			}
			else if (pageRequested > 0) {
				path = user.next_url;
			}
			var getNextFeed = function (parsed, someval, callback) {
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
				someval = {'status':nextStatus, 'data' : toSendImgs};
				callback(res, someval);
			};
			if (path !== '') {
				httpsGet(path, function (parsed, err, callback) { 
					if (err) {
						res.render('error', {'data': 'Instagram appears to be temporarily unavailable. Please try again.'});
					} else {
						var someval = {};
						getNextFeed(parsed, someval, function (res, someval) {
							jsonSend(res, someval);
						});
					}
				});
			}
		}
		else {
			res.write(JSON.stringify({'status':'error', 'data' : null}));
			res.end();
		}
	});
};
