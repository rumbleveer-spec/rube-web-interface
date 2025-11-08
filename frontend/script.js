// Configuration
const API_BASE_URL = window.location.origin;

// DOM Elements
const commandInput = document.getElementById('commandInput');
const executeBtn = document.getElementById('executeBtn');
const resultsSection = document.getElementById('resultsSection');
const resultCard = document.getElementById('resultCard');
const loading = document.getElementById('loading');
const resultContent = document.getElementById('resultContent');
const status = document.getElementById('status');
const quickCommandChips = document.querySelectorAll('.chip');

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

        // Call backend API
        const response = await fetch(`${API_BASE_URL}/api/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ command })
        });

        const data = await response.json();

        console.log('📊 Response:', data);

        // Hide loading, show results
        loading.style.display = 'none';
        resultContent.style.display = 'block';

        if (data.success) {
            resultContent.textContent = JSON.stringify(data.data, null, 2);
            updateStatus('success', 'Success!');

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
        }
    } catch (error) {
        console.error('❌ Backend health check failed:', error);
        updateStatus('error', 'Backend Offline');
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Rube Web Interface loaded');
    checkHealth();
});
