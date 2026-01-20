const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Middleware pour logs
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Route principale
app.get('/', (req, res) => {
    res.json({
        service: '𝚷𝚪𝚰𝚴𝚵𝚵𝚵 HOST API',
        version: '1.0.0',
        status: 'online',
        endpoints: {
            deploy: 'POST /api/deploy',
            status: 'GET /api/status/:id',
            projects: 'GET /api/projects'
        }
    });
});

// Stockage temporaire (à remplacer par DB plus tard)
let projects = {};

// API de déploiement
app.post('/api/deploy', (req, res) => {
    try {
        const { name, language, code, version = 'latest' } = req.body;
        
        if (!code || !language) {
            return res.status(400).json({ error: 'Code et langage requis' });
        }
        
        const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Sauvegarder le projet
        projects[projectId] = {
            id: projectId,
            name: name || `Projet_${Date.now()}`,
            language,
            version,
            status: 'deploying',
            createdAt: new Date().toISOString(),
            url: `${req.protocol}://${req.get('host')}/projects/${projectId}`,
            stats: {
                cpu: '0%',
                ram: '0MB',
                uptime: '0s'
            }
        };
        
        console.log(`Projet créé: ${projectId} (${language})`);
        
        // Simuler le déploiement
        setTimeout(() => {
            projects[projectId].status = 'online';
            projects[projectId].stats = {
                cpu: `${Math.floor(Math.random() * 20 + 5)}%`,
                ram: `${Math.floor(Math.random() * 512 + 256)}MB`,
                uptime: '1m'
            };
        }, 3000);
        
        res.json({
            success: true,
            message: 'Déploiement en cours',
            projectId,
            project: projects[projectId]
        });
        
    } catch (error) {
        console.error('Erreur déploiement:', error);
        res.status(500).json({ error: 'Erreur interne' });
    }
});

// Vérifier statut
app.get('/api/status/:id', (req, res) => {
    const project = projects[req.params.id];
    
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

// Lister tous les projets
app.get('/api/projects', (req, res) => {
    res.json({
        count: Object.keys(projects).length,
        projects: Object.values(projects)
    });
});

// Télécharger le code d'un projet
app.get('/api/project/:id/code', (req, res) => {
    const project = projects[req.params.id];
    
    if (!project) {
        return res.status(404).json({ error: 'Projet non trouvé' });
    }
    
    res.json({
        id: project.id,
        name: project.name,
        language: project.language,
        code: '// Code du projet...'
    });
});

// Supprimer un projet
app.delete('/api/project/:id', (req, res) => {
    if (projects[req.params.id]) {
        delete projects[req.params.id];
        res.json({ success: true, message: 'Projet supprimé' });
    } else {
        res.status(404).json({ error: 'Projet non trouvé' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).json({ error: 'Route non trouvée' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 API Primeee Host démarrée sur le port ${PORT}`);
    console.log(`📡 URL: http://localhost:${PORT}`);
});
