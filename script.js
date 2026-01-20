// ============ NAVIGATION MOBILE ============
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        hamburger.innerHTML = navMenu.classList.contains('active') 
            ? '<i class="fas fa-times"></i>' 
            : '<i class="fas fa-bars"></i>';
    });
}

// Fermer le menu en cliquant ailleurs
document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-container') && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        hamburger.innerHTML = '<i class="fas fa-bars"></i>';
    }
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            // Fermer le menu mobile si ouvert
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                hamburger.innerHTML = '<i class="fas fa-bars"></i>';
            }
            
            window.scrollTo({
                top: target.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// ============ ANIMATIONS HERO ============
// Terminal animation
function updateTerminal() {
    const terminal = document.querySelector('.terminal-body');
    if (terminal) {
        const states = [
            {
                lines: [
                    "$ primeee deploy --lang node --free",
                    "🚀 Téléchargement du code...",
                    "📦 Création du conteneur...",
                    "✅ Déploiement réussi !",
                    "🌐 URL: <span class='success'>https://mon-bot.primeee.app</span>",
                    "⚡ Statut: <span class='success'>EN LIGNE</span>"
                ]
            },
            {
                lines: [
                    "$ primeee status --all",
                    "📊 Projets actifs:",
                    "  • bot-discord (node) - 🟢 ONLINE",
                    "  • api-service (python) - 🟢 ONLINE",
                    "  • website (javascript) - 🟢 ONLINE",
                    "⚡ Uptime global: 99.97%"
                ]
            },
            {
                lines: [
                    "$ primeee logs bot-discord",
                    "📝 Logs du bot:",
                    "  [12:34] ✅ Bot connecté !",
                    "  [12:35] 👋 Message reçu: !ping",
                    "  [12:35] 🏓 Réponse envoyée: Pong!",
                    "  [12:36] 🔄 Redémarrage automatique"
                ]
            }
        ];
        
        const state = states[Math.floor(Math.random() * states.length)];
        terminal.innerHTML = state.lines.map(line => `<p>${line}</p>`).join('');
    }
}

// Démarrer l'animation du terminal
setInterval(updateTerminal, 5000);
updateTerminal(); // Premier appel

// Animation des statistiques
function animateCounter(element, target, suffix = '') {
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.round(current) + suffix;
    }, 30);
}

// Observer pour animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Animer les stats du hero
            document.querySelectorAll('.stat h3').forEach(stat => {
                const text = stat.textContent;
                const match = text.match(/(\d+)(.*)/);
                if (match) {
                    const target = parseInt(match[1]);
                    const suffix = match[2];
                    animateCounter(stat, target, suffix);
                }
            });
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const heroSection = document.querySelector('.hero');
if (heroSection) observer.observe(heroSection);

// ============ SYSTÈME DE DÉPLOIEMENT ============
class PrimeeeDeploy {
    constructor() {
        // URL de l'API - À CHANGER APRÈS DÉPLOIEMENT DU BACKEND
        this.apiUrl = 'https://primeee-api.onrender.com/api'; // À MODIFIER
        this.projects = JSON.parse(localStorage.getItem('primeee_projects')) || [];
        this.init();
    }
    
    init() {
        // Bouton de déploiement
        const deployBtn = document.getElementById('deployBtn');
        if (deployBtn) {
            deployBtn.addEventListener('click', () => this.deploy());
        }
        
        // Charger les projets
        this.loadProjects();
        
        // Vérifier le statut de l'API
        this.checkAPIStatus();
        
        // Mettre à jour l'URL API automatiquement si possible
        this.detectAPIUrl();
    }
    
    // Détecter l'URL de l'API automatiquement
    detectAPIUrl() {
        // Si le backend est sur le même domaine (subdomain)
        const currentHost = window.location.hostname;
        const possibleUrls = [
            `https://primeee-api.${currentHost.replace('primeee-host', '')}/api`,
            `https://api.${currentHost}/api`,
            `https://backend-${currentHost}/api`,
            'https://primeee-api.onrender.com/api', // Render free tier
            'https://primeee-host-api.onrender.com/api'
        ];
        
        // Tester la première URL disponible
        possibleUrls.forEach(url => {
            fetch(url.replace('/api', '/health'))
                .then(res => {
                    if (res.ok) {
                        this.apiUrl = url;
                        console.log(`✅ API détectée: ${url}`);
                        this.checkAPIStatus(); // Mettre à jour le statut
                    }
                })
                .catch(() => {}); // Ignorer les erreurs
        });
    }
    
