# 🎲 Site Guyajeux Agen - Système de Gestion des Tournois

Une application web fullstack moderne pour la gestion et l'inscription aux tournois de jeux de société et de cartes à collectionner du club Guyajeux Agen.

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)](https://mongodb.com/)
[![Express](https://img.shields.io/badge/Express-4.18-blue)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-ISC-yellow)](https://opensource.org/licenses/ISC)

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Utilisation](#-utilisation)
- [API Documentation](#-api-documentation)
- [Structure du projet](#-structure-du-projet)
- [Technologies utilisées](#-technologies-utilisées)
- [Contribution](#-contribution)
- [Licence](#-licence)

## 🚀 Fonctionnalités

### 👥 Gestion des utilisateurs
- **Inscription et connexion** avec authentification JWT
- **Profil utilisateur** avec statistiques personnelles
- **Système de rôles** (Utilisateur/Administrateur)
- **Hashage sécurisé** des mots de passe avec bcrypt
- **Sessions persistantes** avec cookies sécurisés
- **Gestion des préférences** utilisateur

### 🏆 Gestion des tournois
- **Création de tournois** par les administrateurs
- **Inscription aux tournois** avec gestion des places limitées
- **Liste d'attente** automatique en cas de tournoi complet
- **Statuts multiples** : planifié, ouvert, fermé, en cours, terminé, annulé
- **Système de participants** avec confirmation d'inscription
- **Gestion des dates limites** d'inscription
- **Support multi-jeux** (jeux de société, cartes à collectionner, etc.)

### 📅 Calendrier et événements
- **Vue calendrier** interactive des événements
- **Navigation mensuelle** avec filtrage par date
- **Affichage des tournois** avec détails complets
- **Statut en temps réel** des inscriptions

### 📊 Statistiques et tableau de bord
- **Statistiques générales** du site (membres, tournois, jeux)
- **Tableau de bord administrateur** complet
- **Statistiques personnelles** pour chaque utilisateur
- **Rapports d'inscription** et de participation

### 🎨 Interface utilisateur
- **Design responsive** compatible mobile/desktop
- **Thème clair/sombre** avec basculement
- **Navigation intuitive** avec menu hamburger mobile
- **Notifications toast** pour le feedback utilisateur
- **Interface d'administration** dédiée

### 🔒 Sécurité et performance
- **Authentification JWT** avec cookies HttpOnly
- **Middleware de sécurité** avec Helmet
- **Rate limiting** pour prévenir les abus
- **Validation des données** côté client et serveur
- **Protection CORS** configurée
- **Hashage sécurisé** des mots de passe

## 🏗️ Architecture

```mermaid
graph TB
    A[Client Browser] --> B[Frontend - HTML/CSS/JS]
    B --> C[Express.js Server]
    C --> D[MongoDB Database]
    C --> E[JWT Auth Middleware]
    C --> F[API Routes]
    F --> G[Models - Mongoose]
    G --> D
```

L'application suit une architecture **MVC (Model-View-Controller)** avec :
- **Frontend** : Interface utilisateur en HTML/CSS/JavaScript vanilla
- **Backend** : API REST avec Express.js et Node.js
- **Base de données** : MongoDB avec Mongoose ODM
- **Authentification** : JWT avec cookies sécurisés

## 📋 Prérequis

- **Node.js** 16.0+ et npm 8.0+
- **MongoDB** 7.0+ (local ou cloud)
- **Git** pour le clonage du repository

## ⚡ Installation

### Installation rapide

```bash
# Cloner le repository
git clone https://github.com/Kroxii/Site-Guyajeux-Agen.git
cd Site-Guyajeux-Agen

# Installation des dépendances pour tout le projet
npm run install-all

# Configuration de l'environnement
cp backend/.env.example backend/.env
# Éditer backend/.env avec vos paramètres

# Démarrer l'application en mode développement
npm run dev
```

### Installation détaillée

#### 1. Cloner et installer les dépendances

```bash
git clone https://github.com/Kroxii/Site-Guyajeux-Agen.git
cd Site-Guyajeux-Agen

# Installation du backend
cd backend
npm install

# Installation du frontend
cd ../frontend
npm install

# Retour au root
cd ..
```

#### 2. Configuration MongoDB

**Option A : MongoDB local**
```bash
# Installer MongoDB Community Edition
# Démarrer le service MongoDB
mongod --dbpath /data/db
```

**Option B : MongoDB Atlas (Cloud)**
1. Créer un compte sur [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Créer un cluster gratuit
3. Obtenir la chaîne de connexion

#### 3. Variables d'environnement

Créer le fichier `backend/.env` :

```env
# Base de données
MONGODB_URI=mongodb://localhost:27017/guyajeux-agen
# ou pour MongoDB Atlas :
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/guyajeux-agen

# JWT
JWT_SECRET=votre_clé_secrète_très_longue_et_sécurisée
JWT_EXPIRE=7d

# Serveur
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:8080

# Admin par défaut (optionnel)
ADMIN_EMAIL=admin@guyajeux-agen.fr
ADMIN_PASSWORD=admin123
ADMIN_NAME=Administrateur
```

#### 4. Démarrage de l'application

```bash
# Mode développement (recommandé)
npm run dev

# Ou démarrer séparément :
npm run dev-backend    # Port 3000
npm run dev-frontend   # Port 8080

# Mode production
npm run build
npm start
```

## 🔧 Configuration

### Variables d'environnement disponibles

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `MONGODB_URI` | URL de connexion MongoDB | `mongodb://localhost:27017/guyajeux-agen` |
| `JWT_SECRET` | Clé secrète pour JWT | *Obligatoire* |
| `JWT_EXPIRE` | Durée de vie du token | `7d` |
| `NODE_ENV` | Environnement d'exécution | `development` |
| `PORT` | Port du serveur backend | `3000` |
| `FRONTEND_URL` | URL du frontend | `http://localhost:8080` |

### Configuration CORS

Le serveur accepte les requêtes depuis :
- `http://localhost:8080` (développement)
- Domaine configuré via `FRONTEND_URL`

### Configuration de sécurité

- **Rate limiting** : 100 requêtes par IP/15 minutes
- **Cookies sécurisés** : HttpOnly, Secure (production), SameSite
- **Helmet** : Protection des headers HTTP
- **CORS** : Configuration restrictive

## 🎯 Utilisation

### Interface publique

1. **Accueil** (`/`) : Présentation du club et statistiques générales
2. **Calendrier** (`/pages/calendrier.html`) : Vue calendrier des événements
3. **Tournois** (`/pages/tournois.html`) : Liste et détails des tournois

### Interface utilisateur connecté

Après connexion/inscription :
- **Inscription aux tournois** disponibles
- **Gestion du profil** utilisateur
- **Historique des participations**
- **Statistiques personnelles**

### Interface administrateur

Accessible via `/pages/admin.html` pour les administrateurs :

#### Gestion des tournois
- Créer de nouveaux tournois
- Modifier les tournois existants
- Gérer les inscriptions et participants
- Voir les statistiques détaillées

#### Gestion des utilisateurs
- Liste des utilisateurs inscrits
- Promotion/rétrogradation d'administrateurs
- Gestion des comptes utilisateurs

### API REST

L'application expose une API REST complète :

#### Authentification
```bash
POST /api/auth/register    # Inscription
POST /api/auth/login       # Connexion
POST /api/auth/logout      # Déconnexion
GET  /api/auth/me          # Profil utilisateur
```

#### Tournois
```bash
GET    /api/tournaments           # Liste des tournois
GET    /api/tournaments/:id       # Détails d'un tournoi
POST   /api/tournaments           # Créer un tournoi (admin)
PUT    /api/tournaments/:id       # Modifier un tournoi (admin)
DELETE /api/tournaments/:id       # Supprimer un tournoi (admin)
POST   /api/tournaments/:id/register   # S'inscrire à un tournoi
DELETE /api/tournaments/:id/unregister # Se désinscrire
```

#### Utilisateurs
```bash
GET /api/users                    # Liste utilisateurs (admin)
GET /api/users/:id                # Détails utilisateur (admin)
GET /api/users/me/registrations   # Mes inscriptions
GET /api/users/me/stats           # Mes statistiques
```

#### Statistiques
```bash
GET /api/stats                    # Statistiques générales
```

## 📁 Structure du projet

```
Site-Guyajeux-Agen/
├── 📦 package.json              # Configuration principale
├── 📖 README.md                 # Documentation
├── 🖥️ frontend/                 # Interface utilisateur
│   ├── 🏠 index.html           # Page d'accueil
│   ├── 📄 package.json         # Dépendances frontend
│   ├── 🎨 css/
│   │   └── styles.css          # Styles principaux
│   └── 📜 js/
│       ├── api.js              # Service API
│       ├── app.js              # Application principale
│       ├── auth.js             # Gestion authentification
│       ├── calendar.js         # Fonctions calendrier
│       └── tournaments.js      # Gestion tournois
├── ⚙️ backend/                  # Serveur et API
│   ├── 📄 package.json         # Dépendances backend
│   ├── 🚀 server.js            # Point d'entrée serveur
│   ├── 🔐 middleware/
│   │   └── auth.js             # Middleware authentification
│   ├── 📊 models/
│   │   ├── User.js             # Modèle utilisateur
│   │   ├── Tournament.js       # Modèle tournoi
│   │   └── Registration.js     # Modèle inscription
│   └── 🛣️ routes/
│       ├── auth.js             # Routes authentification
│       ├── tournaments.js      # Routes tournois
│       ├── users.js            # Routes utilisateurs
│       └── stats.js            # Routes statistiques
└── 📱 pages/                   # Pages additionnelles
    ├── admin.html              # Interface administration
    ├── calendrier.html         # Page calendrier
    └── tournois.html           # Page tournois
```

## 🛠️ Technologies utilisées

### Backend
- **Node.js** 16+ - Environnement d'exécution JavaScript
- **Express.js** 4.18 - Framework web minimaliste
- **MongoDB** 7.0 - Base de données NoSQL
- **Mongoose** 7.5 - ODM MongoDB pour Node.js
- **JWT** 9.0 - Authentification par tokens
- **bcryptjs** 2.4 - Hashage des mots de passe
- **Helmet** 7.0 - Sécurité des headers HTTP
- **CORS** 2.8 - Gestion des requêtes cross-origin
- **Morgan** 1.10 - Logger HTTP

### Frontend
- **HTML5** - Structure sémantique
- **CSS3** - Styles modernes avec variables CSS
- **JavaScript ES6+** - Logique client vanilla
- **Font Awesome** 6.0 - Icônes
- **Google Fonts** - Typographie (Inter)

### Outils de développement
- **Nodemon** 3.0 - Rechargement automatique
- **Concurrently** 8.2 - Exécution simultanée des scripts
- **dotenv** 16.3 - Gestion des variables d'environnement

### Sécurité
- **Rate limiting** - Protection contre les attaques par déni de service
- **CORS configuré** - Protection cross-origin
- **Cookies sécurisés** - HttpOnly, Secure, SameSite
- **Validation des données** - Côté client et serveur
- **Hashage bcrypt** - Protection des mots de passe

## 📜 Scripts disponibles

```bash
# Installation
npm run install-all        # Installer toutes les dépendances
npm run install-backend     # Installer les dépendances backend
npm run install-frontend    # Installer les dépendances frontend

# Développement
npm run dev                 # Démarrer backend + frontend
npm run dev-backend         # Démarrer uniquement le backend
npm run dev-frontend        # Démarrer uniquement le frontend

# Production
npm start                   # Démarrer en mode production
npm run build               # Builder le frontend

# Tests
npm test                    # Lancer tous les tests
npm run test-backend        # Tests backend
npm run test-frontend       # Tests frontend

# Maintenance
npm run clean               # Nettoyer les node_modules
```

## 🧪 Tests

```bash
# Lancer tous les tests
npm test

# Tests spécifiques
npm run test-backend
npm run test-frontend
```

## 🚀 Déploiement

### Déploiement local

```bash
npm run build
npm start
```

### Déploiement sur serveur

1. **Préparer l'environnement de production**
```bash
export NODE_ENV=production
export MONGODB_URI="mongodb://localhost:27017/guyajeux-agen"
export JWT_SECRET="votre_clé_de_production_très_sécurisée"
```

2. **Installer et démarrer**
```bash
npm run install-all
npm run build
npm start
```

### Variables d'environnement de production

```env
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/guyajeux-agen
JWT_SECRET=clé_de_production_très_longue_et_sécurisée
PORT=3000
FRONTEND_URL=https://votre-domaine.com
```

## 🤝 Contribution

1. **Fork** le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commiter les changements (`git commit -am 'Ajout d'une nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une **Pull Request**

### Standards de code
- Code en **français** pour les commentaires et noms de variables
- **ESLint** pour le formatage JavaScript
- **Commits conventionnels** recommandés

## 🐛 Résolution des problèmes

### Problèmes courants

**Erreur de connexion MongoDB**
```bash
# Vérifier que MongoDB fonctionne
mongod --version
# Ou pour un service système
sudo systemctl status mongod
```

**Port déjà utilisé**
```bash
# Changer le port dans .env ou tuer le processus
lsof -ti:3000 | xargs kill -9
```

**Erreur JWT_SECRET manquant**
```bash
# Ajouter dans backend/.env
echo "JWT_SECRET=$(openssl rand -base64 64)" >> backend/.env
```

## 📄 Licence

Ce projet est sous licence ISC - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👥 Équipe

- **Développement** : [Kroxii](https://github.com/Kroxii)
- **Maintenance** : [Kroxii](https://github.com/Kroxii)

## 📞 Contact

- **Website** : 
- **Email** : 
- **GitHub** : [Kroxii/Site-Guyajeux-Agen](https://github.com/Kroxii/Site-Guyajeux-Agen)

---

⭐ **N'hésitez pas à étoiler ce projet si vous le trouvez utile !**

