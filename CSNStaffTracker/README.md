# CSN Staff Tracker Browser Extension

A browser extension that allows you to search, view, and manage CSN staff members directly from your browser, without needing to have the Staff Tracker website open.

## Features

- Search staff members by name or Discord ID
- View staff details and badges (strikes, watchlist, purgatory)
- Edit staff information (rank, promotion date, strikes, etc.)
- View staff members eligible for promotion
- Clean, modern UI inspired by Proton Pass

## Installation

### Development Installation

1. Clone or download this repository
2. Open Chrome/Edge/Brave and navigate to `chrome://extensions/`
3. Enable "Developer Mode" using the toggle in the top-right corner
4. Click "Load unpacked" and select the `CSNStaffTracker` folder
5. The extension should now be installed and visible in your extensions list

### Production Installation

Once the extension is published to the Chrome Web Store:

1. Visit [Chrome Web Store](https://chrome.google.com/webstore)
2. Search for "CSN Staff Tracker"
3. Click "Add to Chrome"

## Requirements

- The Staff Tracker API must be running on `http://localhost:3001`
- The API server is separate from the main Staff Tracker application
- Start the API server with `npm run api` or `npm run dev-api` (for development)
- The API provides the following endpoints:
  - `/api/health-check` - For checking API connectivity
  - `/api/staff/search?q={query}` - For searching staff members
  - `/api/staff/{id}` - For getting/updating a specific staff member
  - `/api/staff/eligible-promotions` - For getting promotion-eligible staff

## API Integration

This extension connects to the Staff Tracker API running on your local machine. You must have the API server running on port 3001 for the extension to work properly.

Connection status is indicated in the extension header:
- 🟢 Connected - API is available
- 🟠 Connecting - Trying to connect to API
- 🔴 Disconnected - API not available

## Usage

1. Click the CSN Staff Tracker icon in your browser toolbar to open the extension popup
2. Use the search tab to find staff members by name or Discord ID
3. Click on a staff card to view and edit their details
4. Use the Promotions tab to see staff members eligible for promotion

## Security Notes

- The extension only communicates with your local API server
- No delete functionality is included for security reasons
- All changes are logged and synchronized with the server immediately

## Development

Built with:
- HTML/CSS/JavaScript
- Chrome Extension Manifest V3
- RESTful API integration 