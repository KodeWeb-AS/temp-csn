// Configuration
let API_BASE_URL = 'http://localhost:3001/api';

// Import logger
import logger from './utils/logger.js';

// Staff ranks in order (from highest to lowest)
const STAFF_RANKS = [
  'Head of Staff',
  'High Staff',
  'Senior Administrator',
  'Administrator',
  'Department Council',
  'Staff Supervisor',
  'Senior Moderator',
  'Moderator',
  'Trial Moderator',
  'Discord Support',
  'Trial Discord Support',
  'Paid Permissions',
  'Needs Training'
];

// -----------------------
// DOM Element References
// -----------------------
const connectionStatus = document.getElementById('connectionStatus');
const statusText = connectionStatus.querySelector('.status-text');
const statusDot = connectionStatus.querySelector('.status-dot');

const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('resultsContainer');
const promotionsContainer = document.getElementById('promotionsContainer');
const logsContainer = document.getElementById('logsContainer');
const logsContent = document.getElementById('logsContent');
const logLevelFilter = document.getElementById('logLevelFilter');
const clearLogsBtn = document.getElementById('clearLogsBtn');

const refreshBtn = document.getElementById('refreshBtn');
const settingsBtn = document.getElementById('settingsBtn');

const staffModal = document.getElementById('staffModal');
const modalStaffName = document.getElementById('modalStaffName');
const staffForm = document.getElementById('staffForm');
const closeModalBtn = document.getElementById('closeModal');
const saveStaffBtn = document.getElementById('saveStaffBtn');
const cancelStaffBtn = document.getElementById('cancelStaffBtn');

// Staff form fields
const staffIdField = document.getElementById('staffId');
const staffDiscordId = document.getElementById('staffDiscordId');
const staffRank = document.getElementById('staffRank');
const staffDatePromoted = document.getElementById('staffDatePromoted');
const staffStrike1 = document.getElementById('staffStrike1');
const staffStrike1Date = document.getElementById('staffStrike1Date');
const staffStrike2 = document.getElementById('staffStrike2');
const staffStrike2Date = document.getElementById('staffStrike2Date');
const staffStrike3 = document.getElementById('staffStrike3');
const staffStrike3Date = document.getElementById('staffStrike3Date');
const staffWatchlist = document.getElementById('staffWatchlist');
const staffWatchlistReason = document.getElementById('staffWatchlistReason');
const watchlistReasonGroup = document.getElementById('watchlistReasonGroup');
const staffPurgatory = document.getElementById('staffPurgatory');

// Settings Modal Elements
const settingsModal = document.getElementById('settingsModal');
const closeSettingsModal = document.getElementById('closeSettingsModal');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');

const apiUrlInput = document.getElementById('apiUrl');
const showStrikesCheckbox = document.getElementById('showStrikes');
const showWatchlistCheckbox = document.getElementById('showWatchlist');
const showPurgatoryCheckbox = document.getElementById('showPurgatory');
const logLevelSelect = document.getElementById('logLevel');

// -----------------------
// Global Variables
// -----------------------
let currentStaffMember = null;
let activeTab = 'search';
let allStaffData = [];

// -----------------------
// Initialization
// -----------------------
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  setupEventListeners();
  logger.info('CSN Staff Tracker initialized');
});

// -----------------------
// App Initialization
// -----------------------
async function initializeApp() {
  checkApiConnection();
  updateWatchlistReasonVisibility();
  await loadAllStaff();
  // Removed displayLogs() from here so logs are loaded only when the Logs tab is active.
}

