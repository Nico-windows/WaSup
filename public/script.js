const socket = io();

// Elements
const serverList = document.getElementById('server-list');
const messagesDiv = document.getElementById('messages');
const input = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const manageServerButton = document.getElementById('manage-server-button');
const serverModal = document.getElementById('server-modal');
const modalCloseButton = document.getElementById('modal-close-button');
const createServerButton = document.getElementById('create-server-button');
const joinServerButton = document.getElementById('join-server-button');
const serverNameInput = document.getElementById('server-name-input');
const currentServer = document.getElementById('current-server');
const userList = document.getElementById('user-list');
const discoverServersList = document.getElementById('discover-servers-list');

let username = prompt("Enter your username:");
let activeServer = null;
let usersInServer = [];

// Open Manage Servers Modal
manageServerButton.addEventListener('click', () => {
    serverModal.classList.remove('hidden');
});

// Close Modal
modalCloseButton.addEventListener('click', () => {
    serverModal.classList.add('hidden');
});

// Create server
createServerButton.addEventListener('click', () => {
    const serverName = serverNameInput.value.trim();
    if (serverName) {
        socket.emit('create server', { serverName, username });
        activeServer = serverName;
        updateServerUI(serverName);
        currentServer.textContent = `Server: ${serverName}`;
        serverNameInput.value = '';
        serverModal.classList.add('hidden');
    }
});

// Join server
joinServerButton.addEventListener('click', () => {
    const serverName = serverNameInput.value.trim();
    if (serverName) {
        socket.emit('join server', { serverName, username });
        activeServer = serverName;
        updateServerUI(serverName);
        currentServer.textContent = `Server: ${serverName}`;
        serverNameInput.value = '';
        serverModal.classList.add('hidden');
    }
});

// Update server UI
function updateServerUI(serverName) {
    if (!Array.from(serverList.children).some((li) => li.textContent === serverName)) {
        const serverItem = document.createElement('li');
        serverItem.textContent = serverName;
        serverItem.addEventListener('click', () => {
            activeServer = serverName;
            currentServer.textContent = `Server: ${serverName}`;
            messagesDiv.innerHTML = ''; // Clear current messages
            updatePeopleList();
            socket.emit('join server', { serverName, username });
        });
        serverList.appendChild(serverItem);
    }
}

// Update People list
function updatePeopleList() {
    userList.innerHTML = '';
    usersInServer.forEach(user => {
        const userItem = document.createElement('li');
        userItem.textContent = user;
        userList.appendChild(userItem);
    });
}

// Send Message
function sendMessage() {
    const message = input.value.trim();
    if (message && activeServer) {
        socket.emit('server message', { serverName: activeServer, message, username });
        input.value = '';
    }
}

// Send message on Enter key
input.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

// Send message on button click
sendButton.addEventListener('click', sendMessage);

// Receive messages
socket.on('server message', ({ username, message }) => {
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `<strong>${username}:</strong> ${message}`;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// Handle previous messages
socket.on('server messages', (messages) => {
    messagesDiv.innerHTML = ''; 
    messages.forEach(({ username, message }) => {
        const messageElement = document.createElement('div');
        messageElement.innerHTML = `<strong>${username}:</strong> ${message}`;
        messagesDiv.appendChild(messageElement);
    });
});

// Update People in Server
socket.on('update people', (users) => {
    usersInServer = users;
    updatePeopleList();
});

// Handle Discover Servers
socket.on('discover servers', (servers) => {
    discoverServersList.innerHTML = ''; // Clear previous list
    servers.forEach(server => {
        const serverItem = document.createElement('li');
        serverItem.textContent = server;
        serverItem.addEventListener('click', () => {
            socket.emit('join server', { serverName: server, username });
            activeServer = server;
            updateServerUI(server);
            currentServer.textContent = `Server: ${server}`;
            serverModal.classList.add('hidden');
        });
        discoverServersList.appendChild(serverItem);
    });
});
