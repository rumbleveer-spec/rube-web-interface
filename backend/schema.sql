-- SQLite Database Schema for Rube Web Interface

-- Users table (sessions)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Commands history
CREATE TABLE IF NOT EXISTS commands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    command TEXT NOT NULL,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    execution_time INTEGER, -- in milliseconds
    success BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Results storage
CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    command_id INTEGER,
    result_data TEXT, -- JSON string
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (command_id) REFERENCES commands(id)
);

-- User preferences
CREATE TABLE IF NOT EXISTS preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    theme TEXT DEFAULT 'default',
    auto_save BOOLEAN DEFAULT 1,
    settings TEXT, -- JSON string for additional settings
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_commands_user ON commands(user_id);
CREATE INDEX IF NOT EXISTS idx_results_command ON results(command_id);
CREATE INDEX IF NOT EXISTS idx_users_session ON users(session_id);
