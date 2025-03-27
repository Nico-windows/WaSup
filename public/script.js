// Wait for socket.io to load
document.addEventListener('DOMContentLoaded', () => {
  // Set dark mode as default immediately
  document.documentElement.classList.add('dark');
  
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
  
  // Settings Elements
  const settingsButton = document.getElementById('settings-button');
  let settingsModal;
  
  
  // Create settings modal if it doesn't exist
  if (!document.getElementById('settings-modal')) {
    settingsModal = document.createElement('div');
    settingsModal.id = 'settings-modal';
    settingsModal.className = 'hidden';
    settingsModal.innerHTML = `
      <div class="modal-content settings-modal-content">
        <h2>Settings</h2>
        <div class="settings-section">
          <h3>Theme</h3>
          <div class="theme-buttons">
            <button id="light-theme-button" class="theme-button">Light Mode</button>
            <button id="dark-theme-button" class="theme-button active">Dark Mode</button>
          </div>
        </div>
        <div class="settings-section">
          <h3>User Experience</h3>
          <div class="toggle-container">
            <label class="switch">
              <input type="checkbox" id="username-filter-setting" checked>
              <span class="slider round"></span>
            </label>
            <span class="toggle-label">Filter Inappropriate Content</span>
          </div>
          <div class="input-group">
            <label for="filter-words">Words to Filter (comma separated)</label>
            <input type="text" id="filter-words" placeholder="e.g. bad, words, here">
          </div>
        </div>
        <div class="settings-section">
          <h3>Notifications</h3>
          <div class="toggle-container">
            <label class="switch">
              <input type="checkbox" id="notifications-setting" checked>
              <span class="slider round"></span>
            </label>
            <span class="toggle-label">Enable Notifications</span>
          </div>
          <div class="toggle-container">
            <label class="switch">
              <input type="checkbox" id="notification-sound-setting" checked>
              <span class="slider round"></span>
            </label>
            <span class="toggle-label">Notification Sounds</span>
          </div>
        </div>
        <div class="settings-buttons">
          <button id="settings-save-button" class="primary-button">Save</button>
          <button id="settings-cancel-button" class="secondary-button">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(settingsModal);
    
    // Add CSS for settings modal
    const style = document.createElement('style');
    style.textContent = `
      .settings-modal-content {
        width: 450px;
        max-width: 90vw;
        max-height: 80vh;
        overflow-y: auto;
      }
      
      .settings-section {
        margin-bottom: 20px;
        text-align: left;
      }
      
      .settings-section h3 {
        margin-top: 0;
        color: var(--primary-color);
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 5px;
        margin-bottom: 10px;
      }
      
      .theme-buttons {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
      }
      
      .theme-button {
        flex: 1;
        padding: 8px 0;
        background-color: var(--msg-bg);
        border: 2px solid var(--border-color);
        color: var(--text-color);
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .theme-button.active {
        background-color: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }
      
      .toggle-container {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
      }
      
      .toggle-label {
        margin-left: 10px;
      }
      
      .switch {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 24px;
      }
      
      .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      
      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
      }
      
      .slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .4s;
      }
      
      input:checked + .slider {
        background-color: var(--primary-color);
      }
      
      input:focus + .slider {
        box-shadow: 0 0 1px var(--primary-color);
      }
      
      input:checked + .slider:before {
        transform: translateX(26px);
      }
      
      .slider.round {
        border-radius: 24px;
      }
      
      .slider.round:before {
        border-radius: 50%;
      }
      
      .settings-buttons {
        display: flex;
        gap: 10px;
        margin-top: 20px;
        justify-content: center;
      }
      
      .modal-close-button {
        position: absolute;
        right: 15px;
        top: 15px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--secondary-text);
      }
      
      .modal-close-button:hover {
        color: var(--text-color);
      }
      
      .toast-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
      }
      
      .toast {
        margin-top: 10px;
        padding: 12px 20px;
        border-radius: 5px;
        color: white;
        opacity: 1;
        transition: opacity 0.3s;
      }
      
      .toast.info {
        background-color: var(--primary-color);
      }
      
      .toast.success {
        background-color: var(--success-color);
      }
      
      .toast.error {
        background-color: var(--error-color);
      }

      /* Light theme color overrides */
      html:not(.dark) body {
        background-color: #ffffff;
        color: #333333;
      }
      
      html:not(.dark) #sidebar {
        background-color: #f0f0f0;
        border-right-color: #d4d4d4;
      }
      
      html:not(.dark) #main {
        background-color: #f5f5f5;
      }
      
      html:not(.dark) #chat-header {
        background-color: #e0e0e0;
        border-bottom-color: #d4d4d4;
      }
      
      html:not(.dark) #people-list {
        background-color: #e0e0e0;
        border-left-color: #d4d4d4;
      }
      
      html:not(.dark) #input-area {
        background-color: #e0e0e0;
        border-top-color: #d4d4d4;
      }
      
      html:not(.dark) #message-input {
        background-color: #ffffff;
        color: #333333;
      }
      
      html:not(.dark) #server-list li, 
      html:not(.dark) #dm-list li, 
      html:not(.dark) #user-list li,
      html:not(.dark) #discover-servers-list li, 
      html:not(.dark) #dm-users-list li {
        background-color: #e9e9e9;
      }
      
      html:not(.dark) #server-list li:hover, 
      html:not(.dark) #dm-list li:hover {
        background-color: #d9d9d9;
        color: #333333;
      }
      
      html:not(.dark) .modal-content {
        background-color: #ffffff;
        color: #333333;
      }
      
      html:not(.dark) .modal-content input {
        background-color: #f5f5f5;
        color: #333333;
        border: 1px solid #d4d4d4;
      }
    `;
    document.head.appendChild(style);
  } else {
    settingsModal = document.getElementById('settings-modal');
  }
  
  const settingsCloseButton = document.getElementById('settings-close-button');
  const settingsSaveButton = document.getElementById('settings-save-button');
  const settingsCancelButton = document.getElementById('settings-cancel-button');
  
  // Toast container for notifications
  const toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);

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
  
  // Settings
  const defaultSettings = {
    theme: 'dark', // Set dark as default theme
    usernameFilter: true,
    filterWords: ['hitler', 'nazi', 'diddy tec', 'racial slurs', 'offensive terms'],
    enableNotifications: true,
    notificationSound: true,
    messageStyle: 'default',
    fontSize: 'medium'
  };
  
  let userSettings = { ...defaultSettings };
  
  // Load settings from localStorage
  function loadSettings() {
    try {
      const savedSettings = localStorage.getItem('wasup-settings');
      if (savedSettings) {
        userSettings = { ...defaultSettings, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    
    // Apply theme
    applyTheme();
  }
  
  // Save settings to localStorage
  function saveSettings() {
    try {
      localStorage.setItem('wasup-settings', JSON.stringify(userSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }
  
  // Apply theme based on settings
  function applyTheme() {
    if (userSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    updateThemeButtons(userSettings.theme);
  }
  
  // Update theme buttons to show active state
  function updateThemeButtons(theme) {
    const lightButton = document.getElementById('light-theme-button');
    const darkButton = document.getElementById('dark-theme-button');
    
    if (lightButton && darkButton) {
      if (theme === 'light') {
        lightButton.classList.add('active');
        darkButton.classList.remove('active');
      } else {
        darkButton.classList.add('active');
        lightButton.classList.remove('active');
      }
    }
  }
  
  // Filter username to censor inappropriate terms
  function filterUsername(name) {
    if (!userSettings.usernameFilter) return name;
    
    let filteredName = name;
    const wordList = Array.isArray(userSettings.filterWords) 
      ? userSettings.filterWords 
      : defaultSettings.filterWords;
    
    wordList.forEach(word => {
      // Case insensitive check
      const regex = new RegExp(word, 'gi');
      if (regex.test(filteredName)) {
        // Replace with asterisks
        filteredName = filteredName.replace(regex, match => '*'.repeat(match.length));
      }
    });
    
    return filteredName;
  }
  
  // Show toast notification
  function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toastContainer.removeChild(toast);
      }, 300);
    }, duration);
  }
  
<<<<<<< HEAD
  // Show native notification
  function showNotification(title, body) {
    if (!userSettings.enableNotifications || Notification.permission !== 'granted') {
      return;
    }
    
    try {
      const notification = new Notification(title, {
        body: body,
        icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4ac.png'
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      if (userSettings.notificationSound) {
        messageSound.play().catch(e => console.error('Error playing sound:', e));
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
  
  // Format timestamp
  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Hours and minutes formatting
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;
    
    // Check if date is today
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${formattedTime}`;
    }
    
    // Check if date is yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${formattedTime}`;
    }
    
    // Check if date is this year
    if (date.getFullYear() === now.getFullYear()) {
      const month = date.toLocaleString('default', { month: 'short' });
      const day = date.getDate();
      return `${month} ${day} at ${formattedTime}`;
    }
    
    // Full date for older messages
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year} at ${formattedTime}`;
  }
  
  // Format file size
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  }
  
  // Toggle modal display
  function toggleModal(modal, show = true) {
    if (show) {
      modal.classList.remove('hidden');
      setTimeout(() => modal.classList.add('active'), 10);
      
      // Add event listener to close modal when clicking outside
      const overlay = modal.querySelector('.modal-overlay');
      if (overlay) {
        overlay.addEventListener('click', () => toggleModal(modal, false), { once: true });
      }
    } else {
      modal.classList.remove('active');
      setTimeout(() => modal.classList.add('hidden'), 300);
    }
  }
  
  // Safe scrolling that won't break the UI
  function safeScrollToBottom(smooth = true) {
    // Use requestAnimationFrame to ensure DOM is updated before scrolling
    requestAnimationFrame(() => {
      if (smooth) {
        messagesDiv.scrollTo({
          top: messagesDiv.scrollHeight,
          behavior: 'smooth'
        });
      } else {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }
    });
  }
  
  // Check if user is near bottom of chat
  function isNearBottom() {
    const tolerance = 100; // pixels
    return messagesDiv.scrollHeight - messagesDiv.scrollTop - messagesDiv.clientHeight < tolerance;
  }
  
  // Show context menu
  function showContextMenu(event, items = []) {
    event.preventDefault();
    
    // Clear previous items
    contextMenu.querySelector('.context-menu-items').innerHTML = '';
    
    // Add new items
    items.forEach(item => {
      if (item.divider) {
        const divider = document.createElement('div');
        divider.className = 'context-menu-divider';
        contextMenu.querySelector('.context-menu-items').appendChild(divider);
      } else {
        const menuItem = document.createElement('li');
        menuItem.className = `context-menu-item${item.danger ? ' danger' : ''}`;
        menuItem.innerHTML = `
          ${item.icon ? `<i class="fas fa-${item.icon}"></i>` : ''}
          <span>${item.text}</span>
        `;
        menuItem.addEventListener('click', () => {
          hideContextMenu();
          if (item.action) item.action();
        });
        contextMenu.querySelector('.context-menu-items').appendChild(menuItem);
      }
    });
    
    // Position the menu
    contextMenu.style.top = `${event.clientY}px`;
    contextMenu.style.left = `${event.clientX}px`;
    
    // Show the menu
    contextMenu.classList.remove('hidden');
    
    // Make sure the menu doesn't go off-screen
    const rect = contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      contextMenu.style.left = `${window.innerWidth - rect.width - 5}px`;
    }
    if (rect.bottom > window.innerHeight) {
      contextMenu.style.top = `${window.innerHeight - rect.height - 5}px`;
    }
    
    // Add event listener to hide the menu when clicking outside
    document.addEventListener('click', hideContextMenu, { once: true });
    document.addEventListener('contextmenu', hideContextMenu, { once: true });
  }
  
  // Hide context menu
  function hideContextMenu() {
    contextMenu.classList.add('hidden');
  }
  
  // =====================
  // Form & Auth Functions
  // =====================
  
  // Reset auth forms
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
    
    // Show notification permission request
    if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        notificationPermission = permission;
        if (permission === 'granted') {
          showToast('Notifications Enabled', 'You will now receive notifications for new messages.', 'success');
        }
      });
    }
  }
  
  // =====================
  // Chat Functions
  // =====================
  
  // File handling
  function handleFileSelection(e) {
    if (e.target.files.length > 0) {
      selectedFile = e.target.files[0];
      
      // Check file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        showToast('Error', 'File size exceeds 5MB limit', 'error');
        selectedFile = null;
        fileInput.value = '';
        return;
      }
      
      // Show file preview
      showFilePreview(selectedFile);
    }
  }
  
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
      fileIcon.innerHTML = '<i class="fas fa-file"></i>';
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
    removeButton.innerHTML = '<i class="fas fa-times"></i>';
    removeButton.addEventListener('click', () => {
      selectedFile = null;
      fileInput.value = '';
      attachmentPreview.classList.add('hidden');
    });
    
    previewContainer.appendChild(removeButton);
    attachmentPreview.appendChild(previewContainer);
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
          <div class="file-icon"><i class="fas fa-file"></i></div>
          <div class="file-details">
            <div class="file-name">${filename}</div>
            <div class="file-size">${formatFileSize(filesize)}</div>
          </div>
          <a href="${fileUrl}" target="_blank" class="download-button">
            <i class="fas fa-download"></i>
          </a>
        </div>
      `;
    }
    
    attachmentHTML += `</div>`;
    
    return attachmentHTML;
  }
  
  // Update server list UI with joined servers and unread status
  function updateServerListUI() {
    serverList.innerHTML = '';
    
    joinedServers.forEach(serverName => {
      const serverItem = document.createElement('li');
      
      // Add an icon and the server name
      serverItem.innerHTML = `
        <i class="fas fa-hashtag"></i>
        <span>${serverName}</span>
      `;
      
      // Add unread indicator if server has unread messages
      if (unreadServers[serverName]) {
        const badge = document.createElement('span');
        badge.className = 'unread-badge';
        serverItem.appendChild(badge);
      }
      
      // Highlight active server
      if (activeServer === serverName && chatMode === 'server') {
        serverItem.classList.add('active');
      }
      
      // Add context menu for server item
      serverItem.addEventListener('contextmenu', (e) => {
        showContextMenu(e, [
          { text: 'Mark as Read', icon: 'check', action: () => markServerAsRead(serverName) },
          { divider: true },
          { text: 'Leave Server', icon: 'sign-out-alt', danger: true, action: () => leaveServer(serverName) }
        ]);
      });
      
      // Add click handler to switch to this server
      serverItem.addEventListener('click', () => {
        switchToServer(serverName);
        if (isMobile) {
          sidebar.classList.remove('active');
        }
      });
      
      serverList.appendChild(serverItem);
    });
  }
  
  // Create or update DM list
  function updateDmList(dms) {
    dmList.innerHTML = '';
    
    dms.forEach(({ user, hasUnread }) => {
      const dmItem = document.createElement('li');
      const displayName = filterUsername(user);
      
      // Add an icon and the user name
      dmItem.innerHTML = `
        <i class="fas fa-user"></i>
        <span>${displayName}</span>
      `;
      
      // Add unread indicator
      if (hasUnread) {
        const badge = document.createElement('span');
        badge.className = 'unread-badge';
        dmItem.appendChild(badge);
      }
      
      // Highlight active DM
      if (activeDm === user && chatMode === 'dm') {
        dmItem.classList.add('active');
      }
      
      // Add context menu for DM item
      dmItem.addEventListener('contextmenu', (e) => {
        showContextMenu(e, [
          { text: 'Mark as Read', icon: 'check', action: () => markDmAsRead(user) }
        ]);
      });
      
      // Add click handler
      dmItem.addEventListener('click', () => {
        socket.emit('get dm messages', { otherUser: user });
        switchToDmMode(user);
        if (isMobile) {
          sidebar.classList.remove('active');
        }
      });
      
      dmList.appendChild(dmItem);
    });
  }
  
  // Mark server as read
  function markServerAsRead(serverName) {
    if (unreadServers[serverName]) {
      socket.emit('mark server read', { serverName });
      delete unreadServers[serverName];
      updateServerListUI();
    }
  }
  
  // Mark DM as read
  function markDmAsRead(otherUser) {
    socket.emit('mark dm read', { otherUser });
  }
  
  // Leave server
  function leaveServer(serverName) {
    // Confirm before leaving
    if (confirm(`Are you sure you want to leave the server "${serverName}"?`)) {
      socket.emit('leave server', { serverName });
      
      // Remove from UI immediately
      const index = joinedServers.indexOf(serverName);
      if (index > -1) {
        joinedServers.splice(index, 1);
        updateServerListUI();
      }
      
      // If the active server is the one being left, switch to another one
      if (activeServer === serverName) {
        if (joinedServers.length > 0) {
          switchToServer(joinedServers[0]);
        } else {
          // No servers left, show welcome screen
          activeServer = null;
          chatMode = 'server';
          currentServer.textContent = 'Welcome';
          serverMembersCount.textContent = '';
          messagesDiv.innerHTML = `
            <div class="welcome-message">
              <div class="welcome-icon"><i class="fas fa-comments"></i></div>
              <h2>Welcome to WaSup!</h2>
              <p>Join a server or start a direct message to begin chatting.</p>
            </div>
          `;
          userList.innerHTML = '';
        }
      }
      
      showToast('Server Left', `You have left "${serverName}"`, 'info');
    }
  }
  
  // Switch to a server
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
    
    // Update mobile title
    mobileTitle.textContent = serverName;
  }
  
  // Switch to server mode
  function switchToServerMode(serverName) {
    chatMode = 'server';
    activeServer = serverName;
    activeDm = null;
    
    // Save last activity
    socket.emit('update last activity', { server: serverName, dm: null });
    
    // Update UI elements
    currentServer.textContent = serverName;
    messagesDiv.innerHTML = '';
    peopleList.classList.remove('hidden');
    
    // Show typing indicator container but hide the indicator itself
    typingIndicator.classList.add('hidden');
    
    // Update active classes
    updateServerListUI();
    updateDmList([]); // Reset DM active states
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
    const displayName = filterUsername(otherUser);
    currentServer.textContent = displayName;
    serverMembersCount.textContent = 'Direct Message';
    messagesDiv.innerHTML = '';
    peopleList.classList.add('hidden');
    
    // Show typing indicator container but hide the indicator itself
    typingIndicator.classList.add('hidden');
    
    // Update mobile title
    mobileTitle.textContent = displayName;
    
    // Update active classes
    updateServerListUI(); // Reset server active state
    socket.emit('get dms'); // Update DM list to reflect current active state
  }
  
  // Update People list for servers
  function updatePeopleList() {
    userList.innerHTML = '';
    serverMembersCount.textContent = `${usersInServer.length} Members`;
    
    const onlineUsers = usersInServer.length; // In a real app, you'd track who's online
    document.getElementById('online-count').textContent = `${onlineUsers} online`;
    
    usersInServer.forEach(user => {
      const displayName = filterUsername(user);
      const isCurrentUser = user === username;
      
      const userItem = document.createElement('li');
      
      // Create user item with appropriate styling
      userItem.innerHTML = `
        <div class="user-item-info">
          <i class="fas fa-user"></i>
          <span>${displayName}${isCurrentUser ? ' (you)' : ''}</span>
        </div>
      `;
      
      // Add "DM" action button for other users
      if (!isCurrentUser) {
        const actionButton = document.createElement('span');
        actionButton.className = 'dm-user-action';
        actionButton.innerHTML = '<i class="fas fa-comment"></i> DM';
        actionButton.setAttribute('data-username', user);
        
        actionButton.addEventListener('click', (e) => {
          e.stopPropagation();
          const otherUser = e.target.getAttribute('data-username') || 
                          e.target.parentElement.getAttribute('data-username');
          socket.emit('get dm messages', { otherUser });
          switchToDmMode(otherUser);
          if (isMobile) {
            peopleList.classList.remove('active');
          }
        });
        
        userItem.appendChild(actionButton);
      }
      
      // Add context menu for user item
      userItem.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        
        const menuItems = [];
        
        if (!isCurrentUser) {
          menuItems.push({ 
            text: 'Message', 
            icon: 'comment', 
            action: () => {
              socket.emit('get dm messages', { otherUser: user });
              switchToDmMode(user);
            }
          });
        }
        
        if (menuItems.length > 0) {
          showContextMenu(e, menuItems);
        }
      });
      
      userList.appendChild(userItem);
    });
  }
  
  // Filter DM users
  function filterDmUsers() {
    const searchTerm = dmSearchInput.value.toLowerCase();
    const filteredUsers = allUsers.filter(user => 
      user.toLowerCase().includes(searchTerm) && user !== username
    );
    displayDmUsers(filteredUsers);
  }
  
  // Display DM users in the modal
  function displayDmUsers(users) {
    dmUsersList.innerHTML = '';
    
    if (users.length === 0) {
      dmUsersList.innerHTML = `
        <li class="empty-list">
          <i class="fas fa-search"></i>
          <p>No users found</p>
        </li>
      `;
      return;
    }
    
    users.forEach(user => {
      if (user !== username) { // Don't show yourself in the DM list
        const userItem = document.createElement('li');
        const displayName = filterUsername(user);
        
        userItem.innerHTML = `
          <i class="fas fa-user"></i>
          <span>${displayName}</span>
        `;
        
        userItem.addEventListener('click', () => {
          socket.emit('get dm messages', { otherUser: user });
          switchToDmMode(user);
          toggleModal(dmModal, false);
        });
        
        dmUsersList.appendChild(userItem);
      }
    });
  }
  
  // Filter servers in discover tab
  function filterDiscoverServers() {
    const searchTerm = discoverSearchInput.value.toLowerCase();
    socket.emit('get discover servers');
  }
  
  // Send Message (both server and DM)
  // Replace the current sendMessage function with this one
  function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message && !selectedFile) return;
    
    // Clear the typing indicator
    clearTimeout(typingTimeout);
    isTyping = false;
    socket.emit('stop typing', { room: activeServer || activeDm });
    
    // Create a temporary message entry immediately
    if (message) {
      const tempTimestamp = Date.now();
      
      // Create a temporary message object
      const tempMessage = chatMode === 'server' ? 
        { username, message, timestamp: tempTimestamp, serverName: activeServer } :
        { from: username, to: activeDm, message, timestamp: tempTimestamp };
      
      // Add message to UI immediately
      if (chatMode === 'server' && activeServer) {
        // Add temporary server message to UI
        const wasNearBottom = isNearBottom();
        addMessageToUI(tempMessage, true);
        if (wasNearBottom) safeScrollToBottom();
        
        // Then send to server
        socket.emit('server message', { serverName: activeServer, message });
      } else if (chatMode === 'dm' && activeDm) {
        // Add temporary DM message to UI
        const wasNearBottom = isNearBottom();
        addDmToUI(tempMessage, true);
        if (wasNearBottom) safeScrollToBottom();
        
        // Then send to server
        socket.emit('dm message', { to: activeDm, message });
      }
    }
    
    // Handle file uploads
    if (selectedFile) {
      uploadAndSendFile(
        chatMode === 'server' ? activeServer : null, 
        chatMode === 'dm' ? activeDm : null, 
        message
      );
    }
    
    messageInput.value = '';
    messageInput.focus();
  }

  // Add these helper functions to render messages immediately
  function addMessageToUI(message, isTemp = false) {
    const { username: msgUsername, message: messageText, timestamp, serverName, attachment } = message;
    
    // Create the message element
    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';
    if (isTemp) messageContainer.classList.add('temp-message');
    messageContainer.setAttribute('data-username', msgUsername);
    messageContainer.setAttribute('data-timestamp', timestamp);
    
    if (msgUsername === username) {
      messageContainer.classList.add('own-message');
    }
    
    // Check if we should group with previous messages
    const lastMsg = messagesDiv.querySelector('.message-container:last-child');
    const shouldGroup = lastMsg && 
                      lastMsg.getAttribute('data-username') === msgUsername &&
                      Math.abs(parseInt(lastMsg.getAttribute('data-timestamp')) - timestamp) < 5 * 60 * 1000; // 5 minutes
    
    // Message bubble
    const messageBubble = document.createElement('div');
    messageBubble.className = 'message-bubble';
    
    // Add header or timestamp
    if (!shouldGroup) {
      const messageHeader = document.createElement('div');
      messageHeader.className = 'message-header';
      
      const formattedTime = formatTimestamp(timestamp);
      const displayName = filterUsername(msgUsername);
      
      messageHeader.innerHTML = `
        <span class="message-username">${displayName}</span>
        <span class="message-timestamp">${formattedTime}</span>
      `;
      
      messageBubble.appendChild(messageHeader);
    } else {
      const inlineTime = document.createElement('span');
      inlineTime.className = 'inline-timestamp';
      inlineTime.textContent = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      messageBubble.appendChild(inlineTime);
    }
    
    // Message content
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = messageText;
    messageBubble.appendChild(messageContent);
    
    // Add attachment if present
    if (attachment) {
      const attachmentHTML = createAttachmentHTML(attachment);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = attachmentHTML;
      while (tempDiv.firstChild) {
        messageBubble.appendChild(tempDiv.firstChild);
      }
    }
    
    // Add message actions
    addMessageActions(messageBubble, messageText, msgUsername);
    
    messageContainer.appendChild(messageBubble);
    messagesDiv.appendChild(messageContainer);
  }

  function addDmToUI(message, isTemp = false) {
    const { from, to, message: messageText, timestamp, attachment } = message;
    
    // Create the message element
    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';
    if (isTemp) messageContainer.classList.add('temp-message');
    messageContainer.setAttribute('data-username', from);
    messageContainer.setAttribute('data-timestamp', timestamp);
    
    if (from === username) {
      messageContainer.classList.add('own-message');
    }
    
    // Check if we should group with previous messages
    const lastMsg = messagesDiv.querySelector('.message-container:last-child');
    const shouldGroup = lastMsg && 
                      lastMsg.getAttribute('data-username') === from &&
                      Math.abs(parseInt(lastMsg.getAttribute('data-timestamp')) - timestamp) < 5 * 60 * 1000; // 5 minutes
    
    // Message bubble
    const messageBubble = document.createElement('div');
    messageBubble.className = 'message-bubble';
    
    // Add header or timestamp
    if (!shouldGroup) {
      const messageHeader = document.createElement('div');
      messageHeader.className = 'message-header';
      
      const formattedTime = formatTimestamp(timestamp);
      const displayName = filterUsername(from);
      
      messageHeader.innerHTML = `
        <span class="message-username">${displayName}</span>
        <span class="message-timestamp">${formattedTime}</span>
      `;
      
      messageBubble.appendChild(messageHeader);
    } else {
      const inlineTime = document.createElement('span');
      inlineTime.className = 'inline-timestamp';
      inlineTime.textContent = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      messageBubble.appendChild(inlineTime);
    }
    
    // Message content
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = messageText;
    messageBubble.appendChild(messageContent);
    
    // Add attachment if present
    if (attachment) {
      const attachmentHTML = createAttachmentHTML(attachment);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = attachmentHTML;
      while (tempDiv.firstChild) {
        messageBubble.appendChild(tempDiv.firstChild);
      }
    }
    
    // Add message actions
    addMessageActions(messageBubble, messageText, from);
    
    messageContainer.appendChild(messageBubble);
    messagesDiv.appendChild(messageContainer);
  }

  // Add this function to create message actions with reporting functionality
  function addMessageActions(messageBubble, messageText, msgUsername) {
    const messageActions = document.createElement('div');
    messageActions.className = 'message-actions';
    messageActions.innerHTML = `
      <button class="message-action emoji-action" title="React">
        <i class="far fa-smile"></i>
      </button>
      <button class="message-action reply-action" title="Reply">
        <i class="fas fa-reply"></i>
      </button>
      <button class="message-action more-action" title="More">
        <i class="fas fa-ellipsis-v"></i>
      </button>
    `;
    messageBubble.appendChild(messageActions);
    
    // Add event listeners to buttons
    const emojiButton = messageActions.querySelector('.emoji-action');
    const replyButton = messageActions.querySelector('.reply-action');
    const moreButton = messageActions.querySelector('.more-action');
    
    // Emoji reaction
    emojiButton.addEventListener('click', () => {
      showEmojiPicker(messageBubble);
    });
    
    // Reply functionality
    replyButton.addEventListener('click', () => {
      replyToMessage(messageText, msgUsername);
    });
    
    // More options (including report)
    moreButton.addEventListener('click', (e) => {
      e.stopPropagation();
      showMessageOptions(e, messageText, msgUsername, messageBubble);
    });
    
    // Add context menu
    messageBubble.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showMessageOptions(e, messageText, msgUsername, messageBubble);
    });
  }

  // Add these supporting functions
  function showEmojiPicker(messageBubble) {
    // Placeholder for emoji picker
    showToast('Coming Soon', 'Emoji reactions will be available soon!', 'info');
  }

  function replyToMessage(messageText, msgUsername) {
    // Add reply functionality
    const displayName = filterUsername(msgUsername);
    messageInput.value = `@${displayName} `;
    messageInput.focus();
    
    // Show reply preview
    showReplyPreview(messageText, msgUsername);
  }

  function showReplyPreview(messageText, msgUsername) {
    // Placeholder for reply preview
    // In a real implementation, you'd add UI to show which message is being replied to
    showToast('Reply', `Replying to ${filterUsername(msgUsername)}`, 'info');
  }

  function showMessageOptions(event, messageText, msgUsername, messageBubble) {
    const isOwnMessage = msgUsername === username;
    
    const menuItems = [
      { text: 'Reply', icon: 'reply', action: () => replyToMessage(messageText, msgUsername) },
      { text: 'Copy Text', icon: 'copy', action: () => {
        navigator.clipboard.writeText(messageText)
          .then(() => showToast('Copied', 'Text copied to clipboard', 'success'))
          .catch(() => showToast('Error', 'Failed to copy text', 'error'));
      }},
      { divider: true }
    ];
    
    if (isOwnMessage) {
      menuItems.push({ 
        text: 'Edit Message', 
        icon: 'edit', 
        action: () => editMessage(messageBubble, messageText)
      });
      
      menuItems.push({ 
        text: 'Delete Message', 
        icon: 'trash-alt', 
        danger: true, 
        action: () => {
          if (confirm('Are you sure you want to delete this message?')) {
            deleteMessage(messageBubble);
          }
        }
      });
    } else {
      menuItems.push({ 
        text: 'Report Message', 
        icon: 'flag', 
        danger: true, 
        action: () => showReportDialog(msgUsername, messageText)
      });
    }
    
    showContextMenu(event, menuItems);
  }

  // Report dialog function
  function showReportDialog(reportedUser, messageContent) {
    // Create report modal
    const reportModal = document.createElement('div');
    reportModal.className = 'modal report-modal';
    reportModal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>Report Message</h2>
          <button class="close-button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>You are reporting a message from <strong>${filterUsername(reportedUser)}</strong></p>
          <div class="reported-message">
            <div class="reported-content">${messageContent}</div>
          </div>
          <div class="input-group">
            <label>Reason for reporting:</label>
            <select id="report-reason" class="report-select">
              <option value="">Please select a reason</option>
              <option value="harassment">Harassment or bullying</option>
              <option value="hate">Hate speech</option>
              <option value="violence">Violence or threats</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="spam">Spam</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="input-group" id="other-reason-group" style="display: none;">
            <label for="other-reason">Please specify:</label>
            <textarea id="other-reason" placeholder="Please explain why you're reporting this message..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="secondary-button cancel-report">Cancel</button>
          <button class="primary-button submit-report">Submit Report</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(reportModal);
    
    // Add event listeners
    const closeButton = reportModal.querySelector('.close-button');
    const cancelButton = reportModal.querySelector('.cancel-report');
    const submitButton = reportModal.querySelector('.submit-report');
    const reasonSelect = reportModal.querySelector('#report-reason');
    const otherReasonGroup = reportModal.querySelector('#other-reason-group');
    
    function closeReportModal() {
      reportModal.classList.add('closing');
      setTimeout(() => {
        reportModal.remove();
      }, 300);
    }
    
    closeButton.addEventListener('click', closeReportModal);
    cancelButton.addEventListener('click', closeReportModal);
    
    reasonSelect.addEventListener('change', () => {
      if (reasonSelect.value === 'other') {
        otherReasonGroup.style.display = 'block';
      } else {
        otherReasonGroup.style.display = 'none';
      }
    });
    
    submitButton.addEventListener('click', () => {
      const reason = reasonSelect.value;
      if (!reason) {
        showToast('Error', 'Please select a reason for reporting', 'error');
        return;
      }
      
      let details = '';
      if (reason === 'other') {
        details = document.getElementById('other-reason').value.trim();
        if (!details) {
          showToast('Error', 'Please provide details for your report', 'error');
          return;
        }
      }
      
      // Here you would send the report to the server
      // socket.emit('report message', { user: reportedUser, message: messageContent, reason, details });
      
      closeReportModal();
      showToast('Report Submitted', 'Thank you for your report. Our moderators will review it.', 'success');
    });
    
    // Show modal with animation
    setTimeout(() => reportModal.classList.add('active'), 10);
  }

  // Add this function to handle typing events
  function handleTyping() {
    if (!isTyping) {
      isTyping = true;
      
      // Emit typing event
      if (chatMode === 'server' && activeServer) {
        socket.emit('typing', { room: activeServer });
      } else if (chatMode === 'dm' && activeDm) {
        socket.emit('typing', { room: activeDm });
      }
      
      // Reset typing status after timeout
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        isTyping = false;
        
        // Emit stop typing event
        if (chatMode === 'server' && activeServer) {
          socket.emit('stop typing', { room: activeServer });
        } else if (chatMode === 'dm' && activeDm) {
          socket.emit('stop typing', { room: activeDm });
        }
      }, TYPING_TIMEOUT);
    } else {
      // Reset the timeout
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        isTyping = false;
        
        // Emit stop typing event
        if (chatMode === 'server' && activeServer) {
          socket.emit('stop typing', { room: activeServer });
        } else if (chatMode === 'dm' && activeDm) {
          socket.emit('stop typing', { room: activeDm });
        }
      }, TYPING_TIMEOUT);
    }
  }

  // Add these placeholder functions for future implementation
  function editMessage(messageBubble, messageText) {
    // Placeholder for edit functionality
    const messageContent = messageBubble.querySelector('.message-content');
    const originalText = messageContent.textContent;
    
    // Create editable input
    const editInput = document.createElement('textarea');
    editInput.className = 'edit-input';
    editInput.value = originalText;
    
    // Replace content with input
    messageContent.textContent = '';
    messageContent.appendChild(editInput);
    
    // Add save/cancel buttons
    const editActions = document.createElement('div');
    editActions.className = 'edit-actions';
    editActions.innerHTML = `
      <button class="save-edit">Save</button>
      <button class="cancel-edit">Cancel</button>
    `;
    messageContent.appendChild(editActions);
    
    // Focus input
    editInput.focus();
    
    // Add event listeners
    const saveButton = editActions.querySelector('.save-edit');
    const cancelButton = editActions.querySelector('.cancel-edit');
    
    saveButton.addEventListener('click', () => {
      const newText = editInput.value.trim();
      if (newText && newText !== originalText) {
        // Here you would emit an event to update the message on the server
        // socket.emit('edit message', { messageId: xyz, newContent: newText });
        
        // Update UI
        messageContent.textContent = newText;
        showToast('Message Updated', 'Your message has been edited', 'success');
      } else {
        // Restore original
        messageContent.textContent = originalText;
      }
    });
    
    cancelButton.addEventListener('click', () => {
      // Restore original
      messageContent.textContent = originalText;
    });
  }

  function deleteMessage(messageBubble) {
    // Placeholder for delete functionality
    const messageContainer = messageBubble.closest('.message-container');
    
    // Add deletion animation
    messageContainer.classList.add('deleting');
    
    // Here you would emit an event to delete the message on the server
    // socket.emit('delete message', { messageId: xyz });
    
    // Remove after animation
    setTimeout(() => {
      messageContainer.remove();
    }, 300);
    
    showToast('Message Deleted', 'Your message has been deleted', 'success');
  }

  // Function to render DM messages efficiently
  function renderDmMessages(messages) {
    const fragment = document.createDocumentFragment();
    let lastSender = null;
    let lastDate = null;
    
    messages.forEach((message, index) => {
      const { from, to, message: messageText, timestamp, attachment } = message;
      
      // Check if we need to show a date separator
      const messageDate = new Date(timestamp).toLocaleDateString();
      if (lastDate !== messageDate) {
        const dateSeparator = document.createElement('div');
        dateSeparator.className = 'date-separator';
        
        const formattedDate = new Date(timestamp).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        dateSeparator.innerHTML = `
          <div class="date-line"></div>
          <div class="date-text">${formattedDate}</div>
          <div class="date-line"></div>
        `;
        
        fragment.appendChild(dateSeparator);
        lastDate = messageDate;
        lastSender = null; // Reset last sender after date separator
      }
      
      // Determine if this is a new message group
      const isNewGroup = lastSender !== from;
      lastSender = from;
      
      // Create message container
      const messageContainer = document.createElement('div');
      messageContainer.className = 'message-container';
      messageContainer.setAttribute('data-username', from);
      messageContainer.setAttribute('data-timestamp', timestamp);
      
      if (from === username) {
        messageContainer.classList.add('own-message');
      }
      
      // Message bubble contains the actual message content
      const messageBubble = document.createElement('div');
      messageBubble.className = 'message-bubble';
      
      // Only show the header for the first message in a group
      if (isNewGroup) {
        const messageHeader = document.createElement('div');
        messageHeader.className = 'message-header';
        
        const formattedTime = formatTimestamp(timestamp);
        const displayName = filterUsername(from);
        
        messageHeader.innerHTML = `
          <span class="message-username">${displayName}</span>
          <span class="message-timestamp">${formattedTime}</span>
        `;
        
        messageBubble.appendChild(messageHeader);
      } else {
        // For subsequent messages in a group, just add a small timestamp
        const inlineTime = document.createElement('span');
        inlineTime.className = 'inline-timestamp';
        inlineTime.textContent = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageBubble.appendChild(inlineTime);
      }
      
      // Message content
      const messageContent = document.createElement('div');
      messageContent.className = 'message-content';
      messageContent.textContent = messageText;
      messageBubble.appendChild(messageContent);
      
      // Add attachment if present
      if (attachment) {
        const attachmentHTML = createAttachmentHTML(attachment);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = attachmentHTML;
        while (tempDiv.firstChild) {
          messageBubble.appendChild(tempDiv.firstChild);
        }
      }
      
      // Add message actions that appear on hover
      const messageActions = document.createElement('div');
      messageActions.className = 'message-actions';
      messageActions.innerHTML = `
        <button class="message-action" title="React">
          <i class="far fa-smile"></i>
        </button>
        <button class="message-action" title="Reply">
          <i class="fas fa-reply"></i>
        </button>
        <button class="message-action" title="More">
          <i class="fas fa-ellipsis-v"></i>
        </button>
      `;
      messageBubble.appendChild(messageActions);
      
      // Add context menu for message
      messageBubble.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        
        const menuItems = [
          { text: 'Reply', icon: 'reply', action: () => { /* Reply functionality */ } },
          { text: 'Copy Text', icon: 'copy', action: () => {
            navigator.clipboard.writeText(messageText)
              .then(() => showToast('Copied', 'Text copied to clipboard', 'success'))
              .catch(() => showToast('Error', 'Failed to copy text', 'error'));
          }},
          { divider: true }
        ];
        
        // Add delete option only for own messages
        if (from === username) {
          menuItems.push({ 
            text: 'Delete Message', 
            icon: 'trash-alt', 
            danger: true, 
            action: () => {
              if (confirm('Are you sure you want to delete this message?')) {
                // Delete message functionality would go here
                showToast('Deleted', 'Message has been deleted', 'success');
              }
            }
          });
        } else {
          menuItems.push({ 
            text: 'Report Message', 
            icon: 'flag', 
            danger: true, 
            action: () => {
              // Report functionality
              showToast('Reported', 'Message has been reported', 'success');
            }
          });
        }
        
        showContextMenu(e, menuItems);
      });
      
      messageContainer.appendChild(messageBubble);
      fragment.appendChild(messageContainer);
    });
    
    // Append all messages at once
    messagesDiv.appendChild(fragment);
  }
  
  // =====================
  // Event Listeners
  // =====================
  
