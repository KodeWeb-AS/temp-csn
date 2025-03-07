// Background script for CSN Staff Tracker
// This script maintains a connection to the localhost API

// Configuration
const API_BASE_URL = 'http://localhost:3001/api';

// Check if the API is available when the extension starts
chrome.runtime.onStartup.addListener(checkApiAvailability);
chrome.runtime.onInstalled.addListener(checkApiAvailability);

// Function to check if the API is available
async function checkApiAvailability() {
  try {
    const response = await fetch(`${API_BASE_URL}/health-check`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('CSN Staff Tracker: Successfully connected to local API');
      chrome.action.setBadgeText({ text: '' }); // Clear any error badge
    } else {
      console.error('CSN Staff Tracker: API server responded with error');
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#F44336' });
    }
  } catch (error) {
    console.error('CSN Staff Tracker: Cannot connect to API server', error);
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#F44336' });
  }
}

// Handle messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle search requests
  if (message.type === 'searchStaff') {
    searchStaff(message.query)
      .then(sendResponse)
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  // Handle staff member update
  else if (message.type === 'updateStaffMember') {
    updateStaffMember(message.staffMember)
      .then(sendResponse)
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  // Handle promotion eligibility check
  else if (message.type === 'checkEligiblePromotions') {
    checkEligiblePromotions()
      .then(sendResponse)
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Function to search staff in the API
async function searchStaff(query) {
  try {
    const response = await fetch(`${API_BASE_URL}/staff/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to search staff');
    }
    
    const data = await response.json();
    return { success: true, results: data };
  } catch (error) {
    console.error('Error searching staff:', error);
    throw error;
  }
}

// Function to update a staff member in the API
async function updateStaffMember(staffMember) {
  try {
    const response = await fetch(`${API_BASE_URL}/staff/${staffMember.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(staffMember)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update staff member');
    }
    
    const data = await response.json();
    return { success: true, staffMember: data };
  } catch (error) {
    console.error('Error updating staff member:', error);
    throw error;
  }
}

// Function to check eligible promotions in the API
async function checkEligiblePromotions() {
  try {
    const response = await fetch(`${API_BASE_URL}/staff/eligible-promotions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to check eligible promotions');
    }
    
    const data = await response.json();
    return { success: true, eligibleStaff: data };
  } catch (error) {
    console.error('Error checking eligible promotions:', error);
    throw error;
  }
}

// Periodically check if the API is available (every 5 minutes)
setInterval(checkApiAvailability, 5 * 60 * 1000); 