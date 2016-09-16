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

var nsp = io.of('/my-namespace');
var nsp1 = io.of('/my-room');
nsp.on('connection', listen);
nsp1.on('connection', listen);

