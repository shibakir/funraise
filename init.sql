-- Initial database setup for FunRaise application
-- This file will be automatically executed when MySQL container starts

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS funraise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE funraise;

-- Grant permissions to the user
GRANT ALL PRIVILEGES ON funraise.* TO 'funraise_user'@'%';
FLUSH PRIVILEGES;

-- Basic health check table
CREATE TABLE IF NOT EXISTS health_check (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status VARCHAR(10) NOT NULL DEFAULT 'OK',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO health_check (status) VALUES ('OK'); 