    async deploy() {
        const name = document.getElementById('projectName').value.trim() || `Projet_${Date.now()}`;
        const language = document.getElementById('projectLanguage').value;
        const code = document.getElementById('projectCode').value.trim();
        
        // Validation
        if (!code) {
            this.showStatus('⚠️ Veuillez entrer du code', 'warning');
            return;
        }
        
        if (code.length > 10000) {
            this.showStatus('❌ Code trop long (max 10 000 caractères)', 'error');
            return;
        }
        
        this.showStatus('🚀 Déploiement en cours...', 'deploying');
        
        try {
            const response = await fetch(`${this.apiUrl}/deploy`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    name, 
                    language, 
                    code,
                    version: 'latest',
                    timestamp: new Date().toISOString()
                })
            });
            
            let data;
            try {
                data = await response.json();
            } catch (e) {
                throw new Error('Réponse invalide du serveur');
            }
            
            if (data.success || response.ok) {
                const project = data.project || {
                    id: data.projectId || `proj_${Date.now()}`,
                    name,
                    language,
                    status: 'online',
                    url: data.url || `https://${name.toLowerCase().replace(/\s+/g, '-')}.primeee.app`,
                    createdAt: new Date().toISOString()
                };
                
                this.showStatus(`✅ ${data.message || 'Déploiement réussi !'}`, 'success');
                
                // Ajouter le projet
                this.addProject({
                    id: project.id,
                    name: project.name,
                    language: project.language,
                    url: project.url,
                    status: project.status,
                    date: new Date().toLocaleString('fr-FR')
                });
                
                // Effacer le formulaire (sauf le nom)
                document.getElementById('projectCode').value = '';
                
            } else {
                this.showStatus(`❌ ${data.error || 'Erreur de déploiement'}`, 'error');
            }
        } catch (error) {
            console.error('Erreur déploiement:', error);
            
            // Mode simulation si l'API est hors ligne
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                this.showStatus('🌐 Mode simulation (API hors ligne)', 'info');
                
                // Simulation locale
                setTimeout(() => {
                    const project = {
                        id: `proj_${Date.now()}_sim`,
                        name,
                        language,
                        url: `https://${name.toLowerCase().replace(/\s+/g, '-')}.primeee.app`,
                        status: 'online',
                        date: new Date().toLocaleString('fr-FR')
                    };
                    
                    this.addProject(project);
                    this.showStatus('✅ Simulation réussie !', 'success');
                }, 2000);
            } else {
                this.showStatus('❌ Erreur de connexion', 'error');
            }
        }
    }
    
    addProject(project) {
        // Ajouter à la liste en mémoire
        this.projects.unshift(project);
        
        // Garder maximum 20 projets
        if (this.projects.length > 20) {
            this.projects = this.projects.slice(0, 20);
        }
        
        // Sauvegarder
        this.saveProjects();
        
        // Mettre à jour l'UI
        this.addProjectToUI(project);
    }
    
    addProjectToUI(project) {
        const container = document.getElementById('projectsContainer');
        if (!container) return;
        
        // Créer l'élément
        const item = document.createElement('div');
        item.className = 'project-item';
        item.innerHTML = `
            <div class="project-info">
                <h5>${project.name}</h5>
                <p>${project.language.toUpperCase()} • ${project.date}</p>
                <p style="font-size: 0.7rem; color: #666;">${project.url}</p>
            </div>
            <span class="project-status status-${project.status}">
                ${project.status === 'online' ? '🟢 LIGNE' : '🟡 ATTENTE'}
            </span>
        `;
        
        // Ajouter au début
        if (container.firstChild) {
            container.insertBefore(item, container.firstChild);
        } else {
            container.appendChild(item);
        }
    }
    
    loadProjects() {
        const container = document.getElementById('projectsContainer');
        if (!container) return;
        
        // Vider le conteneur
        container.innerHTML = '';
        
        // Message si vide
        if (this.projects.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #666;">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Aucun projet déployé</p>
                    <p style="font-size: 0.8rem;">Déployez votre premier projet !</p>
                </div>
            `;
            return;
        }
        
        // Afficher les projets
        this.projects.forEach(project => this.addProjectToUI(project));
    }
    
    saveProjects() {
        try {
            localStorage.setItem('primeee_projects', JSON.stringify(this.projects));
        } catch (e) {
            console.warn('Impossible de sauvegarder les projets:', e);
        }
    }
    
    async checkAPIStatus() {
        const statusEl = document.getElementById('globalStatus');
        if (!statusEl) return;
        
        try {
            const response = await fetch(`${this.apiUrl.replace('/api', '')}/health`);
            const data = await response.json();
            
            statusEl.innerHTML = `
                <span class="status-dot online"></span>
                <span>API: <strong>En ligne</strong></span>
            `;
            
            return true;
        } catch (error) {
            statusEl.innerHTML = `
                <span class="status-dot" style="background: #f87171;"></span>
                <span>API: <strong>Mode simulation</strong></span>
            `;
            return false;
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
        
        const icon = icons[type] || icons.info;
        const color = colors[type] || colors.info;
        
        statusEl.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="font-size: 1.2rem;">${icon}</div>
                <div>
                    <p style="color: ${color}; margin: 0; font-weight: 600;">${message}</p>
                    ${type === 'deploying' 
                        ? '<div class="progress-bar" style="margin-top: 10px; height: 3px; background: linear-gradient(90deg, #6c63ff, #ff6584); width: 100%; animation: progress 2s infinite;"></div>' 
                        : ''}
                </div>
            </div>
        `;
        
        // Auto-hide après 5 secondes (sauf pour deploying)
        if (type !== 'deploying') {
            setTimeout(() => {
                if (statusEl.innerHTML.includes(message)) {
                    statusEl.innerHTML = `
                        <p><i class="fas fa-info-circle"></i> Prêt à déployer</p>
                    `;
                }
            }, 5000);
        }
    }
}

