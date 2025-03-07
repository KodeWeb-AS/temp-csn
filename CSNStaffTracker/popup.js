// Configuration
const API_BASE_URL = 'http://localhost:3001/api';

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

// DOM Elements
const connectionStatus = document.getElementById('connectionStatus');
const statusText = connectionStatus.querySelector('.status-text');
const statusDot = connectionStatus.querySelector('.status-dot');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('resultsContainer');
const promotionsContainer = document.getElementById('promotionsContainer');
const staffModal = document.getElementById('staffModal');
const modalStaffName = document.getElementById('modalStaffName');
const staffForm = document.getElementById('staffForm');
const closeModalBtn = document.getElementById('closeModal');
const saveStaffBtn = document.getElementById('saveStaffBtn');
const cancelStaffBtn = document.getElementById('cancelStaffBtn');

// Form Elements
const staffId = document.getElementById('staffId');
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

// Variables
let currentStaffMember = null;
let activeTab = 'search';
let allStaffData = [];

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  setupEventListeners();
});

// Initialize the app
async function initializeApp() {
  checkApiConnection();
  updateWatchlistReasonVisibility();
  
  // Load all staff members on initialization
  await loadAllStaff();
}

// Set up event listeners
function setupEventListeners() {
  // Tab switching
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // Search functionality
  searchInput.addEventListener('input', debounce(handleSearch, 300));

  // Modal events
  closeModalBtn.addEventListener('click', closeModal);
  cancelStaffBtn.addEventListener('click', closeModal);
  saveStaffBtn.addEventListener('click', saveStaffChanges);
  
  // Form events
  staffWatchlist.addEventListener('change', updateWatchlistReasonVisibility);
  
  // Strike date toggles
  staffStrike1.addEventListener('change', () => toggleDateInput(staffStrike1, staffStrike1Date));
  staffStrike2.addEventListener('change', () => toggleDateInput(staffStrike2, staffStrike2Date));
  staffStrike3.addEventListener('change', () => toggleDateInput(staffStrike3, staffStrike3Date));
}

// Load all staff members
async function loadAllStaff() {
  try {
    // Show loading state
    resultsContainer.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading staff members...</p>
      </div>
    `;
    
    // Fetch all staff - this is a new endpoint we might need to add to the API
    // For now, we'll use the search with an empty query to get all staff
    const response = await fetch(`${API_BASE_URL}/staff/search?q=`);
    
    if (!response.ok) {
      throw new Error('Failed to load staff members');
    }
    
    allStaffData = await response.json();
    
    // Display staff by rank
    displayStaffByRank(allStaffData);
  } catch (error) {
    console.error('Error loading staff members:', error);
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <p>Error loading staff members: ${error.message}</p>
        <p>Make sure the API server is running at ${API_BASE_URL}</p>
      </div>
    `;
  }
}

// Display staff grouped by rank
function displayStaffByRank(staffData) {
  if (!staffData || staffData.length === 0) {
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <p>No staff members found</p>
      </div>
    `;
    return;
  }
  
  // Group staff by rank
  const staffByRank = {};
  
  // Initialize the object with empty arrays for all ranks
  STAFF_RANKS.forEach(rank => {
    staffByRank[rank] = [];
  });
  
  // Populate the groups
  staffData.forEach(staff => {
    if (staff.rank && staffByRank.hasOwnProperty(staff.rank)) {
      staffByRank[staff.rank].push(staff);
    } else {
      // Add to "Other" category for ranks not in our list
      if (!staffByRank.hasOwnProperty('Other')) {
        staffByRank['Other'] = [];
      }
      staffByRank['Other'].push(staff);
    }
  });
  
  // Build the HTML
  let resultsHTML = '';
  
  // Add each rank section in order
  STAFF_RANKS.forEach(rank => {
    const staffInRank = staffByRank[rank];
    if (staffInRank && staffInRank.length > 0) {
      resultsHTML += `
        <div class="rank-group">
          <div class="rank-group-header">${rank} (${staffInRank.length})</div>
          ${staffInRank.map(staff => createStaffCard(staff)).join('')}
        </div>
      `;
    }
  });
  
  // Add any "Other" category at the end
  if (staffByRank.hasOwnProperty('Other') && staffByRank['Other'].length > 0) {
    resultsHTML += `
      <div class="rank-group">
        <div class="rank-group-header">Other (${staffByRank['Other'].length})</div>
        ${staffByRank['Other'].map(staff => createStaffCard(staff)).join('')}
      </div>
    `;
  }
  
  resultsContainer.innerHTML = resultsHTML;
  
  // Add click event to staff cards
  document.querySelectorAll('.staff-card').forEach(card => {
    card.addEventListener('click', () => {
      const staffId = card.dataset.id;
      openStaffDetails(staffId);
    });
  });
}

// Check API connection status
async function checkApiConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/health-check`);
    
    if (response.ok) {
      updateConnectionStatus('connected', 'Connected');
    } else {
      updateConnectionStatus('error', 'API Error');
    }
  } catch (error) {
    updateConnectionStatus('error', 'Disconnected');
    console.error('API connection error:', error);
  }
}

