/**
 * NotesFlow Frontend Application Controller
 * Handles REST API communication, state management, and DOM interactions.
 */

// Application State
const state = {
    notes: [],
    tags: [],
    stats: {},
    selectedType: 'ALL',
    selectedTag: null,
    searchQuery: '',
    sortBy: 'updated',
    activeModalType: 'TEXT',
    unlockingNoteId: null
};

// DOM Elements
const elements = {
    notesContainer: document.getElementById('notesContainer'),
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    sortSelect: document.getElementById('sortSelect'),
    tagCloud: document.getElementById('tagCloud'),
    filterBanner: document.getElementById('filterBanner'),
    filterValue: document.getElementById('filterValue'),
    clearFilterBtn: document.getElementById('clearFilterBtn'),
    
    // Stats badges
    statTotal: document.getElementById('statTotal'),
    statOverdue: document.getElementById('statOverdue'),
    countAll: document.getElementById('countAll'),
    countText: document.getElementById('countText'),
    countChecklist: document.getElementById('countChecklist'),
    countEncrypted: document.getElementById('countEncrypted'),
    countReminder: document.getElementById('countReminder'),

    // Modals
    createModal: document.getElementById('createModal'),
    openCreateModalBtn: document.getElementById('openCreateModalBtn'),
    closeCreateModalBtn: document.getElementById('closeCreateModalBtn'),
    cancelCreateBtn: document.getElementById('cancelCreateBtn'),
    createNoteForm: document.getElementById('createNoteForm'),
    typeTabs: document.getElementById('typeTabs'),
    
    // Type Fields Containers
    textFields: document.getElementById('textFields'),
    checklistFields: document.getElementById('checklistFields'),
    encryptedFields: document.getElementById('encryptedFields'),
    reminderFields: document.getElementById('reminderFields'),
    checklistItemsContainer: document.getElementById('checklistItemsContainer'),
    addChecklistRowBtn: document.getElementById('addChecklistRowBtn'),

    // Unlock Modal
    unlockModal: document.getElementById('unlockModal'),
    unlockNoteTitle: document.getElementById('unlockNoteTitle'),
    unlockPinInput: document.getElementById('unlockPinInput'),
    unlockError: document.getElementById('unlockError'),
    unlockedContentBox: document.getElementById('unlockedContentBox'),
    unlockedContentText: document.getElementById('unlockedContentText'),
    closeUnlockModalBtn: document.getElementById('closeUnlockModalBtn'),
    cancelUnlockBtn: document.getElementById('cancelUnlockBtn'),
    submitUnlockBtn: document.getElementById('submitUnlockBtn'),

    toast: document.getElementById('toast')
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchNotes();
    fetchTags();
    fetchStats();
});

function setupEventListeners() {
    // Category Nav Buttons
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.selectedType = btn.dataset.type;
            renderNotes();
        });
    });

    // Search Input (debounced)
    let searchTimeout;
    elements.searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        elements.clearSearchBtn.style.display = query ? 'block' : 'none';
        searchTimeout = setTimeout(() => {
            state.searchQuery = query;
            fetchNotes();
        }, 250);
    });

    elements.clearSearchBtn.addEventListener('click', () => {
        elements.searchInput.value = '';
        elements.clearSearchBtn.style.display = 'none';
        state.searchQuery = '';
        fetchNotes();
    });

    // Sorting Select
    elements.sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        fetchNotes();
    });

    // Clear Tag Filter
    elements.clearFilterBtn.addEventListener('click', () => {
        state.selectedTag = null;
        elements.filterBanner.style.display = 'none';
        document.querySelectorAll('.tag-pill').forEach(p => p.classList.remove('active'));
        fetchNotes();
    });

    // Create Modal Triggers
    elements.openCreateModalBtn.addEventListener('click', openCreateModal);
    elements.closeCreateModalBtn.addEventListener('click', closeCreateModal);
    elements.cancelCreateBtn.addEventListener('click', closeCreateModal);
    elements.createNoteForm.addEventListener('submit', handleCreateNoteSubmit);

    // Modal Type Tabs
    elements.typeTabs.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
            elements.typeTabs.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            switchModalType(tab.dataset.type);
        });
    });

    // Add Checklist Item Row
    elements.addChecklistRowBtn.addEventListener('click', () => {
        const row = document.createElement('div');
        row.className = 'item-builder-row';
        row.innerHTML = `
            <input type="text" class="form-input checklist-input" placeholder="Another task item...">
            <button type="button" class="btn btn-secondary btn-sm" onclick="this.parentElement.remove()">×</button>
        `;
        elements.checklistItemsContainer.appendChild(row);
        row.querySelector('input').focus();
    });

    // Unlock Modal Triggers
    elements.closeUnlockModalBtn.addEventListener('click', closeUnlockModal);
    elements.cancelUnlockBtn.addEventListener('click', closeUnlockModal);
    elements.submitUnlockBtn.addEventListener('click', submitUnlock);
    elements.unlockPinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitUnlock();
    });
}

