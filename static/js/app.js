// Global App State
let releaseNotes = [];
let activeTypeFilter = 'all';
let searchQuery = '';

// DOM Elements
const btnRefresh = document.getElementById('btn-refresh');
const refreshSpinner = document.getElementById('refresh-spinner');
const searchInput = document.getElementById('search-input');
const btnClearSearch = document.getElementById('btn-clear-search');
const filterButtonsGroup = document.getElementById('filter-buttons-group');
const statsBar = document.getElementById('stats-bar');
const statsText = document.getElementById('stats-text');
const lastUpdatedTime = document.getElementById('last-updated-time');
const loadingContainer = document.getElementById('loading-container');
const errorContainer = document.getElementById('error-container');
const errorMessage = document.getElementById('error-message');
const btnRetry = document.getElementById('btn-retry');
const emptyContainer = document.getElementById('empty-container');
const notesListContainer = document.getElementById('notes-list-container');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const modalClose = document.getElementById('modal-close');
const originalUpdateText = document.getElementById('original-update-text');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCounter = document.getElementById('char-counter');
const charWarning = document.getElementById('char-warning');
const btnCancelTweet = document.getElementById('btn-cancel-tweet');
const btnPublishTweet = document.getElementById('btn-publish-tweet');

// Toast Element
const toast = document.getElementById('toast');
const toastIcon = document.getElementById('toast-icon');
const toastMessage = document.getElementById('toast-message');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    loadReleaseNotes();
    setupEventListeners();
});

// Event Listeners Configuration
function setupEventListeners() {
    // Refresh Button Click
    btnRefresh.addEventListener('click', () => {
        loadReleaseNotes(true);
    });

    // Search Input Typing
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        btnClearSearch.style.display = searchQuery ? 'block' : 'none';
        applyFiltersAndSearch();
    });

    // Clear Search Input
    btnClearSearch.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        btnClearSearch.style.display = 'none';
        searchInput.focus();
        applyFiltersAndSearch();
    });

    // Filter Buttons Group Click
    filterButtonsGroup.addEventListener('click', (e) => {
        const target = e.target.closest('.btn-filter');
        if (!target) return;

        // Update active class
        document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
        target.classList.add('active');

        activeTypeFilter = target.getAttribute('data-type');
        applyFiltersAndSearch();
    });

    // Retry Loading Button
    btnRetry.addEventListener('click', () => {
        loadReleaseNotes(true);
    });

    // Modal Events
    modalClose.addEventListener('click', closeTweetModal);
    btnCancelTweet.addEventListener('click', closeTweetModal);
    
    // Textarea input event for character limit
    tweetTextarea.addEventListener('input', updateCharCounter);

    // Publish Tweet Button Click
    btnPublishTweet.addEventListener('click', publishTweet);

    // Close modal clicking outside
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            closeTweetModal();
        }
    });
}

// Fetch Release Notes from API
async function loadReleaseNotes(forceRefresh = false) {
    showLoading();
    try {
        const url = `/api/release-notes${forceRefresh ? '?refresh=true' : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP Error Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'error') {
            throw new Error(data.message);
        }

        if (data.status === 'warning') {
            showToast(data.message, 'warning');
        }

        releaseNotes = data.notes || [];
        displayNotes(releaseNotes);
        updateStats(releaseNotes.length, releaseNotes.length);
        
        // Show last checked time
        const now = new Date();
        lastUpdatedTime.textContent = `Last checked: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        statsBar.style.display = 'flex';
        
    } catch (error) {
        showError(error.message);
    }
}

// Display Loaded Notes in grid
function displayNotes(notes) {
    notesListContainer.innerHTML = '';
    
    if (notes.length === 0) {
        notesListContainer.style.display = 'none';
        emptyContainer.style.display = 'flex';
        return;
    }

    emptyContainer.style.display = 'none';
    notesListContainer.style.display = 'grid';

    notes.forEach(note => {
        const noteCard = createNoteCard(note);
        notesListContainer.appendChild(noteCard);
    });
}

// Create a single Release Note Card Element
function createNoteCard(note) {
    const card = document.createElement('article');
    card.className = 'note-card glass-card';
    
    // Assign type color accent
    const typeLower = note.type.toLowerCase();
    let accentColor = 'var(--primary)';
    if (typeLower === 'feature') accentColor = 'var(--color-feature)';
    else if (typeLower === 'announcement') accentColor = 'var(--color-announcement)';
    else if (typeLower === 'issue') accentColor = 'var(--color-issue)';
    else if (typeLower === 'deprecation') accentColor = 'var(--color-deprecation)';
    card.style.setProperty('--card-accent-color', accentColor);

    // Build badge class name
    let badgeClass = 'badge-update';
    if (['feature', 'announcement', 'issue', 'deprecation'].includes(typeLower)) {
        badgeClass = `badge-${typeLower}`;
    }

    card.innerHTML = `
        <div class="note-card-header">
            <div class="note-date-container">
                <i class="fa-regular fa-calendar note-date-icon"></i>
                <span>${note.date}</span>
            </div>
            <span class="badge ${badgeClass}">${note.type}</span>
        </div>
        <div class="note-body">
            ${note.body_html}
        </div>
        <div class="note-actions">
            <a href="${note.link}" target="_blank" rel="noopener noreferrer" class="note-link-btn" title="View official Google Cloud release page">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
                <span>Google Docs</span>
            </a>
            <button class="btn-tweet-card" title="Prepare tweet about this update">
                <i class="fa-brands fa-x-twitter"></i>
                <span>Tweet</span>
            </button>
        </div>
    `;

    // Tweet button click handler
    const btnTweet = card.querySelector('.btn-tweet-card');
    btnTweet.addEventListener('click', () => {
        openTweetModal(note);
    });

    return card;
}

