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
    const fileInput = document.getElementById('file-input');
    const attachmentPreview = document.getElementById('attachment-preview');
    const notificationBanner = document.getElementById('notification-banner');
    const allowNotificationsBtn = document.getElementById('allow-notifications');
    const denyNotificationsBtn = document.getElementById('deny-notifications');
  
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
    let selectedFile = null;
    let notificationPermission = 'default';
    
    // Maximum number of rendered messages
    const MAX_RENDERED_MESSAGES = 100;
    
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
  
    // Notifications initialization
    function initNotifications() {
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return;
      }
  
      // Check if we already have permission
      if (Notification.permission === 'granted') {
        notificationPermission = 'granted';
        return;
      } 
      
      // Show notification banner if permission hasn't been denied
      if (Notification.permission !== 'denied') {
        setTimeout(() => {
          notificationBanner.classList.remove('hidden');
        }, 3000); // Show after 3 seconds to let the user get familiar with the app first
      }
    }
  
    // Set up notification permission handlers
    allowNotificationsBtn.addEventListener('click', () => {
      Notification.requestPermission().then((permission) => {
        notificationPermission = permission;
        notificationBanner.classList.add('hidden');
      });
    });
  
    denyNotificationsBtn.addEventListener('click', () => {
      notificationBanner.classList.add('hidden');
    });
  
    // Show notification
    function showNotification(title, body, icon) {
      if (notificationPermission !== 'granted' || document.hasFocus()) {
        return; // Don't show notification if we don't have permission or the app is in focus
      }
      
      const notification = new Notification(title, {
        body: body,
        icon: icon || '/favicon.ico'
      });
      
      notification.onclick = function() {
        window.focus();
        this.close();
      };
    }
  
    // File handling
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        selectedFile = e.target.files[0];
        
        // Check file size (max 5MB)
        if (selectedFile.size > 5 * 1024 * 1024) {
          alert('File size exceeds 5MB limit');
          selectedFile = null;
          fileInput.value = '';
          return;
        }
        
        // Show file preview
        showFilePreview(selectedFile);
      }
    });
  
    function showFilePreview(file) {
      const reader = new FileReader();
      
      attachmentPreview.innerHTML = '';
      attachmentPreview.classList.remove('hidden');
      
      const previewContainer = document.createElement('div');
      previewContainer.className = 'attachment-preview';
      
      const isImage = file.type.startsWith('image/');
      
      if (isImage) {
        reader.onload = function(e) {
          const img = document.createElement('img');
          img.src = e.target.result;
          previewContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
      } else {
        const fileIcon = document.createElement('div');
        fileIcon.innerHTML = '📄';
        fileIcon.className = 'file-icon';
        previewContainer.appendChild(fileIcon);
      }
      
      const infoDiv = document.createElement('div');
      infoDiv.className = 'attachment-info';
      
      const fileName = document.createElement('div');
      fileName.className = 'attachment-name';
      fileName.textContent = file.name;
      
      const fileSize = document.createElement('div');
      fileSize.className = 'attachment-size';
      fileSize.textContent = formatFileSize(file.size);
      
      infoDiv.appendChild(fileName);
      infoDiv.appendChild(fileSize);
      previewContainer.appendChild(infoDiv);
      
      const removeButton = document.createElement('button');
      removeButton.className = 'attachment-remove';
      removeButton.innerHTML = '×';
      removeButton.addEventListener('click', () => {
        selectedFile = null;
        fileInput.value = '';
        attachmentPreview.classList.add('hidden');
      });
      
      previewContainer.appendChild(removeButton);
      attachmentPreview.appendChild(previewContainer);
      
      // Add a progress bar for upload
      const progressBar = document.createElement('div');
      progressBar.className = 'file-upload-progress';
      attachmentPreview.appendChild(progressBar);
    }
  
    function formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' bytes';
      else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      else return (bytes / 1048576).toFixed(1) + ' MB';
    }
  
    // Create HTML for attachment display
    function createAttachmentHTML(attachment) {
      const { filename, filesize, fileType, fileUrl } = attachment;
      
      let attachmentHTML = `<div class="attachment-container">`;
      
      if (fileType.startsWith('image/')) {
        attachmentHTML += `
          <img src="${fileUrl}" alt="${filename}" class="image-attachment" onclick="window.open('${fileUrl}', '_blank')">
        `;
      } else {
        attachmentHTML += `
          <div class="file-attachment">
            <div class="file-icon">📄</div>
            <div class="file-details">
              <div class="file-name">${filename}</div>
              <div class="file-size">${formatFileSize(filesize)}</div>
            </div>
            <a href="${fileUrl}" target="_blank" class="download-button">Download</a>
          </div>
        `;
      }
      
      attachmentHTML += `</div>`;
      
      return attachmentHTML;
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
      
      // Initialize notifications
      initNotifications();
      
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
      selectedFile = null;
      attachmentPreview.classList.add('hidden');
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
      
      if (!message && !selectedFile) return;
      
      if (chatMode === 'server' && activeServer) {
        if (selectedFile) {
          uploadAndSendFile(activeServer, null, message);
        } else {
          socket.emit('server message', { serverName: activeServer, message });
        }
      } else if (chatMode === 'dm' && activeDm) {
        if (selectedFile) {
          uploadAndSendFile(null, activeDm, message);
        } else {
          socket.emit('dm message', { to: activeDm, message });
        }
      }
      
      input.value = '';
    }
  
    function uploadAndSendFile(serverName, dmUser, textMessage) {
      const progressBar = document.querySelector('.file-upload-progress');
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      if (textMessage) {
        formData.append('message', textMessage);
      }
      
      if (serverName) {
        formData.append('serverName', serverName);
      } else if (dmUser) {
        formData.append('to', dmUser);
      }
      
      // Add socket ID and username to headers
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);
      xhr.setRequestHeader('X-Socket-ID', socket.id);
      xhr.setRequestHeader('X-Username', username);
      
      xhr.upload.onprogress = function(e) {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          progressBar.style.width = percentComplete + '%';
        }
      };
      
      xhr.onload = function() {
        if (xhr.status === 200) {
          // Success - clear the selected file
          selectedFile = null;
          fileInput.value = '';
          attachmentPreview.classList.add('hidden');
        } else {
          alert('Error uploading file. Please try again.');
        }
      };
      
      xhr.send(formData);
    }
  
    // Send message on Enter key
    input.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        sendMessage();
      }
    });
  
    // Send message on button click
    sendButton.addEventListener('click', sendMessage);
  
    // Safe scrolling that won't break the UI
    function safeScrollToBottom() {
      // Use requestAnimationFrame to ensure DOM is updated before scrolling
      requestAnimationFrame(() => {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      });
    }
  
    // Function to render a batch of messages efficiently
    function renderMessages(messages) {
      // Create a document fragment to batch DOM operations
      const fragment = document.createDocumentFragment();
      
      messages.forEach(({ username: msgUsername, message, timestamp, attachment }) => {
        const messageElement = document.createElement('div');
        const formattedTime = formatTimestamp(timestamp);
        
        let messageHTML = `
          <strong>${msgUsername}:</strong> ${message}
          <div class="message-timestamp">${formattedTime}</div>
        `;
        
        // Add attachment if present
        if (attachment) {
          messageHTML += createAttachmentHTML(attachment);
        }
        
        messageElement.innerHTML = messageHTML;
        
        if (msgUsername === username) {
          messageElement.classList.add('own-message');
        }
        
        fragment.appendChild(messageElement);
      });
      
      // Append all messages at once
      messagesDiv.appendChild(fragment);
    }
  
    // Function to render DM messages efficiently
    function renderDmMessages(messages) {
      const fragment = document.createDocumentFragment();
      
      messages.forEach(({ from, to, message, timestamp, attachment }) => {
        const messageElement = document.createElement('div');
        const formattedTime = formatTimestamp(timestamp);
        
        let messageHTML = `
          <strong>${from}:</strong> ${message}
          <div class="message-timestamp">${formattedTime}</div>
        `;
        
        // Add attachment if present
        if (attachment) {
          messageHTML += createAttachmentHTML(attachment);
        }
        
        messageElement.innerHTML = messageHTML;
        
        if (from === username) {
          messageElement.classList.add('own-message');
        }
        
        fragment.appendChild(messageElement);
      });
      
      messagesDiv.appendChild(fragment);
    }
  
    // Receive server messages
    socket.on('server message', ({ username: msgUsername, message, timestamp, serverName, attachment }) => {
      // If this server is currently active, display the message
      if (chatMode === 'server' && activeServer === serverName) {
        const messageElement = document.createElement('div');
        const formattedTime = formatTimestamp(timestamp);
        
        let messageHTML = `
          <strong>${msgUsername}:</strong> ${message}
          <div class="message-timestamp">${formattedTime}</div>
        `;
        
        // Add attachment if present
        if (attachment) {
          messageHTML += createAttachmentHTML(attachment);
        }
        
        messageElement.innerHTML = messageHTML;
        
        if (msgUsername === username) {
          messageElement.classList.add('own-message');
        }
        
        messagesDiv.appendChild(messageElement);
        
        // Check if we need to clean up old messages
        if (messagesDiv.children.length > MAX_RENDERED_MESSAGES + 20) {
          // Remove older messages if we've exceeded our limit by a buffer amount
          while (messagesDiv.children.length > MAX_RENDERED_MESSAGES) {
            if (messagesDiv.firstChild.className !== 'message-truncation-notice') {
              messagesDiv.removeChild(messagesDiv.firstChild);
            } else {
              // If the first child is the truncation notice, remove the next child
              if (messagesDiv.children.length > 1) {
                messagesDiv.removeChild(messagesDiv.children[1]);
              } else {
                break;
              }
            }
          }
          
          // Update truncation notice
          let truncationNotice = messagesDiv.querySelector('.message-truncation-notice');
          if (!truncationNotice) {
            truncationNotice = document.createElement('div');
            truncationNotice.className = 'message-truncation-notice';
            messagesDiv.insertBefore(truncationNotice, messagesDiv.firstChild);
          }
          truncationNotice.textContent = 'Older messages are not displayed.';
        }
        
        safeScrollToBottom();
      } 
      // Otherwise mark as unread if it's not our own message
      else if (msgUsername !== username && joinedServers.includes(serverName)) {
        unreadServers[serverName] = true;
        updateServerListUI();
        
        // Show notification
        showNotification(
          `New message in ${serverName}`,
          `${msgUsername}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`
        );
      }
    });
  
    // Receive DM
    socket.on('dm message', ({ from, to, message, timestamp, attachment }) => {
      // If this DM is currently active, display it
      if (chatMode === 'dm' && ((from === activeDm) || (to === activeDm))) {
        const messageElement = document.createElement('div');
        const formattedTime = formatTimestamp(timestamp);
        
        let messageHTML = `
          <strong>${from}:</strong> ${message}
          <div class="message-timestamp">${formattedTime}</div>
        `;
        
        // Add attachment if present
        if (attachment) {
          messageHTML += createAttachmentHTML(attachment);
        }
        
        messageElement.innerHTML = messageHTML;
        
        if (from === username) {
          messageElement.classList.add('own-message');
        }
        
        messagesDiv.appendChild(messageElement);
        
        // Check if we need to clean up old messages
        if (messagesDiv.children.length > MAX_RENDERED_MESSAGES + 20) {
          // Remove older messages if we've exceeded our limit by a buffer amount
          while (messagesDiv.children.length > MAX_RENDERED_MESSAGES) {
            if (messagesDiv.firstChild.className !== 'message-truncation-notice') {
              messagesDiv.removeChild(messagesDiv.firstChild);
            } else {
              // If the first child is the truncation notice, remove the next child
              if (messagesDiv.children.length > 1) {
                messagesDiv.removeChild(messagesDiv.children[1]);
              } else {
                break;
              }
            }
          }
          
          // Update truncation notice
          let truncationNotice = messagesDiv.querySelector('.message-truncation-notice');
          if (!truncationNotice) {
            truncationNotice = document.createElement('div');
            truncationNotice.className = 'message-truncation-notice';
            messagesDiv.insertBefore(truncationNotice, messagesDiv.firstChild);
          }
          truncationNotice.textContent = 'Older messages are not displayed.';
        }
        
        safeScrollToBottom();
      } 
      // Otherwise mark as unread if it's not our own message
      else if (from !== username) {
        unreadDms[from] = true;
        socket.emit('get dms'); // Refresh DM list to show unread badge
        
        // Show notification
        showNotification(
          `Message from ${from}`,
          `${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`
        );
      }
    });
  
    // Handle previous server messages
    socket.on('server messages', (messages) => {
      if (chatMode === 'server') {
        // Clear current messages
        messagesDiv.innerHTML = '';
        
        // Limit number of rendered messages if there are too many
        const messagesToRender = messages.length > MAX_RENDERED_MESSAGES 
          ? messages.slice(messages.length - MAX_RENDERED_MESSAGES) 
          : messages;
        
        // Add a notice if messages were truncated
        if (messages.length > MAX_RENDERED_MESSAGES) {
          const truncationNotice = document.createElement('div');
          truncationNotice.className = 'message-truncation-notice';
          truncationNotice.textContent = `Showing the ${MAX_RENDERED_MESSAGES} most recent messages. ${messages.length - MAX_RENDERED_MESSAGES} older messages are not displayed.`;
          messagesDiv.appendChild(truncationNotice);
        }
        
        // Render batch of messages
        renderMessages(messagesToRender);
        
        // Scroll to bottom
        safeScrollToBottom();
      }
    });
  
    // Handle DM message history
    socket.on('dm messages', ({ otherUser, messages }) => {
      messagesDiv.innerHTML = '';
      
      // Limit number of rendered messages if there are too many
      const messagesToRender = messages.length > MAX_RENDERED_MESSAGES 
        ? messages.slice(messages.length - MAX_RENDERED_MESSAGES) 
        : messages;
      
      // Add truncation notice if needed
      if (messages.length > MAX_RENDERED_MESSAGES) {
        const truncationNotice = document.createElement('div');
        truncationNotice.className = 'message-truncation-notice';
        truncationNotice.textContent = `Showing the ${MAX_RENDERED_MESSAGES} most recent messages. ${messages.length - MAX_RENDERED_MESSAGES} older messages are not displayed.`;
        messagesDiv.appendChild(truncationNotice);
      }
      
      // Render batch of messages
      renderDmMessages(messagesToRender);
      
      // Scroll to bottom
      safeScrollToBottom();
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