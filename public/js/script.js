/* TODO:
    - Implement Database Connection
*/

document.addEventListener('DOMContentLoaded', () => {
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

    // Promotion requirements (in days)
    const PROMOTION_REQUIREMENTS = {
        'Trial Moderator': { minDays: 14, maxDays: 28, nextRank: 'Moderator' },
        'Moderator': { minDays: 28, maxDays: 42, nextRank: 'Senior Moderator' },
        'Senior Moderator': { minDays: 60, maxDays: 90, nextRank: 'Staff Supervisor' },
        'Staff Supervisor': { minDays: 120, maxDays: 180, nextRank: 'Administrator' },
        'Administrator': { minDays: 180, maxDays: 270, nextRank: 'Senior Administrator' },
        'Discord Support': { minDays: 14, maxDays: 28, nextRank: 'Trial Moderator' },
        'Trial Discord Support': { minDays: 60, maxDays: 90, nextRank: 'Discord Support' }
    };

    // DOM elements
    const addUserBtn = document.getElementById('addUserBtn');
    const importBtn = document.getElementById('importBtn');
    const emptyAddBtn = document.getElementById('emptyAddBtn');
    const searchBtn = document.getElementById('searchBtn');
    const userModal = document.getElementById('userModal');
    const importModal = document.getElementById('importModal');
    const searchModal = document.getElementById('searchModal');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const closeUserModal = document.getElementById('closeUserModal');
    const closeImportModal = document.getElementById('closeImportModal');
    const closeSearchModal = document.getElementById('closeSearchModal');
    const cancelUserModalBtn = document.getElementById('cancelUserModal');
    const cancelImportModalBtn = document.getElementById('cancelImportModal');
    const userForm = document.getElementById('userForm');
    const importForm = document.getElementById('importForm');

    // New DOM elements for strikes and status
    const strike1Checkbox = document.getElementById('strike1');
    const strike2Checkbox = document.getElementById('strike2');
    const strike3Checkbox = document.getElementById('strike3');
    const strike1Fields = document.getElementById('strike1Fields');
    const strike2Fields = document.getElementById('strike2Fields');
    const strike3Fields = document.getElementById('strike3Fields');
    const strike1Date = document.getElementById('strike1Date');
    const strike2Date = document.getElementById('strike2Date');
    const strike3Date = document.getElementById('strike3Date');
    const strike1Info = document.getElementById('strike1Info');
    const strike2Info = document.getElementById('strike2Info');
    const strike3Info = document.getElementById('strike3Info');
    const watchlistCheckbox = document.getElementById('watchlist');
    const watchlistFields = document.getElementById('watchlistFields');
    const watchlistReason = document.getElementById('watchlistReason');
    const purgatoryCheckbox = document.getElementById('purgatory');

    // Filter elements
    const filtersBtn = document.getElementById('filtersBtn');
    const filtersDropdown = document.getElementById('filtersDropdown');
    const resetFiltersBtn = document.querySelector('.reset-filters-btn');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const timeRangeFilter = document.getElementById('timeRangeFilter');
    const timeRangeValue = document.getElementById('timeRangeValue');
    const checkEligibleBtn = document.getElementById('checkEligibleBtn');

    // Calculate time at rank for all cells
    updateTimeAtRank();

    // Set up periodic time update
    setInterval(updateTimeAtRank, 60000); // Update every minute

    // Add event listeners
    addUserBtn.addEventListener('click', openAddUserModal);
    if (emptyAddBtn) emptyAddBtn.addEventListener('click', openAddUserModal);
    importBtn.addEventListener('click', openImportModal);
    searchBtn.addEventListener('click', openSearchModal);
    closeUserModal.addEventListener('click', closeModal.bind(null, userModal));
    closeImportModal.addEventListener('click', closeModal.bind(null, importModal));
    closeSearchModal.addEventListener('click', closeModal.bind(null, searchModal));
    cancelUserModalBtn.addEventListener('click', closeModal.bind(null, userModal));
    cancelImportModalBtn.addEventListener('click', closeModal.bind(null, importModal));
    userForm.addEventListener('submit', handleFormSubmit);
    importForm.addEventListener('submit', handleImportSubmit);
    searchInput.addEventListener('input', handleSearch);

    // Filter event listeners
    filtersBtn.addEventListener('click', toggleFiltersDropdown);
    resetFiltersBtn.addEventListener('click', resetFilters);
    applyFiltersBtn.addEventListener('click', applyFilters);
    timeRangeFilter.addEventListener('input', updateTimeRangeValue);
    checkEligibleBtn.addEventListener('click', checkEligibleStaff);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!filtersBtn.contains(e.target) && !filtersDropdown.contains(e.target)) {
            filtersDropdown.classList.remove('show');
        }
    });

    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target === userModal || e.target === importModal || e.target === searchModal) {
            closeModals();
        }
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModals();
        }
    });

    // Add button hover effects
    const allButtons = document.querySelectorAll('.btn, .action-btn');
    allButtons.forEach(btn => {
        btn.addEventListener('mouseenter', addButtonEffect);
        btn.addEventListener('mouseleave', removeButtonEffect);
    });

    // Edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', handleEditClick);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', handleDeleteClick);
    });

    // Set today as default date for new users
    const datePromotedInput = document.getElementById('datePromoted');
    if (datePromotedInput) {
        const today = new Date().toISOString().slice(0, 10);
        datePromotedInput.value = today;
    }

    // Handle conditional fields display for strikes and watchlist
    strike1Checkbox.addEventListener('change', function () {
        toggleConditionalFields(strike1Checkbox, strike1Fields);
        updateStrikeInfo(strike1Checkbox, strike1Date, strike1Info);
    });

    strike2Checkbox.addEventListener('change', function () {
        toggleConditionalFields(strike2Checkbox, strike2Fields);
        updateStrikeInfo(strike2Checkbox, strike2Date, strike2Info);
    });

    strike3Checkbox.addEventListener('change', function () {
        toggleConditionalFields(strike3Checkbox, strike3Fields);
        updateStrikeInfo(strike3Checkbox, strike3Date, strike3Info);
    });

    watchlistCheckbox.addEventListener('change', function () {
        toggleConditionalFields(watchlistCheckbox, watchlistFields);
    });

    // Set default dates for strike inputs and update info
    strike1Date.addEventListener('change', function () {
        updateStrikeInfo(strike1Checkbox, strike1Date, strike1Info);
    });

    strike2Date.addEventListener('change', function () {
        updateStrikeInfo(strike2Checkbox, strike2Date, strike2Info);
    });

    strike3Date.addEventListener('change', function () {
        updateStrikeInfo(strike3Checkbox, strike3Date, strike3Info);
    });

    // Set default date for new strikes
    function setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        if (!strike1Date.value) strike1Date.value = today;
        if (!strike2Date.value) strike2Date.value = today;
        if (!strike3Date.value) strike3Date.value = today;
    }

    // Toggle conditional fields based on checkbox state
    function toggleConditionalFields(checkbox, fieldsContainer) {
        if (checkbox.checked) {
            fieldsContainer.classList.add('active');
        } else {
            fieldsContainer.classList.remove('active');
        }
    }

    // Calculate and display strike info (days remaining or expired)
    function updateStrikeInfo(checkbox, dateInput, infoElement) {
        if (checkbox && dateInput && infoElement) {
            if (checkbox.checked) {
                const date = new Date(dateInput.value);
                const formattedDate = date.toLocaleDateString();
                const daysAgo = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
                
                let daysText = daysAgo === 1 ? '1 day ago' : daysAgo + ' days ago';
                if (daysAgo === 0) daysText = 'Today';
                
                infoElement.textContent = `${formattedDate} (${daysText})`;
                infoElement.style.display = 'block';
            } else {
                infoElement.style.display = 'none';
            }
        }
    }

    // FUNCTIONS

    // Debounce function to limit how often a function is called
    function debounce(func, delay) {
        let timeout;
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    // Button hover effects
    function addButtonEffect(e) {
        const button = e.currentTarget;
        if (button.classList.contains('action-btn')) {
            button.style.transform = 'scale(1.15)';
        }
    }

    function removeButtonEffect(e) {
        const button = e.currentTarget;
        if (button.classList.contains('action-btn')) {
            button.style.transform = 'scale(1)';
        }
    }

    // Open Add User modal
    function openAddUserModal() {
        // Reset the form
        resetForm();
        
        // Set the form action for POST
        userForm.action = '/api/staff';
        
        // Set modal title and submit button
        document.getElementById('modalTitle').textContent = 'Add New Staff Member';
        document.getElementById('submitUser').textContent = 'Add Staff';
        
        // Default to today's date for promotion
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('datePromoted').value = today;
        
        // Show the modal
        const userModal = document.getElementById('userModal');
        userModal.style.display = 'block';
        setTimeout(() => {
            userModal.classList.add('show');
        }, 10);
        
        // Add modal-open class to body
        document.body.classList.add('modal-open');
        
        // Focus on first input
        setTimeout(() => {
            document.getElementById('name').focus();
        }, 300);
    }

    // Open Import modal
    function openImportModal() {
        // Clear the JSON data field
        document.getElementById('jsonData').value = '';
        
        // Show the modal
        const importModal = document.getElementById('importModal');
        importModal.style.display = 'block';
        setTimeout(() => {
            importModal.classList.add('show');
        }, 10);
        
        // Add modal-open class to body
        document.body.classList.add('modal-open');
        
        // Focus on textarea
        setTimeout(() => {
            document.getElementById('jsonData').focus();
        }, 300);
    }

    // Open Search modal
    function openSearchModal() {
        // Clear the search input
        document.getElementById('searchInput').value = '';
        document.getElementById('searchResults').innerHTML = '';
        
        // Show the modal
        const searchModal = document.getElementById('searchModal');
        searchModal.style.display = 'block';
        setTimeout(() => {
            searchModal.classList.add('show');
        }, 10);
        
        // Add modal-open class to body
        document.body.classList.add('modal-open');
        
        // Focus on search input
        setTimeout(() => {
            document.getElementById('searchInput').focus();
        }, 300);
    }

    // Search functionality
    function handleSearch() {
        const query = searchInput.value.toLowerCase().trim();
        const resultsContainer = document.getElementById('searchResults');
        resultsContainer.innerHTML = '';

        if (query.length < 2) {
            resultsContainer.innerHTML = '<div class="search-empty">Type at least 2 characters to search...</div>';
            return;
        }

        // Get all staff rows from the DOM
        const staffRows = document.querySelectorAll('.rank-table tbody tr');
        const results = [];

        staffRows.forEach(row => {
            const name = row.querySelector('td:first-child').textContent.toLowerCase();
            const discordId = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            const timeAtRank = row.querySelector('.time-at-rank').textContent.toLowerCase();
            const datePromoted = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
            const rank = row.closest('.rank-section').querySelector('.rank-title').textContent.toLowerCase();

            // Include strikes in search
            const strikesCell = row.querySelector('.strikes-cell');
            const strikes = strikesCell ? strikesCell.textContent.toLowerCase() : '';

            // Include status information in search
            const statusCell = row.querySelector('.status-cell');
            const strikeCell = row.querySelector('.strikes-cell');
            let status = '';

            if (statusCell || strikeCell) {
                const watchlistIndicator = statusCell.querySelector('.watchlist-indicator');
                if (watchlistIndicator) {
                    status += 'watchlist ';
                    // Include watchlist reason in search
                    const reason = watchlistIndicator.getAttribute('title');
                    if (reason) status += reason.toLowerCase() + ' ';
                }

                const purgatoryIndicator = statusCell.querySelector('.purgatory-indicator');
                if (purgatoryIndicator) {
                    status += 'purgatory ';
                }

                const strikeIndicator = strikeCell.querySelector('.strikes-indicator');
                if (strikeIndicator) {
                    status += 'strike ';
                    // Include strike reason in search
                    const reason = strikeIndicator.getAttribute('title');
                    if (reason) status += reason.toLowerCase() + ' ';
                }
            }

            // Combine all searchable text
            const searchText = `${name} ${discordId} ${timeAtRank} ${datePromoted} ${rank} ${strikes} ${status}`;

            if (searchText.includes(query)) {
                // Add row data to results
                const userId = row.getAttribute('data-id');
                results.push({
                    id: userId,
                    name: row.querySelector('td:first-child').textContent,
                    discordId: row.querySelector('td:nth-child(2)').textContent,
                    rank: rank,
                    datePromoted: row.querySelector('td:nth-child(4)').textContent,
                    timeAtRank: row.querySelector('.time-at-rank').textContent,
                    strikesHtml: strikesCell ? strikesCell.innerHTML : '-',
                    statusHtml: statusCell ? statusCell.innerHTML : '-',
                    hasStrikes: row.classList.contains('has-strikes'),
                    isWatchlisted: row.classList.contains('watchlisted'),
                    inPurgatory: row.classList.contains('in-purgatory'),
                    hasExpiredStrikes: row.classList.contains('has-expired-strikes'),
                    element: row
                });
            }
        });

        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="search-empty">No staff members found matching your search.</div>';
            return;
        }

        // Create results HTML
        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item animate-fade-in';

            // Add appropriate status classes
            if (result.hasStrikes) resultItem.classList.add('has-strikes');
            if (result.isWatchlisted) resultItem.classList.add('watchlisted');
            if (result.inPurgatory) resultItem.classList.add('in-purgatory');
            if (result.hasExpiredStrikes) resultItem.classList.add('has-expired-strikes');

            resultItem.innerHTML = `
                <div class="result-header">
                    <h3>${result.name}</h3>
                    <span class="result-rank">${result.rank.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                </div>
                <div class="result-details">
                    <div class="result-info-group">
                        <div class="result-info-item">
                            <span class="label">Discord ID:</span>
                            <span>${result.discordId}</span>
                        </div>
                        <div class="result-info-item">
                            <span class="label">Time at Rank:</span>
                            <span>${result.timeAtRank}</span>
                        </div>
                        <div class="result-info-item">
                            <span class="label">Date Promoted:</span>
                            <span>${result.datePromoted}</span>
                        </div>
                    </div>
                    <div class="result-info-group">
                        <div class="result-info-item">
                            <span class="label">Strikes:</span>
                            <span class="strikes-display">${result.strikesHtml}</span>
                        </div>
                        <div class="result-info-item">
                            <span class="label">Status:</span>
                            <span class="status-display">${result.statusHtml}</span>
                        </div>
                    </div>
                </div>
                <div class="result-actions">
                    <button class="btn action-btn edit-btn" data-id="${result.id}" title="Edit">
                        <span class="material-icons">edit</span>
                    </button>
                    <button class="btn action-btn delete-btn" data-id="${result.id}" title="Delete">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            `;

            // Add event listeners
            const editBtn = resultItem.querySelector('.edit-btn');
            editBtn.addEventListener('click', (e) => {
                // Close search modal only
                searchModal.classList.remove('show');
                document.body.style.overflow = 'auto';
                setTimeout(() => {
                    searchModal.style.display = 'none';
                }, 300);

                // Trigger edit
                handleEditClick(e);
            });

            const deleteBtn = resultItem.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                // Close search modal
                searchModal.classList.remove('active');

                // Trigger delete
                handleDeleteClick(e);
            });

            resultsContainer.appendChild(resultItem);
        });
    }

    // Handle edit button clicks
    function handleEditClick(e) {
        const userId = e.currentTarget.getAttribute('data-id');
        const userRow = e.currentTarget.closest('tr');
        
        // Show loading overlay
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        
        // Fetch the staff member's data from the server
        fetch(`/api/staff/${userId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch staff data');
                }
                return response.json();
            })
            .then(staffData => {
                // Hide loading overlay
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'none';
                }
                
                // Set the form action for PUT request
                userForm.action = `/api/staff/${userId}?_method=PUT`;
                
                // Set hidden user ID
                document.getElementById('userId').value = userId;
                
                // Reset form fields to clear previous data
                resetDisciplinaryFields();
                
                // Set modal title and submit button
                document.getElementById('modalTitle').textContent = 'Edit Staff Member';
                document.getElementById('submitUser').textContent = 'Update Staff';
                
                // Populate the form with user data
                populateEditForm(staffData);
                
                // Show the modal
                const userModal = document.getElementById('userModal');
                userModal.style.display = 'block';
                setTimeout(() => {
                    userModal.classList.add('show');
                }, 10);
            })
            .catch(error => {
                console.error('Error fetching staff data:', error);
                
                // Hide loading overlay
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'none';
                }
                
                alert('Error loading staff data. Please try again.');
                
                // Fallback to using the data from the DOM if API fails
                // Get data from the row
                const name = userRow.querySelector('.name-cell').textContent.trim();
                const discordId = userRow.querySelector('.discord-id-cell').textContent.trim();
                const datePromoted = userRow.querySelector('.date-promoted-cell').textContent.trim();
                const rank = userRow.querySelector('.rank-cell').textContent.trim();
                
                // Set the form action for PUT request
                userForm.action = `/api/staff/${userId}?_method=PUT`;
                
                // Set hidden user ID
                document.getElementById('userId').value = userId;
                
                // Set form values
                document.getElementById('name').value = name;
                document.getElementById('discordId').value = discordId;
                document.getElementById('datePromoted').value = formatDateForInput(datePromoted);
                
                // Set the rank dropdown
                const rankSelect = document.getElementById('rank');
                for (let i = 0; i < rankSelect.options.length; i++) {
                    if (rankSelect.options[i].text === rank) {
                        rankSelect.selectedIndex = i;
                        break;
                    }
                }
                
                // Set modal title and submit button
                document.getElementById('modalTitle').textContent = 'Edit Staff Member';
                document.getElementById('submitUser').textContent = 'Update Staff';
                
                // Reset disciplinary fields (since we can't get this info from DOM)
                resetDisciplinaryFields();
                
                // Show the modal
                const userModal = document.getElementById('userModal');
                userModal.style.display = 'block';
                setTimeout(() => {
                    userModal.classList.add('show');
                }, 10);
            });
    }

    // Make sure all modals can be properly closed when the page loads
    document.addEventListener('DOMContentLoaded', function() {
        // Add click event listeners to all close buttons in modals
        document.querySelectorAll('.modal .close-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                closeModal(modal);
            });
        });
        
        // Close modal when clicking on the backdrop
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', function(event) {
                if (event.target === this) {
                    closeModal(this);
                }
            });
        });
        
        // Specific handler for closeEligibleModal button
        const closeEligibleBtn = document.getElementById('closeEligibleModal');
        if (closeEligibleBtn) {
            closeEligibleBtn.addEventListener('click', function() {
                const eligibleModal = document.getElementById('eligibleModal');
                closeModal(eligibleModal);
            });
        }
    });

    // Function to close a specific modal
    function closeModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            
            // Clear eligible row highlighting if we're closing the eligible modal
            if (modal.id === 'eligibleModal') {
                document.querySelectorAll('.eligible-row').forEach(row => {
                    row.classList.remove('eligible-row');
                });
                
                // Remove any eligible indicators
                document.querySelectorAll('.eligible-indicator').forEach(indicator => {
                    indicator.remove();
                });
            }
        }, 300); // Match the transition duration in CSS
        document.body.classList.remove('modal-open');
    }

    // Function to close all modals
    function closeModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        });
        document.body.classList.remove('modal-open');
    }

    // Add all strike, watchlist and purgatory data to the form submission
    function handleFormSubmit(event) {
        event.preventDefault();

        // Gather form data
        const userId = document.getElementById('userId').value;

        // Determine if this is an add or update operation
        const isUpdate = !!userId;
        const url = isUpdate ? `/api/staff/${userId}?_method=PUT` : '/api/staff';
        
        // Show loading overlay
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }

        // Create FormData object for the submission
        const formData = new FormData();
        
        // Add basic info fields
        formData.append('name', document.getElementById('name').value.trim());
        formData.append('discordId', document.getElementById('discordId').value.trim());
        formData.append('rank', document.getElementById('rank').value);
        formData.append('datePromoted', document.getElementById('datePromoted').value);

        // Add disciplinary data
        formData.append('strike1', strike1Checkbox.checked);
        if (strike1Checkbox.checked && strike1Date.value) {
            formData.append('strike1Date', strike1Date.value);
        }

        formData.append('strike2', strike2Checkbox.checked);
        if (strike2Checkbox.checked && strike2Date.value) {
            formData.append('strike2Date', strike2Date.value);
        }

        formData.append('strike3', strike3Checkbox.checked);
        if (strike3Checkbox.checked && strike3Date.value) {
            formData.append('strike3Date', strike3Date.value);
        }

        formData.append('watchlist', watchlistCheckbox.checked);
        if (watchlistCheckbox.checked && watchlistReason.value) {
            formData.append('watchlistReason', watchlistReason.value.trim());
        }

        formData.append('purgatory', purgatoryCheckbox.checked);

        // Convert FormData to a plain object for JSON submission
        const formObject = {};
        for (const [key, value] of formData.entries()) {
            formObject[key] = value;
        }

        // Submit using fetch API with JSON
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formObject)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Server returned error status');
            }
            return response.json();
        })
        .then(data => {
            // Hide loading overlay
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            // Close the modal
            const userModal = document.getElementById('userModal');
            closeModal(userModal);
            
            // Show success message
            const action = isUpdate ? 'updated' : 'added';
            showToast(`Staff member ${action} successfully`, 'success');
            
            // Refresh the page after a short delay
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        })
        .catch(error => {
            console.error('Error submitting form:', error);
            
            // Hide loading overlay
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            // Show error message
            showToast('Failed to save staff member. Please try again.', 'error');
        });
    }

    // Handle import form submission
    function handleImportSubmit(e) {
        e.preventDefault();

        const jsonData = document.getElementById('jsonData').value;
        const jsonInput = document.getElementById('jsonData');

        try {
            // Validate JSON
            const parsedData = JSON.parse(jsonData);
            
            // Additional validation - check if it's an array
            if (!Array.isArray(parsedData)) {
                throw new Error('Data must be an array of staff members');
            }
            
            // Show loading state
            const submitBtn = importForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="material-icons" style="animation: spin 1s infinite linear">refresh</span> Importing...';
            submitBtn.disabled = true;
            
            // Send data using fetch
            fetch('/api/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: jsonData })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Server error');
                }
                return response.json();
            })
            .then(data => {
                // Close the modal
                const importModal = document.getElementById('importModal');
                closeModal(importModal);
                
                // Show success message
                showToast(`${data.count} staff records imported successfully`, 'success');
                
                // Refresh the page after a short delay
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            })
            .catch(error => {
                console.error('Import error:', error);
                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                // Show error
                jsonInput.style.borderColor = 'var(--error-color)';
                
                // Remove existing error message if any
                const existingError = jsonInput.parentNode.querySelector('.input-error');
                if (existingError) existingError.remove();
                
                // Create error message
                const errorMsg = document.createElement('div');
                errorMsg.className = 'input-error';
                errorMsg.style.color = 'var(--error-color)';
                errorMsg.style.fontSize = '12px';
                errorMsg.style.marginTop = '5px';
                errorMsg.textContent = 'Error importing data: ' + error.message;
                
                jsonInput.parentNode.appendChild(errorMsg);
            });
        } catch (error) {
            // JSON parse error - show validation error
            jsonInput.style.borderColor = 'var(--error-color)';

            // Remove existing error message if any
            const existingError = jsonInput.parentNode.querySelector('.input-error');
            if (existingError) existingError.remove();

            // Create error message
            const errorMsg = document.createElement('div');
            errorMsg.className = 'input-error';
            errorMsg.style.color = 'var(--error-color)';
            errorMsg.style.fontSize = '12px';
            errorMsg.style.marginTop = '5px';
            errorMsg.textContent = 'Invalid JSON format: ' + error.message;

            jsonInput.parentNode.appendChild(errorMsg);
        }
    }

    // Handle delete button click
    function handleDeleteClick(e) {
        const btn = e.currentTarget;
        const userId = btn.getAttribute('data-id');
        const tr = document.querySelector(`tr[data-id="${userId}"]`);
        const userName = tr.cells[0].textContent;

        // Create a confirmation dialog
        const confirmDialog = document.createElement('div');
        confirmDialog.className = 'confirm-dialog';
        confirmDialog.innerHTML = `
            <div class="confirm-dialog-content">
                <h3>Delete Staff Member</h3>
                <p>Are you sure you want to delete <strong>${userName}</strong>?</p>
                <p>This action cannot be undone.</p>
                <div class="confirm-actions">
                    <button class="btn cancel-btn">Cancel</button>
                    <button class="btn primary confirm-btn">Delete</button>
                </div>
            </div>
        `;

        // Style the dialog
        Object.assign(confirmDialog.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: '1000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: '0',
            transition: 'opacity 0.3s ease'
        });

        Object.assign(confirmDialog.querySelector('.confirm-dialog-content').style, {
            backgroundColor: 'var(--surface-color)',
            padding: '25px',
            borderRadius: 'var(--radius-lg)',
            width: '90%',
            maxWidth: '400px',
            boxShadow: 'var(--shadow-lg)',
            transform: 'translateY(-20px)',
            transition: 'transform 0.3s ease',
            border: '1px solid var(--border-color)'
        });

        Object.assign(confirmDialog.querySelector('h3').style, {
            marginBottom: '15px',
            fontFamily: 'Lexend, sans-serif',
            color: 'var(--primary-light)'
        });

        Object.assign(confirmDialog.querySelector('.confirm-actions').style, {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '20px'
        });

        Object.assign(confirmDialog.querySelector('.cancel-btn').style, {
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)'
        });

        Object.assign(confirmDialog.querySelector('.confirm-btn').style, {
            backgroundColor: 'var(--error-color)'
        });

        // Add to DOM
        document.body.appendChild(confirmDialog);

        // Show with animation
        setTimeout(() => {
            confirmDialog.style.opacity = '1';
            confirmDialog.querySelector('.confirm-dialog-content').style.transform = 'translateY(0)';
        }, 10);

        // Add event listeners
        confirmDialog.querySelector('.cancel-btn').addEventListener('click', () => {
            // Hide with animation
            confirmDialog.style.opacity = '0';
            confirmDialog.querySelector('.confirm-dialog-content').style.transform = 'translateY(-20px)';
            setTimeout(() => {
                document.body.removeChild(confirmDialog);
            }, 300);
        });

        confirmDialog.querySelector('.confirm-btn').addEventListener('click', () => {
            // Show loading state
            const confirmBtn = confirmDialog.querySelector('.confirm-btn');
            const originalText = confirmBtn.textContent;
            confirmBtn.textContent = 'Deleting...';
            confirmBtn.disabled = true;

            // Use fetch API instead of form submission
            fetch(`/api/staff/${userId}?_method=DELETE`, {
                method: 'POST'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete staff member');
                }
                return response.json();
            })
            .then(data => {
                // Hide dialog
                confirmDialog.style.opacity = '0';
                confirmDialog.querySelector('.confirm-dialog-content').style.transform = 'translateY(-20px)';
                
                setTimeout(() => {
                    if (document.body.contains(confirmDialog)) {
                        document.body.removeChild(confirmDialog);
                    }
                    
                    // Show success message
                    showToast('Staff member deleted successfully', 'success');
                    
                    // Remove row from UI or refresh page
                    if (tr && tr.parentNode) {
                        tr.parentNode.removeChild(tr);
                        
                        // Check if this was the last staff member in the rank
                        const rankSection = tr.closest('.rank-section');
                        if (rankSection) {
                            const remainingRows = rankSection.querySelectorAll('tbody tr').length;
                            if (remainingRows === 0) {
                                // Hide empty rank section
                                rankSection.style.display = 'none';
                            }
                        }
                    } else {
                        // Fallback: reload the page
                        window.location.reload();
                    }
                }, 300);
            })
            .catch(error => {
                console.error('Error deleting staff member:', error);
                
                // Reset button
                confirmBtn.textContent = originalText;
                confirmBtn.disabled = false;
                
                // Show error message
                showToast('Failed to delete staff member. Please try again.', 'error');
            });
        });

        // Close on click outside
        confirmDialog.addEventListener('click', (e) => {
            if (e.target === confirmDialog) {
                confirmDialog.style.opacity = '0';
                confirmDialog.querySelector('.confirm-dialog-content').style.transform = 'translateY(-20px)';
                setTimeout(() => {
                    document.body.removeChild(confirmDialog);
                }, 300);
            }
        });
    }

    // Calculate time at rank
    function updateTimeAtRank() {
        document.querySelectorAll('.time-at-rank').forEach(cell => {
            const datePromoted = cell.getAttribute('data-date');
            if (datePromoted) {
                cell.textContent = calculateTimeAtRank(datePromoted);
            }
        });
    }

    // Calculate time from date to now
    function calculateTimeAtRank(datePromoted) {
        const promotionDate = new Date(datePromoted);
        const now = new Date();

        const diffTime = Math.abs(now - promotionDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 30) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months} month${months !== 1 ? 's' : ''}`;
        } else {
            const years = Math.floor(diffDays / 365);
            const remainingMonths = Math.floor((diffDays % 365) / 30);

            if (remainingMonths === 0) {
                return `${years} year${years !== 1 ? 's' : ''}`;
            } else {
                return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
            }
        }
    }

    // Add animation style
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(styleSheet);

    // Update time range value display
    function updateTimeRangeValue() {
        timeRangeValue.textContent = timeRangeFilter.value;
    }

    // Toggle filters dropdown
    function toggleFiltersDropdown(e) {
        e.stopPropagation();
        filtersDropdown.classList.toggle('show');
    }

    // Reset all filters to default
    function resetFilters() {
        // Reset rank filters to unchecked (changed from checked)
        document.querySelectorAll('input[name="rank-filter"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Reset status filters to unchecked (changed from checked)
        document.querySelectorAll('input[name="status-filter"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Reset time range
        timeRangeFilter.value = 0;
        updateTimeRangeValue();
        
        // Apply the reset filters
        applyFilters();
    }

    // Add toggle all functionality
    document.querySelectorAll('.toggle-all-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Filter by target
            const targetFilter = this.getAttribute('data-target');
            const checkboxes = document.querySelectorAll(`input[name="${targetFilter}"]`);
            
            // Check if all checkboxes are currently checked
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            
            // Toggle all checkboxes to the opposite state
            checkboxes.forEach(checkbox => {
                checkbox.checked = !allChecked;
            });
            
            // Update button text
            this.textContent = allChecked ? 'Select All' : 'Deselect All';
            
            // Don't automatically apply filters - let the user click Apply Filters
        });
    });

    // Apply filters to the staff table
    function applyFilters() {
        // Get selected ranks
        const selectedRanks = Array.from(document.querySelectorAll('input[name="rank-filter"]:checked'))
            .map(checkbox => checkbox.value);
        
        // Get selected statuses
        const selectedStatuses = Array.from(document.querySelectorAll('input[name="status-filter"]:checked'))
            .map(checkbox => checkbox.value);
        
        // Get minimum time value
        const minDays = parseInt(timeRangeFilter.value);
        
        // Get all staff rows
        const staffRows = document.querySelectorAll('tr[data-id]');
        
        // If no rank filters and no status filters are selected, show all staff (except time filter still applies)
        const noRankFilters = selectedRanks.length === 0;
        const noStatusFilters = selectedStatuses.length === 0;
        
        // Loop through rows and apply filters
        staffRows.forEach(row => {
            const rank = row.closest('.rank-section').querySelector('.rank-title').textContent;
            const hasStrikes = row.classList.contains('has-strikes');
            const isWatchlisted = row.classList.contains('watchlisted');
            const isPurgatory = row.classList.contains('in-purgatory');
            const hasExpiredStrikes = row.classList.contains('has-expired-strikes');
            
            // Get time at rank
            const timeCell = row.querySelector('.time-at-rank');
            const timeText = timeCell.textContent;
            
            // Use the calculateTimeInDays function to handle complex time formats
            const days = calculateTimeInDays(timeText);
            
            // Apply filters step by step
            let showRow = true;
            
            // 1. Time filter - always applies
            if (days < minDays) {
                showRow = false;
            }
            
            // 2. Rank filter - if rank filters are selected
            if (showRow && !noRankFilters) {
                if (!selectedRanks.includes(rank)) {
                    showRow = false;
                }
            }
            
            // 3. Status filter - if status filters are selected
            if (showRow && !noStatusFilters) {
                // Check if staff has any of the selected statuses
                const hasSelectedStatus = 
                    (hasStrikes && selectedStatuses.includes('strikes')) ||
                    (isWatchlisted && selectedStatuses.includes('watchlist')) ||
                    (isPurgatory && selectedStatuses.includes('purgatory')) ||
                    (hasExpiredStrikes && selectedStatuses.includes('expired'));
                
                // If staff has no statuses but we're filtering by status, hide them
                const hasNoStatuses = !hasStrikes && !isWatchlisted && !isPurgatory && !hasExpiredStrikes;
                
                if (hasNoStatuses || !hasSelectedStatus) {
                    showRow = false;
                }
            }
            
            // Apply visibility based on filter results
            if (showRow) {
                row.style.display = '';
                // Make sure the rank section is visible
                row.closest('.rank-section').style.display = '';
            } else {
                row.style.display = 'none';
                
                // Check if all rows in this rank section are hidden
                const rankSection = row.closest('.rank-section');
                const visibleRows = rankSection.querySelectorAll('tr[data-id]:not([style*="display: none"])');
                if (visibleRows.length === 0) {
                    rankSection.style.display = 'none';
                }
            }
        });
        
        // Close the dropdown
        filtersDropdown.classList.remove('show');
    }

    // Check eligibility for promotions
    function checkEligibleStaff() {
        // Show loading overlay
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        
        setTimeout(() => {
            const staffRows = document.querySelectorAll('tr[data-id]'); // Use correct selector to match actual table rows
            const eligibleModal = document.getElementById('eligibleModal');
            const eligibleResultsContainer = document.getElementById('eligibleResults');
            const eligibleCountElement = document.getElementById('eligibleCount');
            
            // Clear previous results
            eligibleResultsContainer.innerHTML = '';
            
            // Group eligible staff by current rank
            const eligibleByRank = {};
            let totalEligibleCount = 0;
            
            staffRows.forEach(row => {
                // Skip rows that are hidden due to filters
                if (row.style.display === 'none') return;
                
                // Get the rank from the parent rank section
                const rankSection = row.closest('.rank-section');
                if (!rankSection) return;
                
                const rankTitle = rankSection.querySelector('.rank-title');
                if (!rankTitle) return;
                
                const currentRank = rankTitle.textContent.trim();
                
                // Get time at rank
                const timeCell = row.querySelector('.time-at-rank');
                if (!timeCell) return;
                
                const timeText = timeCell.textContent.trim();
                
                // Check for disciplinary actions
                const hasStrikes = row.classList.contains('has-strikes');
                const isWatchlisted = row.classList.contains('watchlisted');
                const isPurgatory = row.classList.contains('in-purgatory');
                
                // Check eligibility based on rank and time
                const requirements = PROMOTION_REQUIREMENTS[currentRank];
                let isEligible = false;
                let nextRank = '';
                
                if (requirements) {
                    // Get time in days for proper comparison
                    const daysAtRank = calculateTimeInDays(timeText);
                    
                    // Compare with the requirements (minDays)
                    if (daysAtRank >= requirements.minDays && 
                        !hasStrikes && 
                        !isWatchlisted && 
                        !isPurgatory) {
                        
                        isEligible = true;
                        nextRank = requirements.nextRank;
                    }
                }
                
                // Add eligible staff to the group
                if (isEligible) {
                    if (!eligibleByRank[currentRank]) {
                        eligibleByRank[currentRank] = [];
                    }
                    
                    const staffData = {
                        id: row.getAttribute('data-id'),
                        name: row.cells[0].textContent.trim(),
                        discordId: row.cells[1].textContent.trim(),
                        timeAtRank: timeText,
                        currentRank: currentRank,
                        nextRank: nextRank
                    };
                    
                    eligibleByRank[currentRank].push(staffData);
                    totalEligibleCount++;
                    
                    // Highlight the row in the main table
                    row.classList.add('eligible-row');
                    
                    // Add an eligible indicator to the row if it doesn't already have one
                    if (!row.querySelector('.eligible-indicator')) {
                        const indicator = document.createElement('div');
                        indicator.className = 'eligible-indicator';
                        
                        // Use outerHTML instead of innerHTML to ensure proper wrapping of the icon
                        const iconEl = document.createElement('span');
                        iconEl.className = 'material-icons';
                        iconEl.textContent = 'upgrade';
                        indicator.appendChild(iconEl);
                        
                        indicator.title = 'Eligible for promotion';
                        
                        // Append to the first cell in the row
                        const firstCell = row.querySelector('td:first-child');
                        if (firstCell) {
                            firstCell.style.position = 'relative';
                            firstCell.appendChild(indicator);
                        }
                    }
                }
            });
            
            // Update the count in the modal with improved styling
            eligibleCountElement.textContent = `${totalEligibleCount} staff member${totalEligibleCount !== 1 ? 's' : ''} eligible for promotion`;
            
            // Display eligible staff by rank
            if (totalEligibleCount === 0) {
                eligibleResultsContainer.innerHTML = '<div class="no-eligible">No staff members are currently eligible for promotion</div>';
            } else {
                // Get all ranks from PROMOTION_REQUIREMENTS
                const rankOrder = STAFF_RANKS;
                
                // Create flex container for rank sections
                const rankContainer = document.createElement('div');
                rankContainer.className = 'eligible-rank-container';
                eligibleResultsContainer.appendChild(rankContainer);
                
                rankOrder.forEach(rank => {
                    if (eligibleByRank[rank] && eligibleByRank[rank].length > 0) {
                        // Create a section for this rank
                        const rankSection = document.createElement('div');
                        rankSection.className = 'eligible-rank-section';
                        
                        // Create a header for this rank
                        const rankHeader = document.createElement('div');
                        rankHeader.className = 'eligible-rank-header';

                        // Create the rank title element
                        const rankTitle = document.createElement('div');
                        rankTitle.className = 'rank-title';
                        const rankIcon = document.createElement('span');
                        rankIcon.className = 'material-icons';
                        rankIcon.textContent = 'security';
                        rankTitle.appendChild(rankIcon);
                        const rankName = document.createElement('span');
                        rankName.className = 'rank-name';
                        rankName.textContent = rank;
                        rankTitle.appendChild(rankName);

                        // Create the next rank element with better styling
                        const nextRankDiv = document.createElement('div');
                        nextRankDiv.className = 'next-rank';
                        const arrowIcon = document.createElement('span');
                        arrowIcon.className = 'material-icons';
                        arrowIcon.textContent = 'arrow_forward';
                        nextRankDiv.appendChild(arrowIcon);
                        const nextRankSpan = document.createElement('span');
                        nextRankSpan.textContent = PROMOTION_REQUIREMENTS[rank].nextRank;
                        nextRankDiv.appendChild(nextRankSpan);

                        // Append both elements to the rank header
                        rankHeader.appendChild(rankTitle);
                        rankHeader.appendChild(nextRankDiv);
                        rankSection.appendChild(rankHeader);

                        // Create a container for staff cards
                        const staffContainer = document.createElement('div');
                        staffContainer.className = 'eligible-staff-container';
                        
                        // Add each eligible staff member as a card
                        eligibleByRank[rank].forEach(staff => {
                            const staffCard = document.createElement('div');
                            staffCard.className = 'eligible-staff-card';
                            staffCard.setAttribute('data-id', staff.id);
                            staffCard.setAttribute('data-current-rank', staff.currentRank);
                            staffCard.setAttribute('data-next-rank', staff.nextRank);
                            
                            // Create the staff info section
                            const staffInfo = document.createElement('div');
                            staffInfo.className = 'staff-info';
                            
                            // Add name
                            const staffName = document.createElement('div');
                            staffName.className = 'staff-name';
                            staffName.textContent = staff.name;
                            staffInfo.appendChild(staffName);
                            
                            // Add discord ID
                            const staffDiscordId = document.createElement('div');
                            staffDiscordId.className = 'staff-discord-id';
                            staffDiscordId.textContent = staff.discordId;
                            staffInfo.appendChild(staffDiscordId);
                            
                            // Add time at rank
                            const staffTimeAtRank = document.createElement('div');
                            staffTimeAtRank.className = 'staff-time-at-rank';
                            const clockIcon = document.createElement('span');
                            clockIcon.className = 'material-icons';
                            clockIcon.textContent = 'schedule';
                            staffTimeAtRank.appendChild(clockIcon);
                            const timeText = document.createTextNode(staff.timeAtRank);
                            staffTimeAtRank.appendChild(timeText);
                            staffInfo.appendChild(staffTimeAtRank);
                            
                            // Create the promote button
                            const promoteBtn = document.createElement('button');
                            promoteBtn.className = 'promote-btn';
                            promoteBtn.title = `Promote to ${staff.nextRank}`;
                            const checkIcon = document.createElement('span');
                            checkIcon.className = 'material-icons';
                            checkIcon.textContent = 'check_circle';
                            promoteBtn.appendChild(checkIcon);
                            
                            // Add click event for promote button
                            promoteBtn.addEventListener('click', () => {
                                showPromoteConfirmation(staff);
                            });
                            
                            // Assemble the card
                            staffCard.appendChild(staffInfo);
                            staffCard.appendChild(promoteBtn);
                            staffContainer.appendChild(staffCard);
                        });
                        
                        rankSection.appendChild(staffContainer);
                        rankContainer.appendChild(rankSection);
                    }
                });
            }
            
            // Add event listener for the modal close button
            const closeEligibleBtn = document.getElementById('closeEligibleModal');
            if (closeEligibleBtn) {
                // Remove any existing event listeners
                const newCloseBtn = closeEligibleBtn.cloneNode(true);
                if (closeEligibleBtn.parentNode) {
                    closeEligibleBtn.parentNode.replaceChild(newCloseBtn, closeEligibleBtn);
                }
                
                // Add the event listener
                newCloseBtn.addEventListener('click', () => {
                    const eligibleModal = document.getElementById('eligibleModal');
                    closeModal(eligibleModal);
                });
            }
            
            // Hide loading overlay
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            // Show the modal
            eligibleModal.style.display = 'block';
            setTimeout(() => {
                eligibleModal.classList.add('show');
            }, 10);
            
            // Add modal-open class to body
            document.body.classList.add('modal-open');
        }, 300); // Small delay to ensure the loading indicator is shown
    }

    // Helper function to calculate time in days from a string like "3 months" or "2 weeks"
    function calculateTimeInDays(timeStr) {
        const regex = /(\d+)\s*(months?|weeks?|days?|years?)/i;
        const match = timeStr.match(regex);
        
        if (!match) return 0;
        
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        
        // Convert to days
        if (unit.startsWith('day')) {
            return value;
        } else if (unit.startsWith('week')) {
            return value * 7; // 1 week = 7 days
        } else if (unit.startsWith('month')) {
            return value * 30; // Approximation: 1 month = 30 days
        } else if (unit.startsWith('year')) {
            return value * 365; // Approximation: 1 year = 365 days
        }
        
        return 0;
    }

    // Helper function to calculate time in months from a string like "3 months" or "2 weeks"
    function calculateTimeInMonths(timeStr) {
        const regex = /(\d+)\s*(months?|weeks?|days?|years?)/i;
        const match = timeStr.match(regex);
        
        if (!match) return 0;
        
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        
        // Convert to months
        if (unit.startsWith('month')) {
            return value;
        } else if (unit.startsWith('week')) {
            return value / 4; // Approximation: 4 weeks = 1 month
        } else if (unit.startsWith('day')) {
            return value / 30; // Approximation: 30 days = 1 month
        } else if (unit.startsWith('year')) {
            return value * 12; // 1 year = 12 months
        }
        
        return 0;
    }

    // Function to show the promotion confirmation dialog
    function showPromoteConfirmation(staffData) {
        // Create confirmation dialog
        const confirmDialog = document.createElement('div');
        confirmDialog.className = 'confirm-dialog promotion-confirm';
        
        // Create dialog content container
        const dialogContent = document.createElement('div');
        dialogContent.className = 'confirm-dialog-content';
        
        // Create header
        const header = document.createElement('h3');
        header.textContent = 'Confirm Promotion';
        
        // Create confirmation message
        const confirmMsg = document.createElement('p');
        confirmMsg.innerHTML = `Are you sure you want to promote <strong>${staffData.name}</strong>?`;
        
        // Create promotion details container
        const promotionDetails = document.createElement('div');
        promotionDetails.className = 'promotion-details';
        
        // Create "From" section
        const promotionFrom = document.createElement('div');
        promotionFrom.className = 'promotion-from';
        const fromLabel = document.createElement('span');
        fromLabel.className = 'label';
        fromLabel.textContent = 'From:';
        const fromValue = document.createElement('span');
        fromValue.className = 'value';
        fromValue.textContent = staffData.currentRank;
        promotionFrom.appendChild(fromLabel);
        promotionFrom.appendChild(fromValue);
        
        // Create "To" section
        const promotionTo = document.createElement('div');
        promotionTo.className = 'promotion-to';
        const toLabel = document.createElement('span');
        toLabel.className = 'label';
        toLabel.textContent = 'To:';
        const toValue = document.createElement('span');
        toValue.className = 'value';
        toValue.textContent = staffData.nextRank;
        promotionTo.appendChild(toLabel);
        promotionTo.appendChild(toValue);
        
        // Add both sections to promotion details
        promotionDetails.appendChild(promotionFrom);
        promotionDetails.appendChild(promotionTo);
        
        // Create promotion note
        const promotionNote = document.createElement('p');
        promotionNote.className = 'promotion-note';
        promotionNote.textContent = 'Date of promotion will be set to today.';
        
        // Create action buttons container
        const confirmActions = document.createElement('div');
        confirmActions.className = 'confirm-actions';
        
        // Create cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn cancel-btn';
        cancelBtn.textContent = 'Cancel';
        
        // Create confirm button
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn success confirm-btn';
        confirmBtn.textContent = 'Promote';
        
        // Add buttons to actions container
        confirmActions.appendChild(cancelBtn);
        confirmActions.appendChild(confirmBtn);
        
        // Assemble the dialog content
        dialogContent.appendChild(header);
        dialogContent.appendChild(confirmMsg);
        dialogContent.appendChild(promotionDetails);
        dialogContent.appendChild(promotionNote);
        dialogContent.appendChild(confirmActions);
        
        // Add content to dialog
        confirmDialog.appendChild(dialogContent);
        
        // Style the dialog
        Object.assign(confirmDialog.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: '1001', // Higher than the modal
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: '0',
            transition: 'opacity 0.3s ease'
        });
        
        Object.assign(dialogContent.style, {
            backgroundColor: 'var(--surface-color)',
            padding: '25px',
            borderRadius: 'var(--radius-lg)',
            width: '90%',
            maxWidth: '450px',
            boxShadow: 'var(--shadow-lg)',
            transform: 'translateY(-20px)',
            transition: 'transform 0.3s ease',
            border: '1px solid var(--border-color)'
        });
        
        // Add to DOM
        document.body.appendChild(confirmDialog);
        
        // Show with animation
        setTimeout(() => {
            confirmDialog.style.opacity = '1';
            dialogContent.style.transform = 'translateY(0)';
        }, 10);
        
        // Add event listeners
        cancelBtn.addEventListener('click', () => {
            closeConfirmDialog(confirmDialog);
        });
        
        confirmBtn.addEventListener('click', () => {
            // Submit the promotion
            promoteStaffMember(staffData);
            closeConfirmDialog(confirmDialog);
        });
        
        // Close on click outside
        confirmDialog.addEventListener('click', (e) => {
            if (e.target === confirmDialog) {
                closeConfirmDialog(confirmDialog);
            }
        });
    }

    // Function to close the confirmation dialog
    function closeConfirmDialog(dialog) {
        dialog.style.opacity = '0';
        const dialogContent = dialog.querySelector('.confirm-dialog-content');
        if (dialogContent) {
            dialogContent.style.transform = 'translateY(-20px)';
        }
        setTimeout(() => {
            document.body.removeChild(dialog);
        }, 300);
    }

    // Function to promote staff member
    function promoteStaffMember(staffData) {
        // Show loading overlay
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Create form data for the promotion
        const formData = new FormData();
        formData.append('rank', staffData.nextRank);
        formData.append('datePromoted', today);
        
        // Send the promotion request
        fetch(`/api/staff/${staffData.id}?_method=PUT`, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to promote staff member');
            }
            return response.json();
        })
        .then(data => {
            // Hide loading overlay
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            // Remove the promoted staff card
            const staffCard = document.querySelector(`.eligible-staff-card[data-id="${staffData.id}"]`);
            if (staffCard) {
                staffCard.classList.add('promoted');
                setTimeout(() => {
                    staffCard.style.display = 'none';
                    
                    // Check if there are no more staff in this rank section
                    const rankSection = staffCard.closest('.eligible-rank-section');
                    const remainingCards = rankSection.querySelectorAll('.eligible-staff-card:not(.promoted)');
                    if (remainingCards.length === 0) {
                        rankSection.style.display = 'none';
                    }
                    
                    // Update the count in the modal
                    const eligibleCountElement = document.getElementById('eligibleCount');
                    const currentCount = parseInt(eligibleCountElement.textContent.split(' ')[0]);
                    const newCount = currentCount - 1;
                    eligibleCountElement.textContent = `${newCount} staff member${newCount !== 1 ? 's' : ''} eligible for promotion`;
                    
                    // If no more staff are eligible, show the no-eligible message
                    if (newCount === 0) {
                        const eligibleResultsContainer = document.getElementById('eligibleResults');
                        eligibleResultsContainer.innerHTML = '<div class="no-eligible">No staff members are currently eligible for promotion</div>';
                    }
                }, 500);
            }
            
            // Show success message
            showToast(`${staffData.name} promoted to ${staffData.nextRank}`, 'success');
            
            // Refresh the page after a short delay
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        })
        .catch(error => {
            console.error('Error promoting staff member:', error);
            
            // Hide loading overlay
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            // Show error message
            showToast('Failed to promote staff member. Please try again.', 'error');
        });
    }

    // Toast notification function
    function showToast(message, type = 'info') {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => {
            toast.remove();
        });
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Create toast content
        const toastContent = document.createElement('div');
        toastContent.className = 'toast-content';
        
        // Create icon
        const iconEl = document.createElement('span');
        iconEl.className = 'material-icons toast-icon';
        
        // Set the right icon based on type
        if (type === 'success') {
            iconEl.textContent = 'check_circle';
        } else if (type === 'error') {
            iconEl.textContent = 'error';
        } else {
            iconEl.textContent = 'info';
        }
        
        // Create message span
        const messageEl = document.createElement('span');
        messageEl.className = 'toast-message';
        messageEl.textContent = message;
        
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        const closeIcon = document.createElement('span');
        closeIcon.className = 'material-icons';
        closeIcon.textContent = 'close';
        closeBtn.appendChild(closeIcon);
        
        // Assemble the toast
        toastContent.appendChild(iconEl);
        toastContent.appendChild(messageEl);
        toast.appendChild(toastContent);
        toast.appendChild(closeBtn);
        
        // Add to DOM
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Auto-hide after 5 seconds
        const hideTimeout = setTimeout(() => {
            hideToast(toast);
        }, 5000);
        
        // Add close button listener
        closeBtn.addEventListener('click', () => {
            clearTimeout(hideTimeout);
            hideToast(toast);
        });
    }

    // Hide toast function
    function hideToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    // Reset the user form
    function resetForm() {
        // Get the form element
        const userForm = document.getElementById('userForm');
        userForm.reset();
        
        // Clear the user ID field
        document.getElementById('userId').value = '';
        
        // Reset disciplinary fields
        resetDisciplinaryFields();
        
        // Default to today's date for promotion
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('datePromoted').value = today;
    }

    // Function to populate the edit form with data from the server
    function populateEditForm(staffData) {
        // Fill the form with staff data
        document.getElementById('name').value = staffData.name || '';
        document.getElementById('discordId').value = staffData.discordId || '';
        
        // Format date for input field (YYYY-MM-DD)
        if (staffData.datePromoted) {
            const dateStr = staffData.datePromoted instanceof Date 
                ? staffData.datePromoted.toISOString().split('T')[0]
                : staffData.datePromoted.split('T')[0];
            document.getElementById('datePromoted').value = dateStr;
        } else {
            document.getElementById('datePromoted').value = new Date().toISOString().split('T')[0];
        }
        
        // Set the rank dropdown
        const rankSelect = document.getElementById('rank');
        for (let i = 0; i < rankSelect.options.length; i++) {
            if (rankSelect.options[i].value === staffData.rank) {
                rankSelect.selectedIndex = i;
                break;
            }
        }
        
        // TODO: Check if this is needed
        resetDisciplinaryFields();
        
        // Get references to disciplinary UI elements
        const strike1Checkbox = document.getElementById('strike1');
        const strike2Checkbox = document.getElementById('strike2');
        const strike3Checkbox = document.getElementById('strike3');
        const strike1Fields = document.getElementById('strike1Fields');
        const strike2Fields = document.getElementById('strike2Fields');
        const strike3Fields = document.getElementById('strike3Fields');
        const strike1Date = document.getElementById('strike1Date');
        const strike2Date = document.getElementById('strike2Date');
        const strike3Date = document.getElementById('strike3Date');
        const watchlistCheckbox = document.getElementById('watchlist');
        const watchlistFields = document.getElementById('watchlistFields');
        const watchlistReason = document.getElementById('watchlistReason');
        const purgatoryCheckbox = document.getElementById('purgatory');
        
        // Set strike data
        if (staffData.strike1) {
            strike1Checkbox.checked = true;
            strike1Fields.classList.add('active');
            if (staffData.strike1Date) {
                const dateStr = staffData.strike1Date instanceof Date 
                    ? staffData.strike1Date.toISOString().split('T')[0]
                    : staffData.strike1Date.split('T')[0];
                strike1Date.value = dateStr;
            }
        }
        
        if (staffData.strike2) {
            strike2Checkbox.checked = true;
            strike2Fields.classList.add('active');
            if (staffData.strike2Date) {
                const dateStr = staffData.strike2Date instanceof Date 
                    ? staffData.strike2Date.toISOString().split('T')[0]
                    : staffData.strike2Date.split('T')[0];
                strike2Date.value = dateStr;
            }
        }
        
        if (staffData.strike3) {
            strike3Checkbox.checked = true;
            strike3Fields.classList.add('active');
            if (staffData.strike3Date) {
                const dateStr = staffData.strike3Date instanceof Date 
                    ? staffData.strike3Date.toISOString().split('T')[0]
                    : staffData.strike3Date.split('T')[0];
                strike3Date.value = dateStr;
            }
        }
        
        // Set watchlist status
        if (staffData.watchlist) {
            watchlistCheckbox.checked = true;
            watchlistFields.classList.add('active');
            watchlistReason.value = staffData.watchlistReason || '';
        }
        
        // Set purgatory status
        if (staffData.purgatory) {
            purgatoryCheckbox.checked = true;
        }
        
        // Update strike info displays if they exist
        const strike1Info = document.getElementById('strike1Info');
        const strike2Info = document.getElementById('strike2Info');
        const strike3Info = document.getElementById('strike3Info');
        
        if (strike1Info && strike1Date) {
            updateStrikeInfo(strike1Checkbox, strike1Date, strike1Info);
        }
        if (strike2Info && strike2Date) {
            updateStrikeInfo(strike2Checkbox, strike2Date, strike2Info);
        }
        if (strike3Info && strike3Date) {
            updateStrikeInfo(strike3Checkbox, strike3Date, strike3Info);
        }
    }

    // Function to reset disciplinary fields
    function resetDisciplinaryFields() {
        const strike1Checkbox = document.getElementById('strike1');
        const strike2Checkbox = document.getElementById('strike2');
        const strike3Checkbox = document.getElementById('strike3');
        const strike1Fields = document.getElementById('strike1Fields');
        const strike2Fields = document.getElementById('strike2Fields');
        const strike3Fields = document.getElementById('strike3Fields');
        const watchlistCheckbox = document.getElementById('watchlist');
        const watchlistFields = document.getElementById('watchlistFields');
        const watchlistReason = document.getElementById('watchlistReason');
        const purgatoryCheckbox = document.getElementById('purgatory');
        
        if (strike1Checkbox) strike1Checkbox.checked = false;
        if (strike2Checkbox) strike2Checkbox.checked = false;
        if (strike3Checkbox) strike3Checkbox.checked = false;
        if (strike1Fields) strike1Fields.classList.remove('active');
        if (strike2Fields) strike2Fields.classList.remove('active');
        if (strike3Fields) strike3Fields.classList.remove('active');
        if (watchlistCheckbox) watchlistCheckbox.checked = false;
        if (watchlistFields) watchlistFields.classList.remove('active');
        if (watchlistReason) watchlistReason.value = '';
        if (purgatoryCheckbox) purgatoryCheckbox.checked = false;
        
        // Set default dates for strikes
        setDefaultDates();
    }

    // Format date for input field (MM/DD/YYYY to YYYY-MM-DD)
    function formatDateForInput(dateStr) {
        // Try to parse the date string
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
        
        // If parsing fails, return today's date
        return new Date().toISOString().split('T')[0];
    }

    // Add a function to update edit button listeners
    function updateEditButtonListeners() {
        document.querySelectorAll('.edit-btn').forEach(button => {
            // Remove any existing event listeners (by cloning and replacing)
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // Add the event listener to the new button
            newButton.addEventListener('click', handleEditClick);
        });
    }

    // Call the function when the page loads
    document.addEventListener('DOMContentLoaded', function() {
        updateEditButtonListeners();
    });

    // Attach event listener to check eligible button
    document.getElementById('checkEligibleBtn').addEventListener('click', checkEligibleStaff);

    // Generate Report Button
    const generateReportBtn = document.getElementById('generateReportBtn');
    const reportTypeModal = document.getElementById('reportTypeModal');
    const closeReportTypeModalBtn = document.getElementById('closeReportTypeModal');
    const staffLeadershipReportBtn = document.getElementById('staffLeadershipBtn');
    const needsPermsReportBtn = document.getElementById('needsPermsBtn');
    const staffRemovalReportBtn = document.getElementById('staffRemovalBtn');
    const generatedReportModal = document.getElementById('generatedReportModal');
    const closeGeneratedReportModalBtn = document.getElementById('closeGeneratedReportModal');
    const reportText = document.getElementById('reportText');
    const reportTitle = document.getElementById('reportTitle');
    const copyReportBtn = document.getElementById('copyReportBtn');
    
    let currentStaffData = null;
    
    // Show report type selection modal
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent form submission
            // Get current staff data from form
            currentStaffData = {
                id: document.getElementById('userId').value,
                name: document.getElementById('name').value,
                discordId: document.getElementById('discordId').value,
                rank: document.getElementById('rank').value
            };
            
            // Show the report type selection modal
            reportTypeModal.style.display = 'block';
            reportTypeModal.classList.add('show');
        });
    }
    
    // Close report type modal
    if (closeReportTypeModalBtn) {
        closeReportTypeModalBtn.addEventListener('click', function() {
            reportTypeModal.classList.remove('show');
            reportTypeModal.style.display = 'none';
        });
    }
    
    // Handle Staff Leadership Report selection
    if (staffLeadershipReportBtn) {
        staffLeadershipReportBtn.addEventListener('click', function() {
            generateStaffLeadershipReport(currentStaffData);
            reportTypeModal.classList.remove('show');
            reportTypeModal.style.display = 'none';
            generatedReportModal.style.display = 'block';
            generatedReportModal.classList.add('show');
            reportTitle.textContent = "Staff Leadership Report";
        });
    }
    
    // Handle Needs Perms Report selection
    if (needsPermsReportBtn) {
        needsPermsReportBtn.addEventListener('click', function() {
            generateNeedsPermsReport(currentStaffData);
            reportTypeModal.classList.remove('show');
            reportTypeModal.style.display = 'none';
            generatedReportModal.style.display = 'block';
            generatedReportModal.classList.add('show');
            reportTitle.textContent = "Needs Perms Report";
        });
    }
    
    // Add Staff Removal Report button listener
    if (staffRemovalReportBtn) {
        staffRemovalReportBtn.addEventListener('click', function() {
            generateStaffRemovalReport(currentStaffData);
            reportTypeModal.classList.remove('show');
            reportTypeModal.style.display = 'none';
            generatedReportModal.style.display = 'block';
            generatedReportModal.classList.add('show');
            reportTitle.textContent = "Staff Removal Request";
        });
    }
    
    // Close generated report modal
    if (closeGeneratedReportModalBtn) {
        closeGeneratedReportModalBtn.addEventListener('click', function() {
            generatedReportModal.classList.remove('show');
            generatedReportModal.style.display = 'none';
        });
    }
    
    // Copy report to clipboard
    if (copyReportBtn) {
        copyReportBtn.addEventListener('click', function() {
            const textToCopy = reportText.textContent;
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    showToast("Report copied to clipboard!", "success");
                })
                .catch(err => {
                    showToast("Failed to copy: " + err, "error");
                });
        });
    }

    // Make closeModal globally available to fix the ReferenceError
    window.closeModal = closeModal;

    // Add the Staff Removal Report generator function
    function generateStaffRemovalReport(staffData) {
        // Get current date in Norwegian and EST time zones
        const now = new Date();
        const norwegianDate = now.toLocaleDateString('nb-NO'); // Norwegian format
        
        // Format EST date
        const estOptions = { timeZone: 'America/New_York', year: 'numeric', month: 'numeric', day: 'numeric' };
        const estDate = now.toLocaleString('en-US', estOptions).split(',')[0];
        
        // Format the report text
        const reportContent = `## Staff Removal Request
**Name:** <@${staffData.discordId}> | ${staffData.discordId}
**Reason:** *Type reason here*
**Proof:** *Type proof here*
<@&1154991349460906074>`;
        
        // Set the report text in the modal
        document.getElementById('reportText').textContent = reportContent;
    }
});