// -----------------------
// Event Listeners Setup
// -----------------------
function setupEventListeners() {
  // Tab switching
  tabButtons.forEach(btn =>
    btn.addEventListener('click', () => switchTab(btn.dataset.tab))
  );

  // Search input
  searchInput.addEventListener('input', debounce(handleSearch, 300));

  // Modal controls
  closeModalBtn.addEventListener('click', closeModal);
  cancelStaffBtn.addEventListener('click', closeModal);
  saveStaffBtn.addEventListener('click', saveStaffMember);

  // Form controls
  staffWatchlist.addEventListener('change', updateWatchlistReasonVisibility);

  // Log controls
  logLevelFilter.addEventListener('change', loadLogsFromApi);
  clearLogsBtn.addEventListener('click', () => {
    logger.clearLogs();
    loadLogsFromApi();
    logger.info('Logs cleared');
  });

  // Header actions
  refreshBtn.addEventListener('click', async () => {
    logger.info('Refreshing data');
    await loadAllStaff();
    if (activeTab === 'promotions') {
      await loadEligiblePromotions();
    }
  });

  settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'block';
    logger.logModalAction('settings', 'open');
  });

  // Settings Modal Event Listeners
  closeSettingsModal.addEventListener('click', () => {
    settingsModal.style.display = 'none';
    logger.logModalAction('settings', 'close');
  });
  cancelSettingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'none';
    logger.logModalAction('settings', 'cancel');
  });
  saveSettingsBtn.addEventListener('click', saveSettings);
}

// -----------------------
// API & Data Loading Functions
// -----------------------
async function loadAllStaff() {
  try {
    const startTime = performance.now();
    const response = await fetch(`${API_BASE_URL}/staff/search`);
    if (!response.ok) throw new Error('Failed to load staff data');
    allStaffData = await response.json();
    logger.logApiCall('/staff/search', 'GET', response.status, performance.now() - startTime);
    if (activeTab === 'search') {
      displayStaffByRank(allStaffData);
    }
  } catch (error) {
    logger.error('Error loading staff data', { error: error.message });
    showToast('Failed to load staff data', 'error');
  }
}

async function checkApiConnection() {
  try {
    const startTime = performance.now();
    const response = await fetch(`${API_BASE_URL}/health-check`, {
      method: 'GET',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      mode: 'cors'
    });
    if (response.ok) {
      updateConnectionStatus('connected', 'Connected');
      logger.logApiCall('/health-check', 'GET', response.status, performance.now() - startTime);
    } else {
      updateConnectionStatus('error', 'API Error');
      logger.error('API health check failed', { status: response.status });
    }
  } catch (error) {
    updateConnectionStatus('error', 'Disconnected');
    logger.error('API connection error', { error: error.message });
  }
}

function updateConnectionStatus(state, text) {
  connectionStatus.className = `connection-status ${state}`;
  statusText.textContent = text;
}

// -----------------------
// Tab & Search Functions
// -----------------------
function switchTab(tabName) {
  activeTab = tabName;
  tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
  tabContents.forEach(content => {
    const isActive = content.id === `${tabName}Tab`;
    content.classList.toggle('active', isActive);
  });
  if (tabName === 'promotions') {
    loadEligiblePromotions();
  } else if (tabName === 'search') {
    if (!searchInput.value.trim()) {
      displayStaffByRank(allStaffData);
    }
  } else if (tabName === 'logs') {
    // Only load logs when the Logs tab is active.
    loadLogsFromApi();
  }
  logger.info(`Switched to ${tabName} tab`);
}

async function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    displayStaffByRank(allStaffData);
    return;
  }
  if (query.length < 2) {
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
          <path fill="none" d="M0 0h24v24H0z"/>
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
        </svg>
        <p>Enter at least 2 characters to search</p>
      </div>`;
    return;
  }
  try {
    resultsContainer.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>Searching...</p>
      </div>`;
    const startTime = performance.now();
    const response = await fetch(`${API_BASE_URL}/staff/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Search request failed');
    const results = await response.json();
    logger.logApiCall('/staff/search', 'GET', response.status, performance.now() - startTime, {
      query,
      resultCount: results.length
    });
    displaySearchResults(results);
  } catch (error) {
    logger.error('Search error', { error: error.message });
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <p>Error searching staff members: ${error.message}</p>
      </div>`;
  }
}

