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
    const dmList = document.getElementById('dm-list');
    const messagesDiv = document.getElementById('messages');
    const input = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const manageServerButton = document.getElementById('manage-server-button');
    const newDmButton = document.getElementById('new-dm-button');
    const serverModal = document.getElementById('server-modal');
    const dmModal = document.getElementById('dm-modal');
    const modalCloseButton = document.getElementById('modal-close-button');
    const dmModalCloseButton = document.getElementById('dm-modal-close-button');
    const createServerButton = document.getElementById('create-server-button');
    const joinServerButton = document.getElementById('join-server-button');
    const serverNameInput = document.getElementById('server-name-input');
    const dmSearchInput = document.getElementById('dm-search-input');
    const dmUsersList = document.getElementById('dm-users-list');
    const currentServer = document.getElementById('current-server');
    const userList = document.getElementById('user-list');
    const discoverServersList = document.getElementById('discover-servers-list');
    const peopleList = document.getElementById('people-list');
  
    let username = '';
    let activeServer = null;
    let activeDm = null;
    let usersInServer = [];
    let chatMode = 'server'; // 'server' or 'dm'
    let allUsers = [];
    let unreadDms = {};
    
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
      socket.emit('get dms');
      socket.emit('get all users');
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
      dmList.innerHTML = '';
      messagesDiv.innerHTML = '';
      userList.innerHTML = '';
      username = '';
      activeServer = null;
      activeDm = null;
      chatMode = 'server';
    });
  
    // Open Manage Servers Modal
    manageServerButton.addEventListener('click', () => {
      serverModal.classList.remove('hidden');
      socket.emit('get discover servers');
    });
  
    // Open New DM Modal
    newDmButton.addEventListener('click', () => {
      dmModal.classList.remove('hidden');
      socket.emit('get all users');
      displayDmUsers(allUsers);
    });
  
    // Close Modals
    modalCloseButton.addEventListener('click', () => {
      serverModal.classList.add('hidden');
    });
  
    dmModalCloseButton.addEventListener('click', () => {
      dmModal.classList.add('hidden');
    });
  
    // Create server
    createServerButton.addEventListener('click', () => {
      const serverName = serverNameInput.value.trim();
      if (serverName) {
        socket.emit('create server', { serverName, username });
        activeServer = serverName;
        switchToServerMode(serverName);
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
        switchToServerMode(serverName);
        serverNameInput.value = '';
        serverModal.classList.add('hidden');
      }
    });
  
    // Create or update DM list
    function updateDmList(dms) {
      dmList.innerHTML = '';
      dms.forEach(({ user, hasUnread }) => {
        const dmItem = document.createElement('li');
        if (hasUnread) {
          dmItem.innerHTML = `${user} <span class="unread-badge">!</span>`;
        } else {
          dmItem.textContent = user;
        }
        
        if (activeDm === user && chatMode === 'dm') {
          dmItem.classList.add('active');
        }
        
        dmItem.addEventListener('click', () => {
          socket.emit('get dm messages', { otherUser: user });
          switchToDmMode(user);
        });
        dmList.appendChild(dmItem);
      });
    }
  
    // Update server UI
    function updateServerUI(serverName) {
      const existingServer = Array.from(serverList.children).find(li => li.textContent === serverName);
      
      if (!existingServer) {
        const serverItem = document.createElement('li');
        serverItem.textContent = serverName;
        
        if (activeServer === serverName && chatMode === 'server') {
          serverItem.classList.add('active');
        }
        
        serverItem.addEventListener('click', () => {
          activeServer = serverName;
          switchToServerMode(serverName);
          socket.emit('join server', { serverName, username });
        });
        serverList.appendChild(serverItem);
      }
    }
  
    // Switch to server mode
    function switchToServerMode(serverName) {
      chatMode = 'server';
      activeServer = serverName;
      activeDm = null;
      
      // Update UI elements
      currentServer.textContent = `Server: ${serverName}`;
      messagesDiv.innerHTML = '';
      peopleList.classList.remove('hidden');
      
      // Update active classes
      Array.from(serverList.children).forEach(item => {
        item.classList.toggle('active', item.textContent === serverName);
      });
      Array.from(dmList.children).forEach(item => {
        item.classList.remove('active');
      });
    }
  
    // Switch to DM mode
    function switchToDmMode(otherUser) {
      chatMode = 'dm';
      activeDm = otherUser;
      activeServer = null;
      
      // Clear unread status for this DM
      if (unreadDms[otherUser]) {
        socket.emit('mark dm read', { otherUser });
        delete unreadDms[otherUser];
      }
      
      // Update UI elements
      currentServer.textContent = `Chat with: ${otherUser}`;
      messagesDiv.innerHTML = '';
      peopleList.classList.add('hidden');
      
      // Update active classes
      Array.from(serverList.children).forEach(item => {
        item.classList.remove('active');
      });
      
      Array.from(dmList.children).forEach(item => {
        const dmUsername = item.textContent.replace(' !', ''); // Remove unread badge text if present
        item.classList.toggle('active', dmUsername === otherUser);
      });
    }
  
    // Update People list for servers
    function updatePeopleList() {
      userList.innerHTML = '';
      usersInServer.forEach(user => {
        if (user !== username) { // Don't show DM option for self
          const userItem = document.createElement('li');
          userItem.innerHTML = `
            ${user}
            <span class="dm-user-action" data-username="${user}">DM</span>
          `;
          userList.appendChild(userItem);
        } else {
          const userItem = document.createElement('li');
          userItem.textContent = `${user} (you)`;
          userList.appendChild(userItem);
        }
      });
      
      // Add event listeners for DM buttons
      document.querySelectorAll('.dm-user-action').forEach(button => {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          const otherUser = e.target.getAttribute('data-username');
          socket.emit('get dm messages', { otherUser });
          switchToDmMode(otherUser);
        });
      });
    }
  
    // Filter DM users
    dmSearchInput.addEventListener('input', () => {
      const searchTerm = dmSearchInput.value.toLowerCase();
      const filteredUsers = allUsers.filter(user => 
        user.toLowerCase().includes(searchTerm) && user !== username
      );
      displayDmUsers(filteredUsers);
    });
  
    // Display DM users in the modal
    function displayDmUsers(users) {
      dmUsersList.innerHTML = '';
      users.forEach(user => {
        if (user !== username) { // Don't show yourself in the DM list
          const userItem = document.createElement('li');
          userItem.textContent = user;
          userItem.addEventListener('click', () => {
            socket.emit('get dm messages', { otherUser: user });
            switchToDmMode(user);
            dmModal.classList.add('hidden');
          });
          dmUsersList.appendChild(userItem);
        }
      });
    }
  
    // Send Message (both server and DM)
    function sendMessage() {
      const message = input.value.trim();
      if (!message) return;
      
      if (chatMode === 'server' && activeServer) {
        socket.emit('server message', { serverName: activeServer, message, username });
      } else if (chatMode === 'dm' && activeDm) {
        socket.emit('dm message', { to: activeDm, message });
      }
      
      input.value = '';
    }
  
    // Send message on Enter key
    input.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        sendMessage();
      }
    });
  
    // Send message on button click
    sendButton.addEventListener('click', sendMessage);
  
    // Receive server messages
    socket.on('server message', ({ username: msgUsername, message }) => {
      if (chatMode === 'server') {
        const messageElement = document.createElement('div');
        messageElement.innerHTML = `<strong>${msgUsername}:</strong> ${message}`;
        
        if (msgUsername === username) {
          messageElement.classList.add('own-message');
        }
        
        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }
    });
  
    // Receive DM
    socket.on('dm message', ({ from, to, message }) => {
      // If this DM is currently active, display it
      if (chatMode === 'dm' && ((from === activeDm) || (to === activeDm))) {
        const messageElement = document.createElement('div');
        messageElement.innerHTML = `<strong>${from}:</strong> ${message}`;
        
        if (from === username) {
          messageElement.classList.add('own-message');
        }
        
        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      } 
      // Otherwise mark as unread
      else if (from !== username) {
        unreadDms[from] = true;
        socket.emit('get dms'); // Refresh DM list to show unread badge
      }
    });
  
    // Handle previous server messages
    socket.on('server messages', (messages) => {
      if (chatMode === 'server') {
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
      }
    });
  
    // Handle DM message history
    socket.on('dm messages', ({ otherUser, messages }) => {
      messagesDiv.innerHTML = '';
      
      messages.forEach(({ from, to, message }) => {
        const messageElement = document.createElement('div');
        messageElement.innerHTML = `<strong>${from}:</strong> ${message}`;
        
        if (from === username) {
          messageElement.classList.add('own-message');
        }
        
        messagesDiv.appendChild(messageElement);
      });
      
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
  
    // Update user's DM list
    socket.on('user dms', (dms) => {
      updateDmList(dms);
    });
  
    // Update list of all users
    socket.on('all users', (users) => {
      allUsers = users;
    });
  
    // Update People in Server
    socket.on('update people', (users) => {
      usersInServer = users;
      if (chatMode === 'server') {
        updatePeopleList();
      }
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
          switchToServerMode(server);
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