// --- API Calls ---

async function fetchNotes() {
    try {
        let url = `/api/notes?sort=${encodeURIComponent(state.sortBy)}`;
        if (state.searchQuery) url += `&query=${encodeURIComponent(state.searchQuery)}`;
        if (state.selectedTag) url += `&tag=${encodeURIComponent(state.selectedTag)}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to load notes');
        state.notes = await res.json();
        renderNotes();
        updateCategoryCounts();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function fetchTags() {
    try {
        const res = await fetch('/api/tags');
        if (!res.ok) throw new Error('Failed to load tags');
        state.tags = await res.json();
        renderTagCloud();
    } catch (err) {
        console.error(err);
    }
}

async function fetchStats() {
    try {
        const res = await fetch('/api/stats');
        if (!res.ok) return;
        state.stats = await res.json();
        elements.statTotal.textContent = state.stats.totalNotes || 0;
        elements.statOverdue.textContent = state.stats.overdueReminders || 0;
    } catch (err) {
        console.error(err);
    }
}

// --- Rendering ---

function renderNotes() {
    elements.notesContainer.innerHTML = '';

    // Filter by category client-side
    const filtered = state.notes.filter(note => {
        if (state.selectedType === 'ALL') return true;
        return note.type === state.selectedType;
    });

    if (filtered.length === 0) {
        renderEmptyState();
        return;
    }

    filtered.forEach(note => {
        const card = createNoteCardElement(note);
        elements.notesContainer.appendChild(card);
    });
}

function createNoteCardElement(note) {
    const card = document.createElement('article');
    card.className = 'note-card';

    // Type Badge Style
    const typeLower = note.type.toLowerCase();
    
    // Header
    const header = document.createElement('div');
    header.className = 'note-card-header';
    header.innerHTML = `
        <div class="card-title-group">
            <span class="type-pill ${typeLower}">${note.type}</span>
            <h3 class="note-title">${escapeHtml(note.title)}</h3>
        </div>
        <div class="card-actions">
            <button class="btn-card-action" onclick="exportNote('${note.id}', 'markdown')" title="Export Markdown">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </button>
            <button class="btn-card-action danger" onclick="deleteNote('${note.id}')" title="Delete Note">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        </div>
    `;
    card.appendChild(header);

    // Body content based on polymorphic type
    const bodyContainer = document.createElement('div');

    if (note.type === 'TEXT') {
        const textBody = document.createElement('p');
        textBody.className = 'note-body';
        textBody.textContent = note.content;
        bodyContainer.appendChild(textBody);
    } 
    else if (note.type === 'CHECKLIST') {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'checklist-progress-container';
        progressContainer.innerHTML = `
            <div class="progress-header">
                <span>Progress: ${note.completedCount}/${note.totalCount} completed</span>
                <span>${Math.round(note.progressPercentage || 0)}%</span>
            </div>
            <div class="progress-bar-track">
                <div class="progress-bar-fill" style="width: ${note.progressPercentage || 0}%;"></div>
            </div>
        `;
        bodyContainer.appendChild(progressContainer);

        const list = document.createElement('ul');
        list.className = 'card-checklist-items';
        (note.items || []).forEach((item, index) => {
            const li = document.createElement('li');
            li.className = `checklist-row ${item.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <div class="checklist-checkbox">
                    ${item.completed ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                </div>
                <span class="checklist-text">${escapeHtml(item.text)}</span>
            `;
            li.addEventListener('click', () => toggleChecklistItem(note.id, index));
            list.appendChild(li);
        });
        bodyContainer.appendChild(list);
    } 
    else if (note.type === 'ENCRYPTED') {
        const shieldBox = document.createElement('div');
        shieldBox.className = 'vault-shield-box';
        shieldBox.innerHTML = `
            <div class="vault-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <span style="font-size: 0.85rem; color: var(--text-secondary);">Protected by 4-digit PIN</span>
            <button class="btn btn-secondary btn-sm" onclick="openUnlockModal('${note.id}', '${escapeAttr(note.title)}')">
                Unlock Note
            </button>
        `;
        bodyContainer.appendChild(shieldBox);
    } 
    else if (note.type === 'REMINDER') {
        const reminderRow = document.createElement('div');
        reminderRow.className = `reminder-badge-row ${note.overdue ? 'overdue' : ''}`;
        const formattedDate = formatDateTime(note.dueDate);
        reminderRow.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>${note.overdue ? 'OVERDUE: ' : 'Due: '}<strong>${formattedDate}</strong></span>
            <span style="margin-left:auto; font-weight:600; font-size:0.75rem;">${note.priority}</span>
        `;
        bodyContainer.appendChild(reminderRow);

        if (note.content) {
            const remBody = document.createElement('p');
            remBody.className = 'note-body';
            remBody.style.marginTop = '0.75rem';
            remBody.textContent = note.content;
            bodyContainer.appendChild(remBody);
        }
    }

    card.appendChild(bodyContainer);

    // Footer with tags and date
    const footer = document.createElement('div');
    footer.className = 'note-card-footer';
    
    const tagsWrapper = document.createElement('div');
    tagsWrapper.className = 'card-tags';
    if (note.tags && note.tags.length > 0) {
        note.tags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'card-tag';
            tagSpan.textContent = `#${tag}`;
            tagSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                filterByTag(tag);
            });
            tagsWrapper.appendChild(tagSpan);
        });
    }
    footer.appendChild(tagsWrapper);

    const dateSpan = document.createElement('span');
    dateSpan.textContent = formatRelativeTime(note.updatedAt);
    footer.appendChild(dateSpan);

    card.appendChild(footer);
    return card;
}

