const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const multer = require('multer');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Data files
const DATA_FILE = 'server_data.json';
const USERS_FILE = 'users_data.json';
const DM_FILE = 'dm_data.json';
const TOKENS_FILE = 'tokens_data.json';

// Data storage
let servers = {};
let messages = {};
let users = {};
let dms = {};  // Format: { "user1-user2": [{from, to, message, timestamp}] }
let unreadDms = {}; // Format: { "user1": {"user2": true} }
let unreadServers = {}; // Format: { "username": { "servername": true } }
let sessions = {};
let socketToUser = {}; // Maps socket id to username
let verificationTokens = {}; // Store email verification tokens
let resetTokens = {}; // Store password reset tokens
let userActivity = {}; // Track last active server/DM for each user

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Email transporter setup (using environment variables)
let transporter;
try {
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  console.log('Email transporter configured successfully');
} catch (error) {
  console.error('Failed to configure email transporter:', error);
}

// Load data from JSON files on startup
function loadData() {
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

  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const tokensData = fs.readFileSync(TOKENS_FILE, 'utf8');
      const parsedData = JSON.parse(tokensData);
      verificationTokens = parsedData.verificationTokens || {};
      resetTokens = parsedData.resetTokens || {};
      userActivity = parsedData.userActivity || {};
      unreadServers = parsedData.unreadServers || {};
    } else {
      verificationTokens = {};
      resetTokens = {};
      userActivity = {};
      unreadServers = {};
      saveTokens();
    }
  } catch (err) {
    console.log('Error loading tokens data, starting with empty state:', err);
    verificationTokens = {};
    resetTokens = {};
    userActivity = {};
    unreadServers = {};
  }
}

// Load data on startup
loadData();

// Save functions
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

function saveTokens() {
  const dataToSave = { 
    verificationTokens, 
    resetTokens,
    userActivity,
    unreadServers
  };
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(dataToSave, null, 2), 'utf8');
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

// Generate random token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Send verification email
function sendVerificationEmail(email, username, token) {
  if (!transporter) {
    console.error('Email transporter not configured');
    return Promise.reject(new Error('Email service not configured'));
  }
  
  const verificationUrl = `${BASE_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your WaSup Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #5865f2;">Welcome to WaSup!</h2>
        <p>Hi ${username},</p>
        <p>Thank you for signing up. Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${verificationUrl}" style="background-color: #5865f2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>If you didn't create an account, please ignore this email.</p>
        <p>Thank you,<br>The WaSup Team</p>
      </div>
    `
  };
  
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending verification email:', error);
        reject(error);
      } else {
        console.log('Verification email sent:', info.response);
        resolve(info);
      }
    });
  });
}

