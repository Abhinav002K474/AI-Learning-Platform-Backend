-- Create the users table (PostgreSQL / Supabase Compatible)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'student' CHECK (
        role IN ('student', 'teacher', 'parent', 'admin')
    ),
    class VARCHAR(50),
    term VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    profile_image TEXT,
    bio TEXT DEFAULT '',
    avatar VARCHAR(50) DEFAULT 'boy1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);