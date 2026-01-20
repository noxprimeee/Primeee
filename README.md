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

## 🔧 Développement local

```bash
# Cloner le repo
git clone https://github.com/noxprimeee/Primeee.git
cd Primeee

# Frontend
open index.html  # Ou utilise un serveur local

# Backend
cd backend
npm install
npm start
---

## 🚀 **ÉTAPES FINALES :**

### **1. Copie tous ces fichiers** dans ton repo GitHub
### **2. Commit et push :**
```bash
git add .
git commit -m "Version complète Primeee Host avec frontend et backend"
git push origin main
