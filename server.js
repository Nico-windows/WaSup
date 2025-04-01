const express = require('express');
const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const multer = require('multer');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wasup';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Define MongoDB schemas
const UserSchema = new mongoose.Schema({
username: { type: String, required: true, unique: true },
email: { type: String, required: true, unique: true },
password: { type: String, required: true },
servers: [String],
verified: { type: Boolean, default: false }
});

const ServerSchema = new mongoose.Schema({
name: { type: String, required: true, unique: true },
users: [String]
});

const MessageSchema = new mongoose.Schema({
serverName: { type: String, required: true, index: true },
username: { type: String, required: true },
message: { type: String },
timestamp: { type: Number, default: Date.now, index: true },
attachment: {
filename: String,
filesize: Number,
fileType: String,
fileUrl: String
}
});

const DMSchema = new mongoose.Schema({
dmKey: { type: String, required: true, unique: true, index: true },
messages: [{
from: String,
to: String,
message: String,
timestamp: { type: Number, default: Date.now },
attachment: {
filename: String,
filesize: Number,
fileType: String,
fileUrl: String
}
}]
});

const UnreadDMSchema = new mongoose.Schema({
username: { type: String, required: true, index: true },
unreadFrom: { type: Map, of: Boolean, default: new Map() }
});

const UnreadServerSchema = new mongoose.Schema({
username: { type: String, required: true, index: true },
unreadServers: { type: Map, of: Boolean, default: new Map() }
});

const TokenSchema = new mongoose.Schema({
token: { type: String, required: true, unique: true, index: true },
username: { type: String, required: true },
type: { type: String, enum: ['verification', 'reset'], required: true },
expires: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }
});

const UserActivitySchema = new mongoose.Schema({
username: { type: String, required: true, unique: true, index: true },
server: { type: String, default: null },
dm: { type: String, default: null }
});

const ReportSchema = new mongoose.Schema({
userId: { type: String, required: true, index: true },
reportedId: { type: String, required: true, index: true },
messageId: String,
timestamp: { type: Number, default: Date.now }
});

const BannedUserSchema = new mongoose.Schema({
username: { type: String, required: true, unique: true, index: true },
reportCount: { type: Number, default: 0 },
bannedAt: { type: Number, default: Date.now },
reason: String
});

// Create MongoDB models
const User = mongoose.model('User', UserSchema);
const Server = mongoose.model('Server', ServerSchema);
const Message = mongoose.model('Message', MessageSchema);
const DM = mongoose.model('DM', DMSchema);
const UnreadDM = mongoose.model('UnreadDM', UnreadDMSchema);
const UnreadServer = mongoose.model('UnreadServer', UnreadServerSchema);
const Token = mongoose.model('Token', TokenSchema);
const UserActivity = mongoose.model('UserActivity', UserActivitySchema);
const Report = mongoose.model('Report', ReportSchema);
const BannedUser = mongoose.model('BannedUser', BannedUserSchema);

// Sessions in-memory (could be moved to Redis for production)
let sessions = {};
let socketToUser = {}; // Maps socket id to username

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

// Helper functions for DMs
function getDmKey(user1, user2) {
return [user1, user2].sort().join('-');
}

// Get user's DM conversations
async function getUserDms(username) {
try {
// Find all DM keys that include this user
const dmKeys = await DM.find({ dmKey: { $regex: username } }).select('dmKey');
const userDms = [];

for (const dm of dmKeys) {
const [user1, user2] = dm.dmKey.split('-');
const otherUser = user1 === username ? user2 : user1;

// Check if there are unread messages
const unreadData = await UnreadDM.findOne({ username });
const hasUnread = unreadData && unreadData.unreadFrom.get(otherUser);

userDms.push({ user: otherUser, hasUnread: hasUnread || false });
}

return userDms;
} catch (error) {
console.error('Error getting user DMs:', error);
return [];
}
}

// Generate random token
function generateToken() {
return crypto.randomBytes(32).toString('hex');
}

