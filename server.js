const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

const DATA_FILE = 'server_data.json';

let servers = {};
let messages = {};

// Load data from JSON file on startup
try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    const parsedData = JSON.parse(data);
    servers = parsedData.servers || {};
    messages = parsedData.messages || {};
} catch (err) {
    console.log('Error loading data, starting with empty state:', err);
    // If the file doesn't exist or there's an error, start with empty objects.
    servers = {};
    messages = {};
}

function saveData() {
    const dataToSave = { servers, messages };
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2), 'utf8'); // Use null, 2 for pretty printing
}


app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('User connected');

    socket.emit('discover servers', Object.keys(servers));

    socket.on('create server', ({ serverName, username }) => {
        if (!servers[serverName]) {
            servers[serverName] = [];
            messages[serverName] = [];
            saveData(); // Save immediately after server creation
        }
        servers[serverName].push(username);
        socket.join(serverName);
        io.to(serverName).emit('server created', { serverName });
        io.to(serverName).emit('update people', servers[serverName]);
        io.emit('discover servers', Object.keys(servers));
    });

    socket.on('join server', ({ serverName, username }) => {
        if (servers[serverName]) {
            if (!servers[serverName].includes(username)) {
                servers[serverName].push(username);
                saveData(); // Save when a user joins
            }
            socket.join(serverName);
            io.to(serverName).emit('server joined', { serverName });
            io.to(serverName).emit('update people', servers[serverName]);
            socket.emit('server messages', messages[serverName]);
        }
    });

    socket.on('server message', ({ serverName, message, username }) => {
        if (!messages[serverName]) {
            messages[serverName] = [];
        }
        messages[serverName].push({ username, message });
        saveData(); // Save after every message

        io.to(serverName).emit('server message', { username, message });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        // You might want to handle user disconnections and update the user list here.
        // This would involve finding the user in the servers object and removing them.
        // Be sure to save the data after any changes.
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});