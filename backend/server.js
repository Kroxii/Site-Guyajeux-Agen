const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const authRoutes = require('./routes/auth');
const tournamentRoutes = require('./routes/tournaments');
const userRoutes = require('./routes/users');
const statsRoutes = require('./routes/stats');
const app = express();
// Middleware de sécurité
app.use(helmet());
// Configuration CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || true, // Permet tous les domaines en développement
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite à 100 requêtes par IP
  message: {
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
  }
});
app.use('/api/', limiter);
// Middleware pour parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware pour parser les cookies
app.use(cookieParser());

// Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Servir les fichiers statiques (frontend)
app.use(express.static(path.join(__dirname, '../frontend')));
// Servir les pages depuis le dossier pages
app.use('/pages', express.static(path.join(__dirname, '../pages')));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
// Route de test
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Guyajeux Agen fonctionne correctement',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});
// Route pour servir le frontend
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: '../frontend' });
});
// Gestion des erreurs 404
app.use('*', (req, res) => {
  if (req.originalUrl.startsWith('/api/')) {
    res.status(404).json({
      success: false,
      message: 'Route API non trouvée'
    });
  } else {
    res.sendFile('index.html', { root: '../frontend' });
  }
});
// Middleware de gestion d'erreurs globale
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});
// Connexion à MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    // Créer un utilisateur admin par défaut s'il n'existe pas
    await createDefaultAdmin();
  } catch (error) {
    console.error('Erreur de connexion MongoDB:', error);
  }
};
// Créer un utilisateur admin par défaut
const createDefaultAdmin = async () => {
  try {
    const User = require('./models/User');
    const adminExists = await User.findOne({ email: 'admin@guyajeux.com' });
    if (!adminExists) {
      const admin = new User({
        name: 'Administrateur',
        email: 'admin@guyajeux.com',
        password: 'admin123',
        isAdmin: true
      });
      await admin.save();
    }
  } catch (error) {
    console.error('Erreur création admin:', error);
  }
};
// Démarrage du serveur
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
  });
};
startServer();
// Gestion propre de l'arrêt du serveur
process.on('SIGTERM', () => {
  process.exit(0);
});
process.on('SIGINT', () => {
  process.exit(0);
});
module.exports = app;