function renderEmptyState() {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
        <div class="empty-state-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
        </div>
        <h3>No notes found</h3>
        <p>There are no notes matching your current filter. Click "Create Note" to add your first note, or clear your search.</p>
        <button class="btn btn-primary" onclick="openCreateModal()">Create Note</button>
    `;
    elements.notesContainer.appendChild(empty);
}

function renderTagCloud() {
    elements.tagCloud.innerHTML = '';
    if (!state.tags || state.tags.length === 0) {
        elements.tagCloud.innerHTML = '<span class="muted-hint">No tags created yet.</span>';
        return;
    }

    state.tags.forEach(tag => {
        const pill = document.createElement('button');
        pill.className = `tag-pill ${state.selectedTag === tag ? 'active' : ''}`;
        pill.textContent = `#${tag}`;
        pill.addEventListener('click', () => filterByTag(tag));
        elements.tagCloud.appendChild(pill);
    });
}

function updateCategoryCounts() {
    const counts = { ALL: state.notes.length, TEXT: 0, CHECKLIST: 0, ENCRYPTED: 0, REMINDER: 0 };
    state.notes.forEach(n => {
        if (counts[n.type] !== undefined) counts[n.type]++;
    });

    elements.countAll.textContent = counts.ALL;
    elements.countText.textContent = counts.TEXT;
    elements.countChecklist.textContent = counts.CHECKLIST;
    elements.countEncrypted.textContent = counts.ENCRYPTED;
    elements.countReminder.textContent = counts.REMINDER;
}

// --- Tag Filtering ---

function filterByTag(tag) {
    state.selectedTag = tag;
    elements.filterLabel.innerHTML = `Filtering by tag: <strong>#${escapeHtml(tag)}</strong>`;
    elements.filterBanner.style.display = 'flex';
    document.querySelectorAll('.tag-pill').forEach(p => {
        p.classList.toggle('active', p.textContent === `#${tag}`);
    });
    fetchNotes();
}

// --- Note Actions ---

