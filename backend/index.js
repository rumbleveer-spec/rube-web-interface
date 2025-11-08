const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Rube Web Interface Backend is running!' });
});

// Execute Rube command
app.post('/api/execute', async (req, res) => {
    try {
        const { command } = req.body;

        if (!command) {
            return res.status(400).json({ 
                success: false, 
                error: 'Command is required' 
            });
        }

        console.log('🚀 Executing command:', command);

        // Call Rube API
        const response = await axios.post(
            'https://rube.app/api/mcp/execute',
            {
                command: command,
                session_id: process.env.RUBE_SESSION_ID || 'web-interface'
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.RUBE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 seconds
            }
        );

        console.log('✅ Command executed successfully');

        res.json({
            success: true,
            data: response.data,
            message: 'Command executed successfully'
        });

    } catch (error) {
        console.error('❌ Error executing command:', error.message);

        res.status(500).json({
            success: false,
            error: error.response?.data?.message || error.message,
            details: error.response?.data || 'Unknown error occurred'
        });
    }
});

// Get command history (optional feature)
app.get('/api/history', (req, res) => {
    // TODO: Implement command history storage
    res.json({ 
        success: true, 
        history: [] 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Rube Web Backend running on http://localhost:${PORT}`);
    console.log(`📡 API endpoint: http://localhost:${PORT}/api/execute`);
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});
