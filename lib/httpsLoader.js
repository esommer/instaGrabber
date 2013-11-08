
var https = require('https');
var querystring = require('querystring');


exports.httpsPost = function (postpath, dataObj, callback) {
	var dataQuery = querystring.stringify(dataObj);
	var dataLength = dataQuery.length;
	var postOptions = {
		hostname: 'api.instagram.com',
		port: 443,
		method: 'POST',
		path: postpath,
		headers: {
			'Content-Length': dataLength
		}
	};
	var request = https.request(postOptions, function (response) {
		var receivedData = '';
		response.setEncoding('utf8');
		response.on('data', function (chunk) {
			receivedData += chunk;
		});
		response.on('end', function () {
			try {
				receivedData = JSON.parse(receivedData);
			}
			catch (e) {
				console.log('error happened: '+ e);
				if (receivedData.search('<html><body><h1>503 Service Unavailable</h1>') !== -1) {
					console.log(response.status);
					var parsedData = undefined;
					var err = "Instagram unavailable. Please try again: ";
				}
			}

			callback(receivedData, err);
		});
	}).on('error', function (e) {
		console.log('https POST request error: ' + e);
	});
	request.write(dataQuery);
	request.end();
};

exports.httpsGet = function (reqpath, callback) {
	var getOptions = {
		hostname: 'api.instagram.com',
		port: 443,
		method: 'GET',
		path: reqpath
	}
	var request = https.request(getOptions, function (response) {
		var receivedData = '';
		response.setEncoding('utf8');
		response.on('data', function (chunk) {
			receivedData += chunk;
		});
		response.on('end', function () {
			try {
				receivedData = JSON.parse(receivedData);
			}
			catch (e) {
				if (e instanceof SyntaxError) {
					var parsedData = undefined;
					if (response.status === 503) {
						var err = "Instagram unavailable. Please try again: ";
					}
				}
			}
			callback(receivedData, err);
		});
	}).on('error', function (e) {
		console.log('https GET request error: ' + e);
	});
	request.end();
};


