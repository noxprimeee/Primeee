const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

let projects = {};

app.get('/', (req, res) => {
    res.json({
        service: 'Primeee Host API',
        version: '1.0.0',
        status: 'online',
        endpoints: ['POST /api/deploy', 'GET /api/status/:id', 'GET /api/projects']
    });
});

app.post('/api/deploy', (req, res) => {
    const { name, language, code } = req.body;
    
    if (!code || !language) {
        return res.status(400).json({ error: 'Code et langage requis' });
    }
    
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    projects[projectId] = {
        id: projectId,
        name: name || `Projet_${Date.now()}`,
        language,
        status: 'deploying',
        createdAt: new Date().toISOString(),
        url: `https://${projectId}.primeee-host.app`,
        stats: { cpu: '0%', ram: '0MB', uptime: '0s' }
    };
    
    console.log(`Nouveau projet: ${projectId} (${language})`);
    
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
});

app.get('/api/status/:id', (req, res) => {
    const project = projects[req.params.id];
    if (!project) return res.status(404).json({ error: 'Projet non trouvé' });
    res.json(project);
});

app.get('/api/projects', (req, res) => {
    res.json({
        count: Object.keys(projects).length,
        projects: Object.values(projects)
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 API Primeee Host démarrée sur le port ${PORT}`);
});