function displaySearchResults(results) {
  if (!results || results.length === 0) {
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <p>No staff members found</p>
      </div>`;
    return;
  }
  const resultsHTML = results.map(staff => createStaffCard(staff)).join('');
  resultsContainer.innerHTML = `
    <div class="rank-group">
      <div class="rank-group-header">Search Results (${results.length})</div>
      ${resultsHTML}
    </div>`;
  document.querySelectorAll('.staff-card').forEach(card =>
    card.addEventListener('click', () => openStaffDetails(card.dataset.id))
  );
}

function createStaffCard(staff) {
  const badges = [];
  if (staff.strike1 || staff.strike2 || staff.strike3) {
    const strikeCount = (staff.strike1 ? 1 : 0) + (staff.strike2 ? 1 : 0) + (staff.strike3 ? 1 : 0);
    badges.push(`<span class="badge strike-badge">${strikeCount} Strike${strikeCount > 1 ? 's' : ''}</span>`);
  }
  if (staff.watchlist) {
    badges.push(`<span class="badge watchlist-badge">Watchlist</span>`);
  }
  if (staff.purgatory) {
    badges.push(`<span class="badge purgatory-badge">Purgatory</span>`);
  }
  const badgesHTML = badges.length > 0 ? `<div class="staff-badges">${badges.join('')}</div>` : '';
  return `
    <div class="staff-card" data-id="${staff.id}">
      <div class="staff-card-header">
        <div class="staff-name">${staff.name}</div>
        <div class="staff-rank">${staff.rank}</div>
      </div>
      <div class="staff-info">
        <div>Discord ID: ${staff.discordId}</div>
        <div>Promoted: ${formatDate(staff.datePromoted)}</div>
      </div>
      ${badgesHTML}
    </div>`;
}

function displayStaffByRank(staffData) {
  if (!staffData || staffData.length === 0) {
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <p>No staff members found</p>
      </div>`;
    return;
  }
  // Group staff by rank
  const staffByRank = {};
  STAFF_RANKS.forEach(rank => (staffByRank[rank] = []));
  staffData.forEach(staff => {
    if (staff.rank && staffByRank.hasOwnProperty(staff.rank)) {
      staffByRank[staff.rank].push(staff);
    } else {
      staffByRank['Other'] = staffByRank['Other'] || [];
      staffByRank['Other'].push(staff);
    }
  });
  let resultsHTML = '';
  STAFF_RANKS.forEach(rank => {
    const staffInRank = staffByRank[rank];
    if (staffInRank && staffInRank.length > 0) {
      resultsHTML += `
        <div class="rank-group">
          <div class="rank-group-header">${rank} (${staffInRank.length})</div>
          ${staffInRank.map(staff => createStaffCard(staff)).join('')}
        </div>`;
    }
  });
  if (staffByRank['Other'] && staffByRank['Other'].length > 0) {
    resultsHTML += `
      <div class="rank-group">
        <div class="rank-group-header">Other (${staffByRank['Other'].length})</div>
        ${staffByRank['Other'].map(staff => createStaffCard(staff)).join('')}
      </div>`;
  }
  resultsContainer.innerHTML = resultsHTML;
  document.querySelectorAll('.staff-card').forEach(card =>
    card.addEventListener('click', () => openStaffDetails(card.dataset.id))
  );
}

// -----------------------
// Logs Loading (via API)
// -----------------------
async function loadLogsFromApi() {
  try {
    const startTime = performance.now();
    const response = await fetch(`${API_BASE_URL}/logs`);
    if (!response.ok) throw new Error('Failed to load logs');
    const logs = await response.json();
    logger.logApiCall('/logs', 'GET', response.status, performance.now() - startTime);
    logsContent.innerHTML = logs
      .map(log => `
        <div class="log-entry ${log.level.toLowerCase()}">
          <div class="log-entry-header">
            <span>${new Date(log.timestamp).toLocaleString()}</span>
            <span>${log.level}</span>
          </div>
          <div class="log-entry-message">${log.message}</div>
          ${log.data ? `<div class="log-entry-data">${JSON.stringify(log.data, null, 2)}</div>` : ''}
        </div>
      `)
      .join('');
    logsContent.scrollTop = logsContent.scrollHeight;
  } catch (error) {
    logger.error('Error loading logs from API', { error: error.message });
    logsContent.innerHTML = `
      <div class="empty-state">
        <p>Error loading logs: ${error.message}</p>
      </div>`;
  }
}

