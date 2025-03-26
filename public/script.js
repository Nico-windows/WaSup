// WaSup Chat Application - Modern UI
document.addEventListener('DOMContentLoaded', () => {
  // Check system preference for dark/light mode
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    const userSettings = getUserSettings();
    if (userSettings.theme === 'system') {
      if (event.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  });

  // Socket.io initialization
  const socket = io();

  // DOM Elements - Auth
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

  // DOM Elements - App
  const logoutButton = document.getElementById('logout-button');
  const userDisplay = document.getElementById('user-display');
  const serverList = document.getElementById('server-list');
  const dmList = document.getElementById('dm-list');
  const messagesDiv = document.getElementById('messages');
  const messageInput = document.getElementById('message-input');
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
  const typingIndicator = document.getElementById('typing-indicator');
  const serverMembersCount = document.getElementById('server-members-count');
  
  // DOM Elements - Mobile
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileUsersToggle = document.getElementById('mobile-users-toggle');
  const sidebarClose = document.getElementById('sidebar-close');
  const sidebar = document.getElementById('sidebar');
  const mobileTitle = document.getElementById('mobile-title');
  
  // DOM Elements - Server Modal
  const createServerTab = document.getElementById('create-server-tab');
  const joinServerTab = document.getElementById('join-server-tab');
  const discoverServerTab = document.getElementById('discover-server-tab');
  const createServerPanel = document.getElementById('create-server-panel');
  const joinServerPanel = document.getElementById('join-server-panel');
  const discoverServerPanel = document.getElementById('discover-server-panel');
  const joinServerInput = document.getElementById('join-server-input');
  const discoverSearchInput = document.getElementById('discover-search-input');

  // DOM Elements - Settings
  const settingsButton = document.getElementById('settings-button');
  const settingsModal = document.getElementById('settings-modal');
  const settingsCloseButton = document.getElementById('settings-close-button');
  const settingsSaveButton = document.getElementById('settings-save-button');
  const settingsCancelButton = document.getElementById('settings-cancel-button');
  const settingsNavItems = document.querySelectorAll('.settings-nav-item');
  const settingsSections = document.querySelectorAll('.settings-section');
  const lightThemeButton = document.getElementById('light-theme-button');
  const darkThemeButton = document.getElementById('dark-theme-button');
  const systemThemeButton = document.getElementById('system-theme-button');
  const usernameFilterSetting = document.getElementById('username-filter-setting');
  const filterWordsInput = document.getElementById('filter-words');
  const notificationsSetting = document.getElementById('notifications-setting');
  const notificationSoundSetting = document.getElementById('notification-sound-setting');
  const selectorOptions = document.querySelectorAll('.selector-option');
  
  // Context Menu
  const contextMenu = document.getElementById('context-menu');
  
  // Toast Container
  const toastContainer = document.getElementById('toast-container');

  // App state
  let username = '';
  let activeServer = null;
  let activeDm = null;
  let usersInServer = [];
  let chatMode = 'server'; // 'server' or 'dm'
  let allUsers = [];
  let unreadDms = {};
  let lastActivity = { server: null, dm: null };
  let joinedServers = [];
  let unreadServers = {};
  let selectedFile = null;
  let notificationPermission = 'default';
  let isTyping = false;
  let typingTimeout = null;
  
  // Settings
  const defaultSettings = {
    theme: 'dark',
    usernameFilter: true,
    filterWords: ['hitler', 'nazi', 'racial slurs', 'offensive terms'],
    enableNotifications: true,
    notificationSound: true,
    messageStyle: 'cozy',
    fontSize: 'medium',
    muteNewServers: false,
    developerMode: false,
    hardwareAcceleration: true
  };
  
  let userSettings = { ...defaultSettings };
  
  // For mobile responsiveness
  const isMobile = window.innerWidth <= 768;
  
  // Sound effects
  const messageSound = new Audio('https://cdn.jsdelivr.net/gh/zvakanaka/soundelicious@master/src/sounds/notification_decorative-01.mp3');
  
  // Animation timing
  const TYPING_TIMEOUT = 3000; // 3 seconds before "typing..." disappears
  
  // =====================
  // Settings Functions
  // =====================
  
  // Load settings from localStorage
  function getUserSettings() {
    try {
      const savedSettings = localStorage.getItem('wasup-settings');
      return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : { ...defaultSettings };
    } catch (error) {
      console.error('Error loading settings:', error);
      return { ...defaultSettings };
    }
  }
  
  function loadSettings() {
    userSettings = getUserSettings();
    applySettings();
  }
  
  // Save settings to localStorage
  function saveSettings() {
    try {
      localStorage.setItem('wasup-settings', JSON.stringify(userSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }
  
  // Apply all settings to the UI
  function applySettings() {
    applyTheme();
    applyMessageStyle();
    applyFontSize();
  }
  
  // Apply theme based on settings
  function applyTheme() {
    if (userSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (userSettings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (userSettings.theme === 'system') {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    updateThemeButtons();
  }
  
  // Update theme buttons to show active state
  function updateThemeButtons() {
    if (lightThemeButton && darkThemeButton && systemThemeButton) {
      lightThemeButton.classList.remove('active');
      darkThemeButton.classList.remove('active');
      systemThemeButton.classList.remove('active');
      
      if (userSettings.theme === 'light') {
        lightThemeButton.classList.add('active');
      } else if (userSettings.theme === 'dark') {
        darkThemeButton.classList.add('active');
      } else if (userSettings.theme === 'system') {
        systemThemeButton.classList.add('active');
      }
    }
  }
  
  // Apply message display style
  function applyMessageStyle() {
    if (userSettings.messageStyle === 'compact') {
      messagesDiv.classList.add('compact-messages');
    } else {
      messagesDiv.classList.remove('compact-messages');
    }
    
    // Update selector UI
    document.querySelectorAll('.selector-option[data-value]').forEach(option => {
      if (option.dataset.value === userSettings.messageStyle) {
        option.classList.add('active');
      } else if (option.parentElement.classList.contains('selector') &&
                option.parentElement.querySelector('.selector-option.active') !== option) {
        option.classList.remove('active');
      }
    });
  }
  
  // Apply font size
  function applyFontSize() {
    document.body.style.fontSize = userSettings.fontSize === 'small' ? '14px' : 
                                  userSettings.fontSize === 'large' ? '18px' : '16px';
    
    // Update selector UI
    document.querySelectorAll('.selector-option[data-value]').forEach(option => {
      if (option.dataset.value === userSettings.fontSize) {
        option.classList.add('active');
      } else if (option.parentElement.classList.contains('selector') &&
                option.parentElement.querySelector('.selector-option.active') !== option) {
        option.classList.remove('active');
      }
    });
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
  
  // =====================
  // UI Utility Functions
  // =====================
  
  // Show toast notification
  function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    else if (type === 'error') icon = 'exclamation-circle';
    else if (type === 'warning') icon = 'exclamation-triangle';
    
    toast.innerHTML = `
      <div class="toast-icon">
        <i class="fas fa-${icon}"></i>
      </div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    // Add click handler to close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode === toastContainer) {
        toastContainer.removeChild(toast);
      }
    }, 5000);
    
    // Play notification sound if enabled
    if (userSettings.notificationSound && type !== 'error') {
      messageSound.play().catch(e => console.error('Error playing sound:', e));
    }
  }
  
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
  function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message && !selectedFile) return;
    
    // Clear the typing indicator
    clearTimeout(typingTimeout);
    isTyping = false;
    socket.emit('stop typing', { room: activeServer || activeDm });
    
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
    
    messageInput.value = '';
    messageInput.focus();
  }
  
  // Handle typing events
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
  
  function uploadAndSendFile(serverName, dmUser, textMessage) {
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
    
    // Create and show upload progress
    const progressContainer = document.createElement('div');
    progressContainer.className = 'upload-progress-container';
    progressContainer.innerHTML = `
      <div class="upload-info">
        <i class="fas fa-file-upload"></i>
        <div class="upload-details">
          <div class="upload-filename">${selectedFile.name}</div>
          <div class="upload-status">Uploading... 0%</div>
        </div>
      </div>
      <div class="upload-progress-bar">
        <div class="upload-progress" style="width: 0%"></div>
      </div>
    `;
    
    messagesDiv.appendChild(progressContainer);
    safeScrollToBottom();
    
    xhr.upload.onprogress = function(e) {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        progressContainer.querySelector('.upload-progress').style.width = percentComplete + '%';
        progressContainer.querySelector('.upload-status').textContent = `Uploading... ${percentComplete}%`;
      }
    };
    
    xhr.onload = function() {
      if (xhr.status === 200) {
        // Success - clear the selected file and progress
        selectedFile = null;
        fileInput.value = '';
        attachmentPreview.classList.add('hidden');
        
        // Remove upload progress indicator
        progressContainer.remove();
      } else {
        // Error handling
        progressContainer.querySelector('.upload-status').textContent = 'Upload failed';
        progressContainer.querySelector('.upload-progress').style.backgroundColor = 'var(--error-color)';
        
        showToast('Upload Failed', 'Error uploading file. Please try again.', 'error');
      }
    };
    
    xhr.onerror = function() {
      progressContainer.querySelector('.upload-status').textContent = 'Upload failed';
      progressContainer.querySelector('.upload-progress').style.backgroundColor = 'var(--error-color)';
      
      showToast('Upload Failed', 'Network error occurred. Please try again.', 'error');
    };
    
    xhr.send(formData);
  }
  
  // Function to render a batch of messages efficiently
  function renderMessages(messages) {
    // Create a document fragment to batch DOM operations
    const fragment = document.createDocumentFragment();
    let lastSender = null;
    let lastDate = null;
    
    messages.forEach((message, index) => {
      const { username: msgUsername, message: messageText, timestamp, attachment } = message;
      
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
      const isNewGroup = lastSender !== msgUsername;
      lastSender = msgUsername;
      
      // Create message container
      const messageContainer = document.createElement('div');
      messageContainer.className = 'message-container';
      messageContainer.setAttribute('data-username', msgUsername);
      messageContainer.setAttribute('data-timestamp', timestamp);
      
      if (msgUsername === username) {
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
        const displayName = filterUsername(msgUsername);
        
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
        if (msgUsername === username) {
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
  
  // Initialize settings
  loadSettings();
  
  // Auth form event listeners
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
  
  // Login form
  loginButton.addEventListener('click', () => {
    const username = loginUsername.value.trim();
    const password = loginPassword.value;
    
    if (!username || !password) {
      loginError.textContent = 'Please enter both username and password';
      return;
    }
    
    socket.emit('login', { username, password });
  });
  
  // Also allow login on Enter key
  loginPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      loginButton.click();
    }
  });
  
  // Signup form
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
  
  // Password reset form
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
  
  // Logout
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
    hideAllAuthForms();
    loginForm.classList.remove('hidden');
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
    
    showToast('Logged Out', 'You have been logged out successfully', 'info');
  });
  
  // Mobile navigation
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
      sidebar.classList.add('active');
    });
  }
  
  if (mobileUsersToggle) {
    mobileUsersToggle.addEventListener('click', () => {
      peopleList.classList.add('active');
    });
  }
  
  if (sidebarClose) {
    sidebarClose.addEventListener('click', () => {
      sidebar.classList.remove('active');
    });
  }
  
  // Modal toggles
  manageServerButton.addEventListener('click', () => {
    // Reset server modal state
    createServerTab.classList.add('active');
    joinServerTab.classList.remove('active');
    discoverServerTab.classList.remove('active');
    createServerPanel.classList.remove('hidden');
    joinServerPanel.classList.add('hidden');
    discoverServerPanel.classList.add('hidden');
    serverNameInput.value = '';
    joinServerInput.value = '';
    
    toggleModal(serverModal, true);
    socket.emit('get discover servers');
  });

  newDmButton.addEventListener('click', () => {
    toggleModal(dmModal, true);
    dmSearchInput.value = '';
    socket.emit('get all users');
    filterDmUsers();
    
    // Focus search input
    setTimeout(() => dmSearchInput.focus(), 100);
  });

  modalCloseButton.addEventListener('click', () => {
    toggleModal(serverModal, false);
  });

  dmModalCloseButton.addEventListener('click', () => {
    toggleModal(dmModal, false);
  });
  
  // Server modal tabs
  createServerTab.addEventListener('click', () => {
    createServerTab.classList.add('active');
    joinServerTab.classList.remove('active');
    discoverServerTab.classList.remove('active');
    createServerPanel.classList.remove('hidden');
    joinServerPanel.classList.add('hidden');
    discoverServerPanel.classList.add('hidden');
  });
  
  joinServerTab.addEventListener('click', () => {
    createServerTab.classList.remove('active');
    joinServerTab.classList.add('active');
    discoverServerTab.classList.remove('active');
    createServerPanel.classList.add('hidden');
    joinServerPanel.classList.remove('hidden');
    discoverServerPanel.classList.add('hidden');
  });
  
  discoverServerTab.addEventListener('click', () => {
    createServerTab.classList.remove('active');
    joinServerTab.classList.remove('active');
    discoverServerTab.classList.add('active');
    createServerPanel.classList.add('hidden');
    joinServerPanel.classList.add('hidden');
    discoverServerPanel.classList.remove('hidden');
    
    socket.emit('get discover servers');
  });

  // Create server
  createServerButton.addEventListener('click', () => {
    const serverName = serverNameInput.value.trim();
    if (serverName) {
      socket.emit('create server', { serverName });
      serverNameInput.value = '';
      toggleModal(serverModal, false);
      showToast('Creating Server', `Creating server: ${serverName}`, 'info');
    } else {
      showToast('Error', 'Please enter a server name', 'error');
    }
  });

  // Join server
  joinServerButton.addEventListener('click', () => {
    const serverName = joinServerInput.value.trim();
    if (serverName) {
      socket.emit('join server', { serverName });
      joinServerInput.value = '';
      toggleModal(serverModal, false);
      showToast('Joining Server', `Joining server: ${serverName}`, 'info');
    } else {
      showToast('Error', 'Please enter a server name', 'error');
    }
  });
  
  // Search in DM modal
  dmSearchInput.addEventListener('input', filterDmUsers);
  
  // Search in discover servers
  discoverSearchInput.addEventListener('input', filterDiscoverServers);
  
  // File input handling
  fileInput.addEventListener('change', handleFileSelection);
  
  // Send message - button click
  sendButton.addEventListener('click', sendMessage);
  
  // Send message - Enter key
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  // Typing indicator
  messageInput.addEventListener('input', handleTyping);
  
  // Settings modal
  settingsButton.addEventListener('click', () => {
    toggleModal(settingsModal, true);
    
    // Update form values to match current settings
    usernameFilterSetting.checked = userSettings.usernameFilter;
    filterWordsInput.value = Array.isArray(userSettings.filterWords) 
      ? userSettings.filterWords.join(', ') 
      : userSettings.filterWords.toString();
    notificationsSetting.checked = userSettings.enableNotifications;
    notificationSoundSetting.checked = userSettings.notificationSound;
    document.getElementById('mute-servers-setting').checked = userSettings.muteNewServers;
    document.getElementById('developer-mode-setting').checked = userSettings.developerMode;
    document.getElementById('hardware-accel-setting').checked = userSettings.hardwareAcceleration;
    
    // Update theme buttons
    updateThemeButtons();
  });
  
  settingsCloseButton.addEventListener('click', () => {
    toggleModal(settingsModal, false);
  });
  
  // Settings navigation
  settingsNavItems.forEach(item => {
    item.addEventListener('click', () => {
      // Update active nav item
      settingsNavItems.forEach(navItem => navItem.classList.remove('active'));
      item.classList.add('active');
      
      // Show corresponding section
      const targetSection = item.getAttribute('data-target');
      settingsSections.forEach(section => {
        section.classList.remove('active');
        if (section.id === targetSection) {
          section.classList.add('active');
        }
      });
    });
  });
  
  // Theme selection
  lightThemeButton.addEventListener('click', () => {
    userSettings.theme = 'light';
    updateThemeButtons();
    applyTheme();
  });
  
  darkThemeButton.addEventListener('click', () => {
    userSettings.theme = 'dark';
    updateThemeButtons();
    applyTheme();
  });
  
  systemThemeButton.addEventListener('click', () => {
    userSettings.theme = 'system';
    updateThemeButtons();
    applyTheme();
  });
  
  // Selector options (font size, message style)
  selectorOptions.forEach(option => {
    option.addEventListener('click', () => {
      const selector = option.parentElement;
      const options = selector.querySelectorAll('.selector-option');
      
      // Update UI
      options.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      
      // Update settings based on which selector was changed
      const value = option.getAttribute('data-value');
      
      if (selector.parentElement.querySelector('span').textContent === 'Message Display') {
        userSettings.messageStyle = value;
        applyMessageStyle();
      } else if (selector.parentElement.querySelector('span').textContent === 'Font Size') {
        userSettings.fontSize = value;
        applyFontSize();
      }
    });
  });
  
  // Save settings
  settingsSaveButton.addEventListener('click', () => {
    // Get values from form elements
    userSettings.usernameFilter = usernameFilterSetting.checked;
    userSettings.filterWords = filterWordsInput.value
      .split(',')
      .map(word => word.trim())
      .filter(word => word.length > 0);
    userSettings.enableNotifications = notificationsSetting.checked;
    userSettings.notificationSound = notificationSoundSetting.checked;
    userSettings.muteNewServers = document.getElementById('mute-servers-setting').checked;
    userSettings.developerMode = document.getElementById('developer-mode-setting').checked;
    userSettings.hardwareAcceleration = document.getElementById('hardware-accel-setting').checked;
    
    // Apply and save settings
    saveSettings();
    applySettings();
    
    // Close modal
    toggleModal(settingsModal, false);
    
    showToast('Settings Saved', 'Your preferences have been updated', 'success');
  });
  
  // Cancel settings
  settingsCancelButton.addEventListener('click', () => {
    toggleModal(settingsModal, false);
    // Revert to saved settings
    loadSettings();
  });
  
  // Dismiss context menu on scroll
  messagesDiv.addEventListener('scroll', hideContextMenu);
  
  // Dismiss context menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!contextMenu.contains(e.target)) {
      hideContextMenu();
    }
  });
  
  // =====================
  // Socket Event Handlers
  // =====================
  
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
    showToast('Welcome', `Welcome back, ${username}!`, 'success');
    
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
    } else {
      // Show welcome screen
      currentServer.textContent = 'Welcome';
      serverMembersCount.textContent = '';
      messagesDiv.innerHTML = `
        <div class="welcome-message">
          <div class="welcome-icon"><i class="fas fa-comments"></i></div>
          <h2>Welcome to WaSup!</h2>
          <p>Join a server or start a direct message to begin chatting.</p>
        </div>
      `;
    }
    
    // Focus message input
    setTimeout(() => messageInput.focus(), 100);
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
    showToast('Account Created', 'Account created successfully! Please verify your email.', 'success');
  });

  // Handle password reset initiated
  socket.on('reset initiated', () => {
    resetError.textContent = '';
    resetSuccess.textContent = 'Password reset email sent. Please check your inbox.';
    showToast('Email Sent', 'Password reset email sent', 'success');
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

  // Handle server joined response
  socket.on('server joined', (data) => {
    const { serverName } = data;
    
    // Add to joined servers list if not already there
    if (!joinedServers.includes(serverName)) {
      joinedServers.push(serverName);
    }
    
    // Switch to the newly joined server
    switchToServer(serverName);
    showToast('Server Joined', `Joined server: ${serverName}`, 'success');
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
    showToast('Server Created', `Server created: ${serverName}`, 'success');
  });

  // Handle user's DM list
  socket.on('user dms', (dms) => {
    updateDmList(dms);
  });

  // Handle list of all users
  socket.on('all users', (users) => {
    allUsers = users;
    
    // Update DM users list if the modal is open
    if (!dmModal.classList.contains('hidden')) {
      filterDmUsers();
    }
  });

  // Handle People in Server
  socket.on('server users', (users) => {
    usersInServer = users;
    if (chatMode === 'server') {
      updatePeopleList();
    }
  });

  // Handle Discover Servers
  socket.on('discover servers', (servers) => {
    discoverServersList.innerHTML = ''; // Clear previous list
    
    if (servers.length === 0) {
      discoverServersList.innerHTML = `
        <li class="empty-list">
          <i class="fas fa-search"></i>
          <p>No servers found</p>
        </li>
      `;
      return;
    }
    
    // Filter servers if there's a search term
    const searchTerm = discoverSearchInput.value.toLowerCase();
    const filteredServers = searchTerm ? 
      servers.filter(server => server.toLowerCase().includes(searchTerm)) : 
      servers;
    
    if (filteredServers.length === 0) {
      discoverServersList.innerHTML = `
        <li class="empty-list">
          <i class="fas fa-search"></i>
          <p>No matching servers found</p>
        </li>
      `;
      return;
    }
    
    filteredServers.forEach(serverName => {
      const serverItem = document.createElement('li');
      
      // Show icon and server name
      serverItem.innerHTML = `
        <div class="server-item-info">
          <i class="fas fa-hashtag"></i>
          <span>${serverName}</span>
        </div>
      `;
      
      // Show "Joined" label if already joined
      const isJoined = joinedServers.includes(serverName);
      
      if (isJoined) {
        const joinedLabel = document.createElement('span');
        joinedLabel.className = 'joined-label';
        joinedLabel.textContent = 'Joined';
        serverItem.appendChild(joinedLabel);
      }
      
      serverItem.addEventListener('click', () => {
        if (isJoined) {
          // If already joined, just switch to the server
          switchToServer(serverName);
          toggleModal(serverModal, false);
        } else {
          // Otherwise, join the server
          socket.emit('join server', { serverName });
          toggleModal(serverModal, false);
        }
      });
      
      discoverServersList.appendChild(serverItem);
    });
  });

  // Handle server messages
  socket.on('server messages', (messages) => {
    if (chatMode === 'server') {
      // Clear current messages
      messagesDiv.innerHTML = '';
      
      const MAX_RENDERED_MESSAGES = 100;
      
      // Limit number of rendered messages if there are too many
      const messagesToRender = messages.length > MAX_RENDERED_MESSAGES 
        ? messages.slice(messages.length - MAX_RENDERED_MESSAGES) 
        : messages;
      
      // Add a notice if messages were truncated
      if (messages.length > MAX_RENDERED_MESSAGES) {
        const truncationNotice = document.createElement('div');
        truncationNotice.className = 'truncation-notice';
        truncationNotice.innerHTML = `
          <i class="fas fa-info-circle"></i>
          <span>Showing the ${MAX_RENDERED_MESSAGES} most recent messages. ${messages.length - MAX_RENDERED_MESSAGES} older messages are not displayed.</span>
        `;
        messagesDiv.appendChild(truncationNotice);
      }
      
      // Render batch of messages
      renderMessages(messagesToRender);
      
      // Scroll to bottom
      safeScrollToBottom(false);
    }
  });

  // Handle DM message history
  socket.on('dm messages', ({ otherUser, messages }) => {
    messagesDiv.innerHTML = '';
    
    const MAX_RENDERED_MESSAGES = 100;
    
    // Limit number of rendered messages if there are too many
    const messagesToRender = messages.length > MAX_RENDERED_MESSAGES 
      ? messages.slice(messages.length - MAX_RENDERED_MESSAGES) 
      : messages;
    
    // Add truncation notice if needed
    if (messages.length > MAX_RENDERED_MESSAGES) {
      const truncationNotice = document.createElement('div');
      truncationNotice.className = 'truncation-notice';
      truncationNotice.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>Showing the ${MAX_RENDERED_MESSAGES} most recent messages. ${messages.length - MAX_RENDERED_MESSAGES} older messages are not displayed.</span>
      `;
      messagesDiv.appendChild(truncationNotice);
    }
    
    // If no messages, show a welcome message
    if (messages.length === 0) {
      const welcomeMessage = document.createElement('div');
      welcomeMessage.className = 'welcome-message';
      welcomeMessage.innerHTML = `
        <div class="welcome-icon"><i class="fas fa-comments"></i></div>
        <h2>Start a conversation</h2>
        <p>This is the beginning of your direct message history with ${filterUsername(otherUser)}.</p>
      `;
      messagesDiv.appendChild(welcomeMessage);
    } else {
      // Render batch of messages
      renderDmMessages(messagesToRender);
    }
    
    // Scroll to bottom
    safeScrollToBottom(false);
  });

  // Receive server message
  socket.on('server message', ({ username: msgUsername, message, timestamp, serverName, attachment }) => {
    // If this server is currently active, display the message
    if (chatMode === 'server' && activeServer === serverName) {
      const wasNearBottom = isNearBottom();
      
      // Create the message element
      const messageContainer = document.createElement('div');
      messageContainer.className = 'message-container';
      messageContainer.setAttribute('data-username', msgUsername);
      messageContainer.setAttribute('data-timestamp', timestamp);
      
      if (msgUsername === username) {
        messageContainer.classList.add('own-message');
      }
      
      // Check if we should group this with previous messages
      const lastMsg = messagesDiv.querySelector('.message-container:last-child');
      const shouldGroup = lastMsg && 
                        lastMsg.getAttribute('data-username') === msgUsername &&
                        Math.abs(parseInt(lastMsg.getAttribute('data-timestamp')) - timestamp) < 5 * 60 * 1000; // 5 minutes
      
      // Message bubble contains the actual message content
      const messageBubble = document.createElement('div');
      messageBubble.className = 'message-bubble';
      
      // Only show the header for new message groups
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
        // For grouped messages, just add a small timestamp
        const inlineTime = document.createElement('span');
        inlineTime.className = 'inline-timestamp';
        inlineTime.textContent = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageBubble.appendChild(inlineTime);
      }
      
      // Message content
      const messageContent = document.createElement('div');
      messageContent.className = 'message-content';
      messageContent.textContent = message;
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
      
      // Add context menu
      messageBubble.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        
        const menuItems = [
          { text: 'Reply', icon: 'reply', action: () => { /* Reply functionality */ } },
          { text: 'Copy Text', icon: 'copy', action: () => {
            navigator.clipboard.writeText(message)
              .then(() => showToast('Copied', 'Text copied to clipboard', 'success'))
              .catch(() => showToast('Error', 'Failed to copy text', 'error'));
          }},
          { divider: true }
        ];
        
        if (msgUsername === username) {
          menuItems.push({ 
            text: 'Delete Message', 
            icon: 'trash-alt', 
            danger: true, 
            action: () => {
              if (confirm('Are you sure you want to delete this message?')) {
                // Delete message functionality
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
      
      // Add to DOM
      messagesDiv.appendChild(messageContainer);
      
      // Hide typing indicator now that a message arrived
      typingIndicator.classList.add('hidden');
      
      // Auto-scroll if user was near bottom
      if (wasNearBottom) {
        safeScrollToBottom();
      }
      
      // Play notification sound if it's not our own message
      if (msgUsername !== username && userSettings.notificationSound) {
        messageSound.play().catch(e => console.error('Error playing sound:', e));
      }
    } 
    // Otherwise mark as unread if it's not our own message
    else if (msgUsername !== username && joinedServers.includes(serverName)) {
      unreadServers[serverName] = true;
      updateServerListUI();
      
      if (userSettings.enableNotifications) {
        // Show notification
        const displayName = filterUsername(msgUsername);
        showNotification(
          `New message in ${serverName}`,
          `${displayName}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`
        );
      }
    }
  });

  // Receive DM
  socket.on('dm message', ({ from, to, message, timestamp, attachment }) => {
    // If this DM is currently active, display it
    if (chatMode === 'dm' && ((from === activeDm) || (to === activeDm))) {
      const wasNearBottom = isNearBottom();
      
      // Create the message element
      const messageContainer = document.createElement('div');
      messageContainer.className = 'message-container';
      messageContainer.setAttribute('data-username', from);
      messageContainer.setAttribute('data-timestamp', timestamp);
      
      if (from === username) {
        messageContainer.classList.add('own-message');
      }
      
      // Check if we should group this with previous messages
      const lastMsg = messagesDiv.querySelector('.message-container:last-child');
      const shouldGroup = lastMsg && 
                        lastMsg.getAttribute('data-username') === from &&
                        Math.abs(parseInt(lastMsg.getAttribute('data-timestamp')) - timestamp) < 5 * 60 * 1000; // 5 minutes
      
      // Message bubble contains the actual message content
      const messageBubble = document.createElement('div');
      messageBubble.className = 'message-bubble';
      
      // Only show the header for new message groups
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
        // For grouped messages, just add a small timestamp
        const inlineTime = document.createElement('span');
        inlineTime.className = 'inline-timestamp';
        inlineTime.textContent = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageBubble.appendChild(inlineTime);
      }
      
      // Message content
      const messageContent = document.createElement('div');
      messageContent.className = 'message-content';
      messageContent.textContent = message;
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
      
      // Add context menu
      messageBubble.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        
        const menuItems = [
          { text: 'Reply', icon: 'reply', action: () => { /* Reply functionality */ } },
          { text: 'Copy Text', icon: 'copy', action: () => {
            navigator.clipboard.writeText(message)
              .then(() => showToast('Copied', 'Text copied to clipboard', 'success'))
              .catch(() => showToast('Error', 'Failed to copy text', 'error'));
          }},
          { divider: true }
        ];
        
        if (from === username) {
          menuItems.push({ 
            text: 'Delete Message', 
            icon: 'trash-alt', 
            danger: true, 
            action: () => {
              if (confirm('Are you sure you want to delete this message?')) {
                // Delete message functionality
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
      
      // Add to DOM
      messagesDiv.appendChild(messageContainer);
      
      // Hide typing indicator now that a message arrived
      typingIndicator.classList.add('hidden');
      
      // Auto-scroll if user was near bottom
      if (wasNearBottom) {
        safeScrollToBottom();
      }
      
      // Play notification sound if it's not our own message
      if (from !== username && userSettings.notificationSound) {
        messageSound.play().catch(e => console.error('Error playing sound:', e));
      }
    } 
    // Otherwise mark as unread if it's not our own message
    else if (from !== username) {
      unreadDms[from] = true;
      socket.emit('get dms'); // Refresh DM list to show unread badge
      
      if (userSettings.enableNotifications) {
        // Show notification
        const displayName = filterUsername(from);
        showNotification(
          `Message from ${displayName}`,
          `${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`
        );
      }
    }
  });
  
  // Handle typing events
  socket.on('typing', ({ user, room }) => {
    if ((chatMode === 'server' && room === activeServer) || 
        (chatMode === 'dm' && (user === activeDm || room === username))) {
      
      // Don't show typing for own messages
      if (user !== username) {
        typingIndicator.querySelector('span:last-child').textContent = `${filterUsername(user)} is typing...`;
        typingIndicator.classList.remove('hidden');
        
        // Scroll to bottom if user was already at bottom
        if (isNearBottom()) {
          safeScrollToBottom();
        }
      }
    }
  });
  
  socket.on('stop typing', ({ user, room }) => {
    if ((chatMode === 'server' && room === activeServer) || 
        (chatMode === 'dm' && (user === activeDm || room === username))) {
      
      typingIndicator.classList.add('hidden');
    }
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
  
  // Toast for reconnection
  socket.on('reconnect', () => {
    showToast('Reconnected', 'Connection restored', 'success');
  });
  
  socket.on('disconnect', () => {
    showToast('Disconnected', 'Connection lost. Attempting to reconnect...', 'error');
  });
});