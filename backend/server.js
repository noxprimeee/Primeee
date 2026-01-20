const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Route test
app.get('/', (req, res) => {
    res.json({ 
        message: '🚀 Primeee Host API',
        status: 'online',
        version: '1.0.0'
    });
});

// API de déploiement simulé
app.post('/api/deploy', (req, res) => {
    const { name, language, code } = req.body;
    
    console.log(`Nouveau déploiement: ${name} (${language})`);
    
    res.json({
        success: true,
        message: 'Déploiement simulé réussi',
        projectId: `proj_${Date.now()}`,
        project: {
            id: `proj_${Date.now()}`,
            name: name || 'Mon Projet',
            language: language || 'node',
            status: 'online',
            url: `https://${name?.toLowerCase().replace(/\s+/g, '-')}.primeee.app`,
            createdAt: new Date().toISOString()
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`✅ API démarrée sur le port ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
});
