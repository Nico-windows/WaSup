// Wait for socket.io to load
document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
  
    // Auth Elements
    const app = document.getElementById('app');
    const authContainer = document.getElementById('auth-container');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const resetForm = document.getElementById('reset-form');
    const emailVerification = document.getElementById('email-verification');
    
    const loginUsername = document.getElementById('login-username');
    const loginPassword = document.getElementById('login-password');
    const signupUsername = document.getElementById('signup-username');
    const signupEmail = document.getElementById('signup-email');
    const signupPassword = document.getElementById('signup-password');
    const signupConfirmPassword = document.getElementById('signup-confirm-password');
    const resetEmail = document.getElementById('reset-email');
    
    const loginButton = document.getElementById('login-button');
    const signupButton = document.getElementById('signup-button');
    const resetButton = document.getElementById('reset-button');
    const backToLoginButton = document.getElementById('back-to-login-button');
    
    const goToSignup = document.getElementById('go-to-signup');
    const goToLogin = document.getElementById('go-to-login');
    const goToReset = document.getElementById('go-to-reset');
    const backToLogin = document.getElementById('back-to-login');
    
    const loginError = document.getElementById('login-error');
    const signupError = document.getElementById('signup-error');
    const resetError = document.getElementById('reset-error');
    const resetSuccess = document.getElementById('reset-success');
  
    // App Elements
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
  
    // App state
    let username = '';
    let activeServer = null;
    let activeDm = null;
    let usersInServer = [];
    let chatMode = 'server'; // 'server' or 'dm'
    let allUsers = [];
    let unreadDms = {};
    let lastActivity = { server: null, dm: null }; // Track last active server/dm
    let joinedServers = []; // Keep track of servers user has joined
    let unreadServers = {}; // Track unread messages in servers
    
    // Toggle between auth forms
    goToSignup.addEventListener('click', () => {
      hideAllAuthForms();
      signupForm.classList.remove('hidden');
      clearFormErrors();
    });
  
    goToLogin.addEventListener('click', () => {
      hideAllAuthForms();
      loginForm.classList.remove('hidden');
      clearFormErrors();
    });
  
    goToReset.addEventListener('click', () => {
      hideAllAuthForms();
      resetForm.classList.remove('hidden');
      clearFormErrors();
    });
  
    backToLogin.addEventListener('click', () => {
      hideAllAuthForms();
      loginForm.classList.remove('hidden');
      clearFormErrors();
    });
  
    backToLoginButton.addEventListener('click', () => {
      hideAllAuthForms();
      loginForm.classList.remove('hidden');
      clearFormErrors();
    });
  
    function hideAllAuthForms() {
      loginForm.classList.add('hidden');
      signupForm.classList.add('hidden');
      resetForm.classList.add('hidden');
      emailVerification.classList.add('hidden');
    }
  
    // Clear error messages
    function clearFormErrors() {
      loginError.textContent = '';
      signupError.textContent = '';
      resetError.textContent = '';
      resetSuccess.textContent = '';
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
      const email = signupEmail.value.trim();
      const password = signupPassword.value;
      const confirmPassword = signupConfirmPassword.value;
      
      if (!username || !email || !password || !confirmPassword) {
        signupError.textContent = 'Please fill in all fields';
        return;
      }
      
      if (password !== confirmPassword) {
        signupError.textContent = 'Passwords do not match';
        return;
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        signupError.textContent = 'Please enter a valid email address';
        return;
      }
      
      socket.emit('signup', { username, email, password });
    });
  
    // Handle password reset
    resetButton.addEventListener('click', () => {
      const email = resetEmail.value.trim();
      
      if (!email) {
        resetError.textContent = 'Please enter your email address';
        return;
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        resetError.textContent = 'Please enter a valid email address';
        return;
      }
      
      socket.emit('request password reset', { email });
    });
  
    // Handle auth success
    socket.on('auth success', (data) => {
      username = data.username;
      userDisplay.textContent = username;
      authContainer.classList.add('hidden');
      app.classList.remove('hidden');
      
      // Request all joined servers and unread status
      socket.emit('get user servers');
      socket.emit('get dms');
      socket.emit('get all users');
      
      // Restore last active server or DM
      if (data.lastActivity) {
        lastActivity = data.lastActivity;
        
        if (lastActivity.server) {
          activeServer = lastActivity.server;
          socket.emit('get server messages', { serverName: activeServer });
          socket.emit('get server users', { serverName: activeServer });
          switchToServerMode(activeServer);
        } else if (lastActivity.dm) {
          activeDm = lastActivity.dm;
          socket.emit('get dm messages', { otherUser: activeDm });
          switchToDmMode(activeDm);
        }
      }
    });
  
    // Handle joined servers list and unread status
    socket.on('user servers data', (data) => {
      joinedServers = data.servers || [];
      unreadServers = data.unreadServers || {};
      
      // Update server list UI with all joined servers
      updateServerListUI();
    });
  
    // Update server list UI with joined servers and unread status
    function updateServerListUI() {
      serverList.innerHTML = '';
      
      joinedServers.forEach(serverName => {
        const serverItem = document.createElement('li');
        
        // Add unread indicator if server has unread messages
        if (unreadServers[serverName]) {
          serverItem.innerHTML = `${serverName} <span class="unread-badge">!</span>`;
        } else {
          serverItem.textContent = serverName;
        }
        
        // Highlight active server
        if (activeServer === serverName && chatMode === 'server') {
          serverItem.classList.add('active');
        }
        
        // Add click handler to switch to this server
        serverItem.addEventListener('click', () => {
          switchToServer(serverName);
        });
        
        serverList.appendChild(serverItem);
      });
    }
  
    // Switch to a server without rejoining
    function switchToServer(serverName) {
      if (serverName === activeServer && chatMode === 'server') return;
      
      activeServer = serverName;
      
      // Clear unread status for this server
      if (unreadServers[serverName]) {
        socket.emit('mark server read', { serverName });
        delete unreadServers[serverName];
        updateServerListUI();
      }
      
      switchToServerMode(serverName);
      
      // Get server messages and users
      socket.emit('get server messages', { serverName });
      socket.emit('get server users', { serverName });
    }
  
    // Handle signup success
    socket.on('signup success', () => {
      hideAllAuthForms();
      emailVerification.classList.remove('hidden');
    });
  
    // Handle password reset initiated
    socket.on('reset initiated', () => {
      resetError.textContent = '';
      resetSuccess.textContent = 'Password reset email sent. Please check your inbox.';
    });
  
    // Handle auth errors
    socket.on('auth error', (data) => {
      if (data.type === 'login') {
        loginError.textContent = data.message;
      } else if (data.type === 'signup') {
        signupError.textContent = data.message;
      } else if (data.type === 'reset') {
        resetError.textContent = data.message;
      }
    });
  
    // Handle logout
    logoutButton.addEventListener('click', () => {
      // Save last activity before logout
      if (activeServer) {
        socket.emit('update last activity', { server: activeServer, dm: null });
      } else if (activeDm) {
        socket.emit('update last activity', { server: null, dm: activeDm });
      }
      
      socket.emit('logout');
      authContainer.classList.remove('hidden');
      app.classList.add('hidden');
      loginForm.classList.remove('hidden');
      signupForm.classList.add('hidden');
      resetForm.classList.add('hidden');
      emailVerification.classList.add('hidden');
      clearFormErrors();
      
      // Clear forms
      loginUsername.value = '';
      loginPassword.value = '';
      signupUsername.value = '';
      signupEmail.value = '';
      signupPassword.value = '';
      signupConfirmPassword.value = '';
      resetEmail.value = '';
      
      // Clear app state
      serverList.innerHTML = '';
      dmList.innerHTML = '';
      messagesDiv.innerHTML = '';
      userList.innerHTML = '';
      username = '';
      activeServer = null;
      activeDm = null;
      chatMode = 'server';
      lastActivity = { server: null, dm: null };
      joinedServers = [];
      unreadServers = {};
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
        socket.emit('create server', { serverName });
        serverNameInput.value = '';
        serverModal.classList.add('hidden');
      }
    });
  
    // Join server
    joinServerButton.addEventListener('click', () => {
      const serverName = serverNameInput.value.trim();
      if (serverName) {
        socket.emit('join server', { serverName });
        serverNameInput.value = '';
        serverModal.classList.add('hidden');
      }
    });
  
    // Handle server joined response
    socket.on('server joined', (data) => {
      const { serverName } = data;
      
      // Add to joined servers list if not already there
      if (!joinedServers.includes(serverName)) {
        joinedServers.push(serverName);
      }
      
      // Switch to the newly joined server
      switchToServer(serverName);
    });
  
    // Handle server created response
    socket.on('server created', (data) => {
      const { serverName } = data;
      
      // Add to joined servers list if not already there
      if (!joinedServers.includes(serverName)) {
        joinedServers.push(serverName);
      }
      
      // Switch to the newly created server
      switchToServer(serverName);
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
  
    // Switch to server mode
    function switchToServerMode(serverName) {
      chatMode = 'server';
      activeServer = serverName;
      activeDm = null;
      
      // Save last activity
      socket.emit('update last activity', { server: serverName, dm: null });
      
      // Update UI elements
      currentServer.textContent = `Server: ${serverName}`;
      messagesDiv.innerHTML = '';
      peopleList.classList.remove('hidden');
      
      // Update active classes
      updateServerListUI();
      Array.from(dmList.children).forEach(item => {
        item.classList.remove('active');
      });
    }
  
    // Switch to DM mode
    function switchToDmMode(otherUser) {
      chatMode = 'dm';
      activeDm = otherUser;
      activeServer = null;
      
      // Save last activity
      socket.emit('update last activity', { server: null, dm: otherUser });
      
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
      updateServerListUI(); // Reset server active state
      
      Array.from(dmList.children).forEach(item => {
        const dmUsername = item.textContent.replace(' !', ''); // Remove unread badge text if present
        item.classList.toggle('active', dmUsername === otherUser);
      });
    }
  
    // Format timestamp
    function formatTimestamp(timestamp) {
      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Check if date is today
      if (date.toDateString() === today.toDateString()) {
        return `Today at ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      }
      
      // Check if date is yesterday
      if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday at ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      }
      
      // Otherwise return full date
      return `${date.toLocaleDateString()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
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
        socket.emit('server message', { serverName: activeServer, message });
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
    socket.on('server message', ({ username: msgUsername, message, timestamp, serverName }) => {
      // If this server is currently active, display the message
      if (chatMode === 'server' && activeServer === serverName) {
        const messageElement = document.createElement('div');
        const formattedTime = formatTimestamp(timestamp);
        messageElement.innerHTML = `
          <strong>${msgUsername}:</strong> ${message}
          <div class="message-timestamp">${formattedTime}</div>
        `;
        
        if (msgUsername === username) {
          messageElement.classList.add('own-message');
        }
        
        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      } 
      // Otherwise mark as unread if it's not our own message
      else if (msgUsername !== username && joinedServers.includes(serverName)) {
        unreadServers[serverName] = true;
        updateServerListUI();
      }
    });
  
    // Receive DM
    socket.on('dm message', ({ from, to, message, timestamp }) => {
      // If this DM is currently active, display it
      if (chatMode === 'dm' && ((from === activeDm) || (to === activeDm))) {
        const messageElement = document.createElement('div');
        const formattedTime = formatTimestamp(timestamp);
        messageElement.innerHTML = `
          <strong>${from}:</strong> ${message}
          <div class="message-timestamp">${formattedTime}</div>
        `;
        
        if (from === username) {
          messageElement.classList.add('own-message');
        }
        
        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      } 
      // Otherwise mark as unread if it's not our own message
      else if (from !== username) {
        unreadDms[from] = true;
        socket.emit('get dms'); // Refresh DM list to show unread badge
      }
    });
  
    // Handle previous server messages
    socket.on('server messages', (messages) => {
      if (chatMode === 'server') {
        messagesDiv.innerHTML = ''; 
        messages.forEach(({ username: msgUsername, message, timestamp }) => {
          const messageElement = document.createElement('div');
          const formattedTime = formatTimestamp(timestamp);
          messageElement.innerHTML = `
            <strong>${msgUsername}:</strong> ${message}
            <div class="message-timestamp">${formattedTime}</div>
          `;
          
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
      
      messages.forEach(({ from, to, message, timestamp }) => {
        const messageElement = document.createElement('div');
        const formattedTime = formatTimestamp(timestamp);
        messageElement.innerHTML = `
          <strong>${from}:</strong> ${message}
          <div class="message-timestamp">${formattedTime}</div>
        `;
        
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
    socket.on('server users', (users) => {
      usersInServer = users;
      if (chatMode === 'server') {
        updatePeopleList();
      }
    });
  
    // Handle Discover Servers
    socket.on('discover servers', (servers) => {
      discoverServersList.innerHTML = ''; // Clear previous list
      servers.forEach(serverName => {
        const serverItem = document.createElement('li');
        
        // Show if already joined
        const isJoined = joinedServers.includes(serverName);
        
        serverItem.innerHTML = isJoined ? 
          `${serverName} <span class="joined-label">(Joined)</span>` : 
          serverName;
        
        serverItem.addEventListener('click', () => {
          if (isJoined) {
            // If already joined, just switch to the server
            switchToServer(serverName);
          } else {
            // Otherwise, join the server
            socket.emit('join server', { serverName });
          }
          serverModal.classList.add('hidden');
        });
        
        discoverServersList.appendChild(serverItem);
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