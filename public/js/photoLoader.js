window.onload = function () {
	var photoList = document.getElementById('photoList');
	var requestor = new XMLHttpRequest();
	//var userfield = document.getElementById('userfield');
	// var username = window.location.href.replace('http://{{address}}/photos?username=','');
	// userfield.value = username;
	var url = window.location.href.replace('http://{{address}}','');
	var keepRequesting = '';
	var count = 0;
	var state = 'begin';
	var dataReceived = {};

	requestor.onreadystatechange = function () {
		if(requestor.readyState == 4 && requestor.status == 200) {
			state = 'ready';
			if (requestor.responseText !== undefined) {
				dataReceived = JSON.parse(requestor.responseText);
			}
			if (dataReceived.status === 'error') {
				keepRequesting = 'more';
				var msg = document.createElement('li');
				msg.setAttribute('class','errMsg');
				msg.innerHTML = 'Error connecting to Instagram. Please refresh.';
				photoList.appendChild(msg);
			}
			else if (dataReceived.status === 'continue') {
				keepRequesting = 'more';
			}
			else {
				keepRequesting = 'stop';
			}
			if (dataReceived.data !== null) {
				count ++;
				var errMsgs = document.querySelectorAll('li.errMsg');
				for (var i = 0; i < errMsgs.length; i++) {
					errMsgs[i].parentNode.removeChild(errMsgs[i]);
				}
				for (var i = 0; i < dataReceived.data.length; i++) {
					var newLi = document.createElement('li');
					var checkbox = document.createElement('input');
					var newA = document.createElement('a');
					var img = document.createElement('img');
					newA.href = dataReceived.data[i].standard_resolution.url;
					newA.setAttribute('download',dataReceived.data[i].standard_resolution.url);
					checkbox.setAttribute('type','checkbox');
					checkbox.setAttribute('name', 'fileList');
					checkbox.setAttribute('value',dataReceived.data[i].standard_resolution.url);
					img.src = dataReceived.data[i].thumbnail.url;
					photoList.appendChild(newLi);
					newLi.appendChild(checkbox);
					newLi.appendChild(newA);
					newA.appendChild(img);
				}
				if (dataReceived.status === 'continue' && keepRequesting === 'more') {
					sendRequest({'page':count});
					state = 'ready';
				}
				else {
					state = 'halt';
				}
			}
		}
	}
	var sendRequest = function (sendData) {
		if (state === 'ready' || state === 'begin') {
			requestor.open("POST", url);
			requestor.setRequestHeader('Content-Type', 'text/json');
			requestor.send(JSON.stringify(sendData));
		}
	}
	sendRequest({'page':0});



	var checked = '';
	var toggleAll = function () {
		var inputs = document.getElementsByTagName('input');
		if (checked === 'all') {
			for (var i=0; i<inputs.length; i++) {
				if (inputs[i].getAttribute('type') === 'checkbox') {
					inputs[i].removeAttribute('checked');
				}
			}
			checked = 'none';
		}
		else {
			for (var i=0; i<inputs.length; i++) {
				if (inputs[i].getAttribute('type') === 'checkbox') {
					inputs[i].setAttribute('checked',"checked");
				}
			}
			checked = 'all';
		}
	}

	// test for existence of photos and select all button:
	var allSelect = document.getElementById('getall');
	if (photoList.childNodes.length > 0 && allSelect !== undefined) {
		allSelect = document.createElement('span');
		allSelect.innerHTML = "Select All";
		allSelect.addEventListener('click', toggleAll, false);
		photoList.appendChild(allSelect);
	}
};