// Filter and Search logic
function applyFiltersAndSearch() {
    let filteredNotes = releaseNotes;

    // Filter by type
    if (activeTypeFilter !== 'all') {
        filteredNotes = filteredNotes.filter(note => note.type.toLowerCase() === activeTypeFilter);
    }

    // Filter by search query
    if (searchQuery) {
        filteredNotes = filteredNotes.filter(note => {
            return note.date.toLowerCase().includes(searchQuery) ||
                   note.type.toLowerCase().includes(searchQuery) ||
                   note.body_text.toLowerCase().includes(searchQuery);
        });
    }

    displayNotes(filteredNotes);
    updateStats(filteredNotes.length, releaseNotes.length);
}

// Open Tweet Modal with preloaded text
function openTweetModal(note) {
    originalUpdateText.textContent = note.body_text;
    
    // Auto-drafting text
    const dateFormatted = note.date;
    const typeTag = note.type.toUpperCase();
    const hashTags = " #BigQuery #GoogleCloud";
    
    // Base content space calculation
    // Max 280 chars total
    const header = `📢 BigQuery [${typeTag}] (${dateFormatted}): `;
    const link = `\n🔗 Read more: ${note.link}`;
    
    // Calculate allowed text length
    const metaLength = header.length + link.length + hashTags.length;
    const maxBodyTextLength = 280 - metaLength;
    
    let draftedBody = note.body_text;
    if (draftedBody.length > maxBodyTextLength) {
        // Cut with ellipses
        draftedBody = draftedBody.substring(0, maxBodyTextLength - 3) + "...";
    }
    
    const initialTweet = `${header}${draftedBody}${link}${hashTags}`;
    
    tweetTextarea.value = initialTweet;
    updateCharCounter();
    
    // Display Modal
    tweetModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Lock background scrolling
}

// Close Tweet Modal
function closeTweetModal() {
    tweetModal.style.display = 'none';
    document.body.style.overflow = '';
}

// Character counter utility
function updateCharCounter() {
    const len = tweetTextarea.value.length;
    charCounter.textContent = `${len} / 280`;

    // Warn styles
    if (len >= 280) {
        charCounter.className = 'char-counter error';
        charWarning.style.display = 'inline';
        btnPublishTweet.disabled = true;
        btnPublishTweet.style.opacity = 0.5;
        btnPublishTweet.style.cursor = 'not-allowed';
    } else if (len > 250) {
        charCounter.className = 'char-counter warning';
        charWarning.style.display = 'none';
        btnPublishTweet.disabled = false;
        btnPublishTweet.style.opacity = 1;
        btnPublishTweet.style.cursor = 'pointer';
    } else {
        charCounter.className = 'char-counter';
        charWarning.style.display = 'none';
        btnPublishTweet.disabled = false;
        btnPublishTweet.style.opacity = 1;
        btnPublishTweet.style.cursor = 'pointer';
    }
}

// Redirect to Twitter Intent
function publishTweet() {
    const text = tweetTextarea.value;
    if (text.length > 280) return;
    
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(intentUrl, '_blank', 'width=550,height=420');
    
    closeTweetModal();
    showToast('Tweet intent opened successfully!');
}

// Display UI helper elements
function showLoading() {
    refreshSpinner.classList.add('spinning');
    btnRefresh.disabled = true;
    loadingContainer.style.display = 'flex';
    errorContainer.style.display = 'none';
    emptyContainer.style.display = 'none';
    notesListContainer.style.display = 'none';
    statsBar.style.display = 'none';
}

function showError(msg) {
    refreshSpinner.classList.remove('spinning');
    btnRefresh.disabled = false;
    loadingContainer.style.display = 'none';
    errorContainer.style.display = 'flex';
    errorMessage.textContent = msg;
}

function showToast(msg, type = 'success') {
    toastMessage.textContent = msg;
    if (type === 'warning' || type === 'error') {
        toast.className = 'toast toast-error';
        toastIcon.className = 'fa-solid fa-circle-exclamation';
    } else {
        toast.className = 'toast';
        toastIcon.className = 'fa-solid fa-circle-check';
    }
    
    toast.style.display = 'flex';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 4000);
}

function updateStats(showingCount, totalCount) {
    statsText.textContent = `Showing ${showingCount} of ${totalCount} updates`;
    refreshSpinner.classList.remove('spinning');
    btnRefresh.disabled = false;
    loadingContainer.style.display = 'none';
}
