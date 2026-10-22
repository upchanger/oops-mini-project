/**
 * NotesFlow Frontend Application Controller
 * Features Dual-Mode Storage Adapter:
 *  - Cloud Synced mode: Connects to Spring Boot REST API (local or cloud like Render/Railway)
 *  - Standalone Local mode: Zero-setup client-side storage for Vercel static deployments
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
    unlockingNoteId: null,
    unlockingNoteTitle: null,
    deletingNoteId: null,
    theme: localStorage.getItem('notesflow_theme') || 'dark',
    storageMode: localStorage.getItem('notesflow_storage_mode') || 'auto', // 'auto', 'local', 'custom'
    backendUrl: localStorage.getItem('notesflow_backend_url') || '',
    activeBackend: 'cloud', // 'cloud' or 'local'
    fullscreen: {
        isOpen: false,
        mode: 'CREATE', // 'CREATE' or 'EDIT'
        noteId: null,
        type: 'TEXT',
        pin: '',
        tags: []
    }
};

// DOM Elements
const elements = {
    notesContainer: document.getElementById('notesContainer'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeToggleText: document.getElementById('themeToggleText'),
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    sortSelect: document.getElementById('sortSelect'),
    tagCloud: document.getElementById('tagCloud'),
    filterBanner: document.getElementById('filterBanner'),
    filterValue: document.getElementById('filterValue'),
    clearFilterBtn: document.getElementById('clearFilterBtn'),

    // Connection & Backend Elements
    connectionStatusPill: document.getElementById('connectionStatusPill'),
    statusIndicatorDot: document.getElementById('statusIndicatorDot'),
    connectionStatusText: document.getElementById('connectionStatusText'),
    connectionModal: document.getElementById('connectionModal'),
    closeConnectionModalBtn: document.getElementById('closeConnectionModalBtn'),
    cancelConnectionModalBtn: document.getElementById('cancelConnectionModalBtn'),
    saveConnectionSettingsBtn: document.getElementById('saveConnectionSettingsBtn'),
    backendUrlInput: document.getElementById('backendUrlInput'),
    testConnectionBtn: document.getElementById('testConnectionBtn'),
    connectionTestResult: document.getElementById('connectionTestResult'),
    exportBackupBtn: document.getElementById('exportBackupBtn'),
    importBackupBtn: document.getElementById('importBackupBtn'),
    importFileInput: document.getElementById('importFileInput'),
    
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
    saveNoteBtn: document.getElementById('saveNoteBtn'),
    typeTabs: document.getElementById('typeTabs'),
    
    // Type Fields Containers
    textFields: document.getElementById('textFields'),
    checklistFields: document.getElementById('checklistFields'),
    encryptedFields: document.getElementById('encryptedFields'),
    reminderFields: document.getElementById('reminderFields'),
    checklistItemsContainer: document.getElementById('checklistItemsContainer'),
    addChecklistRowBtn: document.getElementById('addChecklistRowBtn'),

    // Unlock PIN Modal (Step 1)
    unlockModal: document.getElementById('unlockModal'),
    unlockNoteTitle: document.getElementById('unlockNoteTitle'),
    unlockPinInput: document.getElementById('unlockPinInput'),
    unlockError: document.getElementById('unlockError'),
    closeUnlockModalBtn: document.getElementById('closeUnlockModalBtn'),
    cancelUnlockBtn: document.getElementById('cancelUnlockBtn'),
    submitUnlockBtn: document.getElementById('submitUnlockBtn'),

    // Fullscreen Workspace Elements
    fullscreenWorkspace: document.getElementById('fullscreenWorkspace'),
    fullscreenTypePill: document.getElementById('fullscreenTypePill'),
    fullscreenTitleInput: document.getElementById('fullscreenTitleInput'),
    fullscreenWordCount: document.getElementById('fullscreenWordCount'),
    fullscreenCharCount: document.getElementById('fullscreenCharCount'),
    copyFullscreenBtn: document.getElementById('copyFullscreenBtn'),
    fullscreenCopyText: document.getElementById('fullscreenCopyText'),
    deleteFullscreenBtn: document.getElementById('deleteFullscreenBtn'),
    saveFullscreenBtn: document.getElementById('saveFullscreenBtn'),
    saveFullscreenBtnText: document.getElementById('saveFullscreenBtnText'),
    closeFullscreenBtn: document.getElementById('closeFullscreenBtn'),
    exitFullscreenBtn: document.getElementById('exitFullscreenBtn'),
    fullscreenTagsInput: document.getElementById('fullscreenTagsInput'),
    fullscreenStatusLabel: document.getElementById('fullscreenStatusLabel'),
    fullscreenContentTextarea: document.getElementById('fullscreenContentTextarea'),

    // Delete Modal
    deleteModal: document.getElementById('deleteModal'),
    deleteNotePrompt: document.getElementById('deleteNotePrompt'),
    closeDeleteModalBtn: document.getElementById('closeDeleteModalBtn'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),

    toast: document.getElementById('toast')
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    setupEventListeners();
    await initStorageEngine();
    fetchNotes();
    fetchTags();
    fetchStats();
});

// --- Theme Management ---
function initTheme() {
    const saved = localStorage.getItem('notesflow_theme') || 'dark';
    applyTheme(saved);
}

function applyTheme(theme) {
    state.theme = theme;
    if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        if (elements.themeToggleText) elements.themeToggleText.textContent = 'Light';
        if (elements.themeToggleBtn) elements.themeToggleBtn.setAttribute('title', 'Switch to Dark mode');
    } else {
        document.documentElement.removeAttribute('data-theme');
        if (elements.themeToggleText) elements.themeToggleText.textContent = 'Dark';
        if (elements.themeToggleBtn) elements.themeToggleBtn.setAttribute('title', 'Switch to Light mode');
    }
    localStorage.setItem('notesflow_theme', theme);
}

function toggleTheme() {
    const nextTheme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
}

// --- Cryptography & Security Helpers ---
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function encryptString(text, key) {
    const textBytes = new TextEncoder().encode(text);
    const keyBytes = new TextEncoder().encode(key);
    const result = new Uint8Array(textBytes.length);
    for (let i = 0; i < textBytes.length; i++) {
        result[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    let binary = '';
    for (let i = 0; i < result.length; i++) {
        binary += String.fromCharCode(result[i]);
    }
    return btoa(binary);
}

function decryptString(encoded, key) {
    const binary = atob(encoded);
    const textBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        textBytes[i] = binary.charCodeAt(i);
    }
    const keyBytes = new TextEncoder().encode(key);
    const result = new Uint8Array(textBytes.length);
    for (let i = 0; i < textBytes.length; i++) {
        result[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    return new TextDecoder().decode(result);
}

// --- Local Storage Adapter (Polymorphic OOP Client Engine) ---
const LocalStorageEngine = {
    KEY: 'notesflow_local_notes',

    getRawNotes() {
        try {
            const raw = localStorage.getItem(this.KEY);
            if (!raw) return this.seedDefaults();
            return JSON.parse(raw) || [];
        } catch (e) {
            console.error('Failed to parse local notes:', e);
            return [];
        }
    },

    saveRawNotes(notes) {
        localStorage.setItem(this.KEY, JSON.stringify(notes));
    },

    seedDefaults() {
        const now = new Date();
        const tomorrow = new Date(Date.now() + 86400000).toISOString();
        const initial = [
            {
                id: 'note-sample-1',
                type: 'TEXT',
                title: 'Welcome to NotesFlow (Vercel Edition)',
                content: 'NotesFlow is an enterprise-grade, polymorphic note application built with clean Object-Oriented Architecture.\n\nKey Highlights:\n- ✍️ Distraction-free full-screen workspace\n- 🎨 Obsidian theme with Zero Blue palette\n- 🔒 SHA-256 PIN Encrypted Vault notes\n- 🚀 Zero-friction Vercel static deployment with seamless local fallback\n- 🔄 Optional cloud sync to Spring Boot on Render or Railway',
                tags: ['welcome', 'obsidian', 'features'],
                createdAt: now.toISOString(),
                updatedAt: now.toISOString()
            },
            {
                id: 'note-sample-2',
                type: 'CHECKLIST',
                title: 'Vercel & Cloud Deployment Checklist',
                items: [
                    { text: 'Configure vercel.json output directory', completed: true },
                    { text: 'Build static assets using node build.js', completed: true },
                    { text: 'Dual-mode storage adapter with local fallback', completed: true },
                    { text: 'Deploy backend Dockerfile to Render or Railway', completed: false },
                    { text: 'Set backend API URL in Settings dialog', completed: false }
                ],
                completedCount: 3,
                totalCount: 5,
                progressPercentage: 60.0,
                tags: ['deployment', 'checklist', 'vercel'],
                createdAt: now.toISOString(),
                updatedAt: now.toISOString()
            },
            {
                id: 'note-sample-3',
                type: 'ENCRYPTED',
                title: 'Protected Vault Credentials',
                pinHash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', // SHA-256 for '1234'
                encryptedContent: encryptString('API Keys:\n- PROD_DB_SECRET: sk_live_9948274102\n- JWT_SIGNING_KEY: f8d1847c92b\n\nDefault PIN to unlock this sample note is: 1234', '1234'),
                tags: ['security', 'vault', 'credentials'],
                createdAt: now.toISOString(),
                updatedAt: now.toISOString()
            },
            {
                id: 'note-sample-4',
                type: 'REMINDER',
                title: 'Review System Metrics',
                content: 'Audit server logs, memory footprint, and storage quota.',
                dueDate: tomorrow,
                priority: 'HIGH',
                isOverdue: false,
                tags: ['maintenance', 'monitoring'],
                createdAt: now.toISOString(),
                updatedAt: now.toISOString()
            }
        ];
        this.saveRawNotes(initial);
        return initial;
    },

    async getNotes({ sort, query, tag }) {
        let notes = this.getRawNotes();

        // Update overdue status on reminders dynamically
        const now = new Date();
        notes.forEach(n => {
            if (n.type === 'REMINDER' && n.dueDate) {
                n.isOverdue = new Date(n.dueDate) < now;
            }
        });

        // Filter by Tag
        if (tag) {
            notes = notes.filter(n => n.tags && n.tags.some(t => t.toLowerCase() === tag.toLowerCase()));
        }

        // Filter by Query (search in title, content, tags, checklist items)
        if (query) {
            const q = query.toLowerCase();
            notes = notes.filter(n => {
                if (n.title && n.title.toLowerCase().includes(q)) return true;
                if (n.content && n.content.toLowerCase().includes(q)) return true;
                if (n.tags && n.tags.some(t => t.toLowerCase().includes(q))) return true;
                if (n.items && n.items.some(i => i.text && i.text.toLowerCase().includes(q))) return true;
                return false;
            });
        }

        // Sort
        notes.sort((a, b) => {
            if (sort === 'created') {
                return new Date(b.createdAt) - new Date(a.createdAt);
            } else if (sort === 'title') {
                return a.title.localeCompare(b.title);
            } else if (sort === 'priority') {
                const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
                const pA = priorityOrder[a.priority] || 0;
                const pB = priorityOrder[b.priority] || 0;
                return pB - pA;
            } else {
                // Default: recently updated
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            }
        });

        return notes;
    },

    async getTags() {
        const notes = this.getRawNotes();
        const tagSet = new Set();
        notes.forEach(n => {
            if (n.tags && Array.isArray(n.tags)) {
                n.tags.forEach(t => tagSet.add(t));
            }
        });
        return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
    },

    async getStats() {
        const notes = this.getRawNotes();
        const now = new Date();
        const stats = {
            totalNotes: notes.length,
            textNotes: 0,
            checklistNotes: 0,
            encryptedNotes: 0,
            reminderNotes: 0,
            overdueReminders: 0
        };

        notes.forEach(n => {
            if (n.type === 'TEXT') stats.textNotes++;
            else if (n.type === 'CHECKLIST') stats.checklistNotes++;
            else if (n.type === 'ENCRYPTED') stats.encryptedNotes++;
            else if (n.type === 'REMINDER') {
                stats.reminderNotes++;
                if (n.dueDate && new Date(n.dueDate) < now) {
                    stats.overdueReminders++;
                }
            }
        });

        return stats;
    },

    async createNote(payload) {
        const notes = this.getRawNotes();
        const now = new Date().toISOString();
        const id = 'note-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);

        const newNote = {
            id,
            title: payload.title,
            type: payload.type,
            tags: payload.tags || [],
            createdAt: now,
            updatedAt: now
        };

        if (payload.type === 'TEXT') {
            newNote.content = payload.content || '';
        } else if (payload.type === 'CHECKLIST') {
            const rawItems = payload.checklistItems || [];
            newNote.items = rawItems.map(item => ({
                text: typeof item === 'string' ? item : item.text,
                completed: false
            }));
            newNote.completedCount = 0;
            newNote.totalCount = newNote.items.length;
            newNote.progressPercentage = 0.0;
        } else if (payload.type === 'ENCRYPTED') {
            const pin = payload.pin || '1234';
            newNote.pinHash = await sha256(pin);
            newNote.encryptedContent = encryptString(payload.content || '', pin);
        } else if (payload.type === 'REMINDER') {
            newNote.content = payload.content || '';
            newNote.dueDate = payload.dueDate;
            newNote.priority = payload.priority || 'MEDIUM';
            newNote.isOverdue = new Date(payload.dueDate) < new Date();
        }

        notes.unshift(newNote);
        this.saveRawNotes(notes);
        return newNote;
    },

    async updateNote(id, payload) {
        const notes = this.getRawNotes();
        const index = notes.findIndex(n => n.id === id);
        if (index === -1) throw new Error('Note not found');

        const note = notes[index];
        note.title = payload.title || note.title;
        note.tags = payload.tags || note.tags;
        note.updatedAt = new Date().toISOString();

        if (note.type === 'TEXT') {
            note.content = payload.content || '';
        } else if (note.type === 'ENCRYPTED') {
            if (payload.pin) {
                note.pinHash = await sha256(payload.pin);
                note.encryptedContent = encryptString(payload.content || '', payload.pin);
            }
        } else if (note.type === 'REMINDER') {
            note.content = payload.content || note.content;
            if (payload.dueDate) note.dueDate = payload.dueDate;
            if (payload.priority) note.priority = payload.priority;
            note.isOverdue = new Date(note.dueDate) < new Date();
        }

        notes[index] = note;
        this.saveRawNotes(notes);
        return note;
    },

    async deleteNote(id) {
        let notes = this.getRawNotes();
        notes = notes.filter(n => n.id !== id);
        this.saveRawNotes(notes);
        return true;
    },

    async toggleChecklistItem(noteId, itemIndex) {
        const notes = this.getRawNotes();
        const note = notes.find(n => n.id === noteId);
        if (!note || note.type !== 'CHECKLIST') throw new Error('Checklist note not found');

        if (!note.items || !note.items[itemIndex]) throw new Error('Invalid item index');
        note.items[itemIndex].completed = !note.items[itemIndex].completed;

        note.completedCount = note.items.filter(i => i.completed).length;
        note.totalCount = note.items.length;
        note.progressPercentage = note.totalCount === 0 ? 0 : Math.round((note.completedCount / note.totalCount) * 100);
        note.updatedAt = new Date().toISOString();

        this.saveRawNotes(notes);
        return note;
    },

    async unlockNote(noteId, pin) {
        const notes = this.getRawNotes();
        const note = notes.find(n => n.id === noteId);
        if (!note || note.type !== 'ENCRYPTED') throw new Error('Vault note not found');

        const inputHash = await sha256(pin);
        if (note.pinHash && note.pinHash !== inputHash) {
            throw new Error('Incorrect PIN. Access denied.');
        }

        const decrypted = decryptString(note.encryptedContent || '', pin);
        return { content: decrypted };
    },

    exportMarkdown(note) {
        let md = `# ${note.title}\n\n`;
        if (note.tags && note.tags.length > 0) {
            md += `*Tags:* ${note.tags.map(t => '#' + t).join(' ')}\n\n`;
        }

        if (note.type === 'CHECKLIST') {
            md += `### Checklist (${note.completedCount || 0}/${note.totalCount || 0} completed)\n\n`;
            (note.items || []).forEach(item => {
                md += `- [${item.completed ? 'x' : ' '}] ${item.text}\n`;
            });
        } else if (note.type === 'REMINDER') {
            md += `> **Priority:** ${note.priority || 'MEDIUM'} | **Due:** ${note.dueDate || 'N/A'}\n\n`;
            md += `${note.content || ''}\n`;
        } else if (note.type === 'ENCRYPTED') {
            md += `> [Locked Encrypted Vault Note]\n\n*(Unlock in NotesFlow to view content)*\n`;
        } else {
            md += `${note.content || ''}\n`;
        }

        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${note.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'note'}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

// --- Storage Engine Orchestrator ---
function getApiBaseUrl() {
    if (state.storageMode === 'custom' && state.backendUrl) {
        return state.backendUrl.replace(/\/$/, '');
    }
    return '';
}

async function initStorageEngine() {
    updateStorageStatusUI();

    if (state.storageMode === 'local') {
        setBackendMode('local', 'Standalone Mode');
        return;
    }

    // Probe backend connection
    const base = getApiBaseUrl();
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(`${base}/api/notes?sort=updated`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            setBackendMode('cloud', 'Cloud Synced');
        } else {
            setBackendMode('local', 'Standalone Mode');
        }
    } catch (e) {
        // Backend not reachable - seamless fallback to local storage
        setBackendMode('local', 'Standalone Mode');
    }
}

function setBackendMode(mode, label) {
    state.activeBackend = mode;
    if (elements.statusIndicatorDot) {
        elements.statusIndicatorDot.className = `status-indicator-dot ${mode === 'cloud' ? 'online' : 'local'}`;
    }
    if (elements.connectionStatusText) {
        elements.connectionStatusText.textContent = label;
    }
}

function updateStorageStatusUI() {
    if (!elements.connectionStatusPill) return;
    const isCloud = (state.activeBackend === 'cloud');
    elements.connectionStatusPill.setAttribute('title', isCloud
        ? 'Connected to Spring Boot API. Click to configure backend.'
        : 'Running in Standalone Local Mode. Click to configure backend.');
}

// --- Unified Data Layer ---
const DataService = {
    async getNotes(params) {
        if (state.activeBackend === 'local') {
            return await LocalStorageEngine.getNotes(params);
        }
        try {
            const base = getApiBaseUrl();
            let url = `${base}/api/notes?sort=${encodeURIComponent(params.sort || 'updated')}`;
            if (params.query) url += `&query=${encodeURIComponent(params.query)}`;
            if (params.tag) url += `&tag=${encodeURIComponent(params.tag)}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to load notes');
            return await res.json();
        } catch (err) {
            if (state.storageMode === 'auto') {
                setBackendMode('local', 'Standalone Mode');
                showToast('Backend offline: switched to Standalone Local Mode', 'error');
                return await LocalStorageEngine.getNotes(params);
            }
            throw err;
        }
    },

    async getTags() {
        if (state.activeBackend === 'local') {
            return await LocalStorageEngine.getTags();
        }
        try {
            const base = getApiBaseUrl();
            const res = await fetch(`${base}/api/tags`);
            if (!res.ok) throw new Error('Failed to load tags');
            return await res.json();
        } catch (err) {
            if (state.storageMode === 'auto') {
                return await LocalStorageEngine.getTags();
            }
            throw err;
        }
    },

    async getStats() {
        if (state.activeBackend === 'local') {
            return await LocalStorageEngine.getStats();
        }
        try {
            const base = getApiBaseUrl();
            const res = await fetch(`${base}/api/stats`);
            if (!res.ok) return {};
            return await res.json();
        } catch (err) {
            if (state.storageMode === 'auto') {
                return await LocalStorageEngine.getStats();
            }
            return {};
        }
    },

    async createNote(payload) {
        if (state.activeBackend === 'local') {
            return await LocalStorageEngine.createNote(payload);
        }
        const base = getApiBaseUrl();
        const res = await fetch(`${base}/api/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || 'Failed to create note');
        }
        return await res.json();
    },

    async updateNote(id, payload) {
        if (state.activeBackend === 'local') {
            return await LocalStorageEngine.updateNote(id, payload);
        }
        const base = getApiBaseUrl();
        const res = await fetch(`${base}/api/notes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || 'Failed to update note');
        }
        return await res.json();
    },

    async deleteNote(id) {
        if (state.activeBackend === 'local') {
            return await LocalStorageEngine.deleteNote(id);
        }
        const base = getApiBaseUrl();
        const res = await fetch(`${base}/api/notes/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete note');
        return true;
    },

    async toggleChecklistItem(noteId, index) {
        if (state.activeBackend === 'local') {
            return await LocalStorageEngine.toggleChecklistItem(noteId, index);
        }
        const base = getApiBaseUrl();
        const res = await fetch(`${base}/api/notes/${noteId}/toggle?index=${index}`, { method: 'POST' });
        if (!res.ok) throw new Error('Failed to toggle checklist item');
        return await res.json();
    },

    async unlockNote(noteId, pin) {
        if (state.activeBackend === 'local') {
            return await LocalStorageEngine.unlockNote(noteId, pin);
        }
        const base = getApiBaseUrl();
        const res = await fetch(`${base}/api/notes/${noteId}/unlock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin })
        });
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || 'Incorrect PIN.');
        }
        return await res.json();
    },

    exportNote(note, format) {
        if (state.activeBackend === 'local') {
            LocalStorageEngine.exportMarkdown(note);
        } else {
            const base = getApiBaseUrl();
            window.open(`${base}/api/notes/${note.id}/export?format=${format}`, '_blank');
        }
    }
};

// --- App Event Listeners ---
function setupEventListeners() {
    // Theme Toggle Trigger
    if (elements.themeToggleBtn) {
        elements.themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Backend / Connection Modal Triggers
    if (elements.connectionStatusPill) {
        elements.connectionStatusPill.addEventListener('click', openConnectionModal);
    }
    if (elements.closeConnectionModalBtn) {
        elements.closeConnectionModalBtn.addEventListener('click', closeConnectionModal);
    }
    if (elements.cancelConnectionModalBtn) {
        elements.cancelConnectionModalBtn.addEventListener('click', closeConnectionModal);
    }
    if (elements.saveConnectionSettingsBtn) {
        elements.saveConnectionSettingsBtn.addEventListener('click', saveConnectionSettings);
    }
    if (elements.testConnectionBtn) {
        elements.testConnectionBtn.addEventListener('click', testBackendConnection);
    }
    if (elements.exportBackupBtn) {
        elements.exportBackupBtn.addEventListener('click', exportBackupJson);
    }
    if (elements.importBackupBtn) {
        elements.importBackupBtn.addEventListener('click', () => elements.importFileInput.click());
    }
    if (elements.importFileInput) {
        elements.importFileInput.addEventListener('change', handleImportBackup);
    }

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

    // Unlock PIN Modal Triggers
    elements.closeUnlockModalBtn.addEventListener('click', closeUnlockModal);
    elements.cancelUnlockBtn.addEventListener('click', closeUnlockModal);
    elements.submitUnlockBtn.addEventListener('click', submitUnlock);
    elements.unlockPinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitUnlock();
    });

    // Fullscreen Workspace Triggers
    elements.closeFullscreenBtn.addEventListener('click', closeFullscreenWorkspace);
    elements.exitFullscreenBtn.addEventListener('click', closeFullscreenWorkspace);
    elements.saveFullscreenBtn.addEventListener('click', saveFullscreenNote);
    elements.copyFullscreenBtn.addEventListener('click', copyFullscreenContent);
    elements.fullscreenContentTextarea.addEventListener('input', updateFullscreenStats);

    // Global Keyboard Listeners (Esc to exit, Ctrl+S / Cmd+S to save)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (state.fullscreen.isOpen) {
                closeFullscreenWorkspace();
            } else if (elements.createModal.style.display === 'flex') {
                closeCreateModal();
            } else if (elements.unlockModal.style.display === 'flex') {
                closeUnlockModal();
            } else if (elements.deleteModal.style.display === 'flex') {
                closeDeleteModal();
            } else if (elements.connectionModal && elements.connectionModal.style.display === 'flex') {
                closeConnectionModal();
            }
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
            if (state.fullscreen.isOpen) {
                e.preventDefault();
                saveFullscreenNote();
            }
        }
    });

    // Delete Modal Triggers
    elements.closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    elements.confirmDeleteBtn.addEventListener('click', executeDeleteNote);
}

// --- Data Fetching Operations ---
async function fetchNotes() {
    try {
        state.notes = await DataService.getNotes({
            sort: state.sortBy,
            query: state.searchQuery,
            tag: state.selectedTag
        });
        renderNotes();
        updateCategoryCounts();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function fetchTags() {
    try {
        state.tags = await DataService.getTags();
        renderTagCloud();
    } catch (err) {
        console.error('Error fetching tags:', err);
    }
}

async function fetchStats() {
    try {
        state.stats = await DataService.getStats();
        elements.statTotal.textContent = state.stats.totalNotes || 0;
        elements.statOverdue.textContent = state.stats.overdueReminders || 0;
        
        if (!state.searchQuery && !state.selectedTag && state.stats.textNotes !== undefined) {
            elements.countAll.textContent = state.stats.totalNotes || 0;
            elements.countText.textContent = state.stats.textNotes || 0;
            elements.countChecklist.textContent = state.stats.checklistNotes || 0;
            elements.countEncrypted.textContent = state.stats.encryptedNotes || 0;
            elements.countReminder.textContent = state.stats.reminderNotes || 0;
        }
    } catch (err) {
        console.error('Error fetching stats:', err);
    }
}

// --- UI Rendering ---
function renderNotes() {
    updateCategoryCounts();
    elements.notesContainer.innerHTML = '';

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
            ${(note.type === 'TEXT' || note.type === 'ENCRYPTED') ? `
            <button class="btn-card-action btn-open-fullscreen" title="Open in Full-Screen Workspace">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
            </button>
            ` : ''}
            <button class="btn-card-action btn-export-note" title="Export Markdown">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </button>
            <button class="btn-card-action danger btn-delete-note" title="Delete Note">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        </div>
    `;

    const openFsBtn = header.querySelector('.btn-open-fullscreen');
    if (openFsBtn) {
        openFsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (note.type === 'TEXT') {
                openFullscreenWorkspace({
                    mode: 'EDIT',
                    type: 'TEXT',
                    noteId: note.id,
                    title: note.title,
                    tags: note.tags || [],
                    content: note.content || ''
                });
            } else if (note.type === 'ENCRYPTED') {
                openUnlockModal(note.id, note.title);
            }
        });
    }

    const exportBtn = header.querySelector('.btn-export-note');
    exportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        DataService.exportNote(note, 'markdown');
    });

    const deleteBtn = header.querySelector('.btn-delete-note');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        promptDeleteNote(note.id, note.title);
    });

    card.appendChild(header);

    // Body content based on polymorphic type
    const bodyContainer = document.createElement('div');

    if (note.type === 'TEXT') {
        card.classList.add('clickable');
        card.addEventListener('click', (e) => {
            if (e.target.closest('.card-actions') || e.target.closest('.card-tag')) return;
            openFullscreenWorkspace({
                mode: 'EDIT',
                type: 'TEXT',
                noteId: note.id,
                title: note.title,
                tags: note.tags || [],
                content: note.content || ''
            });
        });

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
            li.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleChecklistItem(note.id, index);
            });
            list.appendChild(li);
        });
        bodyContainer.appendChild(list);
    } 
    else if (note.type === 'ENCRYPTED') {
        card.classList.add('clickable');
        card.addEventListener('click', (e) => {
            if (e.target.closest('.card-actions') || e.target.closest('.card-tag')) return;
            openUnlockModal(note.id, note.title);
        });

        const vaultBox = document.createElement('div');
        vaultBox.className = 'encrypted-placeholder';
        vaultBox.innerHTML = `
            <div class="encrypted-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
            </div>
            <p>Encrypted Note Content</p>
            <button class="btn btn-secondary btn-sm" onclick="openUnlockModal('${note.id}', '${escapeAttr(note.title)}'); event.stopPropagation();">
                Unlock Note
            </button>
        `;
        bodyContainer.appendChild(vaultBox);
    } 
    else if (note.type === 'REMINDER') {
        const metaBox = document.createElement('div');
        metaBox.className = 'reminder-meta';
        const isOverdue = note.isOverdue;
        metaBox.innerHTML = `
            <span class="priority-badge priority-${(note.priority || 'medium').toLowerCase()}">${note.priority || 'MEDIUM'}</span>
            <span class="due-date-pill ${isOverdue ? 'overdue' : ''}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                ${formatDateTime(note.dueDate)} ${isOverdue ? '(Overdue)' : ''}
            </span>
        `;
        bodyContainer.appendChild(metaBox);

        if (note.content) {
            const remBody = document.createElement('p');
            remBody.className = 'note-body';
            remBody.textContent = note.content;
            bodyContainer.appendChild(remBody);
        }
    }

    card.appendChild(bodyContainer);

    // Footer
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
        const updated = await DataService.toggleChecklistItem(noteId, index);
        const noteIdx = state.notes.findIndex(n => n.id === noteId);
        if (noteIdx !== -1) {
            state.notes[noteIdx] = updated;
            renderNotes();
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function promptDeleteNote(noteId, title) {
    state.deletingNoteId = noteId;
    elements.deleteNotePrompt.textContent = `Are you sure you want to permanently delete "${title}"?`;
    elements.deleteModal.style.display = 'flex';
}

function closeDeleteModal() {
    elements.deleteModal.style.display = 'none';
    state.deletingNoteId = null;
}

async function executeDeleteNote() {
    if (!state.deletingNoteId) return;
    const noteId = state.deletingNoteId;
    try {
        await DataService.deleteNote(noteId);
        state.notes = state.notes.filter(n => n.id !== noteId);
        closeDeleteModal();
        if (state.fullscreen.isOpen && state.fullscreen.noteId === noteId) {
            closeFullscreenWorkspace();
        }
        renderNotes();
        updateCategoryCounts();
        fetchTags();
        fetchStats();
        showToast('Note deleted successfully', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function deleteFromFullscreen() {
    if (!state.fullscreen.noteId) return;
    const title = elements.fullscreenTitleInput.value.trim() || 'this note';
    promptDeleteNote(state.fullscreen.noteId, title);
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

    if (elements.saveNoteBtn) {
        if (type === 'TEXT') {
            elements.saveNoteBtn.textContent = 'Write Note in Full-Screen →';
        } else if (type === 'ENCRYPTED') {
            elements.saveNoteBtn.textContent = 'Set PIN & Open Vault in Full-Screen →';
        } else if (type === 'CHECKLIST') {
            elements.saveNoteBtn.textContent = 'Save Checklist';
        } else if (type === 'REMINDER') {
            elements.saveNoteBtn.textContent = 'Save Reminder';
        }
    }
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

    // Standard Note: Enter full-screen workspace immediately
    if (state.activeModalType === 'TEXT') {
        closeCreateModal();
        openFullscreenWorkspace({
            mode: 'CREATE',
            type: 'TEXT',
            title: title,
            tags: tags,
            content: ''
        });
        return;
    }

    // Encrypted Note: Validate PIN, then enter full-screen vault workspace immediately
    if (state.activeModalType === 'ENCRYPTED') {
        const pin = document.getElementById('encryptedPin').value.trim();
        if (pin.length < 4) {
            showToast('Security PIN must be at least 4 digits', 'error');
            return;
        }
        closeCreateModal();
        openFullscreenWorkspace({
            mode: 'CREATE',
            type: 'ENCRYPTED',
            title: title,
            pin: pin,
            tags: tags,
            content: ''
        });
        return;
    }

    // Checklist & Reminder: Proceed with standard creation
    const payload = {
        title,
        type: state.activeModalType,
        tags
    };

    if (state.activeModalType === 'CHECKLIST') {
        const itemInputs = elements.checklistItemsContainer.querySelectorAll('.checklist-input');
        payload.checklistItems = Array.from(itemInputs).map(inp => inp.value.trim()).filter(v => v);
        if (payload.checklistItems.length === 0) {
            showToast('Please add at least one task item', 'error');
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
        const newNote = await DataService.createNote(payload);
        closeCreateModal();
        fetchNotes();
        fetchTags();
        fetchStats();
        showToast(`Created note "${newNote.title}"`, 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// --- Full-Screen Document Workspace ---
function openFullscreenWorkspace(options) {
    state.fullscreen = {
        isOpen: true,
        mode: options.mode || 'CREATE',
        noteId: options.noteId || null,
        type: options.type || 'TEXT',
        pin: options.pin || '',
        tags: options.tags || []
    };

    const type = state.fullscreen.type;
    const isEncrypted = (type === 'ENCRYPTED');

    elements.fullscreenTypePill.textContent = isEncrypted ? 'Vault Encrypted' : 'Standard Note';
    elements.fullscreenTypePill.className = `type-pill ${type.toLowerCase()}`;
    elements.fullscreenTitleInput.value = options.title || '';
    elements.fullscreenTagsInput.value = (options.tags && options.tags.length > 0) ? options.tags.join(', ') : '';
    elements.fullscreenContentTextarea.value = options.content || '';
    elements.fullscreenContentTextarea.placeholder = isEncrypted
        ? 'Write your protected credentials, private thoughts, or vault secrets here...'
        : 'Start typing your note here... Markdown is supported.';

    elements.saveFullscreenBtnText.textContent = (state.fullscreen.mode === 'CREATE') ? 'Save Note' : 'Save Changes';
    if (elements.deleteFullscreenBtn) {
        elements.deleteFullscreenBtn.style.display = (state.fullscreen.mode === 'EDIT' && state.fullscreen.noteId) ? 'inline-flex' : 'none';
    }
    elements.fullscreenStatusLabel.textContent = isEncrypted
        ? '🔒 Secure Vault Canvas'
        : 'Distraction-free Markdown Canvas';

    updateFullscreenStats();
    elements.fullscreenWorkspace.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
        elements.fullscreenContentTextarea.focus();
    }, 60);
}

function closeFullscreenWorkspace() {
    elements.fullscreenWorkspace.style.display = 'none';
    document.body.style.overflow = '';
    state.fullscreen.isOpen = false;
    fetchNotes();
    fetchTags();
    fetchStats();
}

function updateFullscreenStats() {
    const text = elements.fullscreenContentTextarea.value || '';
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = text.length;
    elements.fullscreenWordCount.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
    elements.fullscreenCharCount.textContent = `${chars} ${chars === 1 ? 'char' : 'chars'}`;
}

async function copyFullscreenContent() {
    const text = elements.fullscreenContentTextarea.value || '';
    if (!text) {
        showToast('Nothing to copy', 'error');
        return;
    }
    try {
        await navigator.clipboard.writeText(text);
        elements.fullscreenCopyText.textContent = 'Copied!';
        setTimeout(() => {
            if (elements.fullscreenCopyText) elements.fullscreenCopyText.textContent = 'Copy';
        }, 2000);
        showToast('Copied to clipboard', 'success');
    } catch (err) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        elements.fullscreenCopyText.textContent = 'Copied!';
        setTimeout(() => {
            if (elements.fullscreenCopyText) elements.fullscreenCopyText.textContent = 'Copy';
        }, 2000);
        showToast('Copied to clipboard', 'success');
    }
}

async function saveFullscreenNote() {
    const title = elements.fullscreenTitleInput.value.trim();
    if (!title) {
        showToast('Note title cannot be blank', 'error');
        elements.fullscreenTitleInput.focus();
        return;
    }

    const content = elements.fullscreenContentTextarea.value;
    const tagsInput = elements.fullscreenTagsInput.value;
    const tags = tagsInput.split(',')
        .map(t => t.trim().replace(/^#/, ''))
        .filter(t => t.length > 0);

    const isCreate = (state.fullscreen.mode === 'CREATE');

    try {
        if (isCreate) {
            const payload = {
                title,
                content,
                type: state.fullscreen.type,
                tags
            };
            if (state.fullscreen.type === 'ENCRYPTED') {
                payload.pin = state.fullscreen.pin;
            }

            const created = await DataService.createNote(payload);
            state.fullscreen.mode = 'EDIT';
            state.fullscreen.noteId = created.id;
            elements.saveFullscreenBtnText.textContent = 'Save Changes';
            showToast(`Note "${created.title}" saved`, 'success');
        } else {
            const payload = {
                title,
                content,
                pin: state.fullscreen.pin,
                tags
            };

            const updated = await DataService.updateNote(state.fullscreen.noteId, payload);
            showToast(`Saved changes to "${updated.title}"`, 'success');
        }

        fetchNotes();
        fetchTags();
        fetchStats();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// --- Unlock PIN Modal ---
function openUnlockModal(noteId, title) {
    state.unlockingNoteId = noteId;
    state.unlockingNoteTitle = title;
    elements.unlockNoteTitle.textContent = title;
    elements.unlockPinInput.value = '';
    elements.unlockError.style.display = 'none';
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
        const data = await DataService.unlockNote(state.unlockingNoteId, pin);
        const noteTitle = state.unlockingNoteTitle || 'Vault Note';
        const targetNote = state.notes.find(n => n.id === state.unlockingNoteId);

        closeUnlockModal();

        openFullscreenWorkspace({
            mode: 'EDIT',
            type: 'ENCRYPTED',
            noteId: state.unlockingNoteId,
            title: noteTitle,
            pin: pin,
            tags: targetNote ? targetNote.tags : [],
            content: data.content || ''
        });
        showToast('Vault note unlocked in full-screen workspace', 'success');
    } catch (err) {
        elements.unlockError.textContent = err.message;
        elements.unlockError.style.display = 'block';
    }
}

// --- Deployment & Backend Settings Modal ---
function openConnectionModal() {
    if (!elements.connectionModal) return;

    // Load saved settings into form
    const mode = localStorage.getItem('notesflow_storage_mode') || 'auto';
    const savedUrl = localStorage.getItem('notesflow_backend_url') || '';

    const radio = elements.connectionModal.querySelector(`input[name="storageMode"][value="${mode}"]`);
    if (radio) radio.checked = true;

    if (elements.backendUrlInput) {
        elements.backendUrlInput.value = savedUrl;
    }
    if (elements.connectionTestResult) {
        elements.connectionTestResult.textContent = 'Leave blank to use current origin (/api)';
        elements.connectionTestResult.style.color = 'var(--text-muted)';
    }

    elements.connectionModal.style.display = 'flex';
}

function closeConnectionModal() {
    if (!elements.connectionModal) return;
    elements.connectionModal.style.display = 'none';
}

async function testBackendConnection() {
    const url = elements.backendUrlInput ? elements.backendUrlInput.value.trim().replace(/\/$/, '') : '';
    elements.connectionTestResult.textContent = 'Pinging backend...';
    elements.connectionTestResult.style.color = 'var(--accent-primary)';

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`${url}/api/notes?sort=updated`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
            elements.connectionTestResult.textContent = '✓ Backend reachable and responding healthy!';
            elements.connectionTestResult.style.color = 'var(--accent-success)';
        } else {
            elements.connectionTestResult.textContent = `⚠ Server responded with HTTP ${res.status}`;
            elements.connectionTestResult.style.color = 'var(--accent-coral)';
        }
    } catch (err) {
        elements.connectionTestResult.textContent = '✕ Cannot connect. Check URL or verify backend server is running.';
        elements.connectionTestResult.style.color = 'var(--accent-coral)';
    }
}

async function saveConnectionSettings() {
    const selectedMode = elements.connectionModal.querySelector('input[name="storageMode"]:checked').value;
    const url = elements.backendUrlInput ? elements.backendUrlInput.value.trim().replace(/\/$/, '') : '';

    state.storageMode = selectedMode;
    state.backendUrl = url;

    localStorage.setItem('notesflow_storage_mode', selectedMode);
    localStorage.setItem('notesflow_backend_url', url);

    await initStorageEngine();
    await fetchNotes();
    await fetchTags();
    await fetchStats();

    closeConnectionModal();
    showToast('Storage & backend configuration saved', 'success');
}

function exportBackupJson() {
    const notes = LocalStorageEngine.getRawNotes();
    const data = {
        app: 'NotesFlow',
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        notesCount: notes.length,
        notes: notes
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notesflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Backup JSON exported', 'success');
}

function handleImportBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (!data.notes || !Array.isArray(data.notes)) {
                throw new Error('Invalid NotesFlow backup format: missing notes array');
            }
            LocalStorageEngine.saveRawNotes(data.notes);
            showToast(`Imported ${data.notes.length} notes successfully`, 'success');
            fetchNotes();
            fetchTags();
            fetchStats();
        } catch (err) {
            showToast('Failed to import: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
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

// Global Window Bindings
window.promptDeleteNote = promptDeleteNote;
window.deleteNote = promptDeleteNote;
window.closeDeleteModal = closeDeleteModal;
window.executeDeleteNote = executeDeleteNote;
window.exportNote = (noteId, format) => {
    const note = state.notes.find(n => n.id === noteId);
    if (note) DataService.exportNote(note, format);
};
window.openUnlockModal = openUnlockModal;
window.closeUnlockModal = closeUnlockModal;
window.openCreateModal = openCreateModal;
window.closeCreateModal = closeCreateModal;
window.openFullscreenWorkspace = openFullscreenWorkspace;
window.closeFullscreenWorkspace = closeFullscreenWorkspace;
window.saveFullscreenNote = saveFullscreenNote;
window.copyFullscreenContent = copyFullscreenContent;
window.deleteFromFullscreen = deleteFromFullscreen;
window.openConnectionModal = openConnectionModal;
window.closeConnectionModal = closeConnectionModal;
window.testBackendConnection = testBackendConnection;
window.saveConnectionSettings = saveConnectionSettings;
window.exportBackupJson = exportBackupJson;
