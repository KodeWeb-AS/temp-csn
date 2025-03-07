const fs = require('fs');

// Read existing staff data
const staffData = JSON.parse(fs.readFileSync('staff-data.json', 'utf8'));

// Existing Discord IDs for duplicate checking
const existingDiscordIds = new Set(staffData.map(staff => staff.discordId));

// Parse the Department Council data
const departmentCouncilData = `abblebabble (697312321046970418)
bulletz29 (388557372869836810)
cheer.i0 (327244206605074432)
con_32 (391987525855477761)
csnhawaiian (771249456007348234)
csntickle.dev (921498172768018476)
csntyronewallace (935706683869630564)
d.smoove (425063639129522187)
f30dillon (333863427812491266)
gavin528 (819639082728030209)
gojo_law (828478422430121984)
ibfw (502047263342854144)
j.smith1129 (974032671724437544)
koalagamesyt (533112170452484107)
lito_808 (267470350273609731)
mike_692 (971112440563650580)
mikesmithcsn (916090156354785310)
notslow0 (880803557606035497)
outlaw_monster (832624329611149383)
priorpanic (669852884845985802)
r1chzl1 (745187675169882185)
samuraiofthemist (729119406872854528)
seckman (466014012983738378)
sgtmanapua (421214091080630284)
slickbillyclintoncsn (1050918157252051045)
smithster.1 (1309227271302676501)
stucks (537402370221539329)
w.alex (1010320688780947487)
xellington (665332877642301440)`.split('\n');

// Track users who had their rank updated vs newly added
const updatedRanks = [];
const newStaffToAdd = [];
const today = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format

departmentCouncilData.forEach(line => {
  const match = line.match(/(.+) \((\d+)\)/);
  if (match) {
    const name = match[1];
    const discordId = match[2];
    
    // Check if this Discord ID already exists in staff data
    if (existingDiscordIds.has(discordId)) {
      // If user exists, update their rank to "Department Council"
      const existingStaffIndex = staffData.findIndex(staff => staff.discordId === discordId);
      if (existingStaffIndex !== -1 && staffData[existingStaffIndex].rank !== "Department Council") {
        const oldRank = staffData[existingStaffIndex].rank;
        staffData[existingStaffIndex].rank = "Department Council";
        updatedRanks.push({ name, oldRank, newRank: "Department Council" });
      }
    } else {
      // Create a new staff entry with the "Department Council" rank
      const newStaff = {
        id: Date.now().toString() + Math.floor(Math.random() * 1000), // Generate a unique ID
        name: name,
        discordId: discordId,
        rank: "Department Council",
        datePromoted: today,
        strike1: false,
        strike1Date: null,
        strike2: false,
        strike2Date: null,
        strike3: false,
        strike3Date: null,
        watchlist: false,
        watchlistReason: "",
        purgatory: false
      };
      
      newStaffToAdd.push(newStaff);
    }
  }
});

// Add new staff to the existing staff data
const updatedStaffData = [
  ...staffData,
  ...newStaffToAdd
];

// Write updated staff data back to file
fs.writeFileSync('staff-data.json', JSON.stringify(updatedStaffData, null, 2));

// Log summary of changes
console.log(`Added ${newStaffToAdd.length} new staff members with "Department Council" rank.`);
if (updatedRanks.length > 0) {
  console.log(`Updated rank for ${updatedRanks.length} existing staff members to "Department Council":`);
  updatedRanks.forEach(({ name, oldRank, newRank }) => {
    console.log(`  - ${name}: ${oldRank} -> ${newRank}`);
  });
} 