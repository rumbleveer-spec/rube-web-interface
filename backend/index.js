const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const dbPath = path.join(__dirname, 'rube.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Database connection error:', err);
    } else {
        console.log('✅ Connected to SQLite database');
        initDatabase();
    }
});

// Initialize database tables
function initDatabase() {
    const fs = require('fs');
    const schemaPath = path.join(__dirname, 'schema.sql');

    if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema, (err) => {
            if (err) {
                console.error('❌ Error initializing database:', err);
            } else {
                console.log('✅ Database initialized successfully');
            }
        });
    }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

// Helper: Get or create user session
function getOrCreateUser(sessionId, callback) {
    db.get('SELECT * FROM users WHERE session_id = ?', [sessionId], (err, user) => {
        if (err) return callback(err, null);

        if (user) {
            // Update last active
            db.run('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
            return callback(null, user);
        }

        // Create new user
        db.run('INSERT INTO users (session_id) VALUES (?)', [sessionId], function(err) {
            if (err) return callback(err, null);
            callback(null, { id: this.lastID, session_id: sessionId });
        });
    });
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Rube Web Interface Backend is running!',
        database: 'Connected'
    });
});

// Get command history
app.get('/api/history', (req, res) => {
    const sessionId = req.query.session_id || 'default';

    getOrCreateUser(sessionId, (err, user) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }

        const query = `
            SELECT c.id, c.command, c.executed_at, c.execution_time, c.success,
                   r.result_data, r.error_message
            FROM commands c
            LEFT JOIN results r ON c.id = r.command_id
            WHERE c.user_id = ?
            ORDER BY c.executed_at DESC
            LIMIT 50
        `;

        db.all(query, [user.id], (err, rows) => {
            if (err) {
                return res.status(500).json({ success: false, error: err.message });
            }

            const history = rows.map(row => ({
                id: row.id,
                command: row.command,
                executed_at: row.executed_at,
                execution_time: row.execution_time,
                success: row.success === 1,
                result: row.result_data ? JSON.parse(row.result_data) : null,
                error: row.error_message
            }));

            res.json({ success: true, history });
        });
    });
});

// Get analytics
app.get('/api/analytics', (req, res) => {
    const sessionId = req.query.session_id || 'default';

    getOrCreateUser(sessionId, (err, user) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }

        const queries = {
            total: 'SELECT COUNT(*) as count FROM commands WHERE user_id = ?',
            successful: 'SELECT COUNT(*) as count FROM commands WHERE user_id = ? AND success = 1',
            failed: 'SELECT COUNT(*) as count FROM commands WHERE user_id = ? AND success = 0',
            avgTime: 'SELECT AVG(execution_time) as avg FROM commands WHERE user_id = ? AND success = 1'
        };

        const analytics = {};
        let completed = 0;

        Object.keys(queries).forEach(key => {
            db.get(queries[key], [user.id], (err, row) => {
                if (!err) {
                    analytics[key] = key === 'avgTime' ? Math.round(row.avg || 0) : row.count;
                }
                completed++;

                if (completed === Object.keys(queries).length) {
                    res.json({ success: true, analytics });
                }
            });
        });
    });
});

// Execute command
app.post('/api/execute', async (req, res) => {
    const startTime = Date.now();
    const { command, session_id = 'default' } = req.body;

    if (!command) {
        return res.status(400).json({ 
            success: false, 
            error: 'Command is required' 
        });
    }

    console.log('🚀 Executing command:', command);

    try {
        // Get or create user
        getOrCreateUser(session_id, async (err, user) => {
            if (err) {
                return res.status(500).json({ success: false, error: err.message });
            }

            try {
                // Call Rube API (placeholder - you'll need actual API endpoint)
                const response = await axios.post(
                    process.env.RUBE_API_URL || 'https://rube.app/api/mcp/execute',
                    { command, session_id },
                    {
                        headers: {
                            'Authorization': `Bearer ${process.env.RUBE_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 30000
                    }
                );

                const executionTime = Date.now() - startTime;

                // Save command
                db.run(
                    'INSERT INTO commands (user_id, command, execution_time, success) VALUES (?, ?, ?, ?)',
                    [user.id, command, executionTime, 1],
                    function(err) {
                        if (err) {
                            console.error('Error saving command:', err);
                        } else {
                            // Save result
                            db.run(
                                'INSERT INTO results (command_id, result_data) VALUES (?, ?)',
                                [this.lastID, JSON.stringify(response.data)]
                            );
                        }
                    }
                );

                console.log('✅ Command executed successfully');
                res.json({
                    success: true,
                    data: response.data,
                    execution_time: executionTime,
                    message: 'Command executed successfully'
                });

            } catch (apiError) {
                const executionTime = Date.now() - startTime;
                const errorMsg = apiError.response?.data?.message || apiError.message;

                // Save failed command
                db.run(
                    'INSERT INTO commands (user_id, command, execution_time, success) VALUES (?, ?, ?, ?)',
                    [user.id, command, executionTime, 0],
                    function(err) {
                        if (!err) {
                            db.run(
                                'INSERT INTO results (command_id, error_message) VALUES (?, ?)',
                                [this.lastID, errorMsg]
                            );
                        }
                    }
                );

                console.error('❌ Error executing command:', errorMsg);
                res.status(500).json({
                    success: false,
                    error: errorMsg,
                    details: apiError.response?.data || 'Unknown error occurred'
                });
            }
        });

    } catch (error) {
        console.error('❌ Server error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Clear history
app.delete('/api/history', (req, res) => {
    const sessionId = req.query.session_id || 'default';

    getOrCreateUser(sessionId, (err, user) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }

        db.run('DELETE FROM results WHERE command_id IN (SELECT id FROM commands WHERE user_id = ?)', [user.id], (err) => {
            if (err) {
                return res.status(500).json({ success: false, error: err.message });
            }

            db.run('DELETE FROM commands WHERE user_id = ?', [user.id], (err) => {
                if (err) {
                    return res.status(500).json({ success: false, error: err.message });
                }

                res.json({ success: true, message: 'History cleared' });
            });
        });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Rube Web Backend running on http://localhost:${PORT}`);
    console.log(`📡 API endpoint: http://localhost:${PORT}/api/execute`);
    console.log(`💾 Database: ${dbPath}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('✅ Database connection closed');
        }
        process.exit(0);
    });
});
