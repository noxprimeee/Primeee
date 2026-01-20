# Primeee
## 🚀 Déploiement

### Frontend (Render Static Site)
1. Connecter GitHub à Render
2. Créer un "Static Site"
3. Configuration :
   - Build Command: (laisser vide)
   - Publish Directory: `.`
4. URL générée automatiquement

### Backend (Render Web Service)
1. Créer un "Web Service" sur Render
2. Configuration :
   - Root Directory: `/backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
3. Variables d'environnement :