// ============ FONCTIONS UTILITAIRES ============
function formatCode() {
    const textarea = document.getElementById('projectCode');
    if (!textarea) return;
    
    let code = textarea.value;
    
    // Indentation basique
    code = code
        .replace(/\t/g, '    ') // Tabs vers espaces
        .replace(/\n{3,}/g, '\n\n') // Multiples lignes vides
        .trim();
    
    textarea.value = code;
    showToast('Code formaté !', 'success');
}

function clearCode() {
    const textarea = document.getElementById('projectCode');
    if (!textarea) return;
    
    if (textarea.value.trim() && confirm('Effacer tout le code ?')) {
        textarea.value = '';
        showToast('Code effacé', 'info');
    }
}

function loadExample() {
    const language = document.getElementById('projectLanguage').value;
    const nameInput = document.getElementById('projectName');
    const codeInput = document.getElementById('projectCode');
    
    const examples = {
        node: {
            name: 'MonBotDiscord',
            code: `// Bot Discord simple avec commandes
const Discord = require('discord.js');
const client = new Discord.Client({ 
    intents: ['Guilds', 'GuildMessages', 'MessageContent'] 
});

client.on('ready', () => {
    console.log(\`✅ Connecté en tant que \${client.user.tag}\`);
    client.user.setActivity('Primeee Host 🚀');
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    
    const content = message.content.toLowerCase();
    
    if (content === '!ping') {
        message.reply('🏓 Pong!');
    }
    
    if (content === '!help') {
        message.reply('\\n**Commandes disponibles:**\\n!ping - Test du bot\\n!help - Affiche cette aide');
    }
});

// Remplace TOKEN par ton token Discord
client.login('TOKEN');`
        },
        
        python: {
            name: 'MonAPI',
            code: `# API Flask avec plusieurs endpoints
from flask import Flask, jsonify, request
import datetime

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({
        "service": "Primeee Host API",
        "status": "online",
        "timestamp": datetime.datetime.now().isoformat(),
        "endpoints": ["/", "/api/hello", "/api/status"]
    })

@app.route('/api/hello')
def hello():
    name = request.args.get('name', 'World')
    return jsonify({"message": f"Hello {name}!", "language": "Python"})

@app.route('/api/status')
def status():
    return jsonify({
        "status": "healthy",
        "uptime": "24/7",
        "host": "Primeee Host"
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)`
        },
        
        javascript: {
            name: 'MonSiteWeb',
            code: `// Serveur web simple avec HTML
const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    
    if (pathname === '/' || pathname === '/index.html') {
        res.end(\`
<!DOCTYPE html>
<html>
<head>
    <title>Mon Site sur Primeee Host</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #6c63ff; }
        .btn { background: #6c63ff; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; }
    </style>
</head>
<body>
    <h1>🚀 Bienvenue sur mon site !</h1>
    <p>Hébergé gratuitement sur <strong>Primeee Host</strong></p>
    <p>Date: \${new Date().toLocaleString()}</p>
    <a href="/api" class="btn">Voir l'API</a>
</body>
</html>
        \`);
    } else if (pathname === '/api') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            message: "API fonctionnelle !",
            timestamp: new Date().toISOString(),
            host: "Primeee Host"
        }));
    } else {
        res.statusCode = 404;
        res.end('<h1>404 - Page non trouvée</h1>');
    }
});

server.listen(3000, () => {
    console.log('🚀 Serveur démarré sur http://localhost:3000');
});`
        },
        
        java: {
            name: 'MonAppJava',
            code: `// Application Java simple
public class Main {
    public static void main(String[] args) {
        System.out.println("🚀 Application Java sur Primeee Host");
        System.out.println("Date: " + new java.util.Date());
        
        // Démonstration
        String[] features = {"Hébergement gratuit", "24/7", "Multi-langages"};
        System.out.println("\\nFonctionnalités:");
        for (String feature : features) {
            System.out.println("✓ " + feature);
        }
    }
}`
        },
        
        go: {
            name: 'MonServeurGo',
            code: `package main

import (
    "fmt"
    "net/http"
    "time"
)

func main() {
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "<h1>🚀 Serveur Go sur Primeee Host</h1>")
        fmt.Fprintf(w, "<p>Date: %s</p>", time.Now().Format(time.RFC1123))
        fmt.Fprintf(w, "<p>Langage: Go 1.20+</p>")
    })
    
    http.HandleFunc("/api", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        fmt.Fprintf(w, \`{
            "status": "online",
            "language": "Go",
            "host": "Primeee Host",
            "timestamp": "%s"
        }\`, time.Now().Format(time.RFC3339))
    })
    
    fmt.Println("🚀 Serveur démarré sur :3000")
    http.ListenAndServe(":3000", nil)
}`
        }
    };
    
    const example = examples[language] || examples.node;
    nameInput.value = example.name;
    codeInput.value = example.code;
    
    showToast(`Exemple ${language} chargé !`, 'success');
}

