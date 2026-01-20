const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Log des requêtes
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Stockage en mémoire (simulation)
const projects = new Map();

// ============ ROUTES ============

// Route racine
app.get('/', (req, res) => {
    res.json({
        service: '🚀 Primeee Host API',
        version: '1.0.0',
        status: 'online',
        endpoints: {
            deploy: 'POST /api/deploy',
            status: 'GET /api/status/:id',
            projects: 'GET /api/projects',
            health: 'GET /health'
        }
    });
});

// Déploiement d'un projet
app.post('/api/deploy', (req, res) => {
    try {
        const { name, language, code, version = 'latest' } = req.body;
        
        // Validation
        if (!code || !language) {
            return res.status(400).json({ 
                error: 'Code et langage sont requis' 
            });
        }
        
        // ID unique
        const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Créer le projet
        const project = {
            id: projectId,
            name: name || `Projet_${Date.now()}`,
            language: language.toLowerCase(),
            version,
            status: 'deploying',
            createdAt: new Date().toISOString(),
            url: `https://${projectId}.primeee-host.app`,
            stats: {
                cpu: '0%',
                ram: '0MB',
                uptime: '0s'
            }
        };
        
        // Sauvegarder
        projects.set(projectId, project);
        
        console.log(`📦 Nouveau projet: ${project.name} (${project.language})`);
        
        // Simulation de déploiement
        setTimeout(() => {
            if (projects.has(projectId)) {
                const proj = projects.get(projectId);
                proj.status = 'online';
                proj.stats = {
                    cpu: `${Math.floor(Math.random() * 20 + 5)}%`,
                    ram: `${Math.floor(Math.random() * 512 + 256)}MB`,
                    uptime: '1m'
                };
                console.log(`✅ Projet ${projectId} déployé`);
            }
        }, 3000);
        
        // Réponse
        res.json({
            success: true,
            message: 'Déploiement en cours...',
            projectId,
            project
        });
        
    } catch (error) {
        console.error('❌ Erreur déploiement:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// Statut d'un projet
app.get('/api/status/:id', (req, res) => {
    const project = projects.get(req.params.id);
    
    if (!project) {
        return res.status(404).json({ error: 'Projet non trouvé' });
    }
    
    // Mettre à jour les stats
    if (project.status === 'online') {
        project.stats.cpu = `${Math.floor(Math.random() * 20 + 5)}%`;
        project.stats.ram = `${Math.floor(Math.random() * 512 + 256)}MB`;
    }
    
    res.json(project);
});

// Liste des projets
app.get('/api/projects', (req, res) => {
    const allProjects = Array.from(projects.values());
    res.json({
        count: allProjects.length,
        projects: allProjects
    });
});

// Health check (pour Render)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Supprimer un projet
app.delete('/api/project/:id', (req, res) => {
    if (projects.has(req.params.id)) {
        projects.delete(req.params.id);
        res.json({ success: true, message: 'Projet supprimé' });
    } else {
        res.status(404).json({ error: 'Projet non trouvé' });
    }
});

// Route 404
app.use((req, res) => {
    res.status(404).json({ error: 'Route non trouvée' });
});

// ============ DÉMARRAGE ============
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════╗
    ║  🚀 PRIMEEE HOST API                 ║
    ║  Port: ${PORT}                         ║
    ║  Environnement: ${process.env.NODE_ENV || 'development'} ║
    ║  URL: http://localhost:${PORT}         ║
    ╚══════════════════════════════════════╝
    `);
    
    // Routes disponibles
    console.log('📡 Routes disponibles:');
    console.log('  GET  /           - Info API');
    console.log('  POST /api/deploy - Déployer un projet');
    console.log('  GET  /api/status/:id - Statut projet');
    console.log('  GET  /api/projects - Liste projets');
    console.log('  GET  /health     - Health check');
});
