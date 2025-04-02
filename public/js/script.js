$(function() {
    // Initialize logger
    var logger = {
        debug: function(message, data) { console.debug(message, data); },
        info: function(message, data) { console.info(message, data); },
        warn: function(message, data) { console.warn(message, data); },
        error: function(message, data) { console.error(message, data); },
        logApiCall: function(endpoint, method, status, duration, data) {
            this.info(`API Call: ${method} ${endpoint}`, { status, duration: `${duration}ms`, data });
        },
        logStaffUpdate: function(staffId, changes) {
            this.info(`Staff Update: ${staffId}`, { changes });
        },
        logSearch: function(query, resultCount) {
            this.debug(`Search: "${query}"`, { resultCount });
        },
        logPromotionEligibility: function(staffId, currentRank, targetRank) {
            this.info(`Promotion Eligibility: ${staffId}`, { currentRank, targetRank });
        },
        logFilterChange: function(filters) {
            this.debug('Filters changed', { filters });
        },
        logModalAction: function(action, modalId) {
            this.debug(`Modal ${action}`, { modalId });
        },
        logFormSubmission: function(formId, data) {
            this.info(`Form submitted: ${formId}`, { data });
        }
    };

    // Staff ranks in order (from highest to lowest)
    var STAFF_RANKS = [
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
    var PROMOTION_REQUIREMENTS = {
        'Trial Moderator': { minDays: 14, maxDays: 28, nextRank: 'Moderator' },
        'Moderator': { minDays: 28, maxDays: 42, nextRank: 'Senior Moderator' },
        'Senior Moderator': { minDays: 60, maxDays: 90, nextRank: 'Staff Supervisor' },
        'Staff Supervisor': { minDays: 120, maxDays: 180, nextRank: 'Administrator' },
        'Administrator': { minDays: 180, maxDays: 270, nextRank: 'Senior Administrator' },
        'Discord Support': { minDays: 14, maxDays: 28, nextRank: 'Trial Moderator' },
        'Trial Discord Support': { minDays: 60, maxDays: 90, nextRank: 'Discord Support' }
    };

    // Cache jQuery selectors for DOM elements
    var $addUserBtn = $('#addUserBtn');
    var $importBtn = $('#importBtn');
    var $emptyAddBtn = $('#emptyAddBtn');
    var $searchBtn = $('#searchBtn');
    var $logsBtn = $('#logsBtn');
    var $userModal = $('#userModal');
    var $importModal = $('#importModal');
    var $searchModal = $('#searchModal');
    var $searchInput = $('#searchInput');
    var $searchResults = $('#searchResults');
    var $closeUserModal = $('#closeUserModal');
    var $closeImportModal = $('#closeImportModal');
    var $closeSearchModal = $('#closeSearchModal');
    var $cancelUserModalBtn = $('#cancelUserModal');
    var $cancelImportModalBtn = $('#cancelImportModal');
    var $userForm = $('#userForm');
    var $importForm = $('#importForm');
    var $logsSection = $('.logs-section');
    var $logLevelFilter = $('#logLevelFilter');
    var $clearLogsBtn = $('#clearLogsBtn');
    var $logsContainer = $('.logs-container');

    // Strikes and related fields
    var $strike1Checkbox = $('#strike1');
    var $strike2Checkbox = $('#strike2');
    var $strike3Checkbox = $('#strike3');
    var $strike1Fields = $('#strike1Fields');
    var $strike2Fields = $('#strike2Fields');
    var $strike3Fields = $('#strike3Fields');
    var $strike1Date = $('#strike1Date');
    var $strike2Date = $('#strike2Date');
    var $strike3Date = $('#strike3Date');
    var $strike1Info = $('#strike1Info');
    var $strike2Info = $('#strike2Info');
    var $strike3Info = $('#strike3Info');
    var $watchlistCheckbox = $('#watchlist');
    var $watchlistFields = $('#watchlistFields');
    var $watchlistReason = $('#watchlistReason');
    var $purgatoryCheckbox = $('#purgatory');

    // Filter elements
    var $filtersBtn = $('#filtersBtn');
    var $filtersDropdown = $('#filtersDropdown');
    var $resetFiltersBtn = $('.reset-filters-btn');
    var $applyFiltersBtn = $('#applyFiltersBtn');
    var $timeRangeFilter = $('#timeRangeFilter');
    var $timeRangeValue = $('#timeRangeValue');
    var $checkEligibleBtn = $('#checkEligibleBtn');

    // Update time at rank initially and set up periodic updates
    updateTimeAtRank();
    setInterval(updateTimeAtRank, 60000);

    // Event Listeners
    $addUserBtn.on('click', openAddUserModal);
    if ($emptyAddBtn.length) { $emptyAddBtn.on('click', openAddUserModal); }
    $importBtn.on('click', openImportModal);
    $searchBtn.on('click', openSearchModal);

    // Logs button functionality
    $logsBtn.on('click', function() {
        $('.rank-tables').toggle();
        $logsSection.toggle();
        if ($logsSection.is(':visible')) {
            updateLogsDisplay();
        }
        $(this).toggleClass('active');
    });

    // Modal close handlers
    $closeUserModal.on('click', function() { closeModal($userModal); });
    $closeImportModal.on('click', function() { closeModal($importModal); });
    $closeSearchModal.on('click', function() { closeModal($searchModal); });
    $cancelUserModalBtn.on('click', function() { closeModal($userModal); });
    $cancelImportModalBtn.on('click', function() { closeModal($importModal); });

    // Form handlers
    $userForm.on('submit', handleFormSubmit);
    $importForm.on('submit', handleImportSubmit);
    $searchInput.on('input', handleSearch);

    // Logs handlers
    $logLevelFilter.on('change', updateLogsDisplay);
    $clearLogsBtn.on('click', function() {
        logger.clearLogs();
        updateLogsDisplay();
        showToast('Logs cleared successfully', 'success');
    });

    // Filters event listeners
    $filtersBtn.on('click', toggleFiltersDropdown);
    $resetFiltersBtn.on('click', resetFilters);
    $applyFiltersBtn.on('click', applyFilters);
    $timeRangeFilter.on('input', updateTimeRangeValue);
    $checkEligibleBtn.on('click', checkEligibleStaff);

    // Close dropdown when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest($filtersBtn).length && !$(e.target).closest($filtersDropdown).length) {
            $filtersDropdown.removeClass('show');
        }
    });

    // Close modals when clicking outside them
    $(window).on('click', function(e) {
        if ($(e.target).is($userModal) || $(e.target).is($importModal) || $(e.target).is($searchModal)) {
            closeModals();
        }
    });

    // Keyboard shortcut: Escape key closes modals
    $(window).on('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModals();
        }
        // Add CTRL + F shortcut for search
        if (e.ctrlKey && e.key.toLowerCase() === 'f') {
            e.preventDefault(); // Prevent browser's default search
            openSearchModal();
        }
    });

    // Button hover effects using jQuery hover
    $('.btn, .action-btn').hover(
        function() {
            if ($(this).hasClass('action-btn')) {
                $(this).css('transform', 'scale(1.15)');
            }
        },
        function() {
            if ($(this).hasClass('action-btn')) {
                $(this).css('transform', 'scale(1)');
            }
        }
    );

    // For dynamically generated edit and delete buttons
    $(document).on('click', '.edit-btn', handleEditClick);
    $(document).on('click', '.delete-btn', handleDeleteClick);

    // Set today as default date for new users
    var $datePromotedInput = $('#datePromoted');
    if ($datePromotedInput.length) {
        var today = new Date().toISOString().slice(0, 10);
        $datePromotedInput.val(today);
    }

    // Handle conditional fields for strikes and watchlist
    $strike1Checkbox.on('change', function() {
        toggleConditionalFields($(this), $strike1Fields);
        updateStrikeInfo($strike1Checkbox, $strike1Date, $strike1Info);
    });
    $strike2Checkbox.on('change', function() {
        toggleConditionalFields($(this), $strike2Fields);
        updateStrikeInfo($strike2Checkbox, $strike2Date, $strike2Info);
    });
    $strike3Checkbox.on('change', function() {
        toggleConditionalFields($(this), $strike3Fields);
        updateStrikeInfo($strike3Checkbox, $strike3Date, $strike3Info);
    });
    $watchlistCheckbox.on('change', function() {
        toggleConditionalFields($(this), $watchlistFields);
    });
    $strike1Date.on('change', function() {
        updateStrikeInfo($strike1Checkbox, $strike1Date, $strike1Info);
    });
    $strike2Date.on('change', function() {
        updateStrikeInfo($strike2Checkbox, $strike2Date, $strike2Info);
    });
    $strike3Date.on('change', function() {
        updateStrikeInfo($strike3Checkbox, $strike3Date, $strike3Info);
    });

    // Utility functions
    function toggleConditionalFields($checkbox, $fieldsContainer) {
        if ($checkbox.is(':checked')) {
            $fieldsContainer.addClass('active');
        } else {
            $fieldsContainer.removeClass('active');
        }
    }

    function updateStrikeInfo($checkbox, $dateInput, $infoElement) {
        if ($checkbox.is(':checked')) {
            var date = new Date($dateInput.val());
            var formattedDate = date.toLocaleDateString();
            var daysAgo = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
            var daysText = daysAgo === 1 ? '1 day ago' : daysAgo + ' days ago';
            if (daysAgo === 0) { daysText = 'Today'; }
            $infoElement.text(formattedDate + ' (' + daysText + ')').show();
        } else {
            $infoElement.hide();
        }
    }

    // Debounce utility
    function debounce(func, delay) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, delay);
        };
    }

    // Modal functions
    function openAddUserModal() {
        if (logger) { logger.logModalAction('opened', 'addUserModal'); }
        resetForm();
        $userForm.attr('action', '/api/staff');
        $('#modalTitle').text('Add New Staff Member');
        $('#submitUser').text('Add Staff');
        var today = new Date().toISOString().split('T')[0];
        $('#datePromoted').val(today);
        $userModal.show().delay(10).queue(function(next) {
            $(this).addClass('show');
            next();
        });
        $('body').addClass('modal-open');
        setTimeout(function() { $('#name').focus(); }, 300);
    }

    function openImportModal() {
        if (logger) { logger.logModalAction('opened', 'importModal'); }
        $('#jsonData').val('');
        $importModal.show().delay(10).queue(function(next) {
            $(this).addClass('show');
            next();
        });
        $('body').addClass('modal-open');
        setTimeout(function() { $('#jsonData').focus(); }, 300);
    }

    function openSearchModal() {
        if (logger) { logger.logModalAction('opened', 'searchModal'); }
        $searchInput.val('');
        $searchResults.empty();
        $searchModal.show().delay(10).queue(function(next) {
            $(this).addClass('show');
            next();
        });
        $('body').addClass('modal-open');
        setTimeout(function() { $searchInput.focus(); }, 300);
    }

    function closeModal($modal) {
        if (logger) { logger.logModalAction('closed', $modal.attr('id')); }
        $modal.removeClass('show');
        setTimeout(function() {
            $modal.hide();
            if ($modal.attr('id') === 'eligibleModal') {
                $('.eligible-row').removeClass('eligible-row');
                $('.eligible-indicator').remove();
            }
        }, 300);
        $('body').removeClass('modal-open');
    }

    function closeModals() {
        $('.modal').each(function() {
            $(this).removeClass('show');
            var $this = $(this);
            setTimeout(function() {
                $this.hide();
            }, 300);
        });
        $('body').removeClass('modal-open');
    }

    // Form submission handling for Add/Edit
    function handleFormSubmit(e) {
        e.preventDefault();
        var userId = $('#userId').val();
        var isUpdate = !!userId;
        var url = isUpdate ? '/api/staff/' + userId + '?_method=PUT' : '/api/staff';
        var $loadingOverlay = $('.loading-overlay');
        if ($loadingOverlay.length) { $loadingOverlay.show(); }

        var formData = {
            name: $('#name').val().trim(),
            discordId: $('#discordId').val().trim(),
            rank: $('#rank').val(),
            datePromoted: $('#datePromoted').val(),
            strike1: $strike1Checkbox.is(':checked'),
            strike1Date: $strike1Checkbox.is(':checked') && $strike1Date.val() ? $strike1Date.val() : undefined,
            strike2: $strike2Checkbox.is(':checked'),
            strike2Date: $strike2Checkbox.is(':checked') && $strike2Date.val() ? $strike2Date.val() : undefined,
            strike3: $strike3Checkbox.is(':checked'),
            strike3Date: $strike3Checkbox.is(':checked') && $strike3Date.val() ? $strike3Date.val() : undefined,
            watchlist: $watchlistCheckbox.is(':checked'),
            watchlistReason: $watchlistCheckbox.is(':checked') && $watchlistReason.val() ? $watchlistReason.val().trim() : undefined,
            purgatory: $purgatoryCheckbox.is(':checked')
        };

        // Log the form submission
        logger.logFormSubmission('userForm', formData);

        $.ajax({
            url: url,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(data) {
                if ($loadingOverlay.length) { $loadingOverlay.hide(); }
                closeModal($userModal);
                var action = isUpdate ? 'updated' : 'added';
                showToast('Staff member ' + action + ' successfully', 'success');
                setTimeout(function() { window.location.reload(); }, 1500);
            },
            error: function(err) {
                if ($loadingOverlay.length) { $loadingOverlay.hide(); }
                showToast('Failed to save staff member. Please try again.', 'error');
            }
        });

        if (logger) { logger.logStaffUpdate(userId, formData); }
    }

    // Import form submission
    function handleImportSubmit(e) {
        e.preventDefault();
        var jsonData = $('#jsonData').val();
        var $jsonInput = $('#jsonData');
        try {
            var parsedData = JSON.parse(jsonData);
            if (!Array.isArray(parsedData)) { throw new Error('Data must be an array of staff members'); }
            var $submitBtn = $importForm.find('button[type="submit"]');
            var originalText = $submitBtn.html();
            $submitBtn.html('<span class="material-icons" style="animation: spin 1s infinite linear">refresh</span> Importing...');
            $submitBtn.prop('disabled', true);
            $.ajax({
                url: '/api/import',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ data: jsonData }),
                success: function(data) {
                    closeModal($importModal);
                    showToast(data.count + ' staff records imported successfully', 'success');
                    setTimeout(function() { window.location.reload(); }, 1500);
                },
                error: function(err) {
                    $submitBtn.html(originalText);
                    $submitBtn.prop('disabled', false);
                    $jsonInput.css('border-color', 'var(--error-color)');
                    var $existingError = $jsonInput.parent().find('.input-error');
                    if ($existingError.length) { $existingError.remove(); }
                    var $errorMsg = $('<div class="input-error" style="color: var(--error-color); font-size: 12px; margin-top: 5px;"></div>')
                        .text('Error importing data: ' + err.responseText);
                    $jsonInput.parent().append($errorMsg);
                }
            });
            if (logger) { logger.logFormSubmission('importForm', { data: jsonData }); }
        } catch (error) {
            $jsonInput.css('border-color', 'var(--error-color)');
            var $existingError = $jsonInput.parent().find('.input-error');
            if ($existingError.length) { $existingError.remove(); }
            var $errorMsg = $('<div class="input-error" style="color: var(--error-color); font-size: 12px; margin-top: 5px;"></div>')
                .text('Invalid JSON format: ' + error.message);
            $jsonInput.parent().append($errorMsg);
        }
    }

    // Search functionality
    function handleSearch() {
        var query = $searchInput.val().toLowerCase().trim();
        $searchResults.empty();
        if (query.length < 2) {
            $searchResults.html('<div class="search-empty">Type at least 2 characters to search...</div>');
            return;
        }
        var results = [];
        $('.rank-table tbody tr').each(function() {
            var $row = $(this);
            var name = $row.find('td:first').text().toLowerCase();
            var discordId = $row.find('td:nth-child(2)').text().toLowerCase();
            var timeAtRank = $row.find('.time-at-rank').text().toLowerCase();
            var datePromoted = $row.find('td:nth-child(4)').text().toLowerCase();
            var rank = $row.closest('.rank-section').find('.rank-title').text().toLowerCase();
            var strikes = $row.find('.strikes-cell').text().toLowerCase();
            var status = '';
            var $statusCell = $row.find('.status-cell');
            var $strikeCell = $row.find('.strikes-cell');
            if ($statusCell.length || $strikeCell.length) {
                if ($statusCell.find('.watchlist-indicator').length) {
                    status += 'watchlist ';
                    var reason = $statusCell.find('.watchlist-indicator').attr('title');
                    if (reason) { status += reason.toLowerCase() + ' '; }
                }
                if ($statusCell.find('.purgatory-indicator').length) { status += 'purgatory '; }
                if ($strikeCell.find('.strikes-indicator').length) {
                    status += 'strike ';
                    var strikeReason = $strikeCell.find('.strikes-indicator').attr('title');
                    if (strikeReason) { status += strikeReason.toLowerCase() + ' '; }
                }
            }
            var searchText = name + ' ' + discordId + ' ' + timeAtRank + ' ' + datePromoted + ' ' + rank + ' ' + strikes + ' ' + status;
            if (searchText.indexOf(query) !== -1) {
                var userId = $row.data('id');
                results.push({
                    id: userId,
                    name: $row.find('td:first').text(),
                    discordId: $row.find('td:nth-child(2)').text(),
                    rank: rank,
                    datePromoted: $row.find('td:nth-child(4)').text(),
                    timeAtRank: $row.find('.time-at-rank').text(),
                    strikesHtml: $row.find('.strikes-cell').html() || '-',
                    statusHtml: $row.find('.status-cell').html() || '-',
                    hasStrikes: $row.hasClass('has-strikes'),
                    isWatchlisted: $row.hasClass('watchlisted'),
                    inPurgatory: $row.hasClass('in-purgatory'),
                    hasExpiredStrikes: $row.hasClass('has-expired-strikes'),
                    $element: $row
                });
            }
        });
        if (results.length === 0) {
            $searchResults.html('<div class="search-empty">No staff members found matching your search.</div>');
            return;
        }
        $.each(results, function(i, result) {
            var $resultItem = $('<div class="search-result-item animate-fade-in"></div>');
            if (result.hasStrikes) { $resultItem.addClass('has-strikes'); }
            if (result.isWatchlisted) { $resultItem.addClass('watchlisted'); }
            if (result.inPurgatory) { $resultItem.addClass('in-purgatory'); }
            if (result.hasExpiredStrikes) { $resultItem.addClass('has-expired-strikes'); }
            $resultItem.html(
                '<div class="result-header">' +
                    '<h3>' + result.name + '</h3>' +
                    '<span class="result-rank">' + result.rank.split(' ').map(function(word) {
                        return word.charAt(0).toUpperCase() + word.slice(1);
                    }).join(' ') + '</span>' +
                '</div>' +
                '<div class="result-details">' +
                    '<div class="result-info-group">' +
                        '<div class="result-info-item"><span class="label">Discord ID:</span><span>' + result.discordId + '</span></div>' +
                        '<div class="result-info-item"><span class="label">Time at Rank:</span><span>' + result.timeAtRank + '</span></div>' +
                        '<div class="result-info-item"><span class="label">Date Promoted:</span><span>' + result.datePromoted + '</span></div>' +
                    '</div>' +
                    '<div class="result-info-group">' +
                        '<div class="result-info-item"><span class="label">Strikes:</span><span class="strikes-display">' + result.strikesHtml + '</span></div>' +
                        '<div class="result-info-item"><span class="label">Status:</span><span class="status-display">' + result.statusHtml + '</span></div>' +
                    '</div>' +
                '</div>' +
                '<div class="result-actions">' +
                    '<button class="btn action-btn edit-btn" data-id="' + result.id + '" title="Edit">' +
                        '<span class="material-icons">edit</span>' +
                    '</button>' +
                    '<button class="btn action-btn delete-btn" data-id="' + result.id + '" title="Delete">' +
                        '<span class="material-icons">delete</span>' +
                    '</button>' +
                '</div>'
            );
            $resultItem.find('.edit-btn').on('click', function(e) {
                $searchModal.removeClass('show');
                $('body').css('overflow', 'auto');
                setTimeout(function() { $searchModal.hide(); }, 300);
                handleEditClick(e);
            });
            $resultItem.find('.delete-btn').on('click', function(e) {
                $searchModal.removeClass('active');
                handleDeleteClick(e);
            });
            $searchResults.append($resultItem);
        });
    }

    // Edit functionality
    function handleEditClick(e) {
        var userId = $(e.currentTarget).data('id');
        var $userRow = $(e.currentTarget).closest('tr');
        var $loadingOverlay = $('.loading-overlay');
        if ($loadingOverlay.length) { $loadingOverlay.show(); }
        $.ajax({
            url: '/api/staff/' + userId,
            method: 'GET',
            success: function(staffData) {
                if ($loadingOverlay.length) { $loadingOverlay.hide(); }
                $userForm.attr('action', '/api/staff/' + userId + '?_method=PUT');
                $('#userId').val(userId);
                resetDisciplinaryFields();
                $('#modalTitle').text('Edit Staff Member');
                $('#submitUser').text('Update Staff');
                populateEditForm(staffData);
                $userModal.show().delay(10).queue(function(next) {
                    $(this).addClass('show');
                    next();
                });
            },
            error: function(err) {
                if ($loadingOverlay.length) { $loadingOverlay.hide(); }
                alert('Error loading staff data. Please try again.');
                // Fallback to DOM data if API call fails
                var name = $userRow.find('.name-cell').text().trim();
                var discordId = $userRow.find('.discord-id-cell').text().trim();
                var datePromoted = $userRow.find('.date-promoted-cell').text().trim();
                var rank = $userRow.find('.rank-cell').text().trim();
                $userForm.attr('action', '/api/staff/' + userId + '?_method=PUT');
                $('#userId').val(userId);
                $('#name').val(name);
                $('#discordId').val(discordId);
                $('#datePromoted').val(formatDateForInput(datePromoted));
                var $rankSelect = $('#rank');
                $rankSelect.find('option').each(function() {
                    if ($(this).text() === rank) {
                        $rankSelect.val($(this).val());
                    }
                });
                $('#modalTitle').text('Edit Staff Member');
                $('#submitUser').text('Update Staff');
                resetDisciplinaryFields();
                $userModal.show().delay(10).queue(function(next) {
                    $(this).addClass('show');
                    next();
                });
            }
        });
    }

    // Delete functionality
    function handleDeleteClick(e) {
        var $btn = $(e.currentTarget);
        var userId = $btn.data('id');
        var $tr = $('tr[data-id="' + userId + '"]');
        var userName = $tr.find('td:first').text();

        var $confirmDialog = $('<div class="confirm-dialog"></div>');
        $confirmDialog.html(
            '<div class="confirm-dialog-content">' +
                '<h3>Delete Staff Member</h3>' +
                '<p>Are you sure you want to delete <strong>' + userName + '</strong>?</p>' +
                '<p>This action cannot be undone.</p>' +
                '<div class="confirm-actions">' +
                    '<button class="btn cancel-btn">Cancel</button>' +
                    '<button class="btn primary confirm-btn">Delete</button>' +
                '</div>' +
            '</div>'
        );
        $confirmDialog.css({
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
        $confirmDialog.find('.confirm-dialog-content').css({
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
        $confirmDialog.find('h3').css({
            marginBottom: '15px',
            fontFamily: 'Lexend, sans-serif',
            color: 'var(--primary-light)'
        });
        $confirmDialog.find('.confirm-actions').css({
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '20px'
        });
        $confirmDialog.find('.cancel-btn').css({
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)'
        });
        $confirmDialog.find('.confirm-btn').css({
            backgroundColor: 'var(--error-color)'
        });
        $('body').append($confirmDialog);
        setTimeout(function() {
            $confirmDialog.css('opacity', '1');
            $confirmDialog.find('.confirm-dialog-content').css('transform', 'translateY(0)');
        }, 10);
        $confirmDialog.find('.cancel-btn').on('click', function() {
            $confirmDialog.css('opacity', '0');
            $confirmDialog.find('.confirm-dialog-content').css('transform', 'translateY(-20px)');
            setTimeout(function() { $confirmDialog.remove(); }, 300);
        });
        $confirmDialog.find('.confirm-btn').on('click', function() {
            var $confirmBtn = $(this);
            var originalText = $confirmBtn.text();
            $confirmBtn.text('Deleting...').prop('disabled', true);
            $.ajax({
                url: '/api/staff/' + userId + '?_method=DELETE',
                method: 'POST',
                success: function(data) {
                    $confirmDialog.css('opacity', '0');
                    $confirmDialog.find('.confirm-dialog-content').css('transform', 'translateY(-20px)');
                    setTimeout(function() {
                        $confirmDialog.remove();
                        showToast('Staff member deleted successfully', 'success');
                        if ($tr.length) {
                            $tr.remove();
                            var $rankSection = $tr.closest('.rank-section');
                            if ($rankSection.length && $rankSection.find('tbody tr:visible').length === 0) {
                                $rankSection.hide();
                            }
                        } else {
                            window.location.reload();
                        }
                    }, 300);
                },
                error: function(err) {
                    $confirmBtn.text(originalText).prop('disabled', false);
                    showToast('Failed to delete staff member. Please try again.', 'error');
                }
            });
        });
        $confirmDialog.on('click', function(e) {
            if ($(e.target).is($confirmDialog)) {
                $confirmDialog.css('opacity', '0');
                $confirmDialog.find('.confirm-dialog-content').css('transform', 'translateY(-20px)');
                setTimeout(function() { $confirmDialog.remove(); }, 300);
            }
        });
        if (logger) { logger.logStaffUpdate(userId, { action: 'delete' }); }
    }

    // Time at rank calculation
    function updateTimeAtRank() {
        $('.time-at-rank').each(function() {
            var datePromoted = $(this).data('date');
            if (datePromoted) {
                $(this).text(calculateTimeAtRank(datePromoted));
            }
        });
    }
    function calculateTimeAtRank(datePromoted) {
        var promotionDate = new Date(datePromoted);
        var now = new Date();
        var diffTime = Math.abs(now - promotionDate);
        var diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 30) {
            return diffDays + ' day' + (diffDays !== 1 ? 's' : '');
        } else if (diffDays < 365) {
            var months = Math.floor(diffDays / 30);
            return months + ' month' + (months !== 1 ? 's' : '');
        } else {
            var years = Math.floor(diffDays / 365);
            var remainingMonths = Math.floor((diffDays % 365) / 30);
            if (remainingMonths === 0) {
                return years + ' year' + (years !== 1 ? 's' : '');
            } else {
                return years + ' year' + (years !== 1 ? 's' : '') + ', ' + remainingMonths + ' month' + (remainingMonths !== 1 ? 's' : '');
            }
        }
    }
    
    // Helper: Convert time text to days (for filtering)
    function calculateTimeInDays(timeText) {
        var days = 0;
        if (timeText.indexOf('day') !== -1) {
            days = parseInt(timeText);
        } else if (timeText.indexOf('month') !== -1) {
            days = parseInt(timeText) * 30;
        } else if (timeText.indexOf('year') !== -1) {
            var parts = timeText.split(',');
            days = parseInt(parts[0]) * 365;
            if (parts[1]) { days += parseInt(parts[1]) * 30; }
        }
        return days;
    }

    // Update time range display
    function updateTimeRangeValue() {
        $timeRangeValue.text($timeRangeFilter.val());
    }

    // Filters dropdown toggle
    function toggleFiltersDropdown(e) {
        e.stopPropagation();
        $filtersDropdown.toggleClass('show');
    }

    // Reset filters to default
    function resetFilters() {
        $('input[name="rank-filter"]').prop('checked', false);
        $('input[name="status-filter"]').prop('checked', false);
        $timeRangeFilter.val(0);
        updateTimeRangeValue();
        applyFilters();
    }

    // Apply filters to the staff table
    function applyFilters() {
        var selectedRanks = $('input[name="rank-filter"]:checked').map(function() { return $(this).val(); }).get();
        var selectedStatuses = $('input[name="status-filter"]:checked').map(function() { return $(this).val(); }).get();
        var minDays = parseInt($timeRangeFilter.val());
        $('tr[data-id]').each(function() {
            var $row = $(this);
            var rank = $row.closest('.rank-section').find('.rank-title').text();
            var hasStrikes = $row.hasClass('has-strikes');
            var isWatchlisted = $row.hasClass('watchlisted');
            var isPurgatory = $row.hasClass('in-purgatory');
            var hasExpiredStrikes = $row.hasClass('has-expired-strikes');
            var timeText = $row.find('.time-at-rank').text();
            var days = calculateTimeInDays(timeText);
            var showRow = true;
            if (days < minDays) { showRow = false; }
            if (showRow && selectedRanks.length > 0 && $.inArray(rank, selectedRanks) === -1) {
                showRow = false;
            }
            if (showRow && selectedStatuses.length > 0) {
                var hasSelectedStatus = ((hasStrikes && $.inArray('strikes', selectedStatuses) !== -1) ||
                                         (isWatchlisted && $.inArray('watchlist', selectedStatuses) !== -1) ||
                                         (isPurgatory && $.inArray('purgatory', selectedStatuses) !== -1) ||
                                         (hasExpiredStrikes && $.inArray('expired', selectedStatuses) !== -1));
                var hasNoStatuses = !hasStrikes && !isWatchlisted && !isPurgatory && !hasExpiredStrikes;
                if (hasNoStatuses || !hasSelectedStatus) { showRow = false; }
            }
            if (showRow) {
                $row.show();
                $row.closest('.rank-section').show();
            } else {
                $row.hide();
                var $rankSection = $row.closest('.rank-section');
                if ($rankSection.find('tr[data-id]:visible').length === 0) {
                    $rankSection.hide();
                }
            }
        });
        $filtersDropdown.removeClass('show');
        if (logger) { logger.logFilterChange({ ranks: selectedRanks, statuses: selectedStatuses, minDays: minDays }); }
    }

    // Check eligibility for promotions
    function checkEligibleStaff() {
        var $loadingOverlay = $('.loading-overlay');
        if ($loadingOverlay.length) { $loadingOverlay.show(); }
        
        // Get all staff rows
        var eligibleStaff = {};
        
        $('tr[data-id]').each(function() {
            var $row = $(this);
            var staffId = $row.data('id');
            var staffName = $row.find('td:first').text();
            var staffDiscordId = $row.find('td:nth-child(2)').text();
            var currentRank = $row.closest('.rank-section').find('.rank-title').text();
            var datePromoted = $row.find('.time-at-rank').data('date');
            
            // Skip if staff has strikes or is in purgatory
            if ($row.hasClass('has-strikes') || $row.hasClass('in-purgatory')) {
                return;
            }
            
            // Check if current rank has promotion requirements
            if (PROMOTION_REQUIREMENTS[currentRank]) {
                var requirements = PROMOTION_REQUIREMENTS[currentRank];
                var daysAtRank = Math.floor((new Date() - new Date(datePromoted)) / (1000 * 60 * 60 * 24));
                
                // Check if staff meets minimum days requirement
                if (daysAtRank >= requirements.minDays && daysAtRank <= requirements.maxDays) {
                    var nextRank = requirements.nextRank;
                    if (!eligibleStaff[nextRank]) {
                        eligibleStaff[nextRank] = [];
                    }
                    
                    eligibleStaff[nextRank].push({
                        id: staffId,
                        name: staffName,
                        discordId: staffDiscordId,
                        datePromoted: datePromoted,
                        currentRank: currentRank,
                        nextRank: nextRank
                    });
                }
            }
        });
        
        // Update UI with eligible staff
        var $eligibleModal = $('#eligibleModal');
        var $eligibleResultsContainer = $('#eligibleResults');
        var $eligibleCountElement = $('#eligibleCount');
        $eligibleResultsContainer.empty();
        
        var totalEligibleCount = 0;
        Object.keys(eligibleStaff).forEach(function(targetRank) {
            if (eligibleStaff[targetRank].length > 0) {
                totalEligibleCount += eligibleStaff[targetRank].length;
                var $rankSection = $('<div class="eligible-rank-section"></div>');
                $rankSection.html(`
                    <div class="eligible-rank-header">
                        <div class="rank-title">
                            <span class="material-icons">arrow_upward</span>
                            ${targetRank}
                        </div>
                    </div>
                    <div class="eligible-staff-container">
                        ${eligibleStaff[targetRank].map(function(staff) {
                            return `
                                <div class="eligible-staff-card">
                                    <div class="staff-info">
                                        <div class="staff-name">${staff.name}</div>
                                        <div class="staff-discord-id">${staff.discordId}</div>
                                        <div class="staff-time-at-rank">
                                            <span class="material-icons">schedule</span>
                                            ${calculateTimeAtRank(staff.datePromoted)}
                                        </div>
                                    </div>
                                    <button class="promote-btn" data-id="${staff.id}" data-target-rank="${targetRank}">
                                        <span class="material-icons">arrow_upward</span>
                                    </button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `);
                $eligibleResultsContainer.append($rankSection);
            }
        });
        
        $eligibleCountElement.text(totalEligibleCount);
        $eligibleModal.show().delay(10).queue(function(next) {
            $(this).addClass('show');
            next();
        });
        
        if ($loadingOverlay.length) { $loadingOverlay.hide(); }
    }

    // Placeholder: populate edit form with staff data
    function populateEditForm(staffData) {
        $('#name').val(staffData.name);
        $('#discordId').val(staffData.discordId);
        $('#rank').val(staffData.rank);
        $('#datePromoted').val(staffData.datePromoted ? staffData.datePromoted.split('T')[0] : '');
        if (staffData.strike1) {
            $strike1Checkbox.prop('checked', true);
            $strike1Date.val(staffData.strike1Date);
            $strike1Fields.addClass('active');
        } else {
            $strike1Checkbox.prop('checked', false);
            $strike1Fields.removeClass('active');
        }
        if (staffData.strike2) {
            $strike2Checkbox.prop('checked', true);
            $strike2Date.val(staffData.strike2Date);
            $strike2Fields.addClass('active');
        } else {
            $strike2Checkbox.prop('checked', false);
            $strike2Fields.removeClass('active');
        }
        if (staffData.strike3) {
            $strike3Checkbox.prop('checked', true);
            $strike3Date.val(staffData.strike3Date);
            $strike3Fields.addClass('active');
        } else {
            $strike3Checkbox.prop('checked', false);
            $strike3Fields.removeClass('active');
        }
        if (staffData.watchlist) {
            $watchlistCheckbox.prop('checked', true);
            $watchlistReason.val(staffData.watchlistReason);
            $watchlistFields.addClass('active');
        } else {
            $watchlistCheckbox.prop('checked', false);
            $watchlistFields.removeClass('active');
        }
        $purgatoryCheckbox.prop('checked', !!staffData.purgatory);
    }

    // Reset disciplinary fields
    function resetDisciplinaryFields() {
        $strike1Checkbox.prop('checked', false);
        $strike2Checkbox.prop('checked', false);
        $strike3Checkbox.prop('checked', false);
        $strike1Fields.removeClass('active');
        $strike2Fields.removeClass('active');
        $strike3Fields.removeClass('active');
        $strike1Date.val('');
        $strike2Date.val('');
        $strike3Date.val('');
        $strike1Info.hide();
        $strike2Info.hide();
        $strike3Info.hide();
        $watchlistCheckbox.prop('checked', false);
        $watchlistReason.val('');
        $watchlistFields.removeClass('active');
        $purgatoryCheckbox.prop('checked', false);
    }

    // Reset entire form
    function resetForm() {
        $userForm[0].reset();
        resetDisciplinaryFields();
    }

    // Format date for input field
    function formatDateForInput(dateStr) {
        var date = new Date(dateStr);
        return date.toISOString().split('T')[0];
    }

    // Placeholder: show toast notifications (customize as needed)
    function showToast(message, type) {
        alert(message);
    }

    // Placeholder: update logs display
    function updateLogsDisplay() {
        if (!$logsContainer.length || !$logLevelFilter.length) return;
        
        var selectedLevel = $logLevelFilter.val();
        var logs = selectedLevel ? logger.getLogs(selectedLevel) : logger.getLogs();
        
        $logsContainer.html(logs.map(function(log) {
            return `
                <div class="log-entry ${log.level.toLowerCase()}">
                    <span class="log-timestamp">${new Date(log.timestamp).toLocaleString()}</span>
                    <span class="log-level">${log.level}</span>
                    <span class="log-message">${log.message}</span>
                    ${log.data ? `<pre class="log-data">${JSON.stringify(log.data, null, 2)}</pre>` : ''}
                </div>
            `;
        }).join(''));
        
        // Scroll to bottom
        $logsContainer.scrollTop($logsContainer[0].scrollHeight);
    }
});