const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// Stockage en mémoire (pour commencer)
const projects = new Map();

// API Routes
app.post('/api/deploy', async (req, res) => {
    const { name, language, code, version = 'latest' } = req.body;
    
    const projectId = `proj_${Date.now()}`;
    const projectDir = path.join(__dirname, 'projects', projectId);
    
    // Créer le projet
    fs.mkdirSync(projectDir, { recursive: true });
    
    // Sauvegarder le code
    const ext = getExtension(language);
    fs.writeFileSync(path.join(projectDir, `main${ext}`), code);
    
    // Créer Dockerfile selon le langage
    const dockerfile = generateDockerfile(language, version);
    fs.writeFileSync(path.join(projectDir, 'Dockerfile'), dockerfile);
    
    projects.set(projectId, {
        id: projectId,
        name,
        language,
        status: 'deploying',
        url: `https://${projectId}.host-cf5g.onrender.com`,
        createdAt: new Date()
    });
    
    res.json({ 
        success: true, 
        projectId, 
        url: projects.get(projectId).url 
    });
});

app.get('/api/status/:id', (req, res) => {
    const project = projects.get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    // Simuler des stats
    project.cpu = `${Math.floor(Math.random() * 30)}%`;
    project.ram = `${Math.floor(Math.random() * 512) + 256}MB`;
    project.uptime = '99.9%';
    
    res.json(project);
});

function getExtension(language) {
    const extensions = {
        'javascript': '.js',
        'python': '.py',
        'node': '.js',
        'java': '.java',
        'go': '.go',
        'rust': '.rs',
        'php': '.php',
        'ruby': '.rb'
    };
    return extensions[language.toLowerCase()] || '.txt';
}

function generateDockerfile(language, version) {
    const templates = {
        'node': `FROM node:${version || '20'}
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "main.js"]`,
        
        'python': `FROM python:${version || '3.11'}
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt 2>/dev/null || true
CMD ["python", "main.py"]`,
        
        'javascript': `FROM node:${version || '20'}
WORKDIR /app
COPY . .
CMD ["node", "main.js"]`,
        
        'java': `FROM openjdk:${version || '17'}
WORKDIR /app
COPY . .
RUN javac main.java
CMD ["java", "main"]`
    };
    
    return templates[language.toLowerCase()] || templates.node;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