=======
>>>>>>> parent of 6e12135 (0.8.1 Minor UI changes)
  // Initialize settings
  loadSettings();
  
  // Setup settings button handlers
  if (settingsButton) {
    settingsButton.addEventListener('click', () => {
      settingsModal.classList.remove('hidden');
      
      // Set correct active state for theme buttons based on current theme
      updateThemeButtons(userSettings.theme);
      
      // Add event listeners to theme buttons
      const lightButton = document.getElementById('light-theme-button');
      const darkButton = document.getElementById('dark-theme-button');
      
      if (lightButton) {
        // Remove existing listeners to prevent duplicates
        lightButton.replaceWith(lightButton.cloneNode(true));
        const newLightButton = document.getElementById('light-theme-button');
        
        newLightButton.addEventListener('click', () => {
          userSettings.theme = 'light';
          updateThemeButtons('light');
          applyTheme();
        });
      }
      
      if (darkButton) {
        // Remove existing listeners to prevent duplicates
        darkButton.replaceWith(darkButton.cloneNode(true));
        const newDarkButton = document.getElementById('dark-theme-button');
        
        newDarkButton.addEventListener('click', () => {
          userSettings.theme = 'dark';
          updateThemeButtons('dark');
          applyTheme();
        });
      }
      
      // Populate other settings form values
      const filterSwitch = document.getElementById('username-filter-setting');
      const filterWordsInput = document.getElementById('filter-words');
      const notificationsSwitch = document.getElementById('notifications-setting');
      const notificationSoundSwitch = document.getElementById('notification-sound-setting');
      
      if (filterSwitch) filterSwitch.checked = userSettings.usernameFilter;
      if (filterWordsInput) filterWordsInput.value = Array.isArray(userSettings.filterWords) 
        ? userSettings.filterWords.join(', ') 
        : userSettings.filterWords.toString();
      if (notificationsSwitch) notificationsSwitch.checked = userSettings.enableNotifications;
      if (notificationSoundSwitch) notificationSoundSwitch.checked = userSettings.notificationSound;
    });
  }
  
  if (settingsCloseButton) {
    settingsCloseButton.addEventListener('click', () => {
      settingsModal.classList.add('hidden');
    });
  }
  
  if (settingsSaveButton) {
    settingsSaveButton.addEventListener('click', () => {
      // Theme is already set when buttons are clicked
      
      // Get values from other form elements
      const filterSwitch = document.getElementById('username-filter-setting');
      const filterWordsInput = document.getElementById('filter-words');
      const notificationsSwitch = document.getElementById('notifications-setting');
      const notificationSoundSwitch = document.getElementById('notification-sound-setting');
      
      if (filterSwitch) userSettings.usernameFilter = filterSwitch.checked;
      if (filterWordsInput) {
        userSettings.filterWords = filterWordsInput.value
          .split(',')
          .map(word => word.trim())
          .filter(word => word.length > 0);
      }
      if (notificationsSwitch) userSettings.enableNotifications = notificationsSwitch.checked;
      if (notificationSoundSwitch) userSettings.notificationSound = notificationSoundSwitch.checked;
      
      // Save and apply settings
      saveSettings();
      
      // Close settings modal
      settingsModal.classList.add('hidden');
      
      // Show confirmation
      showToast('Settings saved successfully', 'success');
    });
  }
  
  if (settingsCancelButton) {
    settingsCancelButton.addEventListener('click', () => {
      settingsModal.classList.add('hidden');
      // Reset to previous settings by reloading them
      loadSettings();
    });
  }
  
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
  
  // File handling
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      selectedFile = e.target.files[0];
      
      // Check file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        showToast('File size exceeds 5MB limit', 'error');
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
    
    // Show welcome toast
    showToast(`Welcome back, ${username}!`, 'success');
    
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
    showToast('Account created successfully! Please verify your email.', 'success');
  });

  // Handle password reset initiated
  socket.on('reset initiated', () => {
    resetError.textContent = '';
    resetSuccess.textContent = 'Password reset email sent. Please check your inbox.';
    showToast('Password reset email sent', 'success');
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
    
    showToast('You have been logged out', 'info');
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
      showToast(`Creating server: ${serverName}`, 'info');
    } else {
      showToast('Please enter a server name', 'error');
    }
  });

  // Join server
  joinServerButton.addEventListener('click', () => {
    const serverName = serverNameInput.value.trim();
    if (serverName) {
      socket.emit('join server', { serverName });
      serverNameInput.value = '';
      serverModal.classList.add('hidden');
      showToast(`Joining server: ${serverName}`, 'info');
    } else {
      showToast('Please enter a server name', 'error');
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
    showToast(`Joined server: ${serverName}`, 'success');
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
    showToast(`Server created: ${serverName}`, 'success');
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
      const displayName = filterUsername(user); // Apply username filter
      
      if (hasUnread) {
        dmItem.innerHTML = `${displayName} <span class="unread-badge">!</span>`;
      } else {
        dmItem.textContent = displayName;
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
    const displayName = filterUsername(otherUser); // Apply username filter
    currentServer.textContent = `Chat with: ${displayName}`;
    messagesDiv.innerHTML = '';
    peopleList.classList.add('hidden');
    
    // Update active classes
    updateServerListUI(); // Reset server active state
    
    Array.from(dmList.children).forEach(item => {
      const dmUsername = item.textContent.replace(' !', ''); // Remove unread badge text if present
      item.classList.toggle('active', dmUsername === displayName);
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
      const displayName = filterUsername(user); // Apply username filter
      
      if (user !== username) { // Don't show DM option for self
        const userItem = document.createElement('li');
        userItem.innerHTML = `
          ${displayName}
          <span class="dm-user-action" data-username="${user}">DM</span>
        `;
        userList.appendChild(userItem);
      } else {
        const userItem = document.createElement('li');
        userItem.textContent = `${displayName} (you)`;
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
        const displayName = filterUsername(user); // Apply username filter
        userItem.textContent = displayName;
        
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
        showToast('File uploaded successfully', 'success');
      } else {
        showToast('Error uploading file. Please try again.', 'error');
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
      const messageContainer = document.createElement('div');
      messageContainer.className = 'message-container';
      
      if (msgUsername === username) {
        messageContainer.classList.add('own-message');
      }
      
      const formattedTime = formatTimestamp(timestamp);
      const displayName = filterUsername(msgUsername); // Apply username filter
      
      let messageHTML = `
        <div class="message-header">
          <span class="message-username">${displayName}</span>
          <span class="message-timestamp">${formattedTime}</span>
        </div>
        <div class="message-content">${message}</div>
      `;
      
      // Add attachment if present
      if (attachment) {
        messageHTML += createAttachmentHTML(attachment);
      }
      
      messageContainer.innerHTML = messageHTML;
      
      fragment.appendChild(messageContainer);
    });
    
    // Append all messages at once
    messagesDiv.appendChild(fragment);
  }

  // Function to render DM messages efficiently
  function renderDmMessages(messages) {
    const fragment = document.createDocumentFragment();
    
    messages.forEach(({ from, to, message, timestamp, attachment }) => {
      const messageContainer = document.createElement('div');
      messageContainer.className = 'message-container';
      
      if (from === username) {
        messageContainer.classList.add('own-message');
      }
      
      const formattedTime = formatTimestamp(timestamp);
      const displayName = filterUsername(from); // Apply username filter
      
      let messageHTML = `
        <div class="message-header">
          <span class="message-username">${displayName}</span>
          <span class="message-timestamp">${formattedTime}</span>
        </div>
        <div class="message-content">${message}</div>
      `;
      
      // Add attachment if present
      if (attachment) {
        messageHTML += createAttachmentHTML(attachment);
      }
      
      messageContainer.innerHTML = messageHTML;
      
      fragment.appendChild(messageContainer);
    });
    
    messagesDiv.appendChild(fragment);
  }

  // Receive server messages
  socket.on('server message', ({ username: msgUsername, message, timestamp, serverName, attachment }) => {
    // If this server is currently active, display the message
    if (chatMode === 'server' && activeServer === serverName) {
      const messageContainer = document.createElement('div');
      messageContainer.className = 'message-container';
      
      if (msgUsername === username) {
        messageContainer.classList.add('own-message');
      }
      
      const formattedTime = formatTimestamp(timestamp);
      const displayName = filterUsername(msgUsername); // Apply username filter
      
      let messageHTML = `
        <div class="message-header">
          <span class="message-username">${displayName}</span>
          <span class="message-timestamp">${formattedTime}</span>
        </div>
        <div class="message-content">${message}</div>
      `;
      
      // Add attachment if present
      if (attachment) {
        messageHTML += createAttachmentHTML(attachment);
      }
      
      messageContainer.innerHTML = messageHTML;
      
      messagesDiv.appendChild(messageContainer);
      
      // Check if we need to clean up old messages
      const MAX_RENDERED_MESSAGES = 100; // Define this constant since it was referenced but not defined
      
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
        `${displayName}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`
      );
    }
  });

  // Receive DM
  socket.on('dm message', ({ from, to, message, timestamp, attachment }) => {
    // If this DM is currently active, display it
    if (chatMode === 'dm' && ((from === activeDm) || (to === activeDm))) {
      const messageContainer = document.createElement('div');
      messageContainer.className = 'message-container';
      
      if (from === username) {
        messageContainer.classList.add('own-message');
      }
      
      const formattedTime = formatTimestamp(timestamp);
      const displayName = filterUsername(from); // Apply username filter
      
      let messageHTML = `
        <div class="message-header">
          <span class="message-username">${displayName}</span>
          <span class="message-timestamp">${formattedTime}</span>
        </div>
        <div class="message-content">${message}</div>
      `;
      
      // Add attachment if present
      if (attachment) {
        messageHTML += createAttachmentHTML(attachment);
      }
      
      messageContainer.innerHTML = messageHTML;
      
      messagesDiv.appendChild(messageContainer);
      
      // Check if we need to clean up old messages
      const MAX_RENDERED_MESSAGES = 100; // Define this constant
      
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
      const displayName = filterUsername(from); // Apply username filter
      showNotification(
        `Message from ${displayName}`,
        `${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`
      );
    }
  });

  // Handle previous server messages
  socket.on('server messages', (messages) => {
    if (chatMode === 'server') {
      // Clear current messages
      messagesDiv.innerHTML = '';
      
      const MAX_RENDERED_MESSAGES = 100; // Define this constant
      
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
    
    const MAX_RENDERED_MESSAGES = 100; // Define this constant
    
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
  
  // Add dark/light mode toggle for system preference changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
      if (event.matches && userSettings.theme === 'system') {
        document.documentElement.classList.add('dark');
      } else if (userSettings.theme === 'system') {
        document.documentElement.classList.remove('dark');
      }
    });
  }
});