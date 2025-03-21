// Wait for socket.io to load
document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
  
    // Elements
    const app = document.getElementById('app');
    const authContainer = document.getElementById('auth-container');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginUsername = document.getElementById('login-username');
    const loginPassword = document.getElementById('login-password');
    const signupUsername = document.getElementById('signup-username');
    const signupPassword = document.getElementById('signup-password');
    const signupConfirmPassword = document.getElementById('signup-confirm-password');
    const loginButton = document.getElementById('login-button');
    const signupButton = document.getElementById('signup-button');
    const goToSignup = document.getElementById('go-to-signup');
    const goToLogin = document.getElementById('go-to-login');
    const loginError = document.getElementById('login-error');
    const signupError = document.getElementById('signup-error');
    const logoutButton = document.getElementById('logout-button');
    const userDisplay = document.getElementById('user-display');
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
  
    let username = '';
    let activeServer = null;
    let usersInServer = [];
  
    // Toggle between login and signup forms
    goToSignup.addEventListener('click', () => {
      loginForm.classList.add('hidden');
      signupForm.classList.remove('hidden');
      clearFormErrors();
    });
  
    goToLogin.addEventListener('click', () => {
      signupForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
      clearFormErrors();
    });
  
    // Clear error messages
    function clearFormErrors() {
      loginError.textContent = '';
      signupError.textContent = '';
    }
  
    // Handle login
    loginButton.addEventListener('click', () => {
      const username = loginUsername.value.trim();
      const password = loginPassword.value;
      
      if (!username || !password) {
        loginError.textContent = 'Please enter both username and password';
        return;
      }
      
      socket.emit('login', { username, password });
    });
  
    // Handle signup
    signupButton.addEventListener('click', () => {
      const username = signupUsername.value.trim();
      const password = signupPassword.value;
      const confirmPassword = signupConfirmPassword.value;
      
      if (!username || !password || !confirmPassword) {
        signupError.textContent = 'Please fill in all fields';
        return;
      }
      
      if (password !== confirmPassword) {
        signupError.textContent = 'Passwords do not match';
        return;
      }
      
      socket.emit('signup', { username, password });
    });
  
    // Handle auth success
    socket.on('auth success', (data) => {
      username = data.username;
      userDisplay.textContent = username;
      authContainer.classList.add('hidden');
      app.classList.remove('hidden');
      socket.emit('get servers');
    });
  
    // Handle auth errors
    socket.on('auth error', (data) => {
      if (data.type === 'login') {
        loginError.textContent = data.message;
      } else {
        signupError.textContent = data.message;
      }
    });
  
    // Handle logout
    logoutButton.addEventListener('click', () => {
      socket.emit('logout');
      authContainer.classList.remove('hidden');
      app.classList.add('hidden');
      loginForm.classList.remove('hidden');
      signupForm.classList.add('hidden');
      clearFormErrors();
      
      // Clear forms
      loginUsername.value = '';
      loginPassword.value = '';
      signupUsername.value = '';
      signupPassword.value = '';
      signupConfirmPassword.value = '';
      
      // Clear app state
      serverList.innerHTML = '';
      messagesDiv.innerHTML = '';
      userList.innerHTML = '';
    });
  
    // Open Manage Servers Modal
    manageServerButton.addEventListener('click', () => {
      serverModal.classList.remove('hidden');
      socket.emit('get discover servers');
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
      if (username === window.username) {
        messageElement.classList.add('own-message');
      }
      messagesDiv.appendChild(messageElement);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
  
    // Handle previous messages
    socket.on('server messages', (messages) => {
      messagesDiv.innerHTML = ''; 
      messages.forEach(({ username: msgUsername, message }) => {
        const messageElement = document.createElement('div');
        messageElement.innerHTML = `<strong>${msgUsername}:</strong> ${message}`;
        if (msgUsername === username) {
          messageElement.classList.add('own-message');
        }
        messagesDiv.appendChild(messageElement);
      });
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
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
  
    // Handle user servers
    socket.on('user servers', (servers) => {
      serverList.innerHTML = '';
      servers.forEach(serverName => {
        updateServerUI(serverName);
      });
    });
  
    // Reconnection handling
    socket.on('connect', () => {
      const storedUsername = localStorage.getItem('wasupUsername');
      const storedToken = localStorage.getItem('wasupToken');
      
      if (storedUsername && storedToken) {
        socket.emit('token auth', { username: storedUsername, token: storedToken });
      }
    });
  
    // Set token on auth
    socket.on('set token', (data) => {
      localStorage.setItem('wasupUsername', data.username);
      localStorage.setItem('wasupToken', data.token);
    });
  
    // Clear token on logout
    socket.on('clear token', () => {
      localStorage.removeItem('wasupUsername');
      localStorage.removeItem('wasupToken');
    });
  });