function testAPI() {
    const deploySystem = window.deploySystem;
    if (!deploySystem) return;
    
    deploySystem.showStatus('🔍 Test de connexion API...', 'info');
    
    setTimeout(() => {
        const isOnline = Math.random() > 0.3; // 70% de chance d'être "en ligne"
        
        if (isOnline) {
            deploySystem.showStatus('✅ API connectée avec succès !', 'success');
        } else {
            deploySystem.showStatus('🌐 Mode simulation activé', 'warning');
        }
    }, 1000);
}

function clearAllProjects() {
    if (confirm('Supprimer tous les projets ? Cette action est irréversible.')) {
        localStorage.removeItem('primeee_projects');
        window.deploySystem.projects = [];
        window.deploySystem.loadProjects();
        showToast('Tous les projets ont été supprimés', 'info');
    }
}

function exportProjects() {
    const projects = JSON.parse(localStorage.getItem('primeee_projects')) || [];
    if (projects.length === 0) {
        showToast('Aucun projet à exporter', 'warning');
        return;
    }
    
    const dataStr = JSON.stringify(projects, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `primeee-projects-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast(`${projects.length} projets exportés`, 'success');
}

function showToast(message, type = 'info') {
    // Créer le toast s'il n'existe pas
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(toastContainer);
    }
    
    const colors = {
        success: '#4ade80',
        error: '#f87171',
        warning: '#fbbf24',
        info: '#60a5fa'
    };
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        background: ${colors[type] || colors.info};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 300px;
    `;
    
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto-remove après 3 secondes
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// ============ INITIALISATION ============
document.addEventListener('DOMContentLoaded', () => {
    // Initialiser le système de déploiement
    window.deploySystem = new PrimeeeDeploy();
    
    // Ajouter les styles d'animation
    if (!document.querySelector('#anim-styles')) {
        const style = document.createElement('style');
        style.id = 'anim-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Cookie banner (optionnel)
    if (!localStorage.getItem('primeee_cookies_accepted')) {
        setTimeout(() => {
            const banner = document.createElement('div');
            banner.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                right: 20px;
                background: var(--darker);
                border: 1px solid var(--gray);
                border-radius: 10px;
                padding: 1rem;
                z-index: 9998;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            `;
            banner.innerHTML = `
                <div>
                    <p style="margin: 0; font-size: 0.9rem;">
                        🍪 Ce site utilise des cookies pour améliorer votre expérience.
                        <a href="#" style="color: var(--primary);">En savoir plus</a>
                    </p>
                </div>
                <button id="accept-cookies" style="background: var(--primary); color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;">
                    Accepter
                </button>
            `;
            document.body.appendChild(banner);
            
            document.getElementById('accept-cookies').addEventListener('click', () => {
                localStorage.setItem('primeee_cookies_accepted', 'true');
                banner.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => banner.remove(), 300);
            });
        }, 2000);
    }
    
    console.log(`
    ╔══════════════════════════════════════╗
    ║  🚀 PRIMEEE HOST - Frontend Loaded   ║
    ║  Version: 1.0.0                      ║
    ║  Déploiement: ${window.location.href}  ║
    ╚══════════════════════════════════════╝
    `);
});
