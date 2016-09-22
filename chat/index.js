require('./lib/Connect');
var Category = require('./models/Category');
var Course = require('./models/course');
var Message = require('./models/Message');

var numUsers = 0;
var countUsers = {};

function listen(socket) {
    var addedUser = false;
    // when the client emits 'new message', this listens and executes
    socket.on('new message', function (message, username, iid) {
        // we tell the client to execute 'new message'
        console.log('room:' + socket.nsp.name + ' username:' + username + '(' + iid + '):' + message);
        var d = new Date();
        var ms = new Message(
            {
                room_iid: socket.nsp.name.replace('/', ''),
                user_name: username,
                message: message,
                created_at: d.getTime(),
                status: 1
            }
        );
        ms.save(function (err, mes) {
            if (err) return console.error(err);
            socket.broadcast.emit('new message', {
                ids: mes.ids,
                username: socket.username,
                message: message
            });
            socket.emit('callback', {
                ids: mes.ids
            });
        });
    });

    //message command
    socket.on('cmd', function (cmd, username, ids) {
        // we tell the client to execute 'new message'
        console.log(username + '(' + ids + '):' + cmd);
        switch (cmd) {
            case 'delete':
                console.log('delete:' + ids);
                Message.findOne({ids: ids}, function (err, doc) {
                    doc.status = 0;
                    doc.save();
                    console.log('Removed: ' + ids);
                    socket.broadcast.emit('cmd', {
                        username: username,
                        message: cmd + ':' + ids
                    });
                });
                break;
            default:
                console.log('default');
        }

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
        ++numUsers;
        addedUser = true;
        socket.emit('login', {
            numUsers: countUsers[socket.nsp.name]
        });
        // echo globally (all clients) that a person has connected
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

//find all course
Course.find({}, function (err, courses) {
    if (err) return console.error(err);
    var count = 0;
    for (var index in courses) {
        count++;
        //create a room chat
        io.of('/' + courses[index].iid).on('connection', listen);
    }
});

//room chat for test
var nsp = io.of('/my-namespace');
var nsp1 = io.of('/my-room');
nsp.on('connection', listen);
nsp1.on('connection', listen);

