const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const Docker = require('dockerode');
const app = express();

// Configuration
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'primeee-secret-key';
const DOCKER_SOCKET = process.env.DOCKER_SOCKET || '/var/run/docker.sock';

// Base de données
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://user:pass@localhost/primeee'
});

// Docker
const docker = new Docker({ socketPath: DOCKER_SOCKET });

// Middleware
app.use(cors());
app.use(express.json());

// ============ MIDDLEWARE AUTH ============
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Token requis' });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token invalide' });
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (!req.user.is_admin) {
        return res.status(403).json({ error: 'Admin requis' });
    }
    next();
};

// ============ AUTHENTIFICATION ============
// Inscription
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, referral_code } = req.body;
    
    try {
        // Vérifier si l'utilisateur existe
        const userExists = await pool.query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );
        
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'Utilisateur existant' });
        }
        
        // Hacher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Générer code de parrainage
        const userReferralCode = `PRIME${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        // Créer l'utilisateur avec 1000 pièces (1GB)
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash, coins, referral_code, referred_by)
             VALUES ($1, $2, $3, 1000, $4, 
                (SELECT id FROM users WHERE referral_code = $5 LIMIT 1))
             RETURNING id, username, email, coins, referral_code`,
            [username, email, hashedPassword, userReferralCode, referral_code]
        );
        
        const user = result.rows[0];
        
        // Si parrainé, donner des pièces au parrain
        if (referral_code) {
            await pool.query(
                `UPDATE users SET coins = coins + 100, total_invites = total_invites + 1 
                 WHERE referral_code = $1`,
                [referral_code]
            );
            
            await pool.query(
                'INSERT INTO referrals (referrer_id, referred_id) VALUES ((SELECT id FROM users WHERE referral_code = $1), $2)',
                [referral_code, user.id]
            );
        }
        
        // Générer token JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            message: 'Compte créé avec 1000 pièces (1GB) !',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                coins: user.coins,
                referral_code: user.referral_code
            },
            token
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Connexion
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $1',
            [username]
        );
        
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Identifiants incorrects' });
        }
        
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(400).json({ error: 'Identifiants incorrects' });
        }
        
        // Mettre à jour last_login
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user.id]
        );
        
        // Générer token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                email: user.email,
                is_admin: user.is_admin 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                coins: user.coins,
                is_admin: user.is_admin,
                referral_code: user.referral_code,
                total_invites: user.total_invites
            },
            token
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============ UTILISATEUR ============
// Profil utilisateur
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.*, 
                    (SELECT COUNT(*) FROM servers WHERE user_id = u.id) as server_count,
                    (SELECT SUM(total_uptime) FROM servers WHERE user_id = u.id) as total_uptime
             FROM users u WHERE id = $1`,
            [req.user.id]
        );
        
        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Historique des transactions
app.get('/api/user/transactions', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM coin_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
            [req.user.id]
        );
        
        res.json({ success: true, transactions: result.rows });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============ SERVEURS ============
// Créer un serveur
app.post('/api/servers/create', authenticateToken, async (req, res) => {
    const { name, type, ram, disk, cpu } = req.body;
    
    try {
        // Vérifier les pièces
        const userResult = await pool.query(
            'SELECT coins FROM users WHERE id = $1',
            [req.user.id]
        );
        
        const userCoins = userResult.rows[0].coins;
        const cost = (ram / 1024) * 1000; // 1GB = 1000 pièces
        
        if (userCoins < cost) {
            return res.status(400).json({ 
                error: `Pièces insuffisantes. Coût: ${cost} pièces, Vous avez: ${userCoins} pièces` 
            });
        }
        
        // Déduire les pièces
        await pool.query(
            'UPDATE users SET coins = coins - $1 WHERE id = $2',
            [cost, req.user.id]
        );
        
        // Enregistrer la transaction
        await pool.query(
            'INSERT INTO coin_transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
            [req.user.id, -cost, 'spend', `Création serveur ${name} (${ram}MB RAM)`]
        );
        
        // Créer le serveur en base
        const serverResult = await pool.query(
            `INSERT INTO servers (user_id, name, type, status, allocated_ram, allocated_disk, cpu_limit)
             VALUES ($1, $2, $3, 'installing', $4, $5, $6)
             RETURNING *`,
            [req.user.id, name, type, ram, disk, cpu || 100]
        );
        
        const server = serverResult.rows[0];
        
        // Créer le conteneur Docker
        const container = await docker.createContainer({
            Image: getImageByType(type),
            name: `primeee-${server.id}-${req.user.id}`,
            HostConfig: {
                Memory: ram * 1024 * 1024, // Convertir en bytes
                MemorySwap: ram * 1024 * 1024,
                CpuShares: cpu * 1024 / 100,
                DiskQuota: disk * 1024 * 1024,
                NetworkMode: 'bridge'
            },
            ExposedPorts: {
                '3000/tcp': {}
            },
            Env: [
                `SERVER_ID=${server.id}`,
                `USER_ID=${req.user.id}`
            ]
        });
        
        await container.start();
        
        // Mettre à jour avec l'ID du conteneur
        await pool.query(
            'UPDATE servers SET container_id = $1, status = $2 WHERE id = $3',
            [container.id, 'running', server.id]
        );
        
        res.json({
            success: true,
            message: `Serveur créé avec ${ram}MB RAM (coût: ${cost} pièces)`,
            server: { ...server, container_id: container.id, status: 'running' }
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur création serveur' });
    }
});

function getImageByType(type) {
    const images = {
        'discord': 'node:18-alpine',
        'whatsapp': 'node:18-alpine',
        'telegram': 'python:3.11-alpine',
        'website': 'nginx:alpine',
        'api': 'node:18-alpine',
        'game': 'itzg/minecraft-server:latest'
    };
    return images[type] || 'alpine:latest';
}

// Lister les serveurs
app.get('/api/servers', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM servers WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        
        // Récupérer les stats Docker
        const serversWithStats = await Promise.all(
            result.rows.map(async (server) => {
                if (server.container_id) {
                    try {
                        const container = docker.getContainer(server.container_id);
                        const stats = await container.stats({ stream: false });
                        const inspect = await container.inspect();
                        
                        return {
                            ...server,
                            docker_stats: {
                                memory_usage: stats.memory_stats.usage,
                                memory_limit: stats.memory_stats.limit,
                                cpu_usage: stats.cpu_stats.cpu_usage.total_usage,
                                online: inspect.State.Running
                            }
                        };
                    } catch (e) {
                        return server;
                    }
                }
                return server;
            })
        );
        
        res.json({ success: true, servers: serversWithStats });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Contrôle serveur (start/stop/restart)
app.post('/api/servers/:id/control', authenticateToken, async (req, res) => {
    const { action } = req.body;
    const serverId = req.params.id;
    
    try {
        // Vérifier que le serveur appartient à l'utilisateur
        const serverResult = await pool.query(
            'SELECT * FROM servers WHERE id = $1 AND user_id = $2',
            [serverId, req.user.id]
        );
        
        if (serverResult.rows.length === 0) {
            return res.status(404).json({ error: 'Serveur non trouvé' });
        }
        
        const server = serverResult.rows[0];
        
        if (!server.container_id) {
            return res.status(400).json({ error: 'Conteneur non créé' });
        }
        
        const container = docker.getContainer(server.container_id);
        
        switch (action) {
            case 'start':
                await container.start();
                await pool.query(
                    'UPDATE servers SET status = $1, last_start = NOW() WHERE id = $2',
                    ['running', serverId]
                );
                break;
                
            case 'stop':
                await container.stop();
                await pool.query(
                    'UPDATE servers SET status = $1 WHERE id = $2',
                    ['stopped', serverId]
                );
                break;
                
            case 'restart':
                await container.restart();
                await pool.query(
                    'UPDATE servers SET status = $1 WHERE id = $2',
                    ['running', serverId]
                );
                break;
                
            case 'kill':
                await container.kill();
                await pool.query(
                    'UPDATE servers SET status = $1 WHERE id = $2',
                    ['stopped', serverId]
                );
                break;
                
            default:
                return res.status(400).json({ error: 'Action invalide' });
        }
        
        res.json({ success: true, message: `Serveur ${action} avec succès` });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur contrôle serveur' });
    }
});

// ============ DÉPLOIEMENT ============
// Déployer du code sur un serveur
app.post('/api/servers/:id/deploy', authenticateToken, async (req, res) => {
    const { code, language } = req.body;
    const serverId = req.params.id;
    
    try {
        // Vérifier les permissions
        const serverResult = await pool.query(
            'SELECT * FROM servers WHERE id = $1 AND user_id = $2',
            [serverId, req.user.id]
        );
        
        if (serverResult.rows.length === 0) {
            return res.status(404).json({ error: 'Serveur non trouvé' });
        }
        
        const server = serverResult.rows[0];
        
        // Créer une entrée de déploiement
        const deployResult = await pool.query(
            `INSERT INTO deployments (user_id, server_id, language, status, logs)
             VALUES ($1, $2, $3, 'building', $4)
             RETURNING *`,
            [req.user.id, serverId, language, 'Démarrage du déploiement...']
        );
        
        const deployment = deployResult.rows[0];
        
        // Envoyer le code au conteneur Docker
        if (server.container_id) {
            const container = docker.getContainer(server.container_id);
            
            // Créer un fichier temporaire avec le code
            const exec = await container.exec({
                Cmd: ['sh', '-c', `echo "${code.replace(/"/g, '\\"')}" > /app/main.${getFileExtension(language)}`],
                AttachStdout: true,
                AttachStderr: true
            });
            
            await exec.start({});
            
            // Mettre à jour le statut
            await pool.query(
                `UPDATE deployments SET status = 'running', 
                 logs = logs || '\n✅ Code déployé avec succès' 
                 WHERE id = $1`,
                [deployment.id]
            );
        }
        
        res.json({
            success: true,
            message: 'Déploiement démarré',
            deployment_id: deployment.id
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur déploiement' });
    }
});

