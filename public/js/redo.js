window.onload = function () {

	var DataHandler = function() {
		this.mediaCount = 0;
	}

	DataHandler.prototype.sendMsg = function (address, dataObj, domFunctions) {
		// messages should take form: {
		// 	'error' : '',
		// 	'action' : '', // loadPhotoLinks, donePhotos, fetchingFiles, zipping, doneZip
		// 	'number' : '', // pageNumber, percentage
		// 	'data' : {} // ex: totalMedia, zipLink
		// };
		var url = window.location.href.replace(window.location.href.replace(/^http:\/\/[\w]*\//, ''), '') + '/' + address;
		var requestObj = new XMLHttpRequest();
		requestObj.open("POST", url);
		requestObj.setRequestHeader('Content-Type', 'text/json');
		requestObj.send(JSON.stringify(dataObj));
		requestObj.onreadystatechange = function () {
			if(requestObj.readyState == 4 && requestObj.status == 200 && requestObj.responseText !== undefined) {
				try {
					this.handleMessage(document, JSON.parse(requestObj.responseText), domFunctions);
				}
				catch (e) {
					if (e) {
						var catchErr = 'error parsing server response: ' + e;
						domFunctions.displayError(catchErr);
						console.log(catchErr);
					}
				}
			}
		};
	};

	DataHandler.prototype.handleMessage = function (document, message, domFunctions) {
		if (message.error !== '') {
			//this.keepRequesting = 'more';
			domFunctions.displayError(message.error);
		}
		switch (message.action) {
			case ('loadPhotoLinks'):
				//stateData.keepRequesting = 'more';
				domFunctions.deleteErrors(document);
				domFunctions.buildImgs(document,message.data,'json');
				var timeout =  message.status === 'error'? 3000: 1;
				window.setTimeout(messenger, timeout,'photos',{'error':'', 'action':'loadPhotoLinks', 'number':message.number + 1, 'data':{}});
				break;
			case ('donePhotos'):
				//stateData.keepRequesting = 'stop';
				domFunctions.updateLoading(document, this.mediaCount, true);
				domFunctions.storeLinks(document, localStorage);
				break;
			case ('fetchingFiles'):
				//stateData.keepRequesting = 'more';
				window.setTimeout(messenger, 500, 'photos',{'status':'zipping','reqNum':requestNum},function (message) {
					zipHandler(message);
				});
				console.log('fetching files... ' + message.number);
				break;
			case ('zipping'):
				//stateData.keepRequesting = 'more';
				window.setTimeout(messenger, 500, 'photos',{'status':'zipping','reqNum':requestNum},function (message) {
					zipHandler(message);
				});
				console.log('zipping files... ' + message.number);
				break;
			case ('doneZip'):
				//stateData.keepRequesting = 'stop';
				console.log('finished the ZIP');
				var menuul = document.getElementById('actions');
				var downloadbutton = document.createElement('a');
				downloadbutton.href = message.data.link;
				downloadbutton.download = 'instagram_photos.tar.gz';
				downloadbutton.innerHTML = 'download your zipped photos!';
				var linkli = document.createElement('li');
				menuul.appendChild(linkli);
				linkli.appendChild(downloadbutton);
				break;
			default:
				break;
		}
	}

	


	var photoLoader = function (message) {
		

		count ++;

		if (message.data !== {} && message.data.mediaCount !== undefined) {
			receivedCount = 20;
			document.getElementById('totalMedia').innerHTML = receivedCount + " out of " + message.data.mediaCount;
		} else {
			receivedCount = 20*count;
			totalMedia.innerHTML = receivedCount + " out of " + mediaCount;
		}
	};



	var domFunctions = {
		storeLinks : function (document, localStorage) {
			var links = [];
			var linkObjs = document.getElementsByName('fileList');
			for (var i=0;i<linkObjs.length;i++) {
				if (linkObjs[i].checked === true) {
					links.push(linkObjs[i].value + "*" + linkObjs[i].nextSibling.href);
				}
			}
		},
		updateLoading : function (document, num, done) {
			var loading = document.getElementById('loading');
			var totalMedia = document.getElementById('totalMedia');
			if (done === true) {
				loading.innerHTML = 'All ' + num.toString() + ' photos loaded!';
				totalMedia.parentNode.removeChild(totalMedia);
			}
		},
		displayError : function (document, error) {
			var msg = document.createElement('p');
			msg.setAttribute('class','errMsg');
			msg.innerHTML = error;
			document.getElementById('errors').appendChild(msg);
		},
		deleteErrors : function (document) {
			var errMsgs = document.querySelectorAll('p.errMsg');
			for (var i = 0; i < errMsgs.length; i++) {
				errMsgs[i].parentNode.removeChild(errMsgs[i]);
			}
		},
		buildImgs : function (document, dataArr, dataType) {
			for (var i = 0; i < dataArr.length; i++) {
				if (dataArr[i] !== '' && dataArr[i] !== undefined) {
					var links = dataType === 'strings'? linkArr[i].split('*'): [dataArr[i].standard_resolution.url, dataArr[i].thumbnail.url];
					var newLi = document.createElement('li');
					var checkbox = document.createElement('input');
					var newA = document.createElement('a');
					var img = document.createElement('img');
					newA.href = links[0];
					newA.setAttribute('download',links[0]);
					checkbox.setAttribute('type','checkbox');
					checkbox.setAttribute('name', 'fileList');
					checkbox.setAttribute('value',links[0]);
					img.src = links[1];
					document.getElementById('photoList').appendChild(newLi);
					newLi.appendChild(checkbox);
					newLi.appendChild(newA);
					newA.appendChild(img);
				}
			}
		},
		toggleAll : function (document) {
			var inputs = document.getElementsByTagName('input');
			var selected = document.getElementById('selectcheck').checked;
			if (selected === false) {
				for (var i=0; i<inputs.length; i++) {
					if (inputs[i].getAttribute('type') === 'checkbox') {
						inputs[i].removeAttribute('checked');
					}
				}
			}
			else {
				for (var i=0; i<inputs.length; i++) {
					if (inputs[i].getAttribute('type') === 'checkbox') {
						inputs[i].setAttribute('checked',"checked");
					}
				}
			}
		},
		resizeImgs : function(document) {
			if (x < 2000) {
				var imgWidth = (x-250) / 4;
			 	var imgs = document.getElementsByTagName('img')
			 	for (var i=0;i<imgs.length;i++) {
			 		imgs[i].style.width = imgWidth + 'px';
			 	}
			}
		},
	};


	var pageSetup = function (document, localStorage, domFunctions) {

		var dataMan = new DataHandler();

		// BUILD PAGE -- IF LOCAL DATA, LOAD IT, ELSE, REQUEST IT:
		if (localStorage.imgLinks !== undefined) {
			var totalMedia = document.getElementById('totalMedia');
			var loading = document.getElementById('loading');
			domFunctions.buildImgs(document, localStorage.imgLinks.split(';'), 'strings');
			var num = localStorage.imgLinks.split(';').length - 1;
			
			resizeImgs();
		}
		else {
			messenger('photos',{'error':'', 'action':'loadPhotoLinks', 'number':0, 'data':{}}, function (responseText) {
				photoLoader(responseText);
			});
		}

		document.getElementById('zipit').addEventListener('click', function() {
			var files = [];
			var fileObjs = document.getElementsByName('fileList');
			for (var i=0;i<fileObjs.length;i++) {
				if (fileObjs[i].checked === true) {
					files.push(fileObjs[i].value);
				}
			}
			messenger('zip',{'status':'zipRequested','fileList':files}, function (responseText) {
				requestNum ++;
				zipHandler(responseText);
			});
		}, false);
		
		// IMAGE RESIZING:
		var x = window.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName('body')[0].clientWidth;
	    var y = window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight;
		domFunctions.resizeImgs(document);

		// test for existence of photos and select all button:
		if (photoList.childNodes.length > 0) {
			var selectcheck = document.getElementById('selectcheck');
			selectcheck.style.opacity = 1.0;
			selectcheck.addEventListener('click', domFunctions.toggleAll, false);
		}

	};
	
};
