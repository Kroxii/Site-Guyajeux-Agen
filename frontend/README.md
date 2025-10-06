# Frontend - Guyajeux Agen

Interface utilisateur moderne pour le système de gestion des tournois.

## 🎨 Technologies

- **HTML5** : Structure sémantique
- **CSS3** : Design moderne et responsive
- **JavaScript Vanilla** : Interactivité et API calls
- **Font Awesome** : Icônes
- **API REST** : Communication avec le backend

## 🚀 Démarrage Rapide

### Installation
```bash
npm install
```

### Développement
```bash
npm start
# ou
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

### Build Production
```bash
npm run build
```

## 📁 Structure

```
frontend/
├── index.html          # Page principale
├── css/
│   └── styles.css     # Styles globaux
├── js/
│   ├── api.js         # Service API
│   ├── app.js         # Logique principale
│   ├── auth.js        # Authentification
│   ├── calendar.js    # Calendrier
│   └── tournaments.js # Gestion tournois
├── package.json       # Configuration npm
└── README.md         # Documentation
```

## 🔧 Configuration

### Variables d'environnement (dans le code)
```javascript
// js/api.js
const API_BASE_URL = 'http://localhost:5000/api';
```

Pour la production, modifiez cette URL vers votre serveur de production.

## 📱 Fonctionnalités

### Pages principales
- **Accueil** : Vue d'ensemble des tournois
- **Calendrier** : Navigation mensuelle
- **Mes tournois** : Inscriptions utilisateur
- **Administration** : Gestion (admin seulement)

### Authentification
- Inscription/Connexion
- Gestion du profil
- Sessions persistantes (JWT)

### Tournois
- Inscription/Désinscription
- Calendrier interactif
- Détails des événements

## 🎯 Mode Hybride

Le frontend fonctionne en mode hybride :
- **API disponible** → Données temps réel du backend
- **API indisponible** → Fallback localStorage automatique

## 📦 Déploiement

### Serveur statique simple
```bash
# Avec serve (inclus dans les dépendances)
npx serve -s . -l 3000

# Avec http-server
npx http-server . -p 3000
```

### Nginx
```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    root /path/to/frontend;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend:5000;
    }
}
```

### Apache
```apache
<VirtualHost *:80>
    DocumentRoot /path/to/frontend
    ServerName votre-domaine.com
    
    ProxyPass /api http://localhost:5000/api
    ProxyPassReverse /api http://localhost:5000/api
</VirtualHost>
```

## 🔄 API Integration

Le frontend communique avec le backend via l'API REST :

```javascript
// Exemple d'appel API
const response = await api.getTournaments();
```

Voir `js/api.js` pour tous les endpoints disponibles.

## 🎨 Personnalisation

### Couleurs principales (CSS)
```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #28a745;
  --error-color: #dc3545;
}
```

### Responsive Design
- Mobile first
- Breakpoints : 480px, 768px, 1024px
- Grid CSS et Flexbox

## 🐛 Dépannage

### API non accessible
- Vérifiez que le backend fonctionne sur le port 5000
- Contrôlez l'URL dans `js/api.js`
- Vérifiez la console développeur pour les erreurs CORS

### Problèmes de cache
```bash
# Vider le cache du navigateur
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

## 📈 Améliorations Futures

- [ ] PWA (Progressive Web App)
- [ ] Service Worker pour mode hors-ligne
- [ ] Notifications push
- [ ] Thème sombre/clair
- [ ] Multi-langues i18n
- [ ] Bundle avec Webpack/Vite
- [ ] Tests e2e avec Cypress