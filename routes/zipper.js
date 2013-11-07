var fs = require('fs');
var http = require('http');
var zlib = require('zlib');
var targz = require('tar.gz');

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
}
var zipDir = function (username) {
	var compress = new targz().compress('./public/temp/'+username+'/', './public/temp/'+username+'/'+username+'.tar.gz', function (err) {
		if (err) {
			console.log(err);
		}
	});
}
exports.zipFiles = function (req, res, callback) {
	var files = req.body.fileList.toString().split(',');
	var username = req.body.username.toString();
	var newFilepath = __dirname.replace('/routes','') + '/public/temp/'+username+'/';
	if (!fs.exists(newFilepath)) {
		fs.mkdir(newFilepath,function (err) {
			if(err) {
				console.log(err);
			}
		});
	}
	var fileCount = files.length;
	var counter = 0;
	
	for (var i=0; i<files.length; i++) {
		fetchFile(files[i], username, function() {
			counter++;
			if(counter === fileCount) {
				zipDir(username);
				res.render('zipper', {'link':'../public/temp/' + username + '/' + username + '.tar.gz'});
			}
		});		
	}
	
};
