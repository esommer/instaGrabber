var urlParser = require('url');
var querystring = require('querystring');
var httpsGet = require('../lib/httpsLoader').httpsGet;
var fs = require('fs');
var users = require('../lib/users');

jsonRespond = function (res, data) {
	res.write(JSON.stringify(data));
	res.end();
};

updateUserData = function (user, updateObject) {
	user.next_url = updateObject.next_url;
	users.saveUser(user);
}

extractPhotoData = function (photo) {
	return {
		tags: photo.tags,
		type: photo.type,
		comments: photo.comments,
		filter: photo.filter,
		likes: photo.likes,
		href: photo.images.standard_resolution.url,
		thumb: photo.images.thumbnail.url,
		caption: photo.caption? photo.caption.text: '',
		id: photo.id
	}
}

cleanPhotoData = function (parsed, callback) {
	var photos = [];
	for (var i=0; i < parsed.data.length; i++) {
		photos.push(extractPhotoData(parsed.data[i]));
	}
	if (photos.length === parsed.data.length) {
		callback(photos);
	}
	else {
		callback(photos, 'incomplete collection of photo data');
	}
};

exports.getPhotos = function (req, res, data, user, callback) {
	var path = data.requestNum === 0 ? '/v1/users/' + user.user_id + '/media/recent/?access_token=' + user.access_token : user.next_url;
	httpsGet(path, function (parsed, err) {
		if (err) {
			jsonRespond(res, {'error':'Instagram appears to be temporarily unavailable. Please try again.', 'requestNum':data.requestNum});
		} else {
			cleanPhotoData(parsed, function (photos, error) {
				var response = {'action':'sendPhotos', 'requestNum':data.requestNum, 'totalMedia':user.mediaCount};
				if (error) {
					response['error'] = error;
					if (data.nextURL !== undefined) response['nextURL'] = data.nextURL;
					if (data.totalPhotos !== undefined) response['totalPhotos'] = data.totalPhotos;
					jsonRespond(res, response);
				}
				else {
					response['photos'] = photos;
					if (parsed.pagination !== undefined && parsed.pagination.next_url !== undefined) {
						var userNextURL = parsed.pagination.next_url.replace('https://api.instagram.com','');
						response['nextURL'] = userNextURL;
						updateUserData(user, {'next_url':userNextURL});
					}
					jsonRespond(res, response);
				}
			});
		}
	});
};