// These functions must be defined in the global scope outside any event listeners
// Make sure these aren't duplicated if they already exist

function generateStaffLeadershipReport(staffData) {
    // Get current date in Norway time and EST
    const now = new Date();
    
    // Norway time (Europe/Oslo)
    const norwayTime = now.toLocaleString('en-US', { 
        timeZone: 'Europe/Oslo',
        hour12: true,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // EST time (America/New_York)
    const estTime = now.toLocaleString('en-US', { 
        timeZone: 'America/New_York',
        hour12: true,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Format dates to match the requested format
    const norwayDate = norwayTime.replace(',', '').replace(/(\d+)\/(\d+)\/(\d+)/, '$1/$2/$3 at');
    const estDate = estTime.replace(',', '').replace(/(\d+)\/(\d+)\/(\d+)/, '$1/$2/$3 at');
    
    // Generate the report
    const report = `**Staff Member's name:** *<@${staffData.discordId}> | ${staffData.discordId}*  
**What they did:** *[Fill in what they did]*  
**When they did it:** *${norwayDate} (Norway Time) | ${estDate} (EST)*  
**Witness names (If Applicable):** *N/A*  
**Did you have a brief convo on how they can improve (Y/N):** *Y*  

**Brief Personal Opinion on Situation:**  
[Fill in your personal opinion here]

**Video Evidence:** *Attached*`;
    
    document.getElementById('reportText').textContent = report;
}

function generateNeedsPermsReport(staffData) {
    console.log("Generating Needs Perms Report for:", staffData);
    
    // Generate the report with the new format
    const report = `**Staff Punishment Format**
**Discord id:** <@${staffData.discordId}> | ${staffData.discordId}
**Punishment Given:** [Fill in punishment]
**Reason:** [Fill in reason]
**Proof:** Leadership Report`;
    
    const reportText = document.getElementById('reportText');
    if (reportText) {
        reportText.textContent = report;
    } else {
        console.error("Report text element not found");
    }
} 