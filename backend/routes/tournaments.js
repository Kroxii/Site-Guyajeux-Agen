const express = require('express');
const Tournament = require('../models/Tournament');
const Registration = require('../models/Registration');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Fonction helper pour synchroniser le nombre de joueurs
async function syncTournamentPlayers(tournamentId) {
  const count = await Registration.countDocuments({ tournament: tournamentId });
  await Tournament.findByIdAndUpdate(tournamentId, { currentPlayers: count });
  return count;
}

// @route   GET /api/tournaments
// @desc    Obtenir tous les tournois
// @access  Public
router.get('/', async (req, res) => {
  try {
    const tournaments = await Tournament.find().sort({ date: 1 });
    
    // Synchroniser le nombre de joueurs pour chaque tournoi
    for (let tournament of tournaments) {
      const actualCount = await Registration.countDocuments({ tournament: tournament._id });
      if (tournament.currentPlayers !== actualCount) {
        tournament.currentPlayers = actualCount;
        await tournament.save();
      }
    }
    
    res.json({
      success: true,
      data: tournaments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des tournois'
    });
  }
});

// @route   GET /api/tournaments/:id
// @desc    Obtenir un tournoi par ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournoi non trouvé'
      });
    }

    res.json({
      success: true,
      data: tournament
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du tournoi'
    });
  }
});

// @route   POST /api/tournaments
// @desc    Créer un nouveau tournoi
// @access  Private (Admin only)
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      date,
      maxPlayers,
      game,
      entryFee,
      registrationDeadline
    } = req.body;

    // Validation
    if (!name || !date || !maxPlayers || !game) {
      return res.status(400).json({
        success: false,
        message: 'Le nom, la date, le jeu et le nombre de joueurs sont requis'
      });
    }

    const tournamentData = {
      name,
      description,
      date,
      maxPlayers,
      game,
      createdBy: req.user.id
    };

    // Ajouter entryFee seulement s'il est fourni
    if (entryFee !== undefined && entryFee !== null) {
      tournamentData.entryFee = entryFee;
    }

    // Ajouter registrationDeadline seulement s'il est fourni
    if (registrationDeadline) {
      tournamentData.registrationDeadline = registrationDeadline;
    }

    const tournament = new Tournament(tournamentData);

    await tournament.save();

    res.status(201).json({
      success: true,
      data: tournament,
      message: 'Tournoi créé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du tournoi'
    });
  }
});

// @route   PUT /api/tournaments/:id
// @desc    Mettre à jour un tournoi
// @access  Private (Admin only)
router.put('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournoi non trouvé'
      });
    }

    const {
      name,
      description,
      date,
      maxPlayers,
      game,
      status,
      entryFee,
      registrationDeadline
    } = req.body;

    // Mise à jour des champs fournis
    if (name !== undefined) tournament.name = name;
    if (description !== undefined) tournament.description = description;
    if (date !== undefined) tournament.date = date;
    if (maxPlayers !== undefined) tournament.maxPlayers = maxPlayers;
    if (game !== undefined) tournament.game = game;
    if (status !== undefined) tournament.status = status;
    if (entryFee !== undefined) tournament.entryFee = entryFee;
    if (registrationDeadline !== undefined) tournament.registrationDeadline = registrationDeadline;

    await tournament.save();

    res.json({
      success: true,
      data: tournament,
      message: 'Tournoi mis à jour avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du tournoi'
    });
  }
});

// @route   DELETE /api/tournaments/:id
// @desc    Supprimer un tournoi
// @access  Private (Admin only)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournoi non trouvé'
      });
    }

    // Supprimer d'abord toutes les inscriptions associées
    await Registration.deleteMany({ tournament: req.params.id });

    // Puis supprimer le tournoi
    await Tournament.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Tournoi supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du tournoi'
    });
  }
});

// @route   POST /api/tournaments/:id/register
// @desc    S'inscrire à un tournoi
// @access  Private
router.post('/:id/register', auth, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournoi non trouvé'
      });
    }

    // Vérifier si le tournoi est ouvert aux inscriptions
    if (tournament.status !== 'registration_open') {
      return res.status(400).json({
        success: false,
        message: 'Les inscriptions ne sont pas ouvertes pour ce tournoi'
      });
    }

    // Vérifier si l'utilisateur est déjà inscrit
    const existingRegistration = await Registration.findOne({
      user: req.user.id,
      tournament: req.params.id
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'Vous êtes déjà inscrit à ce tournoi'
      });
    }

    // Vérifier le nombre maximum de participants
    if (tournament.maxPlayers) {
      const currentRegistrations = await Registration.countDocuments({
        tournament: req.params.id
      });

      if (currentRegistrations >= tournament.maxPlayers) {
        return res.status(400).json({
          success: false,
          message: 'Le tournoi est complet'
        });
      }
    }

    const registration = new Registration({
      user: req.user.id,
      tournament: req.params.id
    });

    await registration.save();
    
    // Synchroniser le nombre de joueurs avec le nombre réel d'inscriptions
    const actualCount = await Registration.countDocuments({ 
      tournament: req.params.id,
      status: { $nin: ['cancelled'] }
    });
    tournament.currentPlayers = actualCount;
    await tournament.save();
    
    await registration.populate('user', 'name email');
    await registration.populate('tournament', 'name date');

    res.status(201).json({
      success: true,
      data: registration,
      message: 'Inscription réussie'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription'
    });
  }
});

