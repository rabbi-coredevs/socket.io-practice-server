const express = require("express");
const cors = require("cors");
const http = require("http");
const { instrument } = require("@socket.io/admin-ui");
const { Server } = require('socket.io');

const app = express();
app.use(cors({
  origin: ["https://admin.socket.io", "http://localhost:5173"],
  credentials: true,
  methods: ['GET', 'POST']
}));

const port = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["https://admin.socket.io","http://localhost:5173"],
    credentials: true,  
    methods: ['GET', 'POST']
  }
});

server.listen(port, () => {
  console.log(`Socket app listening at http://localhost:${port}`);
});

const getOnlineUsers = (room) => {
  const clients = io.sockets.adapter.rooms.get(room) || new Set();
  const onlineUsers = [...clients].map(socketId => {
    return io.sockets.sockets.get(socketId).id;
  });
  return onlineUsers;
};

const emitOnlineUsers = (room) => {
  io.to(room).emit('users', getOnlineUsers(room));
};

io.on('connection', (socket) => {
  console.log(`User ${socket.id} connected`);

  socket.on('join_room', (room,cb) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room ${room}`);
    cb(room);
    emitOnlineUsers(room); // Emit online users when a user joins the room
  });

  socket.on('send_message', (message,room) => {
    console.log(`Message received: ${message}`);
    socket.to(room).emit('received_message', message);
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.id} disconnected`);
    emitOnlineUsers(); // Emit online users when a user disconnects
  });
});


instrument(io, {
  auth: false,
  mode: "development",
});