// Update connection status UI
function updateConnectionStatus(state, text) {
  connectionStatus.className = `connection-status ${state}`;
  statusText.textContent = text;
}

// Switch between tabs
function switchTab(tabName) {
  activeTab = tabName;
  
  // Update tab buttons
  tabButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  
  // Update tab content
  tabContents.forEach(content => {
    const isActive = content.id === `${tabName}Tab`;
    content.classList.toggle('active', isActive);
  });
  
  // Load tab-specific data
  if (tabName === 'promotions') {
    loadEligiblePromotions();
  } else if (tabName === 'search') {
    // If search field is empty, show all staff by rank
    if (!searchInput.value.trim()) {
      displayStaffByRank(allStaffData);
    }
  }
}

// Handle search input
async function handleSearch() {
  const query = searchInput.value.trim();
  
  // If query is empty, show all staff by rank
  if (!query) {
    displayStaffByRank(allStaffData);
    return;
  }
  
  // If query is too short, show message
  if (query.length < 2) {
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
          <path fill="none" d="M0 0h24v24H0z"/>
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
        </svg>
        <p>Enter at least 2 characters to search</p>
      </div>
    `;
    return;
  }
  
  try {
    resultsContainer.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>Searching...</p>
      </div>
    `;
    
    const response = await fetch(`${API_BASE_URL}/staff/search?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error('Search request failed');
    }
    
    const results = await response.json();
    displaySearchResults(results);
  } catch (error) {
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <p>Error searching staff members: ${error.message}</p>
      </div>
    `;
    console.error('Search error:', error);
  }
}

// Display search results
function displaySearchResults(results) {
  if (!results || results.length === 0) {
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <p>No staff members found</p>
      </div>
    `;
    return;
  }
  
  const resultsHTML = results.map(staff => createStaffCard(staff)).join('');
  
  resultsContainer.innerHTML = `
    <div class="rank-group">
      <div class="rank-group-header">Search Results (${results.length})</div>
      ${resultsHTML}
    </div>
  `;
  
  // Add click event to staff cards
  document.querySelectorAll('.staff-card').forEach(card => {
    card.addEventListener('click', () => {
      const staffId = card.dataset.id;
      openStaffDetails(staffId);
    });
  });
}

// Create HTML for a staff card
function createStaffCard(staff) {
  // Create badges
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
  
  const badgesHTML = badges.length > 0 
    ? `<div class="staff-badges">${badges.join('')}</div>` 
    : '';
  
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
    </div>
  `;
}

// Load eligible promotions
async function loadEligiblePromotions() {
  try {
    promotionsContainer.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading eligible promotions...</p>
      </div>
    `;
    
    console.log('Attempting to fetch eligible promotions from:', `${API_BASE_URL}/eligible-promotions`);
    
    const response = await fetch(`${API_BASE_URL}/eligible-promotions`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Eligible promotions response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`API returned status ${response.status}: ${errorText}`);
    }
    
    const eligibleStaff = await response.json();
    console.log('Received eligible promotions data:', eligibleStaff);
    displayEligiblePromotions(eligibleStaff);
  } catch (error) {
    console.error('Detailed error loading eligible promotions:', error);
    promotionsContainer.innerHTML = `
      <div class="empty-state">
        <p>Error loading eligible promotions: ${error.message}</p>
        <p>Please check the console for more details.</p>
      </div>
    `;
  }
}

// Display eligible promotions
function displayEligiblePromotions(eligibleStaff) {
  if (!eligibleStaff || Object.keys(eligibleStaff).length === 0) {
    promotionsContainer.innerHTML = `
      <div class="empty-state">
        <p>No staff members eligible for promotion</p>
      </div>
    `;
    return;
  }
  
  let promotionsHTML = '';
  
  // For each rank with eligible staff
  for (const [rank, staffList] of Object.entries(eligibleStaff)) {
    if (staffList.length === 0) continue;
    
    promotionsHTML += `
      <div class="promotion-group">
        <div class="promotion-group-header">Eligible for ${rank}</div>
        ${staffList.map(staff => createStaffCard(staff)).join('')}
      </div>
    `;
  }
  
  promotionsContainer.innerHTML = promotionsHTML;
  
  // Add click event to staff cards
  promotionsContainer.querySelectorAll('.staff-card').forEach(card => {
    card.addEventListener('click', () => {
      const staffId = card.dataset.id;
      openStaffDetails(staffId);
    });
  });
}

// Open staff details modal
async function openStaffDetails(staffId) {
  try {
    // Show loading in modal
    staffModal.classList.add('active');
    modalStaffName.textContent = 'Loading...';
    
    // Fetch staff details
    const response = await fetch(`${API_BASE_URL}/staff/${staffId}`);
    
    if (!response.ok) {
      throw new Error('Failed to load staff details');
    }
    
    const staffMember = await response.json();
    currentStaffMember = staffMember;
    
    // Populate form
    populateStaffForm(staffMember);
  } catch (error) {
    closeModal();
    alert(`Error loading staff details: ${error.message}`);
    console.error('Error loading staff details:', error);
  }
}

// Populate staff form with data
function populateStaffForm(staff) {
  modalStaffName.textContent = staff.name;
  staffId.value = staff.id;
  staffDiscordId.value = staff.discordId;
  staffRank.value = staff.rank;
  staffDatePromoted.value = staff.datePromoted;
  
  // Strikes
  staffStrike1.checked = staff.strike1;
  staffStrike1Date.value = staff.strike1Date || '';
  staffStrike1Date.disabled = !staff.strike1;
  
  staffStrike2.checked = staff.strike2;
  staffStrike2Date.value = staff.strike2Date || '';
  staffStrike2Date.disabled = !staff.strike2;
  
  staffStrike3.checked = staff.strike3;
  staffStrike3Date.value = staff.strike3Date || '';
  staffStrike3Date.disabled = !staff.strike3;
  
  // Watchlist and Purgatory
  staffWatchlist.checked = staff.watchlist;
  staffWatchlistReason.value = staff.watchlistReason || '';
  updateWatchlistReasonVisibility();
  
  staffPurgatory.checked = staff.purgatory;
}

// Toggle date input based on checkbox
function toggleDateInput(checkbox, dateInput) {
  dateInput.disabled = !checkbox.checked;
  if (checkbox.checked && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
}

// Update watchlist reason visibility
function updateWatchlistReasonVisibility() {
  watchlistReasonGroup.style.display = staffWatchlist.checked ? 'block' : 'none';
}

// Save staff changes
async function saveStaffChanges() {
  try {
    // Show saving indicator
    saveStaffBtn.textContent = 'Saving...';
    saveStaffBtn.disabled = true;
    
    // Collect form data
    const updatedStaffMember = {
      id: staffId.value,
      name: currentStaffMember.name, // Keep the name unchanged
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
    };
    
    // Send update request
    const response = await fetch(`${API_BASE_URL}/staff/${updatedStaffMember.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedStaffMember)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update staff member');
    }
    
    // Update the staff data in memory
    const updatedStaff = await response.json();
    
    // Find and update the staff member in allStaffData
    const index = allStaffData.findIndex(staff => staff.id === updatedStaff.id);
    if (index !== -1) {
      allStaffData[index] = updatedStaff;
    }
    
    // Refresh current view
    if (activeTab === 'search') {
      if (searchInput.value.trim().length >= 2) {
        handleSearch();
      } else {
        displayStaffByRank(allStaffData);
      }
    } else if (activeTab === 'promotions') {
      loadEligiblePromotions();
    }
    
    closeModal();
  } catch (error) {
    alert(`Error saving changes: ${error.message}`);
    console.error('Error saving changes:', error);
  } finally {
    saveStaffBtn.textContent = 'Save Changes';
    saveStaffBtn.disabled = false;
  }
}

// Close the modal
function closeModal() {
  staffModal.classList.remove('active');
  currentStaffMember = null;
}

// Utility: Format date for display
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

// Utility: Debounce function
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
} 