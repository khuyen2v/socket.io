function listen(socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (message, username) {
    // we tell the client to execute 'new message'
    console.log(socket.username + ': ' + message);
    console.log(username);

    socket.broadcast.emit('new message', {
      username: socket.username,
      message: message
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;
    // we store the username in the socket session for this client
    socket.username = username;
    if (typeof countUsers[socket.nsp.name] != 'undefined') {
      countUsers[socket.nsp.name]++;
    } else {
      countUsers[socket.nsp.name] = 1;
    }
    console.log(countUsers);
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: countUsers[socket.nsp.name]
    });
    // echo globally (all clients) that a person has connected
    console.log('add user: ' +username);
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: countUsers[socket.nsp.name]
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    console.log('disconnect: ' + socket.username);
    if (addedUser) {
      --countUsers[socket.nsp.name];
      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: countUsers[socket.nsp.name]
      });
    }
  });
}
// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('..')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var numUsers = 0;
var countUsers = {};

var findDocuments = function(db, callback) {
  // Get the documents collection
  var collection = db.collection('course');
  // Find some documents
  collection.find({}).toArray(function(err, docs) {
    assert.equal(err, null);
    console.log("Found the following records");
    callback(docs);
  });
}

var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');

// Connection URL
var url = 'mongodb://localhost:27017/edx';
// Use connect method to connect to the Server
MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected correctly to server");
  findDocuments(db, function (datas) {
    var count = 0;
    for (var index in datas) {
      count++;
       console.log(count + ':' + datas[index].iid);
      io.of('/' + datas[index].iid).on('connection', listen);
    }
  });
});
var nsp = io.of('/my-namespace');
var nsp1 = io.of('/my-room');
nsp.on('connection', listen);
nsp1.on('connection', listen);

