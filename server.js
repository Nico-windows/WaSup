const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

let servers = {}; // Track servers and users

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('User connected');

  // Create a server
  socket.on('create server', ({ serverName, username }) => {
    if (!servers[serverName]) {
      servers[serverName] = [];
    }
    servers[serverName].push(username);
    socket.join(serverName);
    io.to(serverName).emit('server created', { serverName });
    io.to(serverName).emit('update people', servers[serverName]);
  });

  // Join a server
  socket.on('join server', ({ serverName, username }) => {
    if (servers[serverName]) {
      servers[serverName].push(username);
      socket.join(serverName);
      io.to(serverName).emit('server joined', { serverName });
      io.to(serverName).emit('update people', servers[serverName]);
    }
  });

  // Handle messaging
  socket.on('server message', ({ serverName, message, username }) => {
    io.to(serverName).emit('server message', { username, message });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