async function toggleChecklistItem(noteId, index) {
    try {
        const res = await fetch(`/api/notes/${noteId}/toggle?index=${index}`, { method: 'POST' });
        if (!res.ok) throw new Error('Failed to toggle checklist item');
        const updated = await res.json();
        const noteIdx = state.notes.findIndex(n => n.id === noteId);
        if (noteIdx !== -1) {
            state.notes[noteIdx] = updated;
            renderNotes();
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function deleteNote(noteId) {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
        const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete note');
        state.notes = state.notes.filter(n => n.id !== noteId);
        renderNotes();
        fetchTags();
        fetchStats();
        showToast('Note deleted successfully', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function exportNote(noteId, format) {
    window.open(`/api/notes/${noteId}/export?format=${format}`, '_blank');
}

// --- Create Note Modal ---

function openCreateModal() {
    elements.createModal.style.display = 'flex';
    document.getElementById('noteTitle').focus();
    switchModalType('TEXT');
}

function closeCreateModal() {
    elements.createModal.style.display = 'none';
    elements.createNoteForm.reset();
    elements.checklistItemsContainer.innerHTML = `
        <div class="item-builder-row">
            <input type="text" class="form-input checklist-input" placeholder="e.g. Implement NoteFactory pattern">
        </div>
    `;
}

function switchModalType(type) {
    state.activeModalType = type;
    elements.textFields.style.display = (type === 'TEXT') ? 'block' : 'none';
    elements.checklistFields.style.display = (type === 'CHECKLIST') ? 'block' : 'none';
    elements.encryptedFields.style.display = (type === 'ENCRYPTED') ? 'block' : 'none';
    elements.reminderFields.style.display = (type === 'REMINDER') ? 'block' : 'none';
}

async function handleCreateNoteSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('noteTitle').value.trim();
    if (!title) {
        showToast('Note title is required', 'error');
        return;
    }

    const tagsInput = document.getElementById('noteTags').value;
    const tags = tagsInput.split(',')
        .map(t => t.trim().replace(/^#/, ''))
        .filter(t => t.length > 0);

    const payload = {
        title,
        type: state.activeModalType,
        tags
    };

    if (state.activeModalType === 'TEXT') {
        payload.content = document.getElementById('textContent').value;
    } else if (state.activeModalType === 'CHECKLIST') {
        const itemInputs = elements.checklistItemsContainer.querySelectorAll('.checklist-input');
        payload.checklistItems = Array.from(itemInputs).map(inp => inp.value.trim()).filter(v => v);
        if (payload.checklistItems.length === 0) {
            showToast('Please add at least one task item', 'error');
            return;
        }
    } else if (state.activeModalType === 'ENCRYPTED') {
        payload.content = document.getElementById('encryptedContent').value;
        payload.pin = document.getElementById('encryptedPin').value.trim();
        if (payload.pin.length < 4) {
            showToast('Security PIN must be at least 4 digits', 'error');
            return;
        }
    } else if (state.activeModalType === 'REMINDER') {
        payload.content = document.getElementById('reminderContent').value;
        const dueVal = document.getElementById('reminderDueDate').value;
        if (!dueVal) {
            showToast('Please select a due date and time', 'error');
            return;
        }
        payload.dueDate = dueVal;
        payload.priority = document.getElementById('reminderPriority').value;
    }

    try {
        const res = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Failed to create note');
        }

        const newNote = await res.json();
        closeCreateModal();
        fetchNotes();
        fetchTags();
        fetchStats();
        showToast(`Created note "${newNote.title}"`, 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// --- Unlock PIN Modal ---

function openUnlockModal(noteId, title) {
    state.unlockingNoteId = noteId;
    elements.unlockNoteTitle.textContent = title;
    elements.unlockPinInput.value = '';
    elements.unlockError.style.display = 'none';
    elements.unlockedContentBox.style.display = 'none';
    elements.unlockModal.style.display = 'flex';
    elements.unlockPinInput.focus();
}

function closeUnlockModal() {
    elements.unlockModal.style.display = 'none';
    state.unlockingNoteId = null;
}

async function submitUnlock() {
    const pin = elements.unlockPinInput.value.trim();
    if (!pin) {
        elements.unlockError.textContent = 'Please enter your PIN.';
        elements.unlockError.style.display = 'block';
        return;
    }

    try {
        const res = await fetch(`/api/notes/${state.unlockingNoteId}/unlock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin })
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Incorrect PIN.');
        }

        const data = await res.json();
        elements.unlockError.style.display = 'none';
        elements.unlockedContentText.textContent = data.content || '(Empty content)';
        elements.unlockedContentBox.style.display = 'block';
    } catch (err) {
        elements.unlockError.textContent = err.message;
        elements.unlockError.style.display = 'block';
    }
}

// --- Utility Helpers ---

function showToast(message, type = 'success') {
    elements.toast.textContent = message;
    elements.toast.className = `toast-notification ${type}`;
    elements.toast.style.display = 'block';
    setTimeout(() => {
        elements.toast.style.display = 'none';
    }, 3500);
}

function formatDateTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatRelativeTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttr(text) {
    if (!text) return '';
    return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
