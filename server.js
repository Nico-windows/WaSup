const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

const DATA_FILE = 'server_data.json';
const USERS_FILE = 'users_data.json';
const DM_FILE = 'dm_data.json';

let servers = {};
let messages = {};
let users = {};
let dms = {};  // Format: { "user1-user2": [{from, to, message}] }
let unreadDms = {}; // Format: { "user1": {"user2": true} }
let sessions = {};
let socketToUser = {}; // Maps socket id to username

// Load data from JSON files on startup
try {
  if (fs.existsSync(DATA_FILE)) {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    const parsedData = JSON.parse(data);
    servers = parsedData.servers || {};
    messages = parsedData.messages || {};
  } else {
    servers = {};
    messages = {};
    saveData();
  }
} catch (err) {
  console.log('Error loading server data, starting with empty state:', err);
  servers = {};
  messages = {};
}

try {
  if (fs.existsSync(USERS_FILE)) {
    const userData = fs.readFileSync(USERS_FILE, 'utf8');
    users = JSON.parse(userData) || {};
  } else {
    users = {};
    saveUsers();
  }
} catch (err) {
  console.log('Error loading user data, starting with empty state:', err);
  users = {};
}

try {
  if (fs.existsSync(DM_FILE)) {
    const dmData = fs.readFileSync(DM_FILE, 'utf8');
    const parsedData = JSON.parse(dmData);
    dms = parsedData.dms || {};
    unreadDms = parsedData.unreadDms || {};
  } else {
    dms = {};
    unreadDms = {};
    saveDMs();
  }
} catch (err) {
  console.log('Error loading DM data, starting with empty state:', err);
  dms = {};
  unreadDms = {};
}

function saveData() {
  const dataToSave = { servers, messages };
  fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2), 'utf8');
}

function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function saveDMs() {
  const dataToSave = { dms, unreadDms };
  fs.writeFileSync(DM_FILE, JSON.stringify(dataToSave, null, 2), 'utf8');
}

// Helper functions for DMs
function getDmKey(user1, user2) {
  return [user1, user2].sort().join('-');
}

function getUserDms(username) {
  const userDms = [];
  
  // Get list of all DM conversations this user is part of
  Object.keys(dms).forEach(dmKey => {
    const [user1, user2] = dmKey.split('-');
    if (user1 === username || user2 === username) {
      const otherUser = user1 === username ? user2 : user1;
      
      // Check if there are unread messages
      const hasUnread = unreadDms[username] && unreadDms[username][otherUser];
      
      userDms.push({ user: otherUser, hasUnread });
    }
  });
  
  return userDms;
}

