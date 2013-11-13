var constants = require('../private/constants');
var fs = require('fs');

// STRUCTURE OF A USER:
// instagram_user_id = {
// 	'user_id' : user_id,
// 	'username' : username,
// 	'access_token' : access_token,
// 	'imgLinks' : [],
// 	'next_url' : '',
// 	'mediaCount' : 0,
// 	'profile_picture': '',
// 	'full_name' : '',
// 	'follows' : 0,
// 	'followed_by' : 0,
// 	'zipStage': '',
//	'zipStart': '',
//	'zipPercent': ''
// };


var users = {};
var userVarStatus = 'unset';

readUserFile = function () {
	if (userVarStatus === ( 'unset' || 'behind')) {
		fs.readFile(constants.userFile, function (err, data) {
			if (err) {
				console.log("Error reading data from user.json file: " + err);
			}
			else {
				users = JSON.parse(data);
				userVarStatus = 'current';
			}
		});
	}	
};

writeUserFile = function () {
	if (userVarStatus === 'ahead' || userVarStatus === 'unset') {
		fs.writeFile(constants.userFile, JSON.stringify(users, undefined, 4), function (err) {
			if (err) {
				console.log("Error saving userVar to user.json file: " + err);
			}
			else {
				userVarStatus = 'current';
			}
		});
	}
};

exports.setup = function (reset) {
	if (reset === 'reset') {
		writeUserFile();
	} else {
		readUserFile();
	}
};

exports.getUser = function (user_id) {
	if (users[user_id] !== undefined) {
		return users[user_id];
	}
	else {
		return false;
	}
};

exports.saveUser = function (user) {
	users[user.user_id] = user;
	userVarStatus = 'ahead';
	writeUserFile();
};

