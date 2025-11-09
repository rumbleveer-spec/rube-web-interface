// Configuration
const API_BASE_URL = window.location.origin;
let SESSION_ID = localStorage.getItem('rube_session_id') || generateSessionId();

// Generate unique session ID
function generateSessionId() {
    const id = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('rube_session_id', id);
    return id;
}

// DOM Elements
const commandInput = document.getElementById('commandInput');
const executeBtn = document.getElementById('executeBtn');
const resultsSection = document.getElementById('resultsSection');
const resultCard = document.getElementById('resultCard');
const loading = document.getElementById('loading');
const resultContent = document.getElementById('resultContent');
const status = document.getElementById('status');
const quickCommandChips = document.querySelectorAll('.chip');

// History panel (we'll add this to HTML)
let historyPanel = null;

// Quick command chips click handler
quickCommandChips.forEach(chip => {
    chip.addEventListener('click', () => {
        commandInput.value = chip.dataset.command;
        commandInput.focus();
    });
});

// Execute button click handler
executeBtn.addEventListener('click', async () => {
    const command = commandInput.value.trim();

    if (!command) {
        alert('Please enter a command!');
        return;
    }

    await executeCommand(command);
});

// Enter key handler (Ctrl/Cmd + Enter to execute)
commandInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        executeBtn.click();
    }
});

// Execute command function
async function executeCommand(command) {
    try {
        // Show loading state
        executeBtn.disabled = true;
        executeBtn.innerHTML = '<span class="spinner"></span> Executing...';
        resultsSection.style.display = 'block';
        loading.style.display = 'flex';
        resultContent.style.display = 'none';
        updateStatus('executing', 'Executing...');

        // Smooth scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });

        console.log('🚀 Sending command:', command);

        // Call backend API with session ID
        const response = await fetch(`${API_BASE_URL}/api/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                command,
                session_id: SESSION_ID
            })
        });

        const data = await response.json();

        console.log('📊 Response:', data);

        // Hide loading, show results
        loading.style.display = 'none';
        resultContent.style.display = 'block';

        if (data.success) {
            const executionTime = data.execution_time || 0;
            resultContent.textContent = JSON.stringify(data.data, null, 2);
            resultContent.style.color = '';
            updateStatus('success', `Success! (${executionTime}ms)`);

            // Refresh history
            loadHistory();

            // Auto-hide success status after 3 seconds
            setTimeout(() => updateStatus('ready', 'Ready'), 3000);
        } else {
            resultContent.textContent = `Error: ${data.error}\n\nDetails: ${JSON.stringify(data.details, null, 2)}`;
            resultContent.style.color = 'var(--danger)';
            updateStatus('error', 'Error!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
        loading.style.display = 'none';
        resultContent.style.display = 'block';
        resultContent.textContent = `Network Error: ${error.message}\n\nPlease make sure the backend server is running.`;
        resultContent.style.color = 'var(--danger)';
        updateStatus('error', 'Connection Failed!');
    } finally {
        // Reset button
        executeBtn.disabled = false;
        executeBtn.innerHTML = '<span class="btn-icon">⚡</span> Execute Command';
    }
}

// Load command history
async function loadHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/history?session_id=${SESSION_ID}`);
        const data = await response.json();

        if (data.success && data.history.length > 0) {
            displayHistory(data.history);
        }
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// Display history
function displayHistory(history) {
    // Create history panel if doesn't exist
    if (!historyPanel) {
        historyPanel = document.createElement('div');
        historyPanel.className = 'history-panel';
        historyPanel.innerHTML = `
            <h3>📜 Command History</h3>
            <div class="history-list" id="historyList"></div>
            <button class="btn-secondary" onclick="clearHistory()">Clear History</button>
        `;
        document.querySelector('.main-content').appendChild(historyPanel);
    }

    const historyList = document.getElementById('historyList');
    historyList.innerHTML = history.slice(0, 10).map((item, index) => `
        <div class="history-item ${item.success ? 'success' : 'failed'}" onclick="loadCommand('${item.command.replace(/'/g, "\\'")}')">
            <div class="history-command">${item.command}</div>
            <div class="history-time">${new Date(item.executed_at).toLocaleString()}</div>
            <div class="history-status">${item.success ? '✅' : '❌'} ${item.execution_time}ms</div>
        </div>
    `).join('');
}

// Load command from history
function loadCommand(command) {
    commandInput.value = command;
    commandInput.focus();
}

// Clear history
async function clearHistory() {
    if (!confirm('Are you sure you want to clear all history?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/history?session_id=${SESSION_ID}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (data.success) {
            if (historyPanel) {
                historyPanel.remove();
                historyPanel = null;
            }
            alert('History cleared!');
        }
    } catch (error) {
        console.error('Error clearing history:', error);
        alert('Failed to clear history');
    }
}

// Load analytics
async function loadAnalytics() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/analytics?session_id=${SESSION_ID}`);
        const data = await response.json();

        if (data.success) {
            console.log('📊 Analytics:', data.analytics);
            // You can display this in UI
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Update status indicator
function updateStatus(type, text) {
    const statusDot = status.querySelector('.status-dot');
    const statusText = status.querySelector('span:last-child');

    statusText.textContent = text;

    switch(type) {
        case 'ready':
            statusDot.style.background = 'var(--success)';
            break;
        case 'executing':
            statusDot.style.background = 'var(--primary)';
            break;
        case 'success':
            statusDot.style.background = 'var(--success)';
            break;
        case 'error':
            statusDot.style.background = 'var(--danger)';
            break;
    }
}

// Check backend health on load
async function checkHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        const data = await response.json();

        if (data.status === 'OK') {
            console.log('✅ Backend is healthy');
            updateStatus('ready', 'Ready');

            // Load history
            loadHistory();
            loadAnalytics();
        }
    } catch (error) {
        console.error('❌ Backend health check failed:', error);
        updateStatus('error', 'Backend Offline');
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Rube Web Interface loaded');
    console.log('🔑 Session ID:', SESSION_ID);
    checkHealth();
});