// Generate a message ID
function generateMessageId(username, timestamp, message) {
const md5 = crypto.createHash('md5');
md5.update(`${username}-${timestamp}-${message.substring(0, 20)}`);
return md5.digest('hex');
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
async function getUsernameByEmail(email) {
try {
const user = await User.findOne({ email });
return user ? user.username : null;
} catch (error) {
console.error('Error finding user by email:', error);
return null;
}
}

// Serve static files
app.use(express.static('public'));

// Routes for email verification and password reset
app.get('/verify-email', async (req, res) => {
const tokenValue = req.query.token;

try {
const token = await Token.findOne({ token: tokenValue, type: 'verification' });

if (!token || token.expires < new Date()) {
return res.status(400).send('Invalid or expired verification token.');
}

const username = token.username;
const user = await User.findOne({ username });

if (user) {
user.verified = true;
await user.save();

// Delete the token
await Token.deleteOne({ _id: token._id });

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
} catch (error) {
console.error('Error verifying email:', error);
res.status(500).send('An error occurred while verifying your email.');
}
});

app.get('/reset-password', async (req, res) => {
const tokenValue = req.query.token;

try {
const token = await Token.findOne({ token: tokenValue, type: 'reset' });

if (!token || token.expires < new Date()) {
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
<input type="hidden" id="token" value="${tokenValue}">
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
} catch (error) {
console.error('Error loading reset password page:', error);
res.status(500).send('An error occurred. Please try again later.');
}
});

// API route for password reset
app.use(express.json());

app.post('/api/reset-password', async (req, res) => {
const { token: tokenValue, password } = req.body;

try {
const token = await Token.findOne({ token: tokenValue, type: 'reset' });

if (!token || token.expires < new Date()) {
return res.json({ success: false, message: 'Invalid or expired reset token.' });
}

const username = token.username;
const user = await User.findOne({ username });

if (!user) {
return res.json({ success: false, message: 'User not found.' });
}

// Hash the new password
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// Update user's password
user.password = hashedPassword;
await user.save();

// Delete the reset token
await Token.deleteOne({ _id: token._id });

res.json({ success: true });
} catch (error) {
console.error('Error resetting password:', error);
res.json({ success: false, message: 'An error occurred while resetting your password.' });
}
});

// Add route for file uploads
app.post('/api/upload', upload.single('file'), async (req, res) => {
if (!req.file) {
return res.status(400).json({ error: 'No file uploaded' });
}

// Get username from headers
const username = req.headers['x-username'] || socketToUser[req.headers['x-socket-id']];

if (!username) {
return res.status(401).json({ error: 'Unauthorized' });
}

try {
const user = await User.findOne({ username });

if (!user) {
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
const timestamp = Date.now();

const server = await Server.findOne({ name: serverName });

if (!server || !server.users.includes(username)) {
return res.status(403).json({ error: 'Not a member of this server' });
}

// Generate a unique message ID
const messageId = generateMessageId(username, timestamp, message || req.file.originalname);

const messageObj = { 
    serverName, 
    username, 
    message, 
    timestamp, 
    attachment,
    messageId
};

// Save message to database
const newMessage = new Message(messageObj);
await newMessage.save();

const broadcastMessage = { 
    username, 
    message, 
    timestamp, 
    serverName, 
    attachment,
    messageId
};

// Mark as unread for all users in the server except the sender
for (const user of server.users) {
if (user !== username) {
let unreadServer = await UnreadServer.findOne({ username: user });

if (!unreadServer) {
unreadServer = new UnreadServer({ username: user });
}

unreadServer.unreadServers.set(serverName, true);
await unreadServer.save();
}
}

// Broadcast to all users in the server
io.to(serverName).emit('server message', broadcastMessage);

res.json({ success: true });

} else if (req.body.to) {
// DM message
const to = req.body.to;
const message = req.body.message || '';
const timestamp = Date.now();

const recipient = await User.findOne({ username: to });

if (!recipient) {
return res.status(404).json({ error: 'User not found' });
}

const dmKey = getDmKey(username, to);

// Find or create DM conversation
let dmConversation = await DM.findOne({ dmKey });

if (!dmConversation) {
dmConversation = new DM({ dmKey, messages: [] });
}

// Generate a unique message ID
const messageId = generateMessageId(username, timestamp, message || req.file.originalname);

const dmMessage = {
from: username,
to,
message,
timestamp,
attachment,
messageId
};

// Add message to conversation
dmConversation.messages.push(dmMessage);
await dmConversation.save();

// Mark as unread for recipient
let unreadDm = await UnreadDM.findOne({ username: to });

if (!unreadDm) {
unreadDm = new UnreadDM({ username: to });
}

unreadDm.unreadFrom.set(username, true);
await unreadDm.save();

// Find recipient's socket and send the message
for (const [socketId, socketUsername] of Object.entries(socketToUser)) {
if (socketUsername === username || socketUsername === to) {
io.to(socketId).emit('dm message', dmMessage);
}
}

// Update recipient's DM list to show unread
for (const [socketId, socketUsername] of Object.entries(socketToUser)) {
if (socketUsername === to) {
const recipientDms = await getUserDms(to);
io.to(socketId).emit('user dms', recipientDms);
}
}

res.json({ success: true });
} else {
// Handle error - missing destination
return res.status(400).json({ error: 'Missing destination (serverName or to)' });
}
} catch (error) {
console.error('Error handling file upload:', error);
res.status(500).json({ error: 'Server error while processing upload' });
}
});

// Socket.io connection handling
io.on('connection', (socket) => {
console.log('User connected');

let currentUsername = null;

// Handle signup
socket.on('signup', async ({ username, email, password }) => {
try {
// Check if username already exists
const existingUsername = await User.findOne({ username });
if (existingUsername) {
socket.emit('auth error', { type: 'signup', message: 'Username already taken' });
return;
}

// Check if email already exists
const existingEmail = await User.findOne({ email });
if (existingEmail) {
socket.emit('auth error', { type: 'signup', message: 'Email already in use' });
return;
}

// Hash the password
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// Create the user
const newUser = new User({
username,
email,
password: hashedPassword,
servers: [],
verified: false
});

await newUser.save();

// Create unread DMs document for this user
const unreadDm = new UnreadDM({ username });
await unreadDm.save();

// Create unread servers document for this user
const unreadServer = new UnreadServer({ username });
await unreadServer.save();

// Generate verification token
const verificationToken = generateToken();

// Save verification token
const token = new Token({
token: verificationToken,
username,
type: 'verification'
});

await token.save();

// Send verification email
try {
if (transporter) {
await sendVerificationEmail(email, username, verificationToken);
} else {
console.warn('Skipping verification email - email service not configured');
// Auto-verify user for testing if email is not set up
newUser.verified = true;
await newUser.save();
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
try {
// Check if user exists
const user = await User.findOne({ username });

if (!user) {
socket.emit('auth error', { type: 'login', message: 'Invalid username or password' });
return;
}

// Verify password
const isMatch = await bcrypt.compare(password, user.password);

if (!isMatch) {
socket.emit('auth error', { type: 'login', message: 'Invalid username or password' });
return;
}

// Check if user is banned
const isBanned = await BannedUser.findOne({ username });
if (isBanned) {
socket.emit('auth error', { type: 'login', message: 'Your account has been banned for violating community guidelines' });
return;
}

// Check if user is verified
if (!user.verified) {
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
let userActivityDoc = await UserActivity.findOne({ username });
const lastActivity = userActivityDoc ?
{ server: userActivityDoc.server, dm: userActivityDoc.dm } :
{ server: null, dm: null };

// Emit auth success event
socket.emit('auth success', { username, lastActivity });
socket.emit('set token', { username, token });

} catch (error) {
console.error('Error logging in:', error);
socket.emit('auth error', { type: 'login', message: 'Error logging in' });
}
});

// Handle token auth (for reconnection)
socket.on('token auth', async ({ username, token }) => {
if (sessions[token] && sessions[token] === username) {
currentUsername = username;
socketToUser[socket.id] = username;

// Get user's last activity asynchronously
UserActivity.findOne({ username }).then(userActivity => {
const lastActivity = userActivity ?
{ server: userActivity.server, dm: userActivity.dm } :
{ server: null, dm: null };

socket.emit('auth success', { username, lastActivity });
}).catch(err => {
console.error('Error getting user activity:', err);
socket.emit('auth success', { username, lastActivity: { server: null, dm: null } });
});
} else {
socket.emit('clear token');
}
});

// Handle password reset request
socket.on('request password reset', async ({ email }) => {
try {
const username = await getUsernameByEmail(email);

if (!username) {
socket.emit('auth error', {
type: 'reset',
message: 'If this email is registered, you will receive a password reset link'
});
socket.emit('reset initiated');
return;
}

// Generate reset token
const resetToken = generateToken();

// Save reset token
const token = new Token({
token: resetToken,
username,
type: 'reset'
});

await token.save();

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
socket.on('update last activity', async ({ server, dm }) => {
if (!currentUsername) return;

try {
let userActivity = await UserActivity.findOne({ username: currentUsername });

if (!userActivity) {
userActivity = new UserActivity({
username: currentUsername,
server,
dm
});
} else {
userActivity.server = server;
userActivity.dm = dm;
}

await userActivity.save();
} catch (error) {
console.error('Error updating user activity:', error);
}
});

// Get user's joined servers with unread status
socket.on('get user servers', async () => {
if (!currentUsername) return;

try {
const user = await User.findOne({ username: currentUsername });

if (!user) return;

const userServers = user.servers || [];

// Get unread servers status
const unreadData = await UnreadServer.findOne({ username: currentUsername });
let userUnreadServers = {};

if (unreadData && unreadData.unreadServers) {
// Convert Map to object for sending to client
for (const [server, value] of unreadData.unreadServers.entries()) {
if (value) {
userUnreadServers[server] = true;
}
}
}

socket.emit('user servers data', {
servers: userServers,
unreadServers: userUnreadServers
});
} catch (error) {
console.error('Error getting user servers:', error);
}
});

// Get server messages
socket.on('get server messages', async ({ serverName }) => {
if (!currentUsername) return;

try {
const server = await Server.findOne({ name: serverName });

if (server) {
// Use a debug log to check if the query is running
console.log(`Fetching messages for server ${serverName}`);

// Check for a user in the server
if (!server.users.includes(currentUsername)) {
    console.log(`User ${currentUsername} is not in server ${serverName}`);
    return;
}

// Get all messages for this server, sorted by timestamp
const serverMessages = await Message.find({ serverName })
    .sort({ timestamp: 1 })
    .lean();  // Use lean() for better performance

// Debug log to check the result
console.log(`Found ${serverMessages.length} messages for server ${serverName}`);

socket.emit('server messages', serverMessages);
}
} catch (error) {
console.error('Error getting server messages:', error);
}
});

// Get server users
socket.on('get server users', async ({ serverName }) => {
if (!currentUsername) return;

try {
const server = await Server.findOne({ name: serverName });

if (server) {
socket.emit('server users', server.users);
}
} catch (error) {
console.error('Error getting server users:', error);
}
});

// Mark server as read
socket.on('mark server read', async ({ serverName }) => {
if (!currentUsername) return;

try {
const unreadServer = await UnreadServer.findOne({ username: currentUsername });

if (unreadServer && unreadServer.unreadServers.get(serverName)) {
unreadServer.unreadServers.delete(serverName);
await unreadServer.save();
}
} catch (error) {
console.error('Error marking server as read:', error);
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
socket.on('get dms', async () => {
if (currentUsername) {
try {
const userDms = await getUserDms(currentUsername);
socket.emit('user dms', userDms);
} catch (error) {
console.error('Error getting user DMs:', error);
}
}
});

// Get all users for DM
socket.on('get all users', async () => {
if (currentUsername) {
try {
const allUsers = await User.find().select('username');
const usernames = allUsers.map(user => user.username);
socket.emit('all users', usernames);
} catch (error) {
console.error('Error getting all users:', error);
}
}
});

// Get DM messages
socket.on('get dm messages', async ({ otherUser }) => {
if (!currentUsername) return;

try {
const dmKey = getDmKey(currentUsername, otherUser);

// Find or create DM conversation
let dmConversation = await DM.findOne({ dmKey });

if (!dmConversation) {
dmConversation = new DM({ dmKey, messages: [] });
await dmConversation.save();
}

// Mark messages as read
const unreadDm = await UnreadDM.findOne({ username: currentUsername });

if (unreadDm && unreadDm.unreadFrom.get(otherUser)) {
unreadDm.unreadFrom.delete(otherUser);
await unreadDm.save();
}

socket.emit('dm messages', {
otherUser,
messages: dmConversation.messages
});

// Update DM list to reflect read status
const userDms = await getUserDms(currentUsername);
socket.emit('user dms', userDms);
} catch (error) {
console.error('Error getting DM messages:', error);
}
});

// Mark DM as read
socket.on('mark dm read', async ({ otherUser }) => {
if (!currentUsername) return;

try {
const unreadDm = await UnreadDM.findOne({ username: currentUsername });

if (unreadDm && unreadDm.unreadFrom.get(otherUser)) {
unreadDm.unreadFrom.delete(otherUser);
await unreadDm.save();

// Update DM list
const userDms = await getUserDms(currentUsername);
socket.emit('user dms', userDms);
}
} catch (error) {
console.error('Error marking DM as read:', error);
}
});

// Send DM
socket.on('dm message', async ({ to, message, timestamp }) => {
if (!currentUsername) return;

try {
const dmKey = getDmKey(currentUsername, to);

// Create conversation if it doesn't exist
let dmConversation = await DM.findOne({ dmKey });

if (!dmConversation) {
dmConversation = new DM({ dmKey, messages: [] });
}

// Use provided timestamp or generate a new one
timestamp = timestamp || Date.now();

// Generate a unique message ID
const messageId = generateMessageId(currentUsername, timestamp, message);

// Add message to conversation
const dmMessage = {
from: currentUsername,
to,
message,
timestamp,
messageId
};

dmConversation.messages.push(dmMessage);
await dmConversation.save();

// Mark as unread for recipient
let unreadDm = await UnreadDM.findOne({ username: to });

if (!unreadDm) {
unreadDm = new UnreadDM({ username: to });
}

unreadDm.unreadFrom.set(currentUsername, true);
await unreadDm.save();

// Send to both sender and recipient
socket.emit('dm message', dmMessage);

// Find recipient's socket and send the message
for (const [socketId, username] of Object.entries(socketToUser)) {
if (username === to) {
io.to(socketId).emit('dm message', dmMessage);

// Update recipient's DM list to show unread
const recipientDms = await getUserDms(to);
io.to(socketId).emit('user dms', recipientDms);
}
}
} catch (error) {
console.error('Error sending DM:', error);
}
});

// Get discovered servers
socket.on('get discover servers', async () => {
try {
const allServers = await Server.find().select('name');
const serverNames = allServers.map(server => server.name);
socket.emit('discover servers', serverNames);
} catch (error) {
console.error('Error getting discover servers:', error);
socket.emit('discover servers', []);
}
});

// Create server
socket.on('create server', async ({ serverName }) => {
if (!currentUsername) return;

try {
// Check if server already exists
let server = await Server.findOne({ name: serverName });

if (!server) {
// Create new server
server = new Server({
name: serverName,
users: [currentUsername]
});

await server.save();
} else {
// Server exists, add user if not already a member
if (!server.users.includes(currentUsername)) {
server.users.push(currentUsername);
await server.save();
}
}

// Add server to user's server list if not already there
const user = await User.findOne({ username: currentUsername });

if (!user.servers.includes(serverName)) {
user.servers.push(serverName);
await user.save();
}

// Join socket.io room for this server
socket.join(serverName);

// Emit server created event
socket.emit('server created', { serverName });
io.to(serverName).emit('server users', server.users);

// Update discover servers list for all clients
const allServers = await Server.find().select('name');
const serverNames = allServers.map(s => s.name);
io.emit('discover servers', serverNames);
} catch (error) {
console.error('Error creating server:', error);
}
});

// Join server
socket.on('join server', async ({ serverName }) => {
if (!currentUsername) return;

try {
let server = await Server.findOne({ name: serverName });

if (server) {
// Add user to server if not already there
if (!server.users.includes(currentUsername)) {
server.users.push(currentUsername);
await server.save();
}

// Add server to user's server list if not already there
const user = await User.findOne({ username: currentUsername });

if (!user.servers.includes(serverName)) {
user.servers.push(serverName);
await user.save();
}

// Join socket.io room for this server
socket.join(serverName);

// Emit server joined event
socket.emit('server joined', { serverName });
io.to(serverName).emit('server users', server.users);
}
} catch (error) {
console.error('Error joining server:', error);
}
});

// Server message
socket.on('server message', async ({ serverName, message, timestamp }) => {
if (!currentUsername) return;

try {
const server = await Server.findOne({ name: serverName });

if (!server || !server.users.includes(currentUsername)) {
return; // User must be in the server to send messages
}

// Use provided timestamp or generate a new one
timestamp = timestamp || Date.now();

// Generate a unique message ID
const messageId = generateMessageId(currentUsername, timestamp, message);

const messageObj = {
serverName,
username: currentUsername,
message,
timestamp,
messageId
};

// Save message to database
const newMessage = new Message(messageObj);
await newMessage.save();

// Add messageId to the broadcast message
const broadcastMessage = {
username: currentUsername,
message,
timestamp,
serverName,
messageId
};

// Mark as unread for all users in the server except the sender
for (const user of server.users) {
if (user !== currentUsername) {
let unreadServer = await UnreadServer.findOne({ username: user });

if (!unreadServer) {
unreadServer = new UnreadServer({ username: user });
}

unreadServer.unreadServers.set(serverName, true);
await unreadServer.save();
}
}

// Broadcast to all users in the server
io.to(serverName).emit('server message', broadcastMessage);
} catch (error) {
console.error('Error sending server message:', error);
}
});

// Handle leave server
socket.on('leave server', async ({ serverName }) => {
if (!currentUsername) return;

try {
// Remove user from server
const server = await Server.findOne({ name: serverName });
if (server) {
server.users = server.users.filter(user => user !== currentUsername);
await server.save();

// Remove server from user's list
const user = await User.findOne({ username: currentUsername });
if (user) {
user.servers = user.servers.filter(server => server !== serverName);
await user.save();
}

// Leave socket.io room
socket.leave(serverName);

// Update users list for remaining users in the server
io.to(serverName).emit('server users', server.users);
}
} catch (error) {
console.error('Error leaving server:', error);
}
});

// Get banned users
socket.on('get banned users', async () => {
if (!currentUsername) return;

try {
const bannedUsers = await BannedUser.find().select('username');
socket.emit('banned users', bannedUsers.map(user => user.username));
} catch (error) {
console.error('Error getting banned users:', error);
socket.emit('banned users', []);
}
});

// Report a message
socket.on('report message', async ({ reportedUser, messageId }) => {
if (!currentUsername) return;

try {
// Check if user is already banned
const isBanned = await BannedUser.findOne({ username: reportedUser });
if (isBanned) {
return; // Already banned, no need to report
}

// Check if this message was already reported by this user
const existingReport = await Report.findOne({ 
userId: currentUsername, 
reportedId: reportedUser,
messageId: messageId
});

if (existingReport) {
return; // Already reported this message, ignore
}

// Save report
const report = new Report({
userId: currentUsername,
reportedId: reportedUser,
messageId: messageId
});
await report.save();

// Count total reports for this user
const reportCount = await Report.countDocuments({ reportedId: reportedUser });

// Ban if 5 or more reports
if (reportCount >= 5) {
const bannedUser = new BannedUser({
username: reportedUser,
reportCount: reportCount,
reason: "Received 5 or more reports from community members"
});
await bannedUser.save();

// Notify all clients about the ban
io.emit('user banned', reportedUser);
}

} catch (error) {
console.error('Error reporting message:', error);
}
});

// Report a user directly
socket.on('report user', async ({ username: reportedUser }) => {
if (!currentUsername) return;

try {
// Check if user is already banned
const isBanned = await BannedUser.findOne({ username: reportedUser });
if (isBanned) {
return; // Already banned, no need to report
}

// Check if this user was already reported by this user
const existingReport = await Report.findOne({ 
userId: currentUsername, 
reportedId: reportedUser,
messageId: { $exists: false }
});

if (existingReport) {
return; // Already reported this user, ignore
}

// Save report
const report = new Report({
userId: currentUsername,
reportedId: reportedUser
});
await report.save();

// Count total reports for this user
const reportCount = await Report.countDocuments({ reportedId: reportedUser });

// Ban if 5 or more reports
if (reportCount >= 5) {
const bannedUser = new BannedUser({
username: reportedUser,
reportCount: reportCount,
reason: "Received 5 or more reports from community members"
});
await bannedUser.save();

// Notify all clients about the ban
io.emit('user banned', reportedUser);
}

} catch (error) {
console.error('Error reporting user:', error);
}
});

// Manually ban a user
socket.on('ban user', async ({ username: bannedUsername }) => {
if (!currentUsername) return;

try {
// Check if user is already banned
const existingBan = await BannedUser.findOne({ username: bannedUsername });
if (existingBan) {
return; // Already banned
}

// Count total reports for this user
const reportCount = await Report.countDocuments({ reportedId: bannedUsername });

// Create ban record
const bannedUser = new BannedUser({
username: bannedUsername,
reportCount: reportCount,
reason: "Banned by moderator"
});
await bannedUser.save();

// Notify all clients about the ban
io.emit('user banned', bannedUsername);

} catch (error) {
console.error('Error banning user:', error);
}
});

// Typing indicators
socket.on('typing', ({ room }) => {
if (!currentUsername || !room) return;

io.to(room).emit('typing', { user: currentUsername, room });
});

socket.on('stop typing', ({ room }) => {
if (!currentUsername || !room) return;

io.to(room).emit('stop typing', { user: currentUsername, room });
});

// Handle disconnection
socket.on('disconnect', () => {
console.log('User disconnected');
delete socketToUser[socket.id];
// We don't remove the user from servers here as they might reconnect
});
});

server.listen(PORT, () => {
console.log(`Server running on http://localhost:${PORT}`);
});