// -----------------------
// Promotions Loading
// -----------------------
async function loadEligiblePromotions() {
  try {
    promotionsContainer.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading eligible promotions...</p>
      </div>`;
    const startTime = performance.now();
    const response = await fetch(`${API_BASE_URL}/eligible-promotions`);
    if (!response.ok) throw new Error('Failed to load eligible promotions');
    const eligibleStaff = await response.json();
    logger.logApiCall('/eligible-promotions', 'GET', response.status, performance.now() - startTime);
    displayEligiblePromotions(eligibleStaff);
  } catch (error) {
    logger.error('Error loading eligible promotions', { error: error.message });
    promotionsContainer.innerHTML = `
      <div class="empty-state">
        <p>Error loading eligible promotions: ${error.message}</p>
        <p>Please check the console for more details.</p>
      </div>`;
  }
}

function displayEligiblePromotions(eligibleStaff) {
  if (!eligibleStaff || Object.keys(eligibleStaff).length === 0) {
    promotionsContainer.innerHTML = `
      <div class="empty-state">
        <p>No staff members are currently eligible for promotion</p>
      </div>`;
    return;
  }
  let promotionsHTML = '';
  Object.entries(eligibleStaff).forEach(([targetRank, staffList]) => {
    if (staffList.length > 0) {
      promotionsHTML += `
        <div class="promotion-group">
          <div class="promotion-group-header">${targetRank} (${staffList.length})</div>
          ${staffList.map(staff => createStaffCard(staff)).join('')}
        </div>`;
    }
  });
  promotionsContainer.innerHTML = promotionsHTML;
  document.querySelectorAll('.staff-card').forEach(card =>
    card.addEventListener('click', () => openStaffDetails(card.dataset.id))
  );
}

// -----------------------
// Staff Details & Update
// -----------------------
async function openStaffDetails(staffId) {
  try {
    const startTime = performance.now();
    const response = await fetch(`${API_BASE_URL}/staff/${staffId}`);
    if (!response.ok) throw new Error('Failed to load staff details');
    const staff = await response.json();
    logger.logApiCall(`/staff/${staffId}`, 'GET', response.status, performance.now() - startTime);
    currentStaffMember = staff;
    // Populate form fields
    staffIdField.value = staff.id;
    modalStaffName.textContent = staff.name;
    staffDiscordId.value = staff.discordId;
    staffRank.value = staff.rank;
    staffDatePromoted.value = staff.datePromoted;
    staffStrike1.checked = staff.strike1;
    staffStrike1Date.value = staff.strike1Date;
    staffStrike2.checked = staff.strike2;
    staffStrike2Date.value = staff.strike2Date;
    staffStrike3.checked = staff.strike3;
    staffStrike3Date.value = staff.strike3Date;
    staffWatchlist.checked = staff.watchlist;
    staffWatchlistReason.value = staff.watchlistReason;
    staffPurgatory.checked = staff.purgatory;
    staffModal.classList.add('active');
    updateWatchlistReasonVisibility();
  } catch (error) {
    logger.error('Error opening staff details', { error: error.message });
    showToast('Failed to load staff details', 'error');
  }
}

async function saveStaffMember() {
  if (!currentStaffMember) return;
  try {
    const startTime = performance.now();
    const response = await fetch(`${API_BASE_URL}/staff/${currentStaffMember.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...currentStaffMember,
        name: modalStaffName.textContent,
        discordId: staffDiscordId.value,
        rank: staffRank.value,
        datePromoted: staffDatePromoted.value,
        strike1: staffStrike1.checked,
        strike1Date: staffStrike1.checked ? staffStrike1Date.value : null,
        strike2: staffStrike2.checked,
        strike2Date: staffStrike2.checked ? staffStrike2Date.value : null,
        strike3: staffStrike3.checked,
        strike3Date: staffStrike3.checked ? staffStrike3Date.value : null,
        watchlist: staffWatchlist.checked,
        watchlistReason: staffWatchlist.checked ? staffWatchlistReason.value : '',
        purgatory: staffPurgatory.checked
      })
    });
    if (!response.ok) throw new Error('Failed to save staff details');
    const updatedStaff = await response.json();
    logger.logApiCall(`/staff/${currentStaffMember.id}`, 'PUT', response.status, performance.now() - startTime);
    logger.logStaffUpdate(currentStaffMember.id, updatedStaff);
    const staffCard = document.querySelector(`.staff-card[data-id="${currentStaffMember.id}"]`);
    if (staffCard) {
      staffCard.outerHTML = createStaffCard(updatedStaff);
      staffCard.addEventListener('click', () => openStaffDetails(currentStaffMember.id));
    }
    closeModal();
    showToast('Staff details saved successfully', 'success');
  } catch (error) {
    logger.error('Error saving staff details', { error: error.message });
    showToast('Failed to save staff details', 'error');
  }
}

