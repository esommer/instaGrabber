window.onload = function () {

	var dev = function(message) {
		var dev_mode = true;
		if (dev_mode) console.log(message);
	};
	var errlog = function(message) {
		var logging = true;
		if (logging) console.log(message);
	}






	// EVENT EMITTER:
	var EventEmitter = function () {
		this.handlers = {};
	};
	EventEmitter.prototype = {
		bind : function (event, fxn, scope) {
			this.handlers[event] = this.handlers[event] || [];
			this.handlers[event].push({'fxn':fxn, 'scope': scope});
			console.log(this.handlers);
		},
		emit : function (event, data) {
			console.log(arguments);
			dev(event + ' emitted');
			if (this.handlers[event] !== []) {
				console.log(this);
				for (var i = 0; i < this.handlers[event].length; i++) {
					this.handlers[event][i]['fxn'].call(this.handlers[event][i]['scope'], data);
				}
				// TO ASK MARY: WHY DOESN"T THIS WORK:
				// this.handlers[event].forEach(function(obj) {
				// 	obj['fxn'].call(obj['scope'], data);
				// }, obj['scope']);
			}
		}
	};






	// SERVER MESSENGER:
	var Messenger = function (window, notifier) {
		this.window = window;
		this.notifier = notifier;
	};
	Messenger.prototype = {
		send : function (to, dataObj, cbScope, callback) {
			console.log('req sent to '+ to);
			var url = this.window.location.href.replace(this.window.location.href.replace(/^http:\/\/[\w]*\//, ''), '') + '/' + to;
			var requestObj = new XMLHttpRequest();
			var data = {};
			requestObj.open("POST", url);
			requestObj.setRequestHeader('Content-Type', 'text/json');
			requestObj.send(JSON.stringify(dataObj));
			requestObj.onreadystatechange = function () {
				if(requestObj.readyState == 4 && requestObj.status == 200 && requestObj.responseText !== undefined) {
					try { data = JSON.parse(requestObj.responseText); }
					catch (e) { if (e) errlog('Error parsing server response: ' + e); }
					if (data !== {}) callback.call(cbScope, data);
					else errlog('no response text received from server');
				}
			};	
		},
		photoLoader : function (data) {
			var photoArr = [];
			for (var i = 0; i < data.photos.length; i++) {
				photoArr.push(data.photos[i]);
			}
			this.notifier.emit('photo chunk', photoArr);
			if (data.nextURL !== undefined) {
				var newRequest = {'action':'getPhotos'};
				var timer = data.error === undefined? 1: 3000;
				newRequest['requestNum'] = data.error === undefined? data.requestNum + 1: data.requestNum;
				newRequest['nextURL'] = data.nextURL;
				var that = this;
				this.window.setTimeout(function () {
					that.notifier.emit('get more photos', newRequest);
				}, timer);
				this.notifier.emit('update loading', {'loaded':20*data.requestNum + photoArr.length,'totalMedia':data.totalMedia});
			}
			else {
				this.notifier.emit('all photos loaded', {'totalMedia':data.totalMedia});
			}
		},
		zipUpdater : function (data) {
			console.log(data);
		}
	};




	

	// DOCUMENT OBJECT MODEL MANIPULATION:
	var DOM = function (window, document) {
		this.window = window;
		this.document = document;
	};
	DOM.prototype = {
		makeEmptyDOMElems : function () {
			return {
				outerLI : this.buildElement('li','photo'),
				figure : this.buildElement('figure'),
				ahref : this.buildElement('a'),
				img : this.buildElement('img'),
				caption : this.buildElement('caption'),
				metaUL : this.buildElement('ul', 'metaData'),
				likes : this.buildElement('li', 'likes'),
				filter : this.buildElement('li', 'filter'),
				checkbox : this.buildElement('input', undefined, [['type','checkbox'],['name','fileList']])
			};
		},
		buildElement : function (elemType, className, attributes) {
			var newLI = this.document.createElement(elemType);
			if (className !== undefined) newLI.className = className;
			if (attributes !== undefined && attributes.length > 0) {
				attributes.map(function (attr) {
					newLI.setAttribute(attr[0],attr[1]);
				});
			}
			return newLI;
		},
		cleanCaption : function (caption) {
			var cleaned = caption;
			return cleaned.replace(/#[\w]+/g, '');
		},
		addPhotoData : function (photo, elems) {
			var domElems = elems;
			domElems.outerLI.setAttribute('id','li_'+photo.id);
			domElems.img.src = photo.thumb;
			domElems.caption.innerHTML = this.cleanCaption(photo.caption);
			domElems.ahref.href = photo.href;
			domElems.filter.innerHTML = photo.filter;
			domElems.checkbox.value = photo.href;
			if (photo.likes.count > 0) {
				domElems.likes.innerHTML = photo.likes.count + ' <span class="heart">&#9829;</span>s';
			}
			else {
				delete domElems.likes;
			}
			if (photo.tags.length > 0) {
				domElems['tags'] = this.buildElement('ul','tags');
				domElems['taglist'] = [];
				for (var i = 0; i < photo.tags.length; i++) {
					var newLI = this.buildElement('li');
					newLI.innerHTML = '#' + photo.tags[i];	
					domElems.taglist.push(newLI);
				}
			}
			return domElems;
		},
		attachElemsToDom : function (elems) {
			var domElems = elems;
			this.document.getElementById('photoList').appendChild(domElems.outerLI);
			domElems.outerLI.appendChild(domElems.figure);
			domElems.figure.appendChild(domElems.ahref);
			domElems.figure.appendChild(domElems.checkbox);
			domElems.ahref.appendChild(domElems.img);
			domElems.figure.appendChild(domElems.caption);
			domElems.outerLI.appendChild(domElems.metaUL);
			if (domElems.likes) domElems.metaUL.appendChild(domElems.likes);
			domElems.metaUL.appendChild(domElems.filter);
			if (domElems.tags) {
				domElems.outerLI.appendChild(domElems.tags);
				for (var i = 0; i < domElems.taglist.length; i++) {
					domElems.tags.appendChild(domElems.taglist[i]);
				}
			}
		},
		displayPhotos : function (photos) {			
			photos.forEach(function (photo) {
				this.attachElemsToDom( this.addPhotoData( photo, this.makeEmptyDOMElems() ) );
			}, this);
		},
		updateLoading : function (data) {
			var loading = this.document.getElementById('loading');
			if (data.loaded !== undefined) {
				loading.innerHTML = "Loading " + data.loaded + " out of " + data.totalMedia;
			}
			else {
				loading.innerHTML = "All " + data.totalMedia + " photos loaded!";
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
		getSelectedImages : function () {
			var files = [];
			var fileObjs = this.document.getElementsByName('fileList');
			for (var i=0;i<fileObjs.length;i++) {
				if (fileObjs[i].checked === true) {
					files.push(fileObjs[i].value);
				}
			}
			return files;
		},
		// resizeImgs : function () {
		// },
		fetchDOMObject : function (objID) {
			return this.document.getElementById(objID);
		}
	};

	



	
	// RUNTIME FUNCTIONS:
	var Controller = function (notifier, dom, msg, localStorage) {
		this.notifier = notifier;
		this.dom = dom;
		this.msg = msg;
		this.localStorage = localStorage;
	};
	Controller.prototype = {
		activateButtons : function () {
			// all photos are loaded, now you may
			var selectcheck = this.dom.fetchDOMObject('selectcheck');
			selectcheck.addEventListener('click', this.dom.toggleAll, false);
			var zipper = this.dom.fetchDOMObject('zipit');
			zipper.addEventListener('click', this.zipIt.bind(this), false);
			// this.resizeImgs();
		},
		bindEvents : function () {
			this.notifier.bind('photo chunk', this.dom.displayPhotos, this.dom);
			this.notifier.bind('photo chunk', this.savePhotos, this);
			this.notifier.bind('update loading', this.dom.updateLoading, this.dom);
			this.notifier.bind('get more photos', this.getMorePhotos, this);
			this.notifier.bind('all photos loaded', this.dom.updateLoading, this.dom);
			this.notifier.bind('all photos loaded', this.activateButtons, this);
		},
		savePhotos: function (photos) {
			var storageArr = [];
			var inStorage = this.localStorage.photos === undefined? '':this.localStorage.photos.replace(/^undefined/, '');
			try {
				storageArr = JSON.parse(inStorage);
				console.log(storageArr);
			}
			catch (e) {
				if (e) console.log('instorage failed to parse');
				console.log(inStorage);
			}
			photos.forEach(function (photo) {
				storageArr.push(photo);
			}, photos);
			this.localStorage.photos = JSON.stringify(storageArr);
		},
		getFirstPhotos : function () {
			var loaded = false;
			var photos = [];
			if (this.localStorage.photos !== undefined) {
				try {
					photos = JSON.parse(this.localStorage.photos);
					loaded = true;
				}
				catch (e) {
					if (e) console.log('localStorage failed to parse');
				}
			}
			if (loaded === true) {
				this.dom.displayPhotos(photos);
				this.notifier.emit('all photos loaded',{'totalMedia':photos.length});
			}
			else if (loaded === false) {
				this.msg.send('photos', {'action':'getPhotos','requestNum':0}, this.msg, function (data) {
					this.photoLoader(data);
				});
			}
		},
		getMorePhotos : function (req) {
			this.msg.send('photos', req, this.msg, function (data) {
				this.photoLoader(data);
			});
		},
		zipIt : function () {
			console.log(this);
			var files = this.dom.getSelectedImages();
			this.msg.send('zip', {'action':'startZip','requestNum':0,'fileList':files}, this.msg, function (data) {
				this.zipUpdater(data);
			});
		}
	};

	
	var start = function (window, document, localStorage) {
		var notifier = new EventEmitter;
		var missionControl = new Controller (notifier, new DOM(window, document), new Messenger(window, notifier), localStorage);
		missionControl.bindEvents();
		missionControl.getFirstPhotos();
	}

	start(window, document, localStorage);












};




















































	// var messenger = function(address, dataObj) {
	// 	// messages should take form: {
	// 	// 	'error' : '',
	// 	// 	'action' : '', // loadPhotoLinks, donePhotos, fetchingFiles, zipping, doneZip
	// 	// 	'number' : '', // pageNumber, percentage
	// 	// 	'data' : {} // ex: totalMedia, zipLink, 
	// 	// };
	// 	var url = window.location.href.replace(window.location.href.replace(/^http:\/\/[\w]*\//, ''), '') + '/' + address;
	// 	var requestObj = new XMLHttpRequest();
	// 	requestObj.open("POST", url);
	// 	requestObj.setRequestHeader('Content-Type', 'text/json');
	// 	requestObj.send(JSON.stringify(dataObj));
	// 	requestObj.onreadystatechange = function () {
	// 		if(requestObj.readyState == 4 && requestObj.status == 200 && requestObj.responseText !== undefined) {
	// 			try {
	// 				var message = JSON.parse(requestObj.responseText)
	// 			}
	// 			catch (e) {
	// 				if (e) {
	// 					var catchErr = 'error parsing server response: ' + e;
	// 					domFunctions.displayError(document,catchErr);
	// 					console.log(catchErr);
	// 				}
	// 			}
	// 			if(message !== undefined) {
	// 				messageHandler(message);
	// 			}
	// 		}
	// 	};
	// };

	// var messageHandler = function (message) {
	// 	if (message.error !== '') {
	// 		domFunctions.displayError(document,message.error);
	// 	}
	// 	switch (message.action) {
	// 		case ('loadPhotoLinks'):
	// 			domFunctions.deleteErrors(document);
	// 			domFunctions.buildImgs(document,message.data.images,'json');
	// 			domFunctions.resizeImgs(document);
	// 			domFunctions.updateLoading(document, message.number*20, message.data.totalMedia, false);
	// 			var timeout =  message.error !== ''? 3000: 1;
	// 			window.setTimeout(messenger, timeout,'photos',{'error':'', 'action':'loadPhotoLinks', 'number':message.number + 1, 'data':{}});
	// 			break;
	// 		case ('donePhotos'):
	// 			domFunctions.deleteErrors(document);
	// 			domFunctions.buildImgs(document,message.data.images,'json');
	// 			domFunctions.resizeImgs(document);
	// 			domFunctions.updateLoading(document, message.data.totalMedia, message.data.totalMedia, true);
	// 			domFunctions.storeLinks(document, localStorage);
	// 			break;
	// 		case ('fetchingFiles'):
	// 			console.log('fetching files... ' + message.number);
	// 			window.setTimeout(messenger, 500, 'photos',{'error':'', 'action':'fetchingFiles', 'number':message.number + 1, 'data':{}});
	// 			break;
	// 		case ('zipping'):
	// 			console.log('zipping files... ' + message.number);
	// 			window.setTimeout(messenger, 500, 'photos',{'error':'', 'action':'zipping', 'number':message.number + 1, 'data':{}});
	// 			break;
	// 		case ('doneZip'):
	// 			console.log('finished the ZIP');
	// 			var menuul = document.getElementById('actions');
	// 			var downloadbutton = document.createElement('a');
	// 			downloadbutton.href = message.data.link;
	// 			downloadbutton.download = 'instagram_photos.tar.gz';
	// 			downloadbutton.innerHTML = 'download your zipped photos!';
	// 			var linkli = document.createElement('li');
	// 			menuul.appendChild(linkli);
	// 			linkli.appendChild(downloadbutton);
	// 			break;
	// 		default:
	// 			break;
	// 	}
	// };

	// var domFunctions = {
	// 	storeLinks : function (document, localStorage) {
	// 		var links = [];
	// 		var linkObjs = document.getElementsByName('fileList');
	// 		for (var i=0;i<linkObjs.length;i++) {
	// 			if (linkObjs[i].checked === true) {
	// 				links.push(linkObjs[i].value + "*" + linkObjs[i].nextSibling.href);
	// 			}
	// 		}
	// 	},
	// 	updateLoading : function (document, num, total, done) {
	// 		var loading = document.getElementById('loading');
	// 		var totalMedia = document.getElementById('totalMedia');
	// 		if (done === true) {
	// 			loading.innerHTML = 'All ' + total.toString() + ' photos loaded!';
	// 			totalMedia.parentNode.removeChild(totalMedia);
	// 		}
	// 		else {
	// 			totalMedia.innerHTML = num.toString() + " out of " + total.toString();
	// 		}
	// 	},
	// 	displayError : function (document, error) {
	// 		var msg = document.createElement('p');
	// 		msg.setAttribute('class','errMsg');
	// 		msg.innerHTML = error;
	// 		document.getElementById('errors').appendChild(msg);
	// 	},
	// 	deleteErrors : function (document) {
	// 		var errMsgs = document.querySelectorAll('p.errMsg');
	// 		for (var i = 0; i < errMsgs.length; i++) {
	// 			errMsgs[i].parentNode.removeChild(errMsgs[i]);
	// 		}
	// 	},
	// 	buildImgs : function (document, dataArr, dataType) {
	// 		for (var i = 0; i < dataArr.length; i++) {
	// 			if (dataArr[i] !== '' && dataArr[i] !== undefined) {
	// 				var links = dataType === 'strings'? dataArr[i].split('*'): [dataArr[i].standard_resolution.url, dataArr[i].thumbnail.url];
	// 				var newLi = document.createElement('li');
	// 				var checkbox = document.createElement('input');
	// 				var newA = document.createElement('a');
	// 				var img = document.createElement('img');
	// 				newA.href = links[0];
	// 				newA.setAttribute('download',links[0]);
	// 				checkbox.setAttribute('type','checkbox');
	// 				checkbox.setAttribute('name', 'fileList');
	// 				checkbox.setAttribute('value',links[0]);
	// 				img.src = links[1];
	// 				document.getElementById('photoList').appendChild(newLi);
	// 				newLi.appendChild(checkbox);
	// 				newLi.appendChild(newA);
	// 				newA.appendChild(img);
	// 			}
	// 		}
	// 	},
	// 	toggleAll : function () {
	// 		var inputs = document.getElementsByTagName('input');
	// 		var selected = document.getElementById('selectcheck').checked;
	// 		if (selected === false) {
	// 			for (var i=0; i<inputs.length; i++) {
	// 				if (inputs[i].getAttribute('type') === 'checkbox') {
	// 					inputs[i].removeAttribute('checked');
	// 				}
	// 			}
	// 		}
	// 		else {
	// 			for (var i=0; i<inputs.length; i++) {
	// 				if (inputs[i].getAttribute('type') === 'checkbox') {
	// 					inputs[i].setAttribute('checked',"checked");
	// 				}
	// 			}
	// 		}
	// 	},
	// 	resizeImgs : function(document) {
	// 		var x = window.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName('body')[0].clientWidth;
	//     	var y = window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight;
	// 		if (x < 2000) {
	// 			var imgWidth = (x-250) / 4;
	// 		 	var imgs = document.getElementsByTagName('img')
	// 		 	for (var i=0;i<imgs.length;i++) {
	// 		 		imgs[i].style.width = imgWidth + 'px';
	// 		 	}
	// 		}
	// 	},
	// };


	// var pageSetup = function (document, localStorage, domFunctions) {

	// 	// move this out to its own function: loadPhotos
	// 	// BUILD PAGE -- IF LOCAL DATA, LOAD IT, ELSE, REQUEST IT:
	// 	if (localStorage.imgLinks !== undefined) {
	// 		var totalMedia = document.getElementById('totalMedia');
	// 		var loading = document.getElementById('loading');
	// 		domFunctions.buildImgs(document, localStorage.imgLinks.split(';'), 'strings');
	// 		var num = localStorage.imgLinks.split(';').length - 1;		
	// 		domFunctions.resizeImgs(document);
	// 	}
	// 	else {
	// 		messenger('photos',{'error':'', 'action':'loadPhotoLinks', 'number':0, 'data':{}});
	// 	}
	// 	// loadPhotos should return a gob of photo data and a callback to dom which then deals with displaying photo data 

	// 	document.getElementById('zipit').addEventListener('click', function() {
	// 		var files = [];
	// 		var fileObjs = document.getElementsByName('fileList');
	// 		for (var i=0;i<fileObjs.length;i++) {
	// 			if (fileObjs[i].checked === true) {
	// 				files.push(fileObjs[i].value);
	// 			}
	// 		}
	// 		console.log(files);
	// 		messenger('zip',{'error': '','action':'fetchingFiles','number':0,'data':{'fileList':files}});
	// 	}, false);

	// 	// test for existence of photos and select all button:
	// 	if (photoList.childNodes.length > 0) {
	// 		var selectcheck = document.getElementById('selectcheck');
	// 		selectcheck.style.opacity = 1.0;
	// 		selectcheck.addEventListener('click', domFunctions.toggleAll, false);
	// 	}

	// };

	// pageSetup(document, localStorage, domFunctions);
	
//};
