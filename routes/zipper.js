var fs = require('fs');
var http = require('http');
var zlib = require('zlib');
var targz = require('tar.gz');
var users = require('../lib/users');

jsonSend = function (res, data) {
	res.write(JSON.stringify(data));
	res.end();
};

var fetchFile = function (fileAddress, username, callback) {
	http.get(fileAddress, function (response){
		var addressParts = fileAddress.split('/');
	    var localFileAddress = './public/temp/'+username+'/'+addressParts.pop();
	    var toFile = fs.createWriteStream(localFileAddress, {'flags':'a'});
		response.on('data', function(chunk){
	        toFile.write(chunk,encoding='binary');
	    });
	    response.on('end', function(){
			toFile.end();
			toFile.on('finish',function() {
				callback();
			});
		});
	}).on('error', function (e) {
		console.log('error fetching file: '+ e);
	});
};

var zipDir = function (username, res, callback) {
	var compress = new targz().compress('./public/temp/'+username+'/', './public/temp/'+username+'.tar.gz', function (err) {
		if (err) {
			console.log(err);
		}
		else {
			callback(res);
			var dirname = './public/temp/'+username+'/'
			var count = 0;
			var rmdirectory = function () {
				fs.rmdir(dirname, function (err) {
					if (err) {
						console.log("Error deleting user directory: "+dirname+ " "+err);
					}
					else {
						console.log('removed directory!');
					}
				});
			}
			fs.readdir(dirname, function (err, files) {
				if (err) {
					console.log("Error reading files to delete: " + err);
				}
				else {
					for (var i=0;i<files.length;i++) {
						fs.unlink(dirname+files[i],err,function(err) {
							if (err) {
								console.log('Error deleting file: '+dirname+files[i]+ " "+err);
							}
						});
						count++;
						console.log('removed file, count: '+ count);
						if(count === files.length) {
							console.log('should remove directory now');
							rmdirectory();
						}
					}
				}
			});
		}
	});
};

exports.zipUpdate = function (req, res, body, user, callback) {
	if (user.zipfile !== '' && user.zipStage === 'done') {
		jsonSend(res, {'action':'doneZip', 'requestNum':body.requestNum, 'percent':100, 'link':user.zipfile});
	}
	else {
		users.saveUser(user);
		jsonSend(res, {'action':user.zipStage, 'percent':user.zipPercent, 'requestNum':body.requestNum});
	}
};

exports.zipFiles = function (req, res, data, user, callback) {
	console.log('zipFiles begun: ');
	console.log(data);
	var files = data.fileList.toString().split(',');
	var newFilepath = './public/temp/'+user.username+'/';
	if (!fs.exists(newFilepath)) {
		fs.mkdir(newFilepath,function (err) {
			if(err) {
				console.log(err);
			}
		});
	}
	var fileCount = files.length;
	var counter = 0;
	user.zipSize = fileCount;
	user.zipStage = 'fetchingFiles';
	user.zipPercent = 0;
	users.saveUser(user);
	jsonSend(res,{'action':'fetchingFiles','requestNum':data.requestNum,'percent':0});

	for (var i=0; i<files.length; i++) {
		fetchFile(files[i], user.username, function() {
			counter++;
			user.zipPercent = Math.round(counter/user.zipSize*100);
			users.saveUser(user);
			console.log('file downloaded: '+counter);
			console.log('user updated, zipPercent: '+ user.zipPercent);
			if(counter === fileCount) {
				var timeStart = Date.now();
				user.zipStart = Date.now();
				user.zipStage = 'zipping';
				zipDir(user.username, res, function (res) {
					var timeTotal = Date.now() - timeStart;
					user.zipfile = '../public/temp/' + user.username + '.tar.gz';
					user.zipStage = 'done';
					users.saveUser(user);
				});
			}
		});
	}
};