// Serve static files
app.use(express.static('public'));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected');
  
  let currentUsername = null;
  
  // Handle signup
  socket.on('signup', async ({ username, password }) => {
    // Check if username already exists
    if (users[username]) {
      socket.emit('auth error', { type: 'signup', message: 'Username already taken' });
      return;
    }
    
    try {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Create the user
      users[username] = {
        username,
        password: hashedPassword,
        servers: []
      };
      
      // Initialize unread DMs for this user
      unreadDms[username] = {};
      
      // Save the users data
      saveUsers();
      saveDMs();
      
      // Generate auth token
      const token = crypto.randomBytes(64).toString('hex');
      sessions[token] = username;
      
      // Set current username for this socket
      currentUsername = username;
      socketToUser[socket.id] = username;
      
      // Emit auth success event
      socket.emit('auth success', { username });
      socket.emit('set token', { username, token });
      
    } catch (error) {
      console.error('Error creating user:', error);
      socket.emit('auth error', { type: 'signup', message: 'Error creating account' });
    }
  });
  
  // Handle login
  socket.on('login', async ({ username, password }) => {
    // Check if user exists
    if (!users[username]) {
      socket.emit('auth error', { type: 'login', message: 'Invalid username or password' });
      return;
    }
    
    try {
      // Verify password
      const isMatch = await bcrypt.compare(password, users[username].password);
      
      if (!isMatch) {
        socket.emit('auth error', { type: 'login', message: 'Invalid username or password' });
        return;
      }
      
      // Generate auth token
      const token = crypto.randomBytes(64).toString('hex');
      sessions[token] = username;
      
      // Set current username for this socket
      currentUsername = username;
      socketToUser[socket.id] = username;
      
      // Emit auth success event
      socket.emit('auth success', { username });
      socket.emit('set token', { username, token });
      
      // Send user's servers
      socket.emit('user servers', users[username].servers || []);
      
    } catch (error) {
      console.error('Error logging in:', error);
      socket.emit('auth error', { type: 'login', message: 'Error logging in' });
    }
  });
  
  // Handle token auth (for reconnection)
  socket.on('token auth', ({ username, token }) => {
    if (sessions[token] && sessions[token] === username) {
      currentUsername = username;
      socketToUser[socket.id] = username;
      socket.emit('auth success', { username });
      socket.emit('user servers', users[username].servers || []);
    } else {
      socket.emit('clear token');
    }
  });
  
  // Handle logout
  socket.on('logout', () => {
    if (currentUsername) {
      // Find and remove the token for this user
      for (const [token, user] of Object.entries(sessions)) {
        if (user === currentUsername) {
          delete sessions[token];
          break;
        }
      }
      
      delete socketToUser[socket.id];
      socket.emit('clear token');
      currentUsername = null;
    }
  });

  // Get servers
  socket.on('get servers', () => {
    if (currentUsername && users[currentUsername]) {
      socket.emit('user servers', users[currentUsername].servers || []);
    }
  });
  
  // Get DMs
  socket.on('get dms', () => {
    if (currentUsername) {
      const userDms = getUserDms(currentUsername);
      socket.emit('user dms', userDms);
    }
  });
  
  // Get all users for DM
  socket.on('get all users', () => {
    if (currentUsername) {
      socket.emit('all users', Object.keys(users));
    }
  });
  
  // Get DM messages
  socket.on('get dm messages', ({ otherUser }) => {
    if (!currentUsername) return;
    
    const dmKey = getDmKey(currentUsername, otherUser);
    
    // Create conversation if it doesn't exist
    if (!dms[dmKey]) {
      dms[dmKey] = [];
      saveDMs();
    }
    
    // Mark messages as read
    if (unreadDms[currentUsername] && unreadDms[currentUsername][otherUser]) {
      delete unreadDms[currentUsername][otherUser];
      saveDMs();
    }
    
    socket.emit('dm messages', { 
      otherUser, 
      messages: dms[dmKey] 
    });
    
    // Update DM list to reflect read status
    const userDms = getUserDms(currentUsername);
    socket.emit('user dms', userDms);
  });
  
  // Mark DM as read
  socket.on('mark dm read', ({ otherUser }) => {
    if (!currentUsername) return;
    
    if (unreadDms[currentUsername] && unreadDms[currentUsername][otherUser]) {
      delete unreadDms[currentUsername][otherUser];
      saveDMs();
      
      // Update DM list
      const userDms = getUserDms(currentUsername);
      socket.emit('user dms', userDms);
    }
  });
  
  // Send DM
  socket.on('dm message', ({ to, message }) => {
    if (!currentUsername) return;
    
    const dmKey = getDmKey(currentUsername, to);
    
    // Create conversation if it doesn't exist
    if (!dms[dmKey]) {
      dms[dmKey] = [];
    }
    
    // Add message to conversation
    const dmMessage = {
      from: currentUsername,
      to,
      message,
      timestamp: Date.now()
    };
    
    dms[dmKey].push(dmMessage);
    
    // Mark as unread for recipient
    if (!unreadDms[to]) {
      unreadDms[to] = {};
    }
    unreadDms[to][currentUsername] = true;
    
    saveDMs();
    
    // Send to both sender and recipient
    socket.emit('dm message', dmMessage);
    
    // Find recipient's socket and send the message
    for (const [socketId, username] of Object.entries(socketToUser)) {
      if (username === to) {
        io.to(socketId).emit('dm message', dmMessage);
        
        // Update recipient's DM list to show unread
        const recipientDms = getUserDms(to);
        io.to(socketId).emit('user dms', recipientDms);
      }
    }
  });
  
  // Get discovered servers
  socket.on('get discover servers', () => {
    socket.emit('discover servers', Object.keys(servers));
  });

  // Create server
  socket.on('create server', ({ serverName, username }) => {
    if (!currentUsername) return;
    
    if (!servers[serverName]) {
      servers[serverName] = [];
      messages[serverName] = [];
      
      // Add server to user's server list
      if (!users[username].servers) {
        users[username].servers = [];
      }
      if (!users[username].servers.includes(serverName)) {
        users[username].servers.push(serverName);
      }
      
      saveData();
      saveUsers();
    }
    
    servers[serverName] = servers[serverName].filter(user => user !== username);
    servers[serverName].push(username);
    
    socket.join(serverName);
    io.to(serverName).emit('server created', { serverName });
    io.to(serverName).emit('update people', servers[serverName]);
    io.emit('discover servers', Object.keys(servers));
  });

  // Join server
  socket.on('join server', ({ serverName, username }) => {
    if (!currentUsername) return;
    
    if (servers[serverName]) {
      // Filter out the user if they're already in the server to avoid duplicates
      servers[serverName] = servers[serverName].filter(user => user !== username);
      servers[serverName].push(username);
      
      // Add server to user's server list if not already there
      if (!users[username].servers) {
        users[username].servers = [];
      }
      if (!users[username].servers.includes(serverName)) {
        users[username].servers.push(serverName);
        saveUsers();
      }
      
      saveData();
      
      socket.join(serverName);
      io.to(serverName).emit('server joined', { serverName });
      io.to(serverName).emit('update people', servers[serverName]);
      socket.emit('server messages', messages[serverName]);
    }
  });

  // Server message
  socket.on('server message', ({ serverName, message, username }) => {
    if (!currentUsername) return;
    
    if (!messages[serverName]) {
      messages[serverName] = [];
    }
    
    messages[serverName].push({ username, message });
    saveData();

    io.to(serverName).emit('server message', { username, message });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
    delete socketToUser[socket.id];
    // We don't remove the user from servers or sessions here as they might reconnect
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});