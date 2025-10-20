const mongoose = require('mongoose');
const registrationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'waitlisted', 'no_show', 'completed'],
    default: 'confirmed'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Les notes ne peuvent pas dépasser 500 caractères']
  },
  checkedIn: {
    type: Boolean,
    default: false
  },
  checkedInAt: {
    type: Date
  },
  result: {
    position: {
      type: Number,
      min: 1
    },
    points: {
      type: Number,
      default: 0
    },
    matches: {
      won: { type: Number, default: 0 },
      lost: { type: Number, default: 0 },
      drawn: { type: Number, default: 0 }
    },
    prize: {
      type: String,
      trim: true
    }
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Le commentaire ne peut pas dépasser 1000 caractères']
    }
  }
}, {
  timestamps: true
});

registrationSchema.index({ user: 1, tournament: 1 }, { unique: true });
registrationSchema.index({ tournament: 1, status: 1 });
registrationSchema.index({ user: 1, registrationDate: -1 });

registrationSchema.methods.confirm = function() {
  this.status = 'confirmed';
  return this.save();
};

registrationSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

registrationSchema.methods.checkIn = function() {
  this.checkedIn = true;
  this.checkedInAt = new Date();
  return this.save();
};

registrationSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId })
    .populate('tournament', 'name date game maxPlayers currentPlayers')
    .sort({ registrationDate: -1 });
};

registrationSchema.statics.findByTournament = function(tournamentId) {
  return this.find({ tournament: tournamentId })
    .populate('user', 'name email')
    .sort({ registrationDate: 1 });
};

registrationSchema.statics.getStats = async function() {
  const totalRegistrations = await this.countDocuments();
  const activeRegistrations = await this.countDocuments({ 
    status: { $in: ['confirmed', 'pending'] } 
  });
  const cancelledRegistrations = await this.countDocuments({ status: 'cancelled' });
  return {
    total: totalRegistrations,
    active: activeRegistrations,
    cancelled: cancelledRegistrations,
    cancellationRate: totalRegistrations > 0 ? (cancelledRegistrations / totalRegistrations * 100).toFixed(2) : 0
  };
};
module.exports = mongoose.model('Registration', registrationSchema);

