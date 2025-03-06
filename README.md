# Staff Time Tracker

A simple web application to track staff members by rank, their promotion dates, and time at rank.
You may also generate reports such as Staff Leadership Reports, Needs Perms Report and Staff Removal Requests

## Features

- Track staff members by rank
- Calculate time at rank automatically
- Add, edit, and delete staff members
- Export data to JSON file
- Import data from JSON file
- Material design with dark theme (Glassy on overlay)

## Staff Ranks (from highest to lowest)

- Head of Staff
- High Staff
- Senior Administrator
- Administrator
- Staff Supervisor
- Senior Moderator
- Moderator
- Trial Moderator
- Needs Training (TODO: Implement)

## Getting Started

### Prerequisites

- Node.js (v12 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```
4. Open your browser and navigate to `http://localhost:3000`

## Usage

### Adding a Staff Member

1. Click the "Add User" button
2. Fill in the details (name, Discord ID, rank, date promoted)
3. Click "Save Staff Member"

### Editing a Staff Member

1. Click the edit (pencil) icon next to a staff member
2. Update the details as needed
3. Click "Save Staff Member"

### Deleting a Staff Member

1. Click the delete (trash) icon next to a staff member
2. Confirm the deletion

### Exporting Data

1. Click the "Export" button to download a JSON file with all staff data

### Importing Data

1. Click the "Import" button
2. Paste valid JSON data in the text area
3. Click "Import Data"

## Data Storage

All data is stored in a local file named `staff-data.json` in the application's root directory. 