// Menu mobile
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
});

// Ajustement responsive du menu
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        navMenu.style.display = 'flex';
    } else {
        navMenu.style.display = 'none';
    }
});

// Smooth scroll pour les ancres
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Animation des statistiques
function animateStats() {
    const stats = document.querySelectorAll('.stat h3');
    stats.forEach(stat => {
        const target = parseInt(stat.textContent);
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            stat.textContent = Math.round(current) + (stat.textContent.includes('%') ? '%' : '+');
        }, 30);
    });
}

// Lancer l'animation quand la section est visible
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateStats();
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const heroSection = document.querySelector('.hero');
if (heroSection) {
    observer.observe(heroSection);
}

// Effet de parallaxe
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('.terminal-window');
    if (parallax) {
        parallax.style.transform = `translateY(${scrolled * 0.05}px)`;
    }
});

// Simulation de terminal
function updateTerminal() {
    const terminal = document.querySelector('.terminal-body');
    if (terminal) {
        const lines = [
            "$ system status",
            "✅ Bot: <span class='success'>ONLINE</span>",
            "📊 CPU: <span class='info'>" + Math.floor(Math.random() * 20 + 5) + "%</span>",
            "💾 RAM: <span class='info'>" + Math.floor(Math.random() * 500 + 300) + "MB/2GB</span>",
            "🌐 Uptime: <span class='success'>99." + (90 + Math.floor(Math.random() * 10)) + "%</span>",
            "⚡ Latence: <span class='success'>" + Math.floor(Math.random() * 20 + 20) + "ms</span>"
        ];
        
        terminal.innerHTML = lines.map(line => `<p>${line}</p>`).join('');
    }
}

setInterval(updateTerminal, 3000);

// Notification cookie
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('cookieAccepted')) {
        const cookieBanner = document.createElement('div');
        cookieBanner.className = 'cookie-banner';
        cookieBanner.innerHTML = `
            <p>🍪 Ce site utilise des cookies pour améliorer votre expérience.</p>
            <button class="btn-cookie">Accepter</button>
        `;
        document.body.appendChild(cookieBanner);
        
        document.querySelector('.btn-cookie').addEventListener('click', () => {
            localStorage.setItem('cookieAccepted', 'true');
            cookieBanner.style.display = 'none';
        });
    }
});
// ============ SYSTÈME DE DÉPLOIEMENT ============
class PrimeeeDeploy {
    constructor() {
        this.apiUrl = 'https://host-cf5g.onrender.com/api'; // À changer pour ton backend
        this.projects = JSON.parse(localStorage.getItem('primeee_projects')) || [];
        this.init();
    }
    
    init() {
        // Déploiement
        const deployBtn = document.getElementById('deployBtn');
        if (deployBtn) {
            deployBtn.addEventListener('click', () => this.deploy());
        }
        
        // Charger les projets
        this.loadProjects();
        
        // Vérifier le statut de l'API
        this.checkAPIStatus();
    }
    