// @route   DELETE /api/tournaments/:id/register
// @desc    Se désinscrire d'un tournoi
// @access  Private
router.delete('/:id/register', auth, async (req, res) => {
  try {
    const registration = await Registration.findOne({
      user: req.user.id,
      tournament: req.params.id
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Aucune inscription trouvée pour ce tournoi'
      });
    }

    await Registration.findByIdAndDelete(registration._id);
    
    // Synchroniser le nombre de joueurs avec le nombre réel d'inscriptions
    const tournament = await Tournament.findById(req.params.id);
    if (tournament) {
      const actualCount = await Registration.countDocuments({ 
        tournament: req.params.id,
        status: { $nin: ['cancelled'] }
      });
      tournament.currentPlayers = actualCount;
      await tournament.save();
    }

    res.json({
      success: true,
      message: 'Désinscription réussie'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la désinscription'
    });
  }
});

// @route   GET /api/tournaments/:id/registrations
// @desc    Obtenir les inscriptions d'un tournoi
// @access  Private (Admin only)
router.get('/:id/registrations', auth, requireAdmin, async (req, res) => {
  try {
    const registrations = await Registration.find({ tournament: req.params.id })
      .populate('user', 'name email')
      .populate('tournament', 'name date');

    res.json({
      success: true,
      data: registrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des inscriptions'
    });
  }
});

// @route   GET /api/tournaments/stats
// @desc    Obtenir les statistiques des tournois
// @access  Private (Admin only)
router.get('/stats', auth, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const totalTournaments = await Tournament.countDocuments();
    const upcomingTournaments = await Tournament.countDocuments({ date: { $gt: now } });
    const pastTournaments = await Tournament.countDocuments({ date: { $lte: now } });
    const totalRegistrations = await Registration.countDocuments();
    
    // Calculer la moyenne des participants
    const tournamentsWithParticipants = await Tournament.aggregate([
      {
        $lookup: {
          from: 'registrations',
          localField: '_id',
          foreignField: 'tournament',
          as: 'participants'
        }
      },
      {
        $project: {
          participantCount: { $size: '$participants' }
        }
      },
      {
        $group: {
          _id: null,
          avgParticipants: { $avg: '$participantCount' }
        }
      }
    ]);
    
    const averageParticipants = tournamentsWithParticipants.length > 0 
      ? Math.round(tournamentsWithParticipants[0].avgParticipants * 10) / 10 
      : 0;

    const stats = {
      totalTournaments,
      upcomingTournaments,
      pastTournaments,
      totalRegistrations,
      averageParticipants
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des statistiques'
    });
  }
});

// @route   GET /api/tournaments/weekly
// @desc    Obtenir les tournois de la semaine
// @access  Public
router.get('/weekly', async (req, res) => {
  try {
    const now = new Date();
    const oneWeek = new Date();
    oneWeek.setDate(now.getDate() + 7);

    const tournaments = await Tournament.find({
      date: { $gte: now, $lte: oneWeek }
    }).sort({ date: 1 });

    res.json({
      success: true,
      data: { tournaments }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des tournois de la semaine'
    });
  }
});

// @route   GET /api/tournaments/monthly
// @desc    Obtenir les tournois du mois
// @access  Public
router.get('/monthly', async (req, res) => {
  try {
    const now = new Date();
    const oneMonth = new Date();
    oneMonth.setDate(now.getDate() + 30);

    const tournaments = await Tournament.find({
      date: { $gte: now, $lte: oneMonth }
    }).sort({ date: 1 });

    res.json({
      success: true,
      data: { tournaments }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des tournois du mois'
    });
  }
});

// @route   GET /api/tournaments/calendar/:year/:month
// @desc    Obtenir les tournois pour un mois donné
// @access  Public
router.get('/calendar/:year/:month', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const tournaments = await Tournament.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    res.json({
      success: true,
      data: { tournaments }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des tournois du calendrier'
    });
  }
});

module.exports = router;
