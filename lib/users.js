var constants = require('../private/constants');
var fs = require('fs');

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
				console.log(users);
			}
		});
	}	
};

writeUserFile = function () {
	if (userVarStatus === 'ahead') {
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

exports.setup = function () {
	console.log('setting up user file...');
	if (!fs.exists(constants.userFile)) {
		fs.writeFile(constants.userFile, JSON.stringify(users, undefined, 4), function (err) {
			if (err) {
				console.log('Error creating user.json file: ' + err);
			} else if (userVarStatus === 'unset') {
				readUserFile();
				userVarStatus = 'current';
			}
		});
	}
};

exports.getUser = function (username) {
	if (users[username] !== undefined) {
		return users[username];
	}
	else {
		return false;
	}
};

exports.saveUser = function (user) {
	console.log('adding user');
	users[user.username] = user;
	userVarStatus = 'ahead';
	console.log(users);
	writeUserFile();
};