    async deploy() {
        const name = document.getElementById('projectName').value || `Projet_${Date.now()}`;
        const language = document.getElementById('projectLanguage').value;
        const code = document.getElementById('projectCode').value;
        
        if (!code.trim()) {
            this.showStatus('⚠️ Veuillez entrer du code', 'warning');
            return;
        }
        
        this.showStatus('🚀 Déploiement en cours...', 'deploying');
        
        try {
            const response = await fetch(`${this.apiUrl}/deploy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, language, code })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showStatus(`✅ ${data.message}`, 'success');
                
                // Ajouter le projet à la liste
                const project = {
                    id: data.projectId,
                    name,
                    language,
                    url: data.project.url,
                    status: data.project.status,
                    date: new Date().toLocaleString()
                };
                
                this.projects.unshift(project);
                this.saveProjects();
                this.addProjectToUI(project);
                
                // Effacer le formulaire
                document.getElementById('projectName').value = '';
                document.getElementById('projectCode').value = '';
            } else {
                this.showStatus(`❌ ${data.error || 'Erreur de déploiement'}`, 'error');
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.showStatus('❌ Impossible de se connecter à l\'API', 'error');
        }
    }
    
    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('deployStatus');
        if (!statusEl) return;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            deploying: '🚀',
            info: 'ℹ️'
        };
        
        const colors = {
            success: '#4ade80',
            error: '#f87171',
            warning: '#fbbf24',
            deploying: '#60a5fa',
            info: '#94a3b8'
        };
        
        statusEl.innerHTML = `
            <p style="color: ${colors[type]}; margin: 0;">
                <strong>${icons[type]} ${message}</strong>
            </p>
            ${type === 'deploying' ? '<div class="progress-bar" style="margin-top: 10px; height: 3px; background: linear-gradient(90deg, #6c63ff, #ff6584); width: 100%; animation: progress 2s infinite;"></div>' : ''}
        `;
    }
    
    addProjectToUI(project) {
        const container = document.getElementById('projectsContainer');
        if (!container) return;
        
        const item = document.createElement('div');
        item.className = 'project-item';
        item.innerHTML = `
            <div class="project-info">
                <h5>${project.name}</h5>
                <p>${project.language.toUpperCase()} • ${project.date}</p>
            </div>
            <span class="project-status status-${project.status}">
                ${project.status === 'online' ? '🟢 En ligne' : '🟡 En cours'}
            </span>
        `;
        
        container.prepend(item);
    }
    
    loadProjects() {
        const container = document.getElementById('projectsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.projects.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">Aucun projet déployé</p>';
            return;
        }
        
        this.projects.forEach(project => this.addProjectToUI(project));
    }
    
    saveProjects() {
        localStorage.setItem('primeee_projects', JSON.stringify(this.projects.slice(0, 10)));
    }
    
    async checkAPIStatus() {
        try {
            const response = await fetch(`${this.apiUrl}/`);
            const data = await response.json();
            
            const statusEl = document.getElementById('globalStatus');
            if (statusEl) {
                statusEl.innerHTML = `
                    <span class="status-dot online"></span>
                    <span>API: <strong>En ligne</strong> (${data.version})</span>
                `;
            }
        } catch (error) {
            const statusEl = document.getElementById('globalStatus');
            if (statusEl) {
                statusEl.innerHTML = `
                    <span class="status-dot" style="background: #f87171;"></span>
                    <span>API: <strong>Hors ligne</strong></span>
                `;
            }
        }
    }
}

// Fonctions utilitaires
function formatCode() {
    const textarea = document.getElementById('projectCode');
    const code = textarea.value;
    textarea.value = code.replace(/\t/g, '  ').replace(/\n{3,}/g, '\n\n');
}

function clearCode() {
    if (confirm('Effacer tout le code ?')) {
        document.getElementById('projectCode').value = '';
    }
}

function loadExample() {
    const examples = {
        node: `// Bot Discord simple
const Discord = require('discord.js');
const client = new Discord.Client({ intents: ['Guilds', 'GuildMessages'] });

client.on('ready', () => {
    console.log(\`✅ Connecté en tant que \${client.user.tag}\`);
});

client.on('messageCreate', (message) => {
    if (message.content === '!ping') {
        message.reply('Pong ! 🏓');
    }
});

client.login('TON_TOKEN_DISCORD');`,
        
        python: `# API Flask simple
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({
        "status": "online",
        "service": "Primeee Host",
        "message": "Hello World!"
    })

@app.route('/api/health')
def health():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)`,
        
        javascript: `// Serveur HTTP Node.js
const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    res.setHeader('Content-Type', 'application/json');
    
    if (parsedUrl.pathname === '/') {
        res.end(JSON.stringify({
            service: 'Primeee Host',
            status: 'online',
            timestamp: new Date().toISOString()
        }));
    } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

server.listen(3000, () => {
    console.log('🚀 Serveur démarré sur le port 3000');
});`
    };
    
    const lang = document.getElementById('projectLanguage').value;
    document.getElementById('projectCode').value = examples[lang] || examples.node;
    document.getElementById('projectName').value = lang === 'node' ? 'MonBotDiscord' : 
                                                lang === 'python' ? 'MonAPIPython' : 
                                                'MonProjetJS';
}

// Initialiser le système de déploiement
document.addEventListener('DOMContentLoaded', () => {
    // Initialiser le déploiement
    window.deploySystem = new PrimeeeDeploy();
    
    // Ajouter animation CSS pour la barre de progression
    if (!document.querySelector('#progress-animation')) {
        const style = document.createElement('style');
        style.id = 'progress-animation';
        style.textContent = `
            @keyframes progress {
                0% { width: 0%; }
                50% { width: 100%; }
                100% { width: 0%; }
            }
        `;
        document.head.appendChild(style);
    }
});
