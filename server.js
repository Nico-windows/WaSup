const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
app.use(express.static('public'));
let servers = {}; // Track servers and users
let messages = {}; // Track messages for each server

io.on('connection', (socket) => {
  console.log('User connected');

  // Create a server
  socket.on('create server', ({ serverName, username }) => {
    if (!servers[serverName]) {
      servers[serverName] = [];
      messages[serverName] = [];  // Initialize message array for the new server
    }
    servers[serverName].push(username);
    socket.join(serverName);
    io.to(serverName).emit('server created', { serverName });
    io.to(serverName).emit('update people', servers[serverName]);
  });

  socket.on('join server', ({ serverName, username }) => {
    if (servers[serverName]) {
      // Only add the user if they're not already in the server
      if (!servers[serverName].includes(username)) {
        servers[serverName].push(username);
      }
      socket.join(serverName);
      io.to(serverName).emit('server joined', { serverName });
      io.to(serverName).emit('update people', servers[serverName]);
      
      // Send the stored messages to the user when they join
      socket.emit('server messages', messages[serverName]);
    }
  });
  
  socket.on('server message', ({ serverName, message, username }) => {
    // Save the message to the server's message array
    if (!messages[serverName]) {
      messages[serverName] = [];
    }
    messages[serverName].push({ username, message });
    
    // Broadcast the message to everyone in the server
    io.to(serverName).emit('server message', { username, message });
  });
  

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});


server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
