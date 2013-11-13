window.onload = function () {

	var messenger = function(address, dataObj) {
		// messages should take form: {
		// 	'error' : '',
		// 	'action' : '', // loadPhotoLinks, donePhotos, fetchingFiles, zipping, doneZip
		// 	'number' : '', // pageNumber, percentage
		// 	'data' : {} // ex: totalMedia, zipLink, 
		// };
		var url = window.location.href.replace(window.location.href.replace(/^http:\/\/[\w]*\//, ''), '') + '/' + address;
		var requestObj = new XMLHttpRequest();
		requestObj.open("POST", url);
		requestObj.setRequestHeader('Content-Type', 'text/json');
		requestObj.send(JSON.stringify(dataObj));
		requestObj.onreadystatechange = function () {
			if(requestObj.readyState == 4 && requestObj.status == 200 && requestObj.responseText !== undefined) {
				try {
					var message = JSON.parse(requestObj.responseText)
				}
				catch (e) {
					if (e) {
						var catchErr = 'error parsing server response: ' + e;
						domFunctions.displayError(document,catchErr);
						console.log(catchErr);
					}
				}
				if(message !== undefined) {
					messageHandler(message);
				}
			}
		};
	};

	var messageHandler = function (message) {
		if (message.error !== '') {
			domFunctions.displayError(document,message.error);
		}
		switch (message.action) {
			case ('loadPhotoLinks'):
				domFunctions.deleteErrors(document);
				domFunctions.buildImgs(document,message.data.images,'json');
				domFunctions.resizeImgs(document);
				domFunctions.updateLoading(document, message.number*20, message.data.totalMedia, false);
				var timeout =  message.error !== ''? 3000: 1;
				window.setTimeout(messenger, timeout,'photos',{'error':'', 'action':'loadPhotoLinks', 'number':message.number + 1, 'data':{}});
				break;
			case ('donePhotos'):
				domFunctions.deleteErrors(document);
				domFunctions.buildImgs(document,message.data.images,'json');
				domFunctions.resizeImgs(document);
				domFunctions.updateLoading(document, message.data.totalMedia, message.data.totalMedia, true);
				domFunctions.storeLinks(document, localStorage);
				break;
			case ('fetchingFiles'):
				console.log('fetching files... ' + message.number);
				window.setTimeout(messenger, 500, 'photos',{'error':'', 'action':'fetchingFiles', 'number':message.number + 1, 'data':{}});
				break;
			case ('zipping'):
				console.log('zipping files... ' + message.number);
				window.setTimeout(messenger, 500, 'photos',{'error':'', 'action':'zipping', 'number':message.number + 1, 'data':{}});
				break;
			case ('doneZip'):
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
		updateLoading : function (document, num, total, done) {
			var loading = document.getElementById('loading');
			var totalMedia = document.getElementById('totalMedia');
			if (done === true) {
				loading.innerHTML = 'All ' + total.toString() + ' photos loaded!';
				totalMedia.parentNode.removeChild(totalMedia);
			}
			else {
				totalMedia.innerHTML = num.toString() + " out of " + total.toString();
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
					var links = dataType === 'strings'? dataArr[i].split('*'): [dataArr[i].standard_resolution.url, dataArr[i].thumbnail.url];
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
		toggleAll : function () {
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
			var x = window.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName('body')[0].clientWidth;
	    	var y = window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight;
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

		// BUILD PAGE -- IF LOCAL DATA, LOAD IT, ELSE, REQUEST IT:
		if (localStorage.imgLinks !== undefined) {
			var totalMedia = document.getElementById('totalMedia');
			var loading = document.getElementById('loading');
			domFunctions.buildImgs(document, localStorage.imgLinks.split(';'), 'strings');
			var num = localStorage.imgLinks.split(';').length - 1;		
			domFunctions.resizeImgs(document);
		}
		else {
			messenger('photos',{'error':'', 'action':'loadPhotoLinks', 'number':0, 'data':{}});
		}

		document.getElementById('zipit').addEventListener('click', function() {
			var files = [];
			var fileObjs = document.getElementsByName('fileList');
			for (var i=0;i<fileObjs.length;i++) {
				if (fileObjs[i].checked === true) {
					files.push(fileObjs[i].value);
				}
			}
			console.log(files);
			messenger('zip',{'error': '','action':'fetchingFiles','number':0,'data':{'fileList':files}});
		}, false);

		// test for existence of photos and select all button:
		if (photoList.childNodes.length > 0) {
			var selectcheck = document.getElementById('selectcheck');
			selectcheck.style.opacity = 1.0;
			selectcheck.addEventListener('click', domFunctions.toggleAll, false);
		}

	};

	pageSetup(document, localStorage, domFunctions);
	
};
