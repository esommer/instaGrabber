window.onload = function () {


	// EVENT EMITTER:
	var EventEmitter = function () {
		this.handlers = {};
	};
	EventEmitter.prototype = {
		bind : function (event, fxn, scope) {
			this.handlers[event] = this.handlers[event] || [];
			this.handlers[event].push({'fxn':fxn, 'scope': scope});
		},
		emit : function (event, data) {
			if (this.handlers[event] !== []) {
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
			if (data.link === undefined) {
				this.notifier.emit('zip update', data.percent);
				var that = this;
				this.window.setTimeout(function () {
					that.notifier.emit('get zip update', data);
				}, 500);
			}
			else {
				this.notifier.emit('zip done', data.link);
			}
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
					if (inputs[i].getAttribute('type') === 'checkbox' && inputs[i].parentNode.parentNode.style.display !== 'none') {
						console.log(inputs[i].style.display);
						inputs[i].checked = false;
					}
				}
			}
			else {
				for (var i=0; i<inputs.length; i++) {
					if (inputs[i].getAttribute('type') === 'checkbox' && inputs[i].parentNode.parentNode.style.display !== 'none') {
						console.log(inputs[i].style.display);
						inputs[i].checked = true;
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
		},
		updateZipBar : function (percentage) {
			var box = this.document.getElementById('progress');
			box.className = '';
			var bar = this.document.getElementById('progressbar');
			if (percentage > 80) {
				var barwidth = parseInt(bar.style.width.replace('px',''));
				var diff = percentage*4 - barwidth;
				bar.style.width = barwidth + diff/2 + 'px';
			}
			else {
				bar.style.width = percentage*4 + 'px';
			}
		},
		showZipLink : function (link) {
			var bar = this.document.getElementById('progressbar');
			bar.style.width = '400px';
			var zipDiv = this.document.getElementById('downloadLink');
			var zipLink = this.buildElement('a');
			zipLink.innerHTML = "Download Zipped Photos!";
			zipLink.href = link;
			zipLink.setAttribute('download','photos.tar.gz');
			zipDiv.appendChild(zipLink);
		},
		showOnly : function () {
			var value = this.innerHTML;
			var parentClass = this.parentNode.className;
			var photoUL = this.parentNode.parentNode.parentNode;
			var allImgs = photoUL.childNodes;
			var imgArr = [];
			for (var m=1;m<allImgs.length;m++) {
				imgArr.push(allImgs[m]);
			}
			var show = [];
			for (var i=1;i<allImgs.length;i++) {
				var testUl = parentClass === 'metaData'? allImgs[i].childNodes[1]: allImgs[i].childNodes[2];
				if (testUl !== undefined) {
					var kids = testUl.childNodes;
					if (parentClass === 'metaData') {
						var filterText = kids[0].className === 'filter'?  kids[0].innerHTML : kids[1].innerHTML;
						if (filterText === value) {
							show.push(allImgs[i]);
						}
					}
					else {
						var vals = [];
						for (var k=0;k < kids.length;k++) {
							vals.push(kids[k].innerHTML);
						}
						if (vals.indexOf(value) !== -1) {
							show.push(allImgs[i]);
						}
					}
				}
			}
			var hideArr = imgArr.filter(function (imgLi) {
				if (show.indexOf(imgLi) === -1) {
					imgLi.style.display = 'none';
					return imgLi;
				}
			});
			var showall = photoUL.parentNode.childNodes[3];
			showall.style.display = 'block';
		},
		fixImgLIDisplay : function () {
			var allLIs = this.document.getElementsByTagName('li');
			var imgLIs = [];
			var maxHeight = 0;
			for (var i=0;i<allLIs.length;i++) {
				if (allLIs[i].className === 'photo') {
					imgLIs.push(allLIs[i]);
					if (allLIs[i].clientHeight > maxHeight) {
						maxHeight = allLIs[i].clientHeight;
					}
				}
			}
			imgLIs.forEach(function (li) {
				if (li.clientHeight < maxHeight) {
					var diff = maxHeight - li.clientHeight;
					var marg = li.style["margin-bottom"];
					li.style["margin-bottom"] = diff + marg;
				}
			});
		},
		showAllImgs : function () {
			var imgs = this.parentNode.childNodes[5].childNodes;
			for (var i=1;i<imgs.length;i++) {
				imgs[i].style.display = 'block';
			}
			this.style.display = 'none';
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
			this.dom.fixImgLIDisplay();
			var selectcheck = this.dom.fetchDOMObject('selectcheck');
			selectcheck.addEventListener('click', this.dom.toggleAll, false);
			var zipper = this.dom.fetchDOMObject('zipit');
			zipper.addEventListener('click', this.zipIt.bind(this), false);
			this.addSortingListeners();
			var showall = this.dom.fetchDOMObject('showall');
			showall.addEventListener('click', this.dom.showAllImgs, false);
			// this.resizeImgs();
		},
		addSortingListeners : function () {
			var LIs = this.dom.document.getElementsByTagName('li');
			var activeLIs = [];
			for (var i=0;i<LIs.length;i++) {
				if (LIs[i].parentNode.className === 'metaData' || LIs[i].parentNode.className === 'tags') {
					activeLIs.push(LIs[i]);
				}
			}
			activeLIs.forEach(function (li) {
				li.addEventListener('click', this.dom.showOnly, false);
			}, this);
		},
		bindEvents : function () {
			// loading events:
			this.notifier.bind('photo chunk', this.dom.displayPhotos, this.dom);
			this.notifier.bind('photo chunk', this.savePhotos, this);
			this.notifier.bind('update loading', this.dom.updateLoading, this.dom);
			this.notifier.bind('get more photos', this.getMorePhotos, this);
			// ready events:
			this.notifier.bind('all photos loaded', this.dom.updateLoading, this.dom);
			this.notifier.bind('all photos loaded', this.activateButtons, this);
			// zipping events:
			this.notifier.bind('zip update', this.dom.updateZipBar, this.dom);
			this.notifier.bind('get zip update', this.getZipUpdate, this);
			this.notifier.bind('zip done', this.dom.showZipLink, this.dom);
		},
		getZipUpdate : function (data) {
			this.msg.send('zip', {'action':data.action, 'requestNum':data.requestNum + 1}, this.msg, function (data) {
				this.zipUpdater(data);
			});
		},
		savePhotos: function (photos) {
			var storageArr = [];
			var inStorage = this.localStorage.photos === undefined? '':this.localStorage.photos.replace(/^undefined/, '');
			try {
				storageArr = JSON.parse(inStorage);
			}
			catch (e) {
				if (e) console.log('instorage failed to parse');
			}
			photos.forEach(function (photo) {
				storageArr.push(photo);
			}, photos);
			this.localStorage.photos = JSON.stringify(storageArr);
		},
		getFirstPhotos : function () {
			var loaded = false;
			var photos = [];
			// if (this.localStorage.photos !== undefined) {
			// 	try {
			// 		photos = JSON.parse(this.localStorage.photos);
			// 		loaded = true;
			// 	}
			// 	catch (e) {
			// 		if (e) console.log('localStorage failed to parse');
			// 	}
			// }
			// if (loaded === true) {
			// 	this.dom.displayPhotos(photos);
			// 	this.notifier.emit('all photos loaded',{'totalMedia':photos.length});
			// }
			// else if (loaded === false) {
				this.msg.send('photos', {'action':'getPhotos','requestNum':0}, this.msg, function (data) {
					this.photoLoader(data);
				});
			// }
		},
		getMorePhotos : function (req) {
			this.msg.send('photos', req, this.msg, function (data) {
				this.photoLoader(data);
			});
		},
		zipIt : function () {
			this.dom.updateZipBar(0);
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
