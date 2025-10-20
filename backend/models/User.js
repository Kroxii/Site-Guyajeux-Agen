const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Format d\'email invalide']
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
    select: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  profilePicture: {
    type: String,
    default: null
  },
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    favoriteGames: [{
      type: String,
      trim: true
    }]
  },
  stats: {
    tournamentsJoined: {
      type: Number,
      default: 0
    },
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});
// Index pour optimiser les recherches
userSchema.index({ email: 1 });
userSchema.index({ isAdmin: 1 });
// Middleware pour hasher le mot de passe avant sauvegarde

// A regarder
// Hook mongoose pour hasher le mot de passe avant sauvegarde (à garder ici)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});
// Méthode pour vérifier le mot de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
// A regarder

// Méthode pour obtenir les statistiques de l'utilisateur
userSchema.methods.getStats = function() {
  return {
    tournamentsJoined: this.stats.tournamentsJoined,
    memberSince: this.createdAt,
    lastLogin: this.lastLogin
  };
};

module.exports = mongoose.model('User', userSchema);