// Send password reset email
function sendPasswordResetEmail(email, token) {
  if (!transporter) {
    console.error('Email transporter not configured');
    return Promise.reject(new Error('Email service not configured'));
  }
  
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reset Your WaSup Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #5865f2;">Reset Your Password</h2>
        <p>You requested a password reset for your WaSup account.</p>
        <p>Please click the button below to reset your password:</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${resetUrl}" style="background-color: #5865f2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you didn't request a password reset, please ignore this email.</p>
        <p>Thank you,<br>The WaSup Team</p>
      </div>
    `
  };
  
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending password reset email:', error);
        reject(error);
      } else {
        console.log('Password reset email sent:', info.response);
        resolve(info);
      }
    });
  });
}

// Find username by email
function getUsernameByEmail(email) {
  for (const [username, userData] of Object.entries(users)) {
    if (userData.email === email) {
      return username;
    }
  }
  return null;
}

// Serve static files
app.use(express.static('public'));

// Routes for email verification and password reset
app.get('/verify-email', (req, res) => {
  const token = req.query.token;
  
  if (!token || !verificationTokens[token]) {
    return res.status(400).send('Invalid or expired verification token.');
  }
  
  const username = verificationTokens[token];
  
  if (users[username]) {
    users[username].verified = true;
    delete verificationTokens[token];
    
    saveUsers();
    saveTokens();
    
    res.send(`
      <html>
      <head>
        <title>Email Verified</title>
        <style>
          body {
            font-family: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #2c2f33;
            color: #ffffff;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .container {
            background-color: #36393f;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            width: 400px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          }
          h1 {
            color: #7289da;
          }
          p {
            margin: 20px 0;
            line-height: 1.5;
          }
          .button {
            background-color: #5865f2;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
            display: inline-block;
            margin-top: 15px;
          }
          .button:hover {
            background-color: #4e5bbf;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Email Verified!</h1>
          <p>Your email has been successfully verified. You can now log in to your WaSup account.</p>
          <a href="/" class="button">Go to Login</a>
        </div>
      </body>
      </html>
    `);
  } else {
    res.status(404).send('User not found.');
  }
});

app.get('/reset-password', (req, res) => {
  const token = req.query.token;
  
  if (!token || !resetTokens[token]) {
    return res.status(400).send('Invalid or expired reset token.');
  }
  
  res.send(`
    <html>
    <head>
      <title>Reset Password</title>
      <style>
        body {
          font-family: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #2c2f33;
          color: #ffffff;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
        }
        .container {
          background-color: #36393f;
          padding: 30px;
          border-radius: 10px;
          width: 400px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        h1 {
          color: #7289da;
          text-align: center;
        }
        .input-group {
          margin-bottom: 15px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
          color: #b9bbbe;
        }
        input {
          width: 100%;
          padding: 12px;
          background-color: #202225;
          border: 1px solid #4f545c;
          border-radius: 5px;
          color: white;
          font-size: 16px;
          box-sizing: border-box;
        }
        .error {
          color: #f04747;
          margin-top: 5px;
          display: none;
        }
        .success {
          color: #43b581;
          margin-top: 10px;
          text-align: center;
          display: none;
        }
        .button {
          background-color: #5865f2;
          color: white;
          padding: 12px;
          border: none;
          border-radius: 5px;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          width: 100%;
          margin-top: 20px;
        }
        .button:hover {
          background-color: #4e5bbf;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Reset Your Password</h1>
        <form id="resetForm">
          <input type="hidden" id="token" value="${token}">
          <div class="input-group">
            <label for="password">New Password</label>
            <input type="password" id="password" required>
          </div>
          <div class="input-group">
            <label for="confirmPassword">Confirm New Password</label>
            <input type="password" id="confirmPassword" required>
            <div class="error" id="passwordError">Passwords do not match</div>
          </div>
          <div class="success" id="resetSuccess">Your password has been reset successfully! You can now login with your new password.</div>
          <button type="submit" class="button">Reset Password</button>
        </form>
      </div>
      
      <script>
        document.getElementById('resetForm').addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const password = document.getElementById('password').value;
          const confirmPassword = document.getElementById('confirmPassword').value;
          const token = document.getElementById('token').value;
          const passwordError = document.getElementById('passwordError');
          const resetSuccess = document.getElementById('resetSuccess');
          
          // Validate passwords match
          if (password !== confirmPassword) {
            passwordError.style.display = 'block';
            return;
          }
          
          passwordError.style.display = 'none';
          
          try {
            const response = await fetch('/api/reset-password', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ token, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
              resetSuccess.style.display = 'block';
              document.getElementById('resetForm').reset();
              
              // Redirect to login page after 3 seconds
              setTimeout(() => {
                window.location.href = '/';
              }, 3000);
            } else {
              alert(data.message || 'An error occurred. Please try again.');
            }
          } catch (error) {
            alert('An error occurred. Please try again.');
            console.error('Error:', error);
          }
        });
      </script>
    </body>
    </html>
  `);
});

// API route for password reset
app.use(express.json());

app.post('/api/reset-password', async (req, res) => {
  const { token, password } = req.body;
  
  if (!token || !resetTokens[token]) {
    return res.json({ success: false, message: 'Invalid or expired reset token.' });
  }
  
  const username = resetTokens[token];
  
  try {
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update user's password
    users[username].password = hashedPassword;
    
    // Delete the reset token
    delete resetTokens[token];
    
    saveUsers();
    saveTokens();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.json({ success: false, message: 'An error occurred while resetting your password.' });
  }
});

// Add route for file uploads
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // Get username from headers
  const username = req.headers['x-username'] || socketToUser[req.headers['x-socket-id']];
  
  if (!username || !users[username]) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const fileUrl = `/uploads/${req.file.filename}`;
  const attachment = {
    filename: req.file.originalname,
    filesize: req.file.size,
    fileType: req.file.mimetype,
    fileUrl: fileUrl
  };
  
  // Handle server or DM message
  if (req.body.serverName) {
    // Server message
    const serverName = req.body.serverName;
    const message = req.body.message || '';
    
    if (!servers[serverName] || !servers[serverName].includes(username)) {
      return res.status(403).json({ error: 'Not a member of this server' });
    }
    
    if (!messages[serverName]) {
      messages[serverName] = [];
    }
    
    const timestamp = Date.now();
    const messageObj = { 
      username, 
      message, 
      timestamp,
      attachment
    };
    
    messages[serverName].push(messageObj);
    saveData();
    
    const broadcastMessage = { ...messageObj, serverName };
    
    // Mark as unread for all users in the server except the sender
    servers[serverName].forEach(user => {
      if (user !== username) {
        if (!unreadServers[user]) {
          unreadServers[user] = {};
        }
        unreadServers[user][serverName] = true;
      }
    });
    
    saveTokens();
    
    // Broadcast to all users in the server
    io.to(serverName).emit('server message', broadcastMessage);
    
    res.json({ success: true });
    
  } else if (req.body.to) {
    // DM message
    const to = req.body.to;
    const message = req.body.message || '';
    
    if (!users[to]) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const dmKey = getDmKey(username, to);
    
    if (!dms[dmKey]) {
      dms[dmKey] = [];
    }
    
    const timestamp = Date.now();
    const dmMessage = {
      from: username,
      to,
      message,
      timestamp,
      attachment
    };
    
    dms[dmKey].push(dmMessage);
    
    // Mark as unread for recipient
    if (!unreadDms[to]) {
      unreadDms[to] = {};
    }
    unreadDms[to][username] = true;
    
    saveDMs();
    
    // Find recipient's socket and send the message
    for (const [socketId, socketUsername] of Object.entries(socketToUser)) {
      if (socketUsername === username || socketUsername === to) {
        io.to(socketId).emit('dm message', dmMessage);
      }
    }
    
    // Update recipient's DM list to show unread
    for (const [socketId, socketUsername] of Object.entries(socketToUser)) {
      if (socketUsername === to) {
        const recipientDms = getUserDms(to);
        io.to(socketId).emit('user dms', recipientDms);
      }
    }
    
    res.json({ success: true });
  } else {
    // Handle error - missing destination
    return res.status(400).json({ error: 'Missing destination (serverName or to)' });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected');
  
  let currentUsername = null;
  
  // Handle signup
  socket.on('signup', async ({ username, email, password }) => {
    // Check if username already exists
    if (users[username]) {
      socket.emit('auth error', { type: 'signup', message: 'Username already taken' });
      return;
    }
    
    // Check if email already exists
    for (const userData of Object.values(users)) {
      if (userData.email === email) {
        socket.emit('auth error', { type: 'signup', message: 'Email already in use' });
        return;
      }
    }
    
    try {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Create the user
      users[username] = {
        username,
        email,
        password: hashedPassword,
        servers: [],
        verified: false
      };
      
      // Initialize unread DMs for this user
      unreadDms[username] = {};
      unreadServers[username] = {};
      
      // Generate verification token
      const verificationToken = generateToken();
      verificationTokens[verificationToken] = username;
      
      // Save all data
      saveUsers();
      saveDMs();
      saveTokens();
      
      // Send verification email
      try {
        if (transporter) {
          await sendVerificationEmail(email, username, verificationToken);
        } else {
          console.warn('Skipping verification email - email service not configured');
          // Auto-verify user for testing if email is not set up
          users[username].verified = true;
          saveUsers();
        }
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Still consider signup successful, but log the error
      }
      
      // Emit signup success event
      socket.emit('signup success');
      
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
      
      // Check if user is verified
      if (!users[username].verified) {
        socket.emit('auth error', { type: 'login', message: 'Please verify your email first' });
        return;
      }
      
      // Generate auth token
      const token = crypto.randomBytes(64).toString('hex');
      sessions[token] = username;
      
      // Set current username for this socket
      currentUsername = username;
      socketToUser[socket.id] = username;
      
      // Get user's last activity
      const lastActivity = userActivity[username] || { server: null, dm: null };
      
      // Emit auth success event
      socket.emit('auth success', { username, lastActivity });
      socket.emit('set token', { username, token });
      
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
      
      // Get user's last activity
      const lastActivity = userActivity[username] || { server: null, dm: null };
      
      socket.emit('auth success', { username, lastActivity });
    } else {
      socket.emit('clear token');
    }
  });
  
  // Handle password reset request
  socket.on('request password reset', async ({ email }) => {
    const username = getUsernameByEmail(email);
    
    if (!username) {
      socket.emit('auth error', { 
        type: 'reset', 
        message: 'If this email is registered, you will receive a password reset link' 
      });
      socket.emit('reset initiated');
      return;
    }
    
    try {
      // Generate reset token
      const resetToken = generateToken();
      resetTokens[resetToken] = username;
      
      saveTokens();
      
      // Send password reset email
      if (transporter) {
        await sendPasswordResetEmail(email, resetToken);
      } else {
        console.warn('Password reset email not sent - email service not configured');
      }
      
      socket.emit('reset initiated');
      
    } catch (error) {
      console.error('Error initiating password reset:', error);
      socket.emit('auth error', { 
        type: 'reset', 
        message: 'Error initiating password reset' 
      });
    }
  });
  
  // Update last activity
  socket.on('update last activity', ({ server, dm }) => {
    if (!currentUsername) return;
    
    userActivity[currentUsername] = { server, dm };
    saveTokens();
  });
  
  // Get user's joined servers with unread status
  socket.on('get user servers', () => {
    if (!currentUsername || !users[currentUsername]) return;
    
    const userServers = users[currentUsername].servers || [];
    const userUnreadServers = unreadServers[currentUsername] || {};
    
    socket.emit('user servers data', {
      servers: userServers,
      unreadServers: userUnreadServers
    });
  });
  
  // Get server messages
  socket.on('get server messages', ({ serverName }) => {
    if (!currentUsername) return;
    
    if (servers[serverName]) {
      socket.emit('server messages', messages[serverName] || []);
    }
  });
  
  // Get server users
  socket.on('get server users', ({ serverName }) => {
    if (!currentUsername) return;
    
    if (servers[serverName]) {
      socket.emit('server users', servers[serverName] || []);
    }
  });
  
  // Mark server as read
  socket.on('mark server read', ({ serverName }) => {
    if (!currentUsername) return;
    
    if (unreadServers[currentUsername] && unreadServers[currentUsername][serverName]) {
      delete unreadServers[currentUsername][serverName];
      saveTokens();
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
    const timestamp = Date.now();
    const dmMessage = {
      from: currentUsername,
      to,
      message,
      timestamp
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
  socket.on('create server', ({ serverName }) => {
    if (!currentUsername) return;
    
    if (!servers[serverName]) {
      servers[serverName] = [];
      messages[serverName] = [];
    }
    
    // Add user to server
    servers[serverName] = servers[serverName].filter(user => user !== currentUsername);
    servers[serverName].push(currentUsername);
    
    // Add server to user's server list
    if (!users[currentUsername].servers) {
      users[currentUsername].servers = [];
    }
    if (!users[currentUsername].servers.includes(serverName)) {
      users[currentUsername].servers.push(serverName);
    }
    
    saveData();
    saveUsers();
    
    // Join socket.io room for this server
    socket.join(serverName);
    
    // Emit server created event
    socket.emit('server created', { serverName });
    io.to(serverName).emit('server users', servers[serverName]);
    io.emit('discover servers', Object.keys(servers));
  });

  // Join server
  socket.on('join server', ({ serverName }) => {
    if (!currentUsername) return;
    
    if (servers[serverName]) {
      // Add user to server if not already there
      if (!servers[serverName].includes(currentUsername)) {
        servers[serverName].push(currentUsername);
      }
      
      // Add server to user's server list if not already there
      if (!users[currentUsername].servers) {
        users[currentUsername].servers = [];
      }
      if (!users[currentUsername].servers.includes(serverName)) {
        users[currentUsername].servers.push(serverName);
      }
      
      saveData();
      saveUsers();
      
      // Join socket.io room for this server
      socket.join(serverName);
      
      // Emit server joined event
      socket.emit('server joined', { serverName });
      io.to(serverName).emit('server users', servers[serverName]);
    }
  });

  // Server message
  socket.on('server message', ({ serverName, message }) => {
    if (!currentUsername) return;
    
    if (!servers[serverName] || !servers[serverName].includes(currentUsername)) {
      return; // User must be in the server to send messages
    }
    
    if (!messages[serverName]) {
      messages[serverName] = [];
    }
    
    const timestamp = Date.now();
    const messageObj = { 
      username: currentUsername, 
      message, 
      timestamp
    };
    
    messages[serverName].push(messageObj);
    saveData();

    // add serverName to the message object for client-side filtering
    const broadcastMessage = { ...messageObj, serverName };
    
    // mark as unread for all users in the server except the sender
    servers[serverName].forEach(user => {
      if (user !== currentUsername) {
        if (!unreadServers[user]) {
          unreadServers[user] = {};
        }
        unreadServers[user][serverName] = true;
      }
    });
    
    saveTokens();
    
    // Broadcast to all users in the server
    io.to(serverName).emit('server message', broadcastMessage);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
    delete socketToUser[socket.id];
    // We don't remove the user from servers here as they might reconnect :)
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});