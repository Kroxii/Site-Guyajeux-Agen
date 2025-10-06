# Backend Guyajeux Agen - API

Backend Node.js avec Express et MongoDB pour le système de gestion des tournois.

## 🚀 Installation et Configuration

### Prérequis
- Node.js (version 16+)
- MongoDB (local ou Atlas)
- npm ou yarn

### Installation

1. **Naviguer vers le dossier server**
```bash
cd server
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
Copier `.env.example` vers `.env` et modifier les valeurs :

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/guyajeux-agen
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:3000
```

### Démarrage

**Mode développement (avec rechargement automatique) :**
```bash
npm run dev
```

**Mode production :**
```bash
npm start
```

L'API sera accessible sur `http://localhost:5000`

## 📡 API Endpoints

### Authentification (`/api/auth`)
- `POST /register` - Créer un compte
- `POST /login` - Se connecter
- `GET /me` - Profil utilisateur
- `PUT /profile` - Modifier le profil
- `POST /change-password` - Changer le mot de passe
- `POST /logout` - Se déconnecter

### Tournois (`/api/tournaments`)
- `GET /` - Liste des tournois
- `GET /upcoming` - Tournois à venir
- `GET /weekly` - Tournois de la semaine
- `GET /monthly` - Tournois du mois
- `GET /calendar/:year/:month` - Calendrier mensuel
- `GET /:id` - Détails d'un tournoi
- `POST /` - Créer un tournoi (admin)
- `PUT /:id` - Modifier un tournoi (admin)
- `DELETE /:id` - Supprimer un tournoi (admin)
- `POST /:id/register` - S'inscrire à un tournoi
- `DELETE /:id/register` - Se désinscrire

### Utilisateurs (`/api/users`)
- `GET /me/registrations` - Mes inscriptions
- `GET /me/stats` - Mes statistiques
- `GET /` - Liste utilisateurs (admin)
- `GET /:id` - Détails utilisateur (admin)
- `PUT /:id/status` - Activer/désactiver (admin)
- `PUT /:id/admin` - Droits admin (admin)
- `GET /stats/general` - Stats générales (admin)

## 📊 Modèles de Données

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  isAdmin: Boolean,
  isActive: Boolean,
  lastLogin: Date,
  preferences: {
    notifications: Boolean,
    favoriteGames: [String]
  },
  stats: {
    tournamentsJoined: Number,
    tournamentsWon: Number
  }
}
```

### Tournament
```javascript
{
  name: String,
  description: String,
  game: String,
  date: Date,
  maxPlayers: Number,
  currentPlayers: Number,
  status: String,
  createdBy: ObjectId,
  participants: [{
    user: ObjectId,
    registrationDate: Date,
    status: String
  }],
  // ...autres champs
}
```

### Registration
```javascript
{
  user: ObjectId,
  tournament: ObjectId,
  registrationDate: Date,
  status: String,
  checkedIn: Boolean,
  result: {
    position: Number,
    points: Number,
    prize: String
  }
}
```

## 🔐 Sécurité

- **JWT** : Authentification par tokens
- **Bcrypt** : Hash des mots de passe
- **Rate limiting** : Protection contre le spam
- **CORS** : Configuration des origines autorisées
- **Helmet** : Headers de sécurité HTTP

## 🛠 Développement

### Scripts disponibles
```bash
npm start          # Démarrage production
npm run dev        # Développement avec nodemon
npm test           # Tests (à implémenter)
```

### Structure des fichiers
```
server/
├── models/           # Modèles Mongoose
├── routes/          # Routes Express
├── middleware/      # Middlewares personnalisés
├── server.js        # Point d'entrée
├── package.json     # Dépendances
└── .env            # Variables d'environnement
```

## 📝 Variables d'Environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NODE_ENV` | Environnement | `development` / `production` |
| `PORT` | Port du serveur | `5000` |
| `MONGODB_URI` | URI MongoDB | `mongodb://localhost:27017/db` |
| `JWT_SECRET` | Clé secrète JWT | `supersecretkey123` |
| `JWT_EXPIRE` | Durée des tokens | `30d` |
| `FRONTEND_URL` | URL du frontend | `http://localhost:3000` |

## 🚨 Déploiement

### MongoDB Atlas (Cloud)
1. Créer un cluster sur [MongoDB Atlas](https://cloud.mongodb.com)
2. Obtenir l'URI de connexion
3. Mettre à jour `MONGODB_URI` dans `.env`

### Variables d'environnement production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/guyajeux-agen
JWT_SECRET=your-production-secret-very-long-and-secure
FRONTEND_URL=https://votre-domaine.com
```

### Commandes de déploiement
```bash
# Installation des dépendances
npm ci --only=production

# Démarrage
npm start
```

## 📋 TODO

- [ ] Tests unitaires et d'intégration
- [ ] Documentation API avec Swagger
- [ ] Système de logs avancé
- [ ] Mise en cache Redis
- [ ] Upload d'images pour les tournois
- [ ] Notifications en temps réel (WebSocket)
- [ ] Backup automatique de la base
- [ ] Monitoring et métriques

## 🤝 Compte Admin par Défaut

Au premier démarrage, un compte administrateur est créé :
- **Email** : admin@guyajeux.com
- **Mot de passe** : admin123

⚠️ **Important** : Changez ces identifiants en production !

## 📞 Support

Pour toute question technique :
- Vérifiez les logs du serveur
- Testez la connectivité MongoDB
- Vérifiez les variables d'environnement
- Consultez la documentation des erreurs API