function getFileExtension(language) {
    const extensions = {
        'javascript': 'js',
        'node': 'js',
        'python': 'py',
        'java': 'java',
        'go': 'go',
        'rust': 'rs',
        'php': 'php'
    };
    return extensions[language] || 'txt';
}

// ============ ÉCONOMIE DE PIÈCES ============
// Gagner des pièces quotidiennes
app.post('/api/coins/daily', authenticateToken, async (req, res) => {
    try {
        // Vérifier si déjà réclamé aujourd'hui
        const today = new Date().toISOString().split('T')[0];
        const lastClaim = await pool.query(
            `SELECT created_at FROM coin_transactions 
             WHERE user_id = $1 AND type = 'bonus' 
             AND DATE(created_at) = $2 LIMIT 1`,
            [req.user.id, today]
        );
        
        if (lastClaim.rows.length > 0) {
            return res.status(400).json({ error: 'Déjà réclamé aujourd\'hui' });
        }
        
        // Calculer le bonus (10 pièces + 1 par serveur actif)
        const activeServers = await pool.query(
            'SELECT COUNT(*) FROM servers WHERE user_id = $1 AND status = $2',
            [req.user.id, 'running']
        );
        
        const bonus = 10 + (activeServers.rows[0].count * 1);
        
        // Ajouter les pièces
        await pool.query(
            'UPDATE users SET coins = coins + $1 WHERE id = $2',
            [bonus, req.user.id]
        );
        
        // Enregistrer la transaction
        await pool.query(
            `INSERT INTO coin_transactions (user_id, amount, type, description)
             VALUES ($1, $2, 'bonus', 'Bonus quotidien (serveurs actifs: ${activeServers.rows[0].count})')`,
            [req.user.id, bonus]
        );
        
        res.json({
            success: true,
            message: `+${bonus} pièces (Bonus quotidien)`,
            coins: bonus
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur réclamation' });
    }
});

// Parrainer un ami
app.post('/api/referral/use', authenticateToken, async (req, res) => {
    const { referral_code } = req.body;
    
    try {
        // Vérifier que ce n'est pas son propre code
        const userResult = await pool.query(
            'SELECT referral_code FROM users WHERE id = $1',
            [req.user.id]
        );
        
        if (userResult.rows[0].referral_code === referral_code) {
            return res.status(400).json({ error: 'Vous ne pouvez pas utiliser votre propre code' });
        }
        
        // Vérifier si déjà utilisé
        const alreadyUsed = await pool.query(
            'SELECT id FROM referrals WHERE referred_id = $1',
            [req.user.id]
        );
        
        if (alreadyUsed.rows.length > 0) {
            return res.status(400).json({ error: 'Déjà utilisé un code de parrainage' });
        }
        
        // Donner les bonus
        await pool.query(
            `UPDATE users SET coins = coins + 100 WHERE referral_code = $1`,
            [referral_code]
        );
        
        await pool.query(
            `UPDATE users SET coins = coins + 100, referred_by = 
                (SELECT id FROM users WHERE referral_code = $1)
             WHERE id = $2`,
            [referral_code, req.user.id]
        );
        
        // Enregistrer le parrainage
        await pool.query(
            `INSERT INTO referrals (referrer_id, referred_id, coins_awarded)
             VALUES (
                (SELECT id FROM users WHERE referral_code = $1),
                $2, 100
             )`,
            [referral_code, req.user.id]
        );
        
        res.json({
            success: true,
            message: '+100 pièces pour vous et votre parrain !'
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur parrainage' });
    }
});

// ============ ADMIN ============
// Dashboard admin
app.get('/api/admin/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM servers) as total_servers,
                (SELECT SUM(coins) FROM users) as total_coins,
                (SELECT COUNT(*) FROM servers WHERE status = 'running') as running_servers,
                (SELECT SUM(allocated_ram) FROM servers) as total_ram,
                (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURRENT_DATE) as new_users_today
        `);
        
        res.json({ success: true, stats: stats.rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Gérer les utilisateurs
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await pool.query(`
            SELECT u.*, 
                   (SELECT COUNT(*) FROM servers WHERE user_id = u.id) as server_count,
                   (SELECT SUM(allocated_ram) FROM servers WHERE user_id = u.id) as total_ram
            FROM users u
            ORDER BY u.created_at DESC
            LIMIT 100
        `);
        
        res.json({ success: true, users: users.rows });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============ DÉMARRAGE ============
app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════════════╗
    ║  🚀 PRIMEEE HOST - PANEL COMPLET                 ║
    ║  Port: ${PORT}                                   ║
    ║  Base: PostgreSQL + Docker                       ║
    ║  Fonctionnalités:                                ║
    ║    • Authentification JWT                        ║
    ║    • Gestion serveurs Docker                     ║
    ║    • Économie de pièces                          ║
    ║    • Système de parrainage                       ║
    ║    • Panel admin                                 ║
    ╚══════════════════════════════════════════════════╝
    `);
});
