var urlParser = require('url');
var querystring = require('querystring');
var httpsGet = require('../lib/httpsLoader').httpsGet;
var fs = require('fs');
var users = require('../lib/users');

blargjsonSend = function (res, data) {
	res.write(JSON.stringify(data));
	res.end();
};

updateUserData = function (user, updateObject) {
	if (user.imgLinks.length === 0) {
		user.imgLinks = updateObject.imgLinks;
	}
	else {
		user.imgLinks = user.imgLinks.concat(updateObject.imgLinks);
	}
	user.next_url = updateObject.next_url;
	users.saveUser(user);
}

handleReceivedData = function (parsed, user, sendData, res, callback) {
	sendData = {};
	sendData.data = {};
	var error = '';
	var toSendImgs = [];
	var receivedImgs = {};
	var captureLinks = [];
	var userNextURL = '';
	if (parsed !== undefined && parsed.data !== undefined) {
		receivedImgs = parsed.data;
		for (var i=0; i < receivedImgs.length; i++) {
			captureLinks.push(receivedImgs[i].images);
			toSendImgs.push(receivedImgs[i].images);
		}
		if (parsed.pagination !== undefined && parsed.pagination.next_url !== undefined) {
			userNextURL = parsed.pagination.next_url.replace('https://api.instagram.com','');
			sendData.action = 'loadPhotoLinks';
			updateUserData(user, {'imgLinks': captureLinks, 'next_url':userNextURL});
		} else {
			sendData.action = 'donePhotos';
			userNextURL = '';
			updateUserData(user, {'imgLinks': captureLinks, 'next_url':userNextURL});
		}
	}
	else {
		error = 'Error fetching photos from Instagram.';
		toSendImgs = null;
	}
	sendData.error = error
	sendData.number = 0;
	sendData.data.images = toSendImgs;
	sendData.data.totalMedia = user.mediaCount;
	callback(res, sendData);
};

exports.loadData = function(req, res, data, user, callback){
	var pageRequested = data.number;
	var path = pageRequested === 0 ? '/v1/users/' + user.user_id + '/media/recent/?access_token=' + user.access_token : user.next_url;
	var sendData = {};
	if (pageRequested === 0) {
		sendData.data = {};
		sendData.data.totalMedia = user.mediaCount;
	}
	// if (user.mediaCount === user.imgLinks.length && pageRequested === 0) {
	// 	// we know this user and have their data ready! 
	// 	jsonSend(res, {'error':'','action':'donePhotos','number':pageRequested,'data':{'totalMedia':user.mediaCount,'images':user.imgLinks}});
	// }
	//else {
		httpsGet(path, function (parsed, err) { 
			if (err) {
				jsonSend(res, {'error':'Instagram appears to be temporarily unavailable. Please try again.', 'action':'loadPhotoLinks','number':data.number,'data':{}});
			} else {
				handleReceivedData(parsed, user, sendData, res, function (res, sendData) {
					blargjsonSend(res, sendData);
				});
			}
		});
	//}
};
