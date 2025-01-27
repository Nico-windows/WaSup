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

let username = prompt("Enter your username:");
let activeServer = null;
let usersInServer = [];

// Open modal
manageServerButton.addEventListener('click', () => {
  serverModal.classList.remove('hidden');
});

// Close modal
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
      messagesDiv.innerHTML = '';  // Clear current messages
      updatePeopleList();
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

// Handle "Enter" key press to send a message
input.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    sendMessage();
  }
});

// Send message on button click
sendButton.addEventListener('click', sendMessage);

// Send message function
function sendMessage() {
  const message = input.value.trim();
  if (message && activeServer) {
    socket.emit('server message', { serverName: activeServer, message, username });
    input.value = '';  // Clear input field
  }
}

// Receive messages
socket.on('server message', ({ username, message }) => {
  const messageElement = document.createElement('div');
  messageElement.innerHTML = `<strong>${username}:</strong> ${message}`;
  
  // Add class only if it’s the current user's message
  if (username === this.username) {
    messageElement.classList.add('own-message');
  }
  
  messagesDiv.appendChild(messageElement);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;  // Auto-scroll to latest message
});


// Update people in server
socket.on('update people', (users) => {
  usersInServer = users;
  updatePeopleList();
});
