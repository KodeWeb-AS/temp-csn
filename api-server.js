/**
 * API Server for CSN Staff Tracker Browser Extension
 * This server provides API endpoints for the browser extension while using
 * the same data file as the main server.js application.
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Create Express app
const app = express();
const PORT = 3001; // Using a different port than the main server

// Middleware
app.use(cors()); // Enable CORS for browser extension
app.use(express.json());

// Path to the staff data file (same as used by the main server)
const DATA_FILE = path.join(__dirname, 'staff-data.json');

// Staff ranks in order (same as in main server)
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

// Helper function to read staff data
function getStaffData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading staff data:', error);
    return [];
  }
}

// Helper function to write staff data
function saveStaffData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving staff data:', error);
    return false;
  }
}

// Health check endpoint
app.get('/api/health-check', (req, res) => {
  try {
    // Check if we can read the data file
    const staffData = getStaffData();
    res.status(200).json({ status: 'ok', count: staffData.length });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Search staff endpoint
app.get('/api/staff/search', (req, res) => {
  try {
    const query = req.query.q?.toLowerCase() || '';
    
    // If query is empty, return all staff members
    if (!query) {
      const staffData = getStaffData();
      return res.json(staffData);
    }
    
    // For short queries, require at least 2 characters
    if (query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }
    
    const staffData = getStaffData();
    
    const results = staffData.filter(staff => {
      return (
        staff.name.toLowerCase().includes(query) ||
        staff.discordId.includes(query)
      );
    });
    
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get staff by ID endpoint
app.get('/api/staff/:id', (req, res) => {
  try {
    const id = req.params.id;
    const staffData = getStaffData();
    
    const staffMember = staffData.find(staff => staff.id === id);
    
    if (!staffMember) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    
    res.json(staffMember);
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update staff by ID endpoint
app.put('/api/staff/:id', (req, res) => {
  try {
    const id = req.params.id;
    const updatedStaff = req.body;
    
    // Validate required fields
    if (!updatedStaff || !updatedStaff.id || !updatedStaff.name || !updatedStaff.discordId || !updatedStaff.rank) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Ensure IDs match
    if (id !== updatedStaff.id) {
      return res.status(400).json({ error: 'ID mismatch' });
    }
    
    const staffData = getStaffData();
    const staffIndex = staffData.findIndex(staff => staff.id === id);
    
    if (staffIndex === -1) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    
    // Helper function to parse boolean values
    const parseBool = (value) => {
      if (value === 'true' || value === true || value === 'on' || value === 'yes') {
        return true;
      }
      return false;
    };
    
    // Create updated staff object with proper boolean handling
    const processedStaff = {
      ...updatedStaff,
      strike1: parseBool(updatedStaff.strike1),
      strike2: parseBool(updatedStaff.strike2),
      strike3: parseBool(updatedStaff.strike3),
      watchlist: parseBool(updatedStaff.watchlist),
      purgatory: parseBool(updatedStaff.purgatory)
    };
    
    // Update the staff member
    staffData[staffIndex] = processedStaff;
    
    // Write updated data back to file
    if (!saveStaffData(staffData)) {
      return res.status(500).json({ error: 'Failed to save changes' });
    }
    
    // Log the update
    console.log(`Staff member updated via API: ${processedStaff.name} (${processedStaff.id})`);
    
    res.json(processedStaff);
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get eligible promotions endpoint
// Note: Make sure this is defined AFTER the /api/staff/:id endpoint to avoid conflicts
app.get('/api/staff/eligible-promotions', (req, res) => {
  try {
    const staffData = getStaffData();
    
    if (!staffData || !Array.isArray(staffData)) {
      return res.status(500).json({ error: 'Invalid staff data format' });
    }
    
    const today = new Date();
    
    // Define promotion rules
    const promotionRules = {
      'Trial Moderator': {
        targetRank: 'Moderator',
        minDays: 14, // 2 weeks
        checkFunction: (staff) => {
          try {
            if (!staff.datePromoted) return false;
            
            const promotedDate = new Date(staff.datePromoted);
            if (isNaN(promotedDate.getTime())) return false;
            
            const daysSincePromotion = Math.floor((today - promotedDate) / (1000 * 60 * 60 * 24));
            
            return (
              staff.rank === 'Trial Moderator' &&
              daysSincePromotion >= 14 &&
              !staff.strike1 &&
              !staff.purgatory
            );
          } catch (err) {
            console.error('Error checking eligibility for Trial Moderator:', err);
            return false;
          }
        }
      },
      'Trial Discord Support': {
        targetRank: 'Discord Support',
        minDays: 14, // 2 weeks
        checkFunction: (staff) => {
          try {
            if (!staff.datePromoted) return false;
            
            const promotedDate = new Date(staff.datePromoted);
            if (isNaN(promotedDate.getTime())) return false;
            
            const daysSincePromotion = Math.floor((today - promotedDate) / (1000 * 60 * 60 * 24));
            
            return (
              staff.rank === 'Trial Discord Support' &&
              daysSincePromotion >= 14 &&
              !staff.strike1 &&
              !staff.purgatory
            );
          } catch (err) {
            console.error('Error checking eligibility for Trial Discord Support:', err);
            return false;
          }
        }
      },
      'Moderator': {
        targetRank: 'Senior Moderator',
        minDays: 30, // 1 month
        checkFunction: (staff) => {
          try {
            if (!staff.datePromoted) return false;
            
            const promotedDate = new Date(staff.datePromoted);
            if (isNaN(promotedDate.getTime())) return false;
            
            const daysSincePromotion = Math.floor((today - promotedDate) / (1000 * 60 * 60 * 24));
            
            return (
              staff.rank === 'Moderator' &&
              daysSincePromotion >= 30 &&
              !staff.strike1 &&
              !staff.purgatory &&
              !staff.watchlist
            );
          } catch (err) {
            console.error('Error checking eligibility for Moderator:', err);
            return false;
          }
        }
      },
      'Paid Permissions': {
        targetRank: 'Trial Moderator',
        minDays: 30, // 1 month
        checkFunction: (staff) => {
          try {
            if (!staff.datePromoted) return false;
            
            const promotedDate = new Date(staff.datePromoted);
            if (isNaN(promotedDate.getTime())) return false;
            
            const daysSincePromotion = Math.floor((today - promotedDate) / (1000 * 60 * 60 * 24));
            
            return (
              staff.rank === 'Paid Permissions' &&
              daysSincePromotion >= 30 &&
              !staff.strike1 &&
              !staff.purgatory
            );
          } catch (err) {
            console.error('Error checking eligibility for Paid Permissions:', err);
            return false;
          }
        }
      }
    };
    
    // Process staff members according to promotion rules
    const eligiblePromotions = {};
    
    // Initialize result structure
    Object.keys(promotionRules).forEach(rank => {
      eligiblePromotions[promotionRules[rank].targetRank] = [];
    });
    
    // Check each staff member against promotion rules
    staffData.forEach(staff => {
      if (!staff || typeof staff !== 'object') return;
      
      Object.keys(promotionRules).forEach(rank => {
        const rule = promotionRules[rank];
        
        try {
          if (rule.checkFunction(staff)) {
            eligiblePromotions[rule.targetRank].push(staff);
          }
        } catch (err) {
          console.error(`Error checking ${staff.name || 'unknown'} for ${rank} promotion:`, err);
        }
      });
    });
    
    res.json(eligiblePromotions);
  } catch (error) {
    console.error('Eligible promotions error:', error);
    res.status(500).json({ error: 'Server error processing eligible promotions' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`CSN Staff Tracker API server running on http://localhost:${PORT}`);
  console.log(`API endpoints available:`);
  console.log(`- Health check: GET http://localhost:${PORT}/api/health-check`);
  console.log(`- Search staff: GET http://localhost:${PORT}/api/staff/search?q={query}`);
  console.log(`- Get staff: GET http://localhost:${PORT}/api/staff/{id}`);
  console.log(`- Update staff: PUT http://localhost:${PORT}/api/staff/{id}`);
  console.log(`- Eligible promotions: GET http://localhost:${PORT}/api/staff/eligible-promotions`);
}); 