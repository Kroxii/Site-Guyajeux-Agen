# Site Guyajeux Agen - Système de Gestion des Tournois

Un site web moderne pour la gestion et l'inscription aux tournois de jeux de société et de cartes à collectionner.


Le projet est organisé en **deux parties distinctes** :

```
Site-Guyajeux-Agen/
├── frontend/              # Interface utilisateur
│   ├── index.html        
│   ├── css/              
│   ├── js/               
│   └── package.json      
├── backend/               # API et serveur
│   ├── models/           
│   ├── routes/           
│   ├── middleware/       
│   ├── server.js         
│   └── package.json      
├── package.json          # Configuration principale
├── install.bat           # Installation Windows
├── install.sh            # Installation Linux/Mac
├── start-dev.bat         # Démarrage complet
└── docker-compose.yml    # Configuration Docker
```



**Windows :**
```cmd
# Double-cliquer sur install.bat
# OU en ligne de commande :
install.bat
```

**Linux/Mac :**
```bash
chmod +x install.sh
./install.sh
```

```bash
# 1. Dépendances principales
npm install

# 2. Backend
cd backend && npm install && cd ..

# 3. Frontend  
cd frontend && npm install && cd ..
```


```bash
# Les deux serveurs (Frontend + Backend)
npm run dev

# Accès : http://localhost:5000
```


**Backend seulement :**
```bash
npm run dev-backend
# API: http://localhost:5000/api/health
# Frontend inclus: http://localhost:5000
```

**Frontend seulement :**
```bash
npm run dev-frontend  
# Interface: http://localhost:3000
# (Nécessite que le backend soit démarré)
```

- `start-dev.bat` - Démarrage complet
- `start-backend.bat` - Backend uniquement
- `start-frontend.bat` - Frontend uniquement


- **Inscription/Connexion** : Comptes sauvegardés en MongoDB
- **Calendrier interactif** : Navigation mensuelle des tournois
- **Inscriptions** : Gestion complète des participations
- **Interface responsive** : Mobile, tablette, desktop

- **Panel d'administration** : Gestion complète
- **CRUD tournois** : Création, modification, suppression
- **Gestion utilisateurs** : Statistiques et modération
- **Dashboard** : Métriques en temps réel


- **HTML5/CSS3/JavaScript** : Interface moderne
- **API REST** : Communication serveur
- **Responsive Design** : Mobile-first
- **LocalStorage Fallback** : Mode dégradé

- **Node.js + Express** : Serveur API
- **MongoDB + Mongoose** : Base de données
- **JWT** : Authentification sécurisée
- **Bcrypt** : Chiffrement mots de passe


Votre configuration actuelle utilise MongoDB Atlas Cloud.

```bash
# Démarrer MongoDB localement
mongod

# Modifier backend/.env
MONGODB_URI=mongodb://localhost:27017/guyajeux-agen
```

```bash
docker-compose up -d mongodb
# Interface admin : http://localhost:8081
```



**Authentification :**
- `POST /auth/register` - Inscription
- `POST /auth/login` - Connexion
- `GET /auth/me` - Profil utilisateur

**Tournois :**
- `GET /tournaments` - Liste tournois
- `GET /tournaments/weekly` - Tournois semaine
- `GET /tournaments/monthly` - Tournois mois
- `POST /tournaments` - Créer (admin)
- `POST /tournaments/:id/register` - S'inscrire

**Utilisateurs :**
- `GET /users/me/registrations` - Mes inscriptions
- `GET /users/stats/general` - Stats (admin)

*Documentation complète : `backend/README.md`*


```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://...  # Votre URL Atlas
JWT_SECRET=your-secret-key
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:3000
```

```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```


```bash
# MongoDB + Interface admin
docker-compose up -d

# MongoDB seul
docker-compose up -d mongodb

# Interface admin MongoDB
# http://localhost:8081
```


Au premier démarrage du backend :
- **Email** : admin@guyajeux.com  
- **Mot de passe** : admin123

⚠️ **Changez ces identifiants en production !**


Le frontend fonctionne intelligemment :
- **API disponible** → Données MongoDB temps réel
- **API indisponible** → Fallback localStorage automatique


```bash
npm run dev              # Frontend + Backend
npm run dev-backend      # Backend seul
npm run dev-frontend     # Frontend seul
npm run install-all      # Installer toutes les dépendances
npm run start           # Production backend
npm run build           # Build frontend
```

```bash
npm run dev             # Développement avec nodemon
npm start               # Production
```

```bash
npm start               # Serveur de développement
npm run build           # Build production
```


```bash
# Nettoyer et réinstaller
npm run clean
npm run install-all
```

```bash
# Vérifier la santé de l'API
curl http://localhost:5000/api/health

# Vérifier MongoDB Atlas
# Consultez votre dashboard Atlas
```

- **5000** : Backend + Frontend intégré
- **3000** : Frontend séparé (développement)
- **27017** : MongoDB local
- **8081** : Interface admin MongoDB (Docker)

- **Backend** : Console avec détails des erreurs
- **Frontend** : Console développeur navigateur
- **MongoDB** : Dashboard Atlas ou logs Docker


```bash
# Variables d'environnement production
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=super-secret-production-key
FRONTEND_URL=https://votre-domaine.com

# Démarrage
cd backend && npm start
```

```bash
cd frontend && npm run build
# Servir les fichiers statiques
```

Le backend sert automatiquement le frontend sur le port 5000.


- [ ] Tests automatisés (Jest, Cypress)
- [ ] CI/CD GitHub Actions
- [ ] Monitoring et logs
- [ ] Cache Redis
- [ ] WebSockets temps réel

- [ ] Upload d'images tournois
- [ ] Notifications push
- [ ] PWA (mode offline)
- [ ] Multi-langues
- [ ] Thème sombre/clair
- [ ] Chat intégré
- [ ] Application mobile


- **Projet** : `README.md` (ce fichier)
- **Backend** : `backend/README.md`
- **Frontend** : `frontend/README.md`

- **API** : http://localhost:5000/api/health
- **Application** : http://localhost:5000

1. **Port 5000 occupé** : Modifier `PORT` dans `backend/.env`
2. **MongoDB inaccessible** : Vérifier l'URL Atlas dans `.env`
3. **Erreurs CORS** : Vérifier `FRONTEND_URL` dans `.env`


Projet créé pour Guyajeux Agen - Tous droits réservés.

---

**🎯 Version 2.0 - Architecture Frontend/Backend Séparée**

✅ **Structure organisée** : Frontend et Backend séparés  
✅ **Installation automatique** : Scripts Windows/Linux  
✅ **Démarrage flexible** : Ensemble ou séparé  
✅ **MongoDB Atlas** : Configuration cloud prête  
✅ **Mode hybride** : API + localStorage fallback  
✅ **Documentation complète** : README pour chaque partie  
✅ **Scripts de développement** : Workflow optimisé
