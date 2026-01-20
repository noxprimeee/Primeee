-- Utilisateurs
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    coins INT DEFAULT 1000, -- 1GB = 1000 pièces
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_admin BOOLEAN DEFAULT FALSE,
    referral_code VARCHAR(20) UNIQUE,
    referred_by INT,
    total_invites INT DEFAULT 0
);

-- Serveurs des utilisateurs
CREATE TABLE servers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    name VARCHAR(100),
    type ENUM('discord', 'whatsapp', 'telegram', 'website', 'api', 'game'),
    status ENUM('running', 'stopped', 'installing', 'error'),
    allocated_ram INT DEFAULT 1024, -- en MB
    allocated_disk INT DEFAULT 5120, -- en MB
    cpu_limit INT DEFAULT 100,
    node VARCHAR(50) DEFAULT 'node1',
    container_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_start TIMESTAMP,
    total_uptime INT DEFAULT 0 -- en secondes
);

-- Transactions de pièces
CREATE TABLE coin_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    amount INT,
    type ENUM('earn', 'spend', 'bonus', 'referral'),
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Déploiements
CREATE TABLE deployments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    server_id INT,
    language VARCHAR(20),
    status ENUM('pending', 'building', 'running', 'failed'),
    logs TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Références
CREATE TABLE referrals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    referrer_id INT,
    referred_id INT,
    coins_awarded INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
