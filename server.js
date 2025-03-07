const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const path = require('path');
const fs = require('fs');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Add middleware to log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log('Request headers:', req.headers);
        console.log('Request body:', req.body);
    }
    next();
});

// Data storage path
const DATA_FILE = path.join(__dirname, 'staff-data.json');

// Initialize staff data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

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
        console.log('Saving data to file:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        console.log('Data saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving staff data:', error);
        return false;
    }
}

// Home page - display staff data
app.get('/', (req, res) => {
    const staffData = getStaffData();
    // Group staff by rank
    const staffByRank = {};
    STAFF_RANKS.forEach(rank => {
        staffByRank[rank] = staffData.filter(staff => staff.rank === rank);
    });

    res.render('index', { staffData, staffByRank, ranks: STAFF_RANKS });
});

// Get a specific staff member by ID
app.get('/api/staff/:id', (req, res) => {
    const staffData = getStaffData();
    const staff = staffData.find(s => s.id === req.params.id);
    
    if (staff) {
        res.json(staff);
    } else {
        res.status(404).json({ error: 'Staff member not found' });
    }
});

// Add new staff member
app.post('/api/staff', (req, res) => {
    const staffData = getStaffData();

    // Helper function to parse boolean values from form inputs
    const parseBool = (value) => {
        if (value === 'true' || value === true || value === 'on' || value === 'yes') {
            return true;
        }
        return false;
    };

    const newStaff = {
        id: Date.now().toString(),
        name: req.body.name,
        discordId: req.body.discordId,
        rank: req.body.rank,
        datePromoted: req.body.datePromoted,
        // Add disciplinary data
        strike1: parseBool(req.body.strike1),
        strike1Date: parseBool(req.body.strike1) ? req.body.strike1Date || null : null,
        strike2: parseBool(req.body.strike2),
        strike2Date: parseBool(req.body.strike2) ? req.body.strike2Date || null : null,
        strike3: parseBool(req.body.strike3),
        strike3Date: parseBool(req.body.strike3) ? req.body.strike3Date || null : null,
        watchlist: parseBool(req.body.watchlist),
        watchlistReason: parseBool(req.body.watchlist) ? req.body.watchlistReason || '' : '',
        purgatory: parseBool(req.body.purgatory)
    };

    staffData.push(newStaff);
    saveStaffData(staffData);

    // Return JSON response instead of redirecting
    return res.status(201).json({
        success: true,
        message: 'Staff member added successfully',
        data: newStaff
    });
});

// Update staff member
app.put('/api/staff/:id', (req, res) => {
    let staffData = getStaffData();
    const index = staffData.findIndex(s => s.id === req.params.id);

    if (index !== -1) {
        
        // Helper function to parse boolean values from form inputs
        const parseBool = (value) => {
            if (value === 'true' || value === true || value === 'on' || value === 'yes') {
                return true;
            }
            return false;
        };

        // Create updated staff object
        const updatedStaff = { ...staffData[index] };
        
        // Update basic fields - only if they exist in the request
        if ('name' in req.body) updatedStaff.name = req.body.name;
        if ('discordId' in req.body) updatedStaff.discordId = req.body.discordId;
        if ('rank' in req.body) updatedStaff.rank = req.body.rank;
        if ('datePromoted' in req.body) updatedStaff.datePromoted = req.body.datePromoted;
        
        // Update disciplinary data
        updatedStaff.strike1 = parseBool(req.body.strike1);
        updatedStaff.strike1Date = parseBool(req.body.strike1) ? req.body.strike1Date || staffData[index].strike1Date : null;
        updatedStaff.strike2 = parseBool(req.body.strike2);
        updatedStaff.strike2Date = parseBool(req.body.strike2) ? req.body.strike2Date || staffData[index].strike2Date : null;
        updatedStaff.strike3 = parseBool(req.body.strike3);
        updatedStaff.strike3Date = parseBool(req.body.strike3) ? req.body.strike3Date || staffData[index].strike3Date : null;
        updatedStaff.watchlist = parseBool(req.body.watchlist);
        updatedStaff.watchlistReason = parseBool(req.body.watchlist) ? req.body.watchlistReason || staffData[index].watchlistReason : '';
        updatedStaff.purgatory = parseBool(req.body.purgatory);
        
        // Log the updated staff object
        console.log('Updated staff data:', updatedStaff);
        
        // Update the staff data
        staffData[index] = updatedStaff;
        saveStaffData(staffData);
        
        // Return JSON response with updated staff data instead of redirecting
        return res.status(200).json({
            success: true,
            message: 'Staff member updated successfully',
            data: staffData[index]
        });
    }

    // Return error if staff member not found
    return res.status(404).json({
        success: false,
        message: 'Staff member not found'
    });
});

// Delete staff member
app.delete('/api/staff/:id', (req, res) => {
    let staffData = getStaffData();
    const staffExists = staffData.some(s => s.id === req.params.id);
    
    if (staffExists) {
        staffData = staffData.filter(s => s.id !== req.params.id);
        saveStaffData(staffData);
        
        // Return JSON response instead of redirecting
        return res.status(200).json({
            success: true,
            message: 'Staff member deleted successfully'
        });
    }
    
    // Return error if staff member not found
    return res.status(404).json({
        success: false,
        message: 'Staff member not found'
    });
});

// Export data as JSON
app.get('/api/export', (req, res) => {
    const staffData = getStaffData();

    res.setHeader('Content-disposition', 'attachment; filename=staff_data.json');
    res.setHeader('Content-type', 'application/json');
    res.send(JSON.stringify(staffData, null, 2));
});

// Import data
app.post('/api/import', (req, res) => {
    try {
        let data;
        
        // Check how the data is being sent
        if (typeof req.body.data === 'string') {
            // If it's a string, parse it
            data = JSON.parse(req.body.data);
        } else if (req.body.data && typeof req.body.data === 'object') {
            // If it's already an object (pre-parsed by bodyParser), use it directly
            data = req.body.data;
        } else {
            throw new Error('No valid data provided');
        }

        if (Array.isArray(data)) {
            saveStaffData(data);
            
            // Return JSON response instead of redirecting
            return res.status(200).json({
                success: true,
                message: 'Staff data imported successfully',
                count: data.length
            });
        } else {
            throw new Error('Imported data is not an array');
        }
    } catch (error) {
        console.error('Import error:', error);
        return res.status(400).json({ 
            success: false,
            error: 'Invalid JSON data: ' + error.message 
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 