function updateWatchlistReasonVisibility() {
  watchlistReasonGroup.style.display = staffWatchlist.checked ? 'block' : 'none';
}

function closeModal() {
  staffModal.classList.remove('active');
  currentStaffMember = null;
}

// -----------------------
// Utility Functions
// -----------------------
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function showToast(message, type = 'info') {
  document.querySelectorAll('.toast').forEach(toast => toast.remove());
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const toastContent = document.createElement('div');
  toastContent.className = 'toast-content';
  const iconEl = document.createElement('span');
  iconEl.className = 'material-icons toast-icon';
  iconEl.textContent = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
  const messageEl = document.createElement('span');
  messageEl.className = 'toast-message';
  messageEl.textContent = message;
  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  const closeIcon = document.createElement('span');
  closeIcon.className = 'material-icons';
  closeIcon.textContent = 'close';
  closeBtn.appendChild(closeIcon);
  toastContent.appendChild(iconEl);
  toastContent.appendChild(messageEl);
  toast.appendChild(toastContent);
  toast.appendChild(closeBtn);
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  const hideTimeout = setTimeout(() => hideToast(toast), 5000);
  closeBtn.addEventListener('click', () => {
    clearTimeout(hideTimeout);
    hideToast(toast);
  });
}

function hideToast(toast) {
  toast.classList.remove('show');
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 300);
}

// -----------------------
// Settings Functions
// -----------------------
function saveSettings() {
  const settings = {
    apiUrl: apiUrlInput.value,
    showStrikes: showStrikesCheckbox.checked,
    showWatchlist: showWatchlistCheckbox.checked,
    showPurgatory: showPurgatoryCheckbox.checked,
    logLevel: logLevelSelect.value
  };
  chrome.storage.sync.set({ settings }, () => {
    API_BASE_URL = settings.apiUrl;
    logger.setLogLevel(settings.logLevel);
    settingsModal.style.display = 'none';
    logger.logModalAction('settings', 'save');
    refreshData();
  });
}

function refreshData() {
  initializeApp();
}

// -----------------------
// Load Settings from Storage
// -----------------------
chrome.storage.sync.get(['settings'], result => {
  const settings = result.settings || {
    apiUrl: 'http://localhost:3001/api',
    showStrikes: true,
    showWatchlist: true,
    showPurgatory: true,
    logLevel: 'INFO'
  };
  apiUrlInput.value = settings.apiUrl;
  showStrikesCheckbox.checked = settings.showStrikes;
  showWatchlistCheckbox.checked = settings.showWatchlist;
  showPurgatoryCheckbox.checked = settings.showPurgatory;
  logLevelSelect.value = settings.logLevel;
  API_BASE_URL = settings.apiUrl;
  logger.setLogLevel(settings.logLevel);
});