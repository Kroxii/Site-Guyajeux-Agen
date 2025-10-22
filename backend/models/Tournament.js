const mongoose = require('mongoose');
const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du tournoi est requis'],
    trim: true,
    maxlength: [200, 'Le nom ne peut pas dépasser 200 caractères']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
  },
  game: {
    type: String,
    required: [true, 'Le jeu est requis'],
    trim: true,
    maxlength: [100, 'Le nom du jeu ne peut pas dépasser 100 caractères']
  },
  date: {
    type: Date,
    required: [true, 'La date du tournoi est requise']
  },
  maxPlayers: {
    type: Number,
    required: [true, 'Le nombre maximum de joueurs est requis'],
    min: [2, 'Il faut au moins 2 joueurs'],
    max: [100, 'Maximum 100 joueurs autorisés']
  },
  currentPlayers: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['planned', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'cancelled'],
    default: 'registration_open'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    registrationDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'confirmed', 'cancelled', 'no_show'],
      default: 'registered'
    }
  }],
  waitingList: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    registrationDate: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  registrationDeadline: {
    type: Date
  }
}, {
  timestamps: true
});

tournamentSchema.index({ date: 1 });
tournamentSchema.index({ game: 1 });
tournamentSchema.index({ status: 1 });
tournamentSchema.index({ createdBy: 1 });
tournamentSchema.index({ 'participants.user': 1 });
tournamentSchema.pre('save', function(next) {
  next();
});

tournamentSchema.methods.canUserRegister = function(userId) {
  if (this.currentPlayers >= this.maxPlayers) {
    return { canRegister: false, reason: 'Tournoi complet' };
  }
  
  const isAlreadyRegistered = this.participants.some(p => 
    p.user.toString() === userId.toString() && 
    (p.status === 'registered' || p.status === 'confirmed')
  );
  if (isAlreadyRegistered) {
    return { canRegister: false, reason: 'Déjà inscrit' };
  }
  
  if (this.registrationDeadline && new Date() > this.registrationDeadline) {
    return { canRegister: false, reason: 'Date limite d\'inscription dépassée' };
  }
  
  if (new Date() > this.date) {
    return { canRegister: false, reason: 'Tournoi déjà passé' };
  }
  return { canRegister: true };
};

tournamentSchema.methods.registerUser = function(userId) {
  const canRegister = this.canUserRegister(userId);
  if (!canRegister.canRegister) {
    throw new Error(canRegister.reason);
  }
  this.participants.push({
    user: userId,
    registrationDate: new Date(),
    status: 'registered'
  });
  return this.save();
};

tournamentSchema.methods.unregisterUser = function(userId) {
  const participantIndex = this.participants.findIndex(p => 
    p.user.toString() === userId.toString() && 
    (p.status === 'registered' || p.status === 'confirmed')
  );
  if (participantIndex === -1) {
    throw new Error('Utilisateur non inscrit à ce tournoi');
  }
  this.participants.splice(participantIndex, 1);
  
  if (this.waitingList.length > 0) {
    const nextUser = this.waitingList.shift();
    this.participants.push({
      user: nextUser.user,
      registrationDate: new Date(),
      status: 'registered'
    });
  }
  return this.save();
};

tournamentSchema.statics.findUpcoming = function() {
  return this.find({
    date: { $gt: new Date() },
    status: { $in: ['planned', 'registration_open'] }
  }).sort({ date: 1 });
};

tournamentSchema.statics.findByGame = function(game) {
  return this.find({ 
    game: new RegExp(game, 'i'),
    isPublic: true 
  });
};
module.exports = mongoose.model('Tournament', tournamentSchema);

