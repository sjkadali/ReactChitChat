const express = require('express');
const socketio = require('socket.io');
const http = require('http');
//const cors = require('cors');

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');

const PORT = process.env.PORT || 5000;

const router = require('./router');
//const { callbackify } = require('util');

const app = express();
const server = http.createServer(app);

const io = socketio(server); 
//app.use(cors());
app.use(router);

io.on('connection', (socket) => {
    console.log("Client connected");
    socket.on('join', ({name, room}) => {
        console.log("Name is ", name, room);
        const user = addUser( socket.id, name, room );

        socket.emit('message', {user: 'admin', text: `${user.name}, welcome to the room ${user.room}`});
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!`});
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
        socket.join(user.room);               
    })
    socket.on('sendMessage', (message, callback) => {
       const user = getUser(socket.id);
       //console.log("user: " + user, user.name);
       io.to(user.room).emit('message', { user: user.name, text: message});
       callback();       
    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('message',  {user: 'admin', text: `${user.name} has left.`});
            io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
        }
    })
});

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));