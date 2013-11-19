// NOTES from Mary
var displayUI = function() {
  displayZipit();
  displaySelectAll();
};

var setup = function() {
  loadPhotoData(function() {
    displayPhotos(function() {
      displayUI(function() {

      });
    });
  });
};

var messageHandlers = {

};

message(data, messageHandlers.loadPhotos)

message(data, function() {
  // respond to message
})

message(data, function() {
  // respond to message
})

var EventEmitter = function() {
  this.handlers = {};
};

EventEmitter.prototype = {
  bind: function(event, fn) {
    this.handlers[event] = this.handlers[event] || [];
    this.handlers[event].push(fn);
  },

  emit: function(event, data) {
    if (this.handlers[event] !== undefined) {
      this.handlers[event].forEach(function(fn) {
        fn(data);
      });
    }
  }
};


var loadPhotoData = function(user) {
  var emitter = new EventEmitter();
  var serverEmitter = message("loadPhotos", user);
  var allPhotos = [];
  serverEmitter.bind("photo", function(photo) {
    allPhotos.push(photo);
    emitter.emit("photo", photo);
  });
  serverEmitter.bind("all-done", function() {
    emitter.emit("all-done", allPhotos);
  });
  return emitter;
};

var emitter = loadPhotoData("maryrosecook");
emitter.bind("photo", displayPhoto);
emitter.bind("all-done", displayUI);


(new Thing()).go()

window.go = "no"
Thing.prototype.go() // undefined

var Thing = function() {
  this.go = "go";
};

Thing.prototype = {
  go: function() {
    return this.go;
  }
};