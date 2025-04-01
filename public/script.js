document.addEventListener('DOMContentLoaded', () => {

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
    } else {
    document.documentElement.classList.remove('dark');
    }

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

    const socket = io();

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

    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileUsersToggle = document.getElementById('mobile-users-toggle');
    const sidebarClose = document.getElementById('sidebar-close');
    const sidebar = document.getElementById('sidebar');
    const mobileTitle = document.getElementById('mobile-title');

    const createServerTab = document.getElementById('create-server-tab');
    const joinServerTab = document.getElementById('join-server-tab');
    const discoverServerTab = document.getElementById('discover-server-tab');
    const createServerPanel = document.getElementById('create-server-panel');
    const joinServerPanel = document.getElementById('join-server-panel');
    const discoverServerPanel = document.getElementById('discover-server-panel');
    const joinServerInput = document.getElementById('join-server-input');
    const discoverSearchInput = document.getElementById('discover-search-input');

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

    const contextMenu = document.getElementById('context-menu');

    const toastContainer = document.getElementById('toast-container');

    const tutorialModal = document.getElementById('tutorial-modal');
    const tutorialCloseButton = document.getElementById('tutorial-close-button');
    const showTutorialButton = document.getElementById('show-tutorial-button');
    const tutorialSteps = document.querySelectorAll('.tutorial-step');
    const prevStepButton = document.getElementById('prev-step');
    const nextStepButton = document.getElementById('next-step');
    const currentStepSpan = document.getElementById('current-step');
    const totalStepsSpan = document.getElementById('total-steps');

    let username = '';
    let activeServer = null;
    let activeDm = null;
    let usersInServer = [];
    let chatMode = 'server'; 
    let allUsers = [];
    let unreadDms = {};
    let lastActivity = { server: null, dm: null };
    let joinedServers = [];
    let unreadServers = {};
    let selectedFile = null;
    let notificationPermission = 'default';
    let isTyping = false;
    let typingTimeout = null;
    let processedMessageIds = new Set(); 
    let reportedMessages = new Set(); 
    let bannedUsers = new Set(); 
    let userReportCounts = new Map(); 
    let currentTutorialStep = 1;
    const TOTAL_TUTORIAL_STEPS = 5;
    let isFirstTimeUser = false;
    let isReconnecting = false;

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
    hardwareAcceleration: true,
    completedTutorial: false 
    };

    let userSettings = { ...defaultSettings };

    const isMobile = window.innerWidth <= 768;

    const messageSound = new Audio('https://cdn.jsdelivr.net/gh/zvakanaka/soundelicious@master/src/sounds/notification_decorative-01.mp3');

    const TYPING_TIMEOUT = 3000; 

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

    isFirstTimeUser = !userSettings.completedTutorial;
    }

    function saveSettings() {
    try {
    localStorage.setItem('wasup-settings', JSON.stringify(userSettings));
    } catch (error) {
    console.error('Error saving settings:', error);
    }
    }

    function applySettings() {
    applyTheme();
    applyMessageStyle();
    applyFontSize();
    }

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

    function applyMessageStyle() {
        if (userSettings.messageStyle === 'compact') {
            messagesDiv.classList.add('compact-messages');
        } else {
            messagesDiv.classList.remove('compact-messages');
        }

    document.querySelectorAll('.selector-option[data-value]').forEach(option => {
        if (option.dataset.value === userSettings.messageStyle) {
            option.classList.add('active');
        } else if (option.parentElement.classList.contains('selector') &&
            option.parentElement.querySelector('.selector-option.active') !== option) {
            option.classList.remove('active');
        }
    });
}

    function applyFontSize() {
    document.body.style.fontSize = userSettings.fontSize === 'small' ? '14px' :
    userSettings.fontSize === 'large' ? '18px' : '16px';

    document.querySelectorAll('.selector-option[data-value]').forEach(option => {
    if (option.dataset.value === userSettings.fontSize) {
    option.classList.add('active');
    } else if (option.parentElement.classList.contains('selector') &&
    option.parentElement.querySelector('.selector-option.active') !== option) {
    option.classList.remove('active');
    }
    });
    }

    function filterUsername(name) {
    if (!userSettings.usernameFilter) return name;

    let filteredName = name;
    const wordList = Array.isArray(userSettings.filterWords)
    ? userSettings.filterWords
    : defaultSettings.filterWords;

    wordList.forEach(word => {

    const regex = new RegExp(word, 'gi');
    if (regex.test(filteredName)) {

    filteredName = filteredName.replace(regex, match => '*'.repeat(match.length));
    }
    });

    return filteredName;
    }

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

    toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.remove();
    });

    toastContainer.appendChild(toast);

    setTimeout(() => {
    if (toast.parentNode === toastContainer) {
    toastContainer.removeChild(toast);
    }
    }, 5000);

    if (userSettings.notificationSound && type !== 'error') {
    messageSound.play().catch(e => console.error('Error playing sound:', e));
    }
    }

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

    function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;

    if (date.toDateString() === now.toDateString()) {
    return `Today at ${formattedTime}`;
    }

    if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${formattedTime}`;
    }

    if (date.getFullYear() === now.getFullYear()) {
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day} at ${formattedTime}`;
    }

    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year} at ${formattedTime}`;
    }

    function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
    }

    function toggleModal(modal, show = true) {
    if (show) {
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('active'), 10);

    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) {
    overlay.addEventListener('click', () => toggleModal(modal, false), { once: true });
    }
    } else {
    modal.classList.remove('active');
    setTimeout(() => modal.classList.add('hidden'), 300);
    }
    }

    function safeScrollToBottom(smooth = true) {

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

    function isNearBottom() {
    const tolerance = 100; 
    return messagesDiv.scrollHeight - messagesDiv.scrollTop - messagesDiv.clientHeight < tolerance;
    }

    function showContextMenu(event, items = []) {
    event.preventDefault();

    contextMenu.querySelector('.context-menu-items').innerHTML = '';

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

    contextMenu.style.top = `${event.clientY}px`;
    contextMenu.style.left = `${event.clientX}px`;

    contextMenu.classList.remove('hidden');

    const rect = contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
    contextMenu.style.left = `${window.innerWidth - rect.width - 5}px`;
    }
    if (rect.bottom > window.innerHeight) {
    contextMenu.style.top = `${window.innerHeight - rect.height - 5}px`;
    }

    document.addEventListener('click', hideContextMenu, { once: true });
    document.addEventListener('contextmenu', hideContextMenu, { once: true });
    }

    function hideContextMenu() {
    contextMenu.classList.add('hidden');
    }

    function showTutorial() {
    toggleModal(tutorialModal, true);

    updateTutorialStep(1);
    }

    function updateTutorialStep(stepNumber) {

    tutorialSteps.forEach(step => step.classList.remove('active'));

    const currentStep = document.querySelector(`.tutorial-step[data-step="${stepNumber}"]`);
    if (currentStep) {
        currentStep.classList.add('active');
    }

    currentStepSpan.textContent = stepNumber;
    totalStepsSpan.textContent = TOTAL_TUTORIAL_STEPS;

    prevStepButton.disabled = stepNumber === 1;
    nextStepButton.textContent = stepNumber === TOTAL_TUTORIAL_STEPS ? 'Finish' : 'Next';
    currentTutorialStep = stepNumber;
    }

    function nextTutorialStep() {
    if (currentTutorialStep < TOTAL_TUTORIAL_STEPS) {
        updateTutorialStep(currentTutorialStep + 1);
    } else {

        toggleModal(tutorialModal, false);
        userSettings.completedTutorial = true;
        saveSettings();
        showToast('Tutorial Completed', 'You can access the tutorial anytime via the Help button.', 'success');
    }
    }

    function prevTutorialStep() {
    if (currentTutorialStep > 1) {
        updateTutorialStep(currentTutorialStep - 1);
    }
    }

    function reportMessage(messageEl, reportedUser) {

    const reportDialog = document.createElement('div');
    reportDialog.className = 'report-dialog';
    reportDialog.innerHTML = `
    <p>Report this message sent by <strong>${reportedUser}</strong>?</p>
    <div class="report-dialog-actions">
    <button class="secondary-button" id="cancel-report">Cancel</button>
    <button class="primary-button" id="confirm-report">Report</button>
    </div>
    `;

    messageEl.appendChild(reportDialog);

    document.getElementById('cancel-report').addEventListener('click', () => {
    reportDialog.remove();
    });

    document.getElementById('confirm-report').addEventListener('click', () => {
    reportDialog.remove();

    messageEl.classList.add('message-reported');
    reportedMessages.add(messageEl.getAttribute('data-message-id'));

    const currentCount = userReportCounts.get(reportedUser) || 0;
    userReportCounts.set(reportedUser, currentCount + 1);

    if (userReportCounts.get(reportedUser) >= 5 && !bannedUsers.has(reportedUser)) {
        bannedUsers.add(reportedUser);
        socket.emit('ban user', { username: reportedUser });
        showToast('User Banned', `${reportedUser} has been banned for receiving 5 reports.`, 'success');

        document.querySelectorAll(`[data-username="${reportedUser}"]`).forEach(el => {
            if (!el.classList.contains('user-banned')) {
                el.classList.add('user-banned');
            }
        });
    }

    showToast('Message Reported', 'Thank you for helping keep the community safe.', 'success');

    socket.emit('report message', { 
        reportedUser,
        messageId: messageEl.getAttribute('data-message-id')
    });
    });
    }

    function hideAllAuthForms() {
    loginForm.classList.add('hidden');
    signupForm.classList.add('hidden');
    resetForm.classList.add('hidden');
    emailVerification.classList.add('hidden');
    }

    function clearFormErrors() {
    loginError.textContent = '';
    signupError.textContent = '';
    resetError.textContent = '';
    resetSuccess.textContent = '';
    }

    function initNotifications() {

    if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return;
    }

    if (Notification.permission === 'granted') {
    notificationPermission = 'granted';
    return;
    }

    if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
    notificationPermission = permission;
    if (permission === 'granted') {
    showToast('Notifications Enabled', 'You will now receive notifications for new messages.', 'success');
    }
    });
    }
    }

    function handleFileSelection(e) {
    if (e.target.files.length > 0) {
    selectedFile = e.target.files[0];

    if (selectedFile.size > 5 * 1024 * 1024) {
    showToast('Error', 'File size exceeds 5MB limit', 'error');
    selectedFile = null;
    fileInput.value = '';
    return;
    }

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

    function updateServerListUI() {
    serverList.innerHTML = '';

    joinedServers.forEach(serverName => {
    const serverItem = document.createElement('li');

    serverItem.innerHTML = `
    <i class="fas fa-hashtag"></i>
    <span>${serverName}</span>
    `;

    if (unreadServers[serverName]) {
    const badge = document.createElement('span');
    badge.className = 'unread-badge';
    serverItem.appendChild(badge);
    }

    if (activeServer === serverName && chatMode === 'server') {
    serverItem.classList.add('active');
    }

    serverItem.addEventListener('contextmenu', (e) => {
    showContextMenu(e, [
    { text: 'Mark as Read', icon: 'check', action: () => markServerAsRead(serverName) },
    { divider: true },
    { text: 'Leave Server', icon: 'sign-out-alt', danger: true, action: () => leaveServer(serverName) }
    ]);
    });

    serverItem.addEventListener('click', () => {
    switchToServer(serverName);
    if (isMobile) {
    sidebar.classList.remove('active');
    }
    });

    serverList.appendChild(serverItem);
    });
    }

    function updateDmList(dms) {
    dmList.innerHTML = '';

    dms.forEach(({ user, hasUnread }) => {
    const dmItem = document.createElement('li');
    const displayName = filterUsername(user);

    dmItem.innerHTML = `
    <i class="fas fa-user"></i>
    <span>${displayName}</span>
    `;

    if (hasUnread) {
    const badge = document.createElement('span');
    badge.className = 'unread-badge';
    dmItem.appendChild(badge);
    }

    if (activeDm === user && chatMode === 'dm') {
    dmItem.classList.add('active');
    }

    if (bannedUsers.has(user)) {
    dmItem.classList.add('user-banned');
    }

    dmItem.addEventListener('contextmenu', (e) => {
    showContextMenu(e, [
    { text: 'Mark as Read', icon: 'check', action: () => markDmAsRead(user) }
    ]);
    });

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

    function markServerAsRead(serverName) {
    if (unreadServers[serverName]) {
    socket.emit('mark server read', { serverName });
    delete unreadServers[serverName];
    updateServerListUI();
    }
    }

    function markDmAsRead(otherUser) {
    socket.emit('mark dm read', { otherUser });
    }

    function leaveServer(serverName) {

    if (confirm(`Are you sure you want to leave the server "${serverName}"?`)) {
    socket.emit('leave server', { serverName });

    const index = joinedServers.indexOf(serverName);
    if (index > -1) {
    joinedServers.splice(index, 1);
    updateServerListUI();
    }

    if (activeServer === serverName) {
    if (joinedServers.length > 0) {
    switchToServer(joinedServers[0]);
    } else {

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

    function switchToServer(serverName) {
    if (serverName === activeServer && chatMode === 'server') return;

    activeServer = serverName;

    if (unreadServers[serverName]) {
    socket.emit('mark server read', { serverName });
    delete unreadServers[serverName];
    updateServerListUI();
    }

    switchToServerMode(serverName);

    socket.emit('get server messages', { serverName });
    socket.emit('get server users', { serverName });

    mobileTitle.textContent = serverName;
    }

    function switchToServerMode(serverName) {
    chatMode = 'server';
    activeServer = serverName;
    activeDm = null;

    socket.emit('update last activity', { server: serverName, dm: null });

    currentServer.textContent = serverName;
    messagesDiv.innerHTML = '';
    peopleList.classList.remove('hidden');

    typingIndicator.classList.add('hidden');

    updateServerListUI();
    updateDmList([]); 
    }

    function switchToDmMode(otherUser) {
    chatMode = 'dm';
    activeDm = otherUser;
    activeServer = null;

    socket.emit('update last activity', { server: null, dm: otherUser });

    if (unreadDms[otherUser]) {
    socket.emit('mark dm read', { otherUser });
    delete unreadDms[otherUser];
    }

    const displayName = filterUsername(otherUser);
    currentServer.textContent = displayName;
    serverMembersCount.textContent = 'Direct Message';
    messagesDiv.innerHTML = '';
    peopleList.classList.add('hidden');

    typingIndicator.classList.add('hidden');

    mobileTitle.textContent = displayName;

    updateServerListUI(); 
    socket.emit('get dms'); 
    }

    function updatePeopleList() {
    userList.innerHTML = '';
    serverMembersCount.textContent = `${usersInServer.length} Members`;

    const onlineUsers = usersInServer.length; 
    document.getElementById('online-count').textContent = `${onlineUsers} online`;

    usersInServer.forEach(user => {
    const displayName = filterUsername(user);
    const isCurrentUser = user === username;
    const isBanned = bannedUsers.has(user);

    const userItem = document.createElement('li');
    if (isBanned) {
        userItem.classList.add('user-banned');
    }

    userItem.innerHTML = `
    <div class="user-item-info">
    <i class="fas fa-user"></i>
    <span>${displayName}${isCurrentUser ? ' (you)' : ''}</span>
    </div>
    `;

    if (!isCurrentUser && !isBanned) {
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

    if (!isBanned) {
        menuItems.push({
            text: 'Report User',
            icon: 'flag',
            danger: true,
            action: () => {
                if (confirm(`Report user ${user}?`)) {

                    const currentCount = userReportCounts.get(user) || 0;
                    userReportCounts.set(user, currentCount + 1);

                    if (userReportCounts.get(user) >= 5 && !bannedUsers.has(user)) {
                        bannedUsers.add(user);
                        socket.emit('ban user', { username: user });
                        showToast('User Banned', `${user} has been banned for receiving 5 reports.`, 'success');
                        updatePeopleList();
                    } else {
                        socket.emit('report user', { username: user });
                        showToast('User Reported', `You have reported ${user}.`, 'success');
                    }
                }
            }
        });
    }
    }

    if (menuItems.length > 0) {
    showContextMenu(e, menuItems);
    }
    });

    userList.appendChild(userItem);
    });
    }

    function filterDmUsers() {
    const searchTerm = dmSearchInput.value.toLowerCase();
    const filteredUsers = allUsers.filter(user =>
    user.toLowerCase().includes(searchTerm) && user !== username
    );
    displayDmUsers(filteredUsers);
    }

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
    if (user !== username) { 
    const userItem = document.createElement('li');
    const displayName = filterUsername(user);
    const isBanned = bannedUsers.has(user);

    if (isBanned) {
        userItem.classList.add('user-banned');
    }

    userItem.innerHTML = `
    <i class="fas fa-user"></i>
    <span>${displayName}</span>
    `;

    userItem.addEventListener('click', () => {
        if (!isBanned) {
            socket.emit('get dm messages', { otherUser: user });
            switchToDmMode(user);
            toggleModal(dmModal, false);
        } else {
            showToast('User Banned', 'This user has been banned and cannot receive messages.', 'error');
        }
    });

    dmUsersList.appendChild(userItem);
    }
    });
    }

    function filterDiscoverServers() {
    const searchTerm = discoverSearchInput.value.toLowerCase();
    socket.emit('get discover servers');
    }

    function generateMessageId(username, timestamp, message) {
    return `${username}-${timestamp}-${message.substring(0, 10)}`;
    }

    function sendMessage() {
    const message = messageInput.value.trim();

    if (!message && !selectedFile) return;

    clearTimeout(typingTimeout);
    isTyping = false;
    socket.emit('stop typing', { room: activeServer || activeDm });

    const timestamp = Date.now();
    const messageId = message ? generateMessageId(username, timestamp, message) : null;

    if (chatMode === 'server' && activeServer) {

        if (message && !processedMessageIds.has(messageId)) {
            displayLocalMessage(username, message, timestamp, messageId);
        }

        if (selectedFile) {
            uploadAndSendFile(activeServer, null, message);
        } else if (message) {
            socket.emit('server message', { 
                serverName: activeServer, 
                message,
                timestamp 
            });
        }
    } else if (chatMode === 'dm' && activeDm) {

        if (message && !processedMessageIds.has(messageId)) {
            displayLocalMessage(username, message, timestamp, messageId);
        }

        if (selectedFile) {
            uploadAndSendFile(null, activeDm, message);
        } else if (message) {
            socket.emit('dm message', { 
                to: activeDm, 
                message,
                timestamp  
            });
        }
    }

    messageInput.value = '';
    messageInput.focus();
    }

    function displayLocalMessage(sender, text, timestamp, messageId) {

    processedMessageIds.add(messageId);

    const wasNearBottom = isNearBottom();

    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container own-message';
    messageContainer.setAttribute('data-username', sender);
    messageContainer.setAttribute('data-timestamp', timestamp);
    messageContainer.setAttribute('data-message-id', messageId);

    const messageBubble = document.createElement('div');
    messageBubble.className = 'message-bubble';

    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';

    const formattedTime = formatTimestamp(timestamp);
    messageHeader.innerHTML = `
        <span class="message-username">${sender}</span>
        <span class="message-timestamp">${formattedTime}</span>
    `;
    messageBubble.appendChild(messageHeader);

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = text;
    messageBubble.appendChild(messageContent);

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

    messageBubble.addEventListener('contextmenu', (e) => {
        e.preventDefault();

        const menuItems = [
            { text: 'Reply', icon: 'reply', action: () => {  } },
            { text: 'Copy Text', icon: 'copy', action: () => {
                navigator.clipboard.writeText(text)
                    .then(() => showToast('Copied', 'Text copied to clipboard', 'success'))
                    .catch(() => showToast('Error', 'Failed to copy text', 'error'));
            }},
            { divider: true },
            { text: 'Delete Message', icon: 'trash-alt', danger: true, action: () => {
                if (confirm('Are you sure you want to delete this message?')) {

                    showToast('Deleted', 'Message has been deleted', 'success');
                }
            }}
        ];

        showContextMenu(e, menuItems);
    });

    messageContainer.appendChild(messageBubble);
    messagesDiv.appendChild(messageContainer);

    if (wasNearBottom) {
        safeScrollToBottom();
    }
    }

    function handleTyping() {
    if (!isTyping) {
    isTyping = true;

    if (chatMode === 'server' && activeServer) {
    socket.emit('typing', { room: activeServer });
    } else if (chatMode === 'dm' && activeDm) {
    socket.emit('typing', { room: activeDm });
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
    isTyping = false;

    if (chatMode === 'server' && activeServer) {
    socket.emit('stop typing', { room: activeServer });
    } else if (chatMode === 'dm' && activeDm) {
    socket.emit('stop typing', { room: activeDm });
    }
    }, TYPING_TIMEOUT);
    } else {

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
    isTyping = false;

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

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);
    xhr.setRequestHeader('X-Socket-ID', socket.id);
    xhr.setRequestHeader('X-Username', username);

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

    selectedFile = null;
    fileInput.value = '';
    attachmentPreview.classList.add('hidden');

    progressContainer.remove();
    } else {

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

    function renderMessages(messages) {

    const fragment = document.createDocumentFragment();
    let lastSender = null;
    let lastDate = null;

    messages.forEach((message, index) => {
    const { username: msgUsername, message: messageText, timestamp, attachment } = message;
    const messageId = generateMessageId(msgUsername, timestamp, messageText);

    if (processedMessageIds.has(messageId)) {
        return;
    }
    processedMessageIds.add(messageId);

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
    lastSender = null; 
    }

    const isNewGroup = lastSender !== msgUsername;
    lastSender = msgUsername;

    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';
    messageContainer.setAttribute('data-username', msgUsername);
    messageContainer.setAttribute('data-timestamp', timestamp);
    messageContainer.setAttribute('data-message-id', messageId);

    if (msgUsername === username) {
    messageContainer.classList.add('own-message');
    }

    if (bannedUsers.has(msgUsername)) {
    messageContainer.classList.add('user-banned');
    }

    if (reportedMessages.has(messageId)) {
    messageContainer.classList.add('message-reported');
    }

    const messageBubble = document.createElement('div');
    messageBubble.className = 'message-bubble';

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

    const inlineTime = document.createElement('span');
    inlineTime.className = 'inline-timestamp';
    inlineTime.textContent = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageBubble.appendChild(inlineTime);
    }

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = messageText;
    messageBubble.appendChild(messageContent);

    if (attachment) {
    const attachmentHTML = createAttachmentHTML(attachment);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = attachmentHTML;
    while (tempDiv.firstChild) {
    messageBubble.appendChild(tempDiv.firstChild);
    }
    }

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

    messageBubble.addEventListener('contextmenu', (e) => {
    e.preventDefault();

    const menuItems = [
    { text: 'Reply', icon: 'reply', action: () => {  } },
    { text: 'Copy Text', icon: 'copy', action: () => {
    navigator.clipboard.writeText(messageText)
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

        showToast('Deleted', 'Message has been deleted', 'success');
    }
    }
    });
    } else if (!reportedMessages.has(messageId) && !bannedUsers.has(msgUsername)) {
    menuItems.push({
    text: 'Report Message',
    icon: 'flag',
    danger: true,
    action: () => {
        reportMessage(messageContainer, msgUsername);
    }
    });
    }

    showContextMenu(e, menuItems);
    });

    messageContainer.appendChild(messageBubble);
    fragment.appendChild(messageContainer);
    });

    messagesDiv.appendChild(fragment);
    }

    function renderDmMessages(messages) {
    const fragment = document.createDocumentFragment();
    let lastSender = null;
    let lastDate = null;

    messages.forEach((message, index) => {
    const { from, to, message: messageText, timestamp, attachment } = message;
    const messageId = generateMessageId(from, timestamp, messageText);

    if (processedMessageIds.has(messageId)) {
        return;
    }
    processedMessageIds.add(messageId);

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
    lastSender = null; 
    }

    const isNewGroup = lastSender !== from;
    lastSender = from;

    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';
    messageContainer.setAttribute('data-username', from);
    messageContainer.setAttribute('data-timestamp', timestamp);
    messageContainer.setAttribute('data-message-id', messageId);

    if (from === username) {
    messageContainer.classList.add('own-message');
    }

    if (bannedUsers.has(from)) {
    messageContainer.classList.add('user-banned');
    }

    if (reportedMessages.has(messageId)) {
    messageContainer.classList.add('message-reported');
    }

    const messageBubble = document.createElement('div');
    messageBubble.className = 'message-bubble';

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

    const inlineTime = document.createElement('span');
    inlineTime.className = 'inline-timestamp';
    inlineTime.textContent = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageBubble.appendChild(inlineTime);
    }

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = messageText;
    messageBubble.appendChild(messageContent);

    if (attachment) {
    const attachmentHTML = createAttachmentHTML(attachment);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = attachmentHTML;
    while (tempDiv.firstChild) {
    messageBubble.appendChild(tempDiv.firstChild);
    }
    }

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

    messageBubble.addEventListener('contextmenu', (e) => {
    e.preventDefault();

    const menuItems = [
    { text: 'Reply', icon: 'reply', action: () => {  } },
    { text: 'Copy Text', icon: 'copy', action: () => {
    navigator.clipboard.writeText(messageText)
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

        showToast('Deleted', 'Message has been deleted', 'success');
    }
    }
    });
    } else if (!reportedMessages.has(messageId) && !bannedUsers.has(from)) {
    menuItems.push({
    text: 'Report Message',
    icon: 'flag',
    danger: true,
    action: () => {
        reportMessage(messageContainer, from);
    }
    });
    }

    showContextMenu(e, menuItems);
    });

    messageContainer.appendChild(messageBubble);
    fragment.appendChild(messageContainer);
    });

    messagesDiv.appendChild(fragment);
    }

    loadSettings();

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

    loginButton.addEventListener('click', () => {
    const username = loginUsername.value.trim();
    const password = loginPassword.value;

    if (!username || !password) {
    loginError.textContent = 'Please enter both username and password';
    return;
    }

    socket.emit('login', { username, password });
    });

    loginPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
    loginButton.click();
    }
    });

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
    signupError.textContent = 'Please enter a valid email address';
    return;
    }

    socket.emit('signup', { username, email, password });
    });

    resetButton.addEventListener('click', () => {
    const email = resetEmail.value.trim();

    if (!email) {
    resetError.textContent = 'Please enter your email address';
    return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
    resetError.textContent = 'Please enter a valid email address';
    return;
    }

    socket.emit('request password reset', { email });
    });

    logoutButton.addEventListener('click', () => {

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

    loginUsername.value = '';
    loginPassword.value = '';
    signupUsername.value = '';
    signupEmail.value = '';
    signupPassword.value = '';
    signupConfirmPassword.value = '';
    resetEmail.value = '';

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
    processedMessageIds.clear();
    reportedMessages.clear();
    bannedUsers.clear();
    userReportCounts.clear();

    showToast('Logged Out', 'You have been logged out successfully', 'info');
    });

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

    manageServerButton.addEventListener('click', () => {

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

    setTimeout(() => dmSearchInput.focus(), 100);
    });

    modalCloseButton.addEventListener('click', () => {
    toggleModal(serverModal, false);
    });

    dmModalCloseButton.addEventListener('click', () => {
    toggleModal(dmModal, false);
    });

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

    dmSearchInput.addEventListener('input', filterDmUsers);

    discoverSearchInput.addEventListener('input', filterDiscoverServers);

    fileInput.addEventListener('change', handleFileSelection);

    sendButton.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
    }
    });

    messageInput.addEventListener('input', handleTyping);

    settingsButton.addEventListener('click', () => {
    toggleModal(settingsModal, true);

    usernameFilterSetting.checked = userSettings.usernameFilter;
    filterWordsInput.value = Array.isArray(userSettings.filterWords)
    ? userSettings.filterWords.join(', ')
    : userSettings.filterWords.toString();
    notificationsSetting.checked = userSettings.enableNotifications;
    notificationSoundSetting.checked = userSettings.notificationSound;
    document.getElementById('mute-servers-setting').checked = userSettings.muteNewServers;
    document.getElementById('developer-mode-setting').checked = userSettings.developerMode;
    document.getElementById('hardware-accel-setting').checked = userSettings.hardwareAcceleration;

    updateThemeButtons();
    });

    settingsCloseButton.addEventListener('click', () => {
    toggleModal(settingsModal, false);
    });

    settingsNavItems.forEach(item => {
    item.addEventListener('click', () => {

    settingsNavItems.forEach(navItem => navItem.classList.remove('active'));
    item.classList.add('active');

    const targetSection = item.getAttribute('data-target');
    settingsSections.forEach(section => {
    section.classList.remove('active');
    if (section.id === targetSection) {
    section.classList.add('active');
    }
    });
    });
    });

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

    selectorOptions.forEach(option => {
    option.addEventListener('click', () => {
    const selector = option.parentElement;
    const options = selector.querySelectorAll('.selector-option');

    options.forEach(opt => opt.classList.remove('active'));
    option.classList.add('active');

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

    settingsSaveButton.addEventListener('click', () => {

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

    saveSettings();
    applySettings();

    toggleModal(settingsModal, false);

    showToast('Settings Saved', 'Your preferences have been updated', 'success');
    });

    settingsCancelButton.addEventListener('click', () => {
    toggleModal(settingsModal, false);

    loadSettings();
    });

    messagesDiv.addEventListener('scroll', hideContextMenu);

    document.addEventListener('click', (e) => {
    if (!contextMenu.contains(e.target)) {
    hideContextMenu();
    }
    });

    tutorialCloseButton.addEventListener('click', () => {
    toggleModal(tutorialModal, false);
    });

    showTutorialButton.addEventListener('click', () => {
    showTutorial();
    });

    prevStepButton.addEventListener('click', prevTutorialStep);
    nextStepButton.addEventListener('click', nextTutorialStep);

    socket.on('auth success', (data) => {
    username = data.username;
    userDisplay.textContent = username;
    authContainer.classList.add('hidden');
    app.classList.remove('hidden');

    socket.emit('get user servers');
    socket.emit('get dms');
    socket.emit('get all users');
    socket.emit('get banned users');

    initNotifications();

    if (!isReconnecting) {
        processedMessageIds.clear();
    }
    isReconnecting = false;

    showToast('Welcome', `Welcome back, ${username}!`, 'success');

    if (isFirstTimeUser) {

        setTimeout(() => {
            showTutorial();
        }, 1000);
    }

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

    setTimeout(() => messageInput.focus(), 100);
    });

    socket.on('user servers data', (data) => {
    joinedServers = data.servers || [];
    unreadServers = data.unreadServers || {};

    updateServerListUI();
    });

    socket.on('banned users', (users) => {
    bannedUsers = new Set(users);
    updatePeopleList();
    socket.emit('get dms');
    });

    socket.on('signup success', () => {
    hideAllAuthForms();
    emailVerification.classList.remove('hidden');
    showToast('Account Created', 'Account created successfully! Please verify your email.', 'success');
    });

    socket.on('reset initiated', () => {
    resetError.textContent = '';
    resetSuccess.textContent = 'Password reset email sent. Please check your inbox.';
    showToast('Email Sent', 'Password reset email sent', 'success');
    });

    socket.on('auth error', (data) => {
    if (data.type === 'login') {
    loginError.textContent = data.message;
    } else if (data.type === 'signup') {
    signupError.textContent = data.message;
    } else if (data.type === 'reset') {
    resetError.textContent = data.message;
    }
    });

    socket.on('server joined', (data) => {
    const { serverName } = data;

    if (!joinedServers.includes(serverName)) {
    joinedServers.push(serverName);
    }

    switchToServer(serverName);
    showToast('Server Joined', `Joined server: ${serverName}`, 'success');
    });

    socket.on('server created', (data) => {
    const { serverName } = data;

    if (!joinedServers.includes(serverName)) {
    joinedServers.push(serverName);
    }

    switchToServer(serverName);
    showToast('Server Created', `Server created: ${serverName}`, 'success');
    });

    socket.on('user dms', (dms) => {
    updateDmList(dms);
    });

    socket.on('all users', (users) => {
    allUsers = users;

    if (!dmModal.classList.contains('hidden')) {
    filterDmUsers();
    }
    });

    socket.on('server users', (users) => {
    usersInServer = users;
    if (chatMode === 'server') {
    updatePeopleList();
    }
    });

    socket.on('discover servers', (servers) => {
    discoverServersList.innerHTML = ''; 

    if (servers.length === 0) {
    discoverServersList.innerHTML = `
    <li class="empty-list">
    <i class="fas fa-search"></i>
    <p>No servers found</p>
    </li>
    `;
    return;
    }

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

    serverItem.innerHTML = `
    <div class="server-item-info">
    <i class="fas fa-hashtag"></i>
    <span>${serverName}</span>
    </div>
    `;

    const isJoined = joinedServers.includes(serverName);

    if (isJoined) {
    const joinedLabel = document.createElement('span');
    joinedLabel.className = 'joined-label';
    joinedLabel.textContent = 'Joined';
    serverItem.appendChild(joinedLabel);
    }

    serverItem.addEventListener('click', () => {
    if (isJoined) {

    switchToServer(serverName);
    toggleModal(serverModal, false);
    } else {

    socket.emit('join server', { serverName });
    toggleModal(serverModal, false);
    }
    });

    discoverServersList.appendChild(serverItem);
    });
    });

    socket.on('server messages', (messages) => {
    if (chatMode === 'server') {

    messagesDiv.innerHTML = '';

    processedMessageIds.clear();

    const MAX_RENDERED_MESSAGES = 100;

    const messagesToRender = messages.length > MAX_RENDERED_MESSAGES
    ? messages.slice(messages.length - MAX_RENDERED_MESSAGES)
    : messages;

    if (messages.length > MAX_RENDERED_MESSAGES) {
    const truncationNotice = document.createElement('div');
    truncationNotice.className = 'truncation-notice';
    truncationNotice.innerHTML = `
    <i class="fas fa-info-circle"></i>
    <span>Showing the ${MAX_RENDERED_MESSAGES} most recent messages. ${messages.length - MAX_RENDERED_MESSAGES} older messages are not displayed.</span>
    `;
    messagesDiv.appendChild(truncationNotice);
    }

    console.log(`Received ${messages.length} messages for server ${activeServer}`);

    renderMessages(messagesToRender);

    safeScrollToBottom(false);
    }
    });

    socket.on('dm messages', ({ otherUser, messages }) => {
    messagesDiv.innerHTML = '';

    processedMessageIds.clear();

    const MAX_RENDERED_MESSAGES = 100;

    const messagesToRender = messages.length > MAX_RENDERED_MESSAGES
    ? messages.slice(messages.length - MAX_RENDERED_MESSAGES)
    : messages;

    if (messages.length > MAX_RENDERED_MESSAGES) {
    const truncationNotice = document.createElement('div');
    truncationNotice.className = 'truncation-notice';
    truncationNotice.innerHTML = `
    <i class="fas fa-info-circle"></i>
    <span>Showing the ${MAX_RENDERED_MESSAGES} most recent messages. ${messages.length - MAX_RENDERED_MESSAGES} older messages are not displayed.</span>
    `;
    messagesDiv.appendChild(truncationNotice);
    }

    console.log(`Received ${messages.length} DM messages with ${otherUser}`);

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

    renderDmMessages(messagesToRender);
    }

    safeScrollToBottom(false);
    });

    socket.on('server message', ({ username: msgUsername, message, timestamp, serverName, attachment, messageId }) => {

    messageId = messageId || generateMessageId(msgUsername, timestamp, message);

    if (processedMessageIds.has(messageId)) {
        return;
    }

    if (chatMode === 'server' && activeServer === serverName) {
    const wasNearBottom = isNearBottom();

    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';
    messageContainer.setAttribute('data-username', msgUsername);
    messageContainer.setAttribute('data-timestamp', timestamp);
    messageContainer.setAttribute('data-message-id', messageId);

    if (msgUsername === username) {
    messageContainer.classList.add('own-message');
    }

    if (bannedUsers.has(msgUsername)) {
    messageContainer.classList.add('user-banned');
    }

    const lastMsg = messagesDiv.querySelector('.message-container:last-child');
    const shouldGroup = lastMsg &&
    lastMsg.getAttribute('data-username') === msgUsername &&
    Math.abs(parseInt(lastMsg.getAttribute('data-timestamp')) - timestamp) < 5 * 60 * 1000; 

    const messageBubble = document.createElement('div');
    messageBubble.className = 'message-bubble';

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

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = message;
    messageBubble.appendChild(messageContent);

    if (attachment) {
    const attachmentHTML = createAttachmentHTML(attachment);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = attachmentHTML;
    while (tempDiv.firstChild) {
    messageBubble.appendChild(tempDiv.firstChild);
    }
    }

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

    messageBubble.addEventListener('contextmenu', (e) => {
    e.preventDefault();

    const menuItems = [
    { text: 'Reply', icon: 'reply', action: () => {  } },
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

        showToast('Deleted', 'Message has been deleted', 'success');
    }
    }
    });
    } else if (!reportedMessages.has(messageId) && !bannedUsers.has(msgUsername)) {
    menuItems.push({
    text: 'Report Message',
    icon: 'flag',
    danger: true,
    action: () => {
        reportMessage(messageContainer, msgUsername);
    }
    });
    }

    showContextMenu(e, menuItems);
    });

    messageContainer.appendChild(messageBubble);

    processedMessageIds.add(messageId);

    messagesDiv.appendChild(messageContainer);

    typingIndicator.classList.add('hidden');

    if (wasNearBottom) {
    safeScrollToBottom();
    }

    if (msgUsername !== username && userSettings.notificationSound) {
    messageSound.play().catch(e => console.error('Error playing sound:', e));
    }
    }

    else if (msgUsername !== username && joinedServers.includes(serverName)) {
    unreadServers[serverName] = true;
    updateServerListUI();

    if (userSettings.enableNotifications) {

    const displayName = filterUsername(msgUsername);
    showNotification(
    `New message in ${serverName}`,
    `${displayName}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`
    );
    }
    }
    });

    socket.on('dm message', ({ from, to, message, timestamp, attachment, messageId }) => {

    messageId = messageId || generateMessageId(from, timestamp, message);

    if (processedMessageIds.has(messageId)) {
        return;
    }

    if (chatMode === 'dm' && ((from === activeDm) || (to === activeDm))) {
    const wasNearBottom = isNearBottom();

    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';
    messageContainer.setAttribute('data-username', from);
    messageContainer.setAttribute('data-timestamp', timestamp);
    messageContainer.setAttribute('data-message-id', messageId);

    if (from === username) {
    messageContainer.classList.add('own-message');
    }

    if (bannedUsers.has(from)) {
    messageContainer.classList.add('user-banned');
    }

    const lastMsg = messagesDiv.querySelector('.message-container:last-child');
    const shouldGroup = lastMsg &&
    lastMsg.getAttribute('data-username') === from &&
    Math.abs(parseInt(lastMsg.getAttribute('data-timestamp')) - timestamp) < 5 * 60 * 1000; 

    const messageBubble = document.createElement('div');
    messageBubble.className = 'message-bubble';

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

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = message;
    messageBubble.appendChild(messageContent);

    if (attachment) {
    const attachmentHTML = createAttachmentHTML(attachment);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = attachmentHTML;
    while (tempDiv.firstChild) {
    messageBubble.appendChild(tempDiv.firstChild);
    }
    }

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

    messageBubble.addEventListener('contextmenu', (e) => {
    e.preventDefault();

    const menuItems = [
    { text: 'Reply', icon: 'reply', action: () => {  } },
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

        showToast('Deleted', 'Message has been deleted', 'success');
    }
    }
    });
    } else if (!reportedMessages.has(messageId) && !bannedUsers.has(from)) {
    menuItems.push({
    text: 'Report Message',
    icon: 'flag',
    danger: true,
    action: () => {
        reportMessage(messageContainer, from);
    }
    });
    }

    showContextMenu(e, menuItems);
    });

    messageContainer.appendChild(messageBubble);

    processedMessageIds.add(messageId);

    messagesDiv.appendChild(messageContainer);

    typingIndicator.classList.add('hidden');

    if (wasNearBottom) {
    safeScrollToBottom();
    }

    if (from !== username && userSettings.notificationSound) {
    messageSound.play().catch(e => console.error('Error playing sound:', e));
    }
    }

    else if (from !== username) {
    unreadDms[from] = true;
    socket.emit('get dms'); 

    if (userSettings.enableNotifications) {

    const displayName = filterUsername(from);
    showNotification(
    `Message from ${displayName}`,
    `${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`
    );
    }
    }
    });

    socket.on('user banned', (bannedUsername) => {
    bannedUsers.add(bannedUsername);
    showToast('User Banned', `${bannedUsername} has been banned for repeated violations.`, 'warning');

    document.querySelectorAll(`[data-username="${bannedUsername}"]`).forEach(el => {
        el.classList.add('user-banned');
    });

    updatePeopleList();
    socket.emit('get dms');
    });

    socket.on('typing', ({ user, room }) => {
    if ((chatMode === 'server' && room === activeServer) ||
    (chatMode === 'dm' && (user === activeDm || room === username))) {

    if (user !== username) {
    typingIndicator.querySelector('span:last-child').textContent = `${filterUsername(user)} is typing...`;
    typingIndicator.classList.remove('hidden');

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

    socket.on('connect', () => {
    const storedUsername = localStorage.getItem('wasupUsername');
    const storedToken = localStorage.getItem('wasupToken');

    if (storedUsername && storedToken) {
        isReconnecting = true;
        socket.emit('token auth', { username: storedUsername, token: storedToken });
    }
    });

    socket.on('set token', (data) => {
    localStorage.setItem('wasupUsername', data.username);
    localStorage.setItem('wasupToken', data.token);
    });

    socket.on('clear token', () => {
    localStorage.removeItem('wasupUsername');
    localStorage.removeItem('wasupToken');
    });

    socket.on('reconnect', () => {
    showToast('Reconnected', 'Connection restored', 'success');
    });

    socket.on('disconnect', () => {
    showToast('Disconnected', 'Connection lost. Attempting to reconnect...', 'error');
    });
});