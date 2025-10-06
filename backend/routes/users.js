const express = require('express');
const User = require('../models/User');
const Registration = require('../models/Registration');
const Tournament = require('../models/Tournament');
const { auth, requireAdmin } = require('../middleware/auth');
const router = express.Router();
// @route   GET /api/users/me/registrations
// @desc    Obtenir les inscriptions de l'utilisateur connecté
// @access  Private
router.get('/me/registrations', auth, async (req, res) => {
  try {
    const registrations = await Registration.findByUser(req.user.id);
    res.json({
      success: true,
      data: { registrations }
    });
  } catch (error) {
    console.error('Erreur récupération inscriptions utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de vos inscriptions'
    });
  }
});
// @route   GET /api/users/me/stats
// @desc    Obtenir les statistiques de l'utilisateur connecté
// @access  Private
router.get('/me/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const registrationCount = await Registration.countDocuments({ 
      user: req.user.id,
      status: { $in: ['confirmed', 'completed'] }
    });
    const upcomingTournaments = await Registration.find({
      user: req.user.id,
      status: 'confirmed'
    }).populate({
      path: 'tournament',
      match: { date: { $gt: new Date() } }
    });
    const stats = {
      ...user.getStats(),
      totalRegistrations: registrationCount,
      upcomingTournaments: upcomingTournaments.filter(r => r.tournament).length
    };
    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Erreur récupération statistiques utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});
// @route   GET /api/users
// @desc    Obtenir la liste des utilisateurs (Admin seulement)
// @access  Private (Admin)
router.get('/', auth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    let filter = {};
    if (search) {
      filter = {
        $or: [
          { name: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') }
        ]
      };
    }
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await User.countDocuments(filter);
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
});
// @route   GET /api/users/:id
// @desc    Obtenir les détails d'un utilisateur (Admin seulement)
// @access  Private (Admin)
router.get('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    const registrations = await Registration.findByUser(user._id);
    res.json({
      success: true,
      data: {
        user,
        registrations,
        stats: user.getStats()
      }
    });
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur'
    });
  }
});
// @route   PUT /api/users/:id/status
// @desc    Activer/désactiver un utilisateur (Admin seulement)
// @access  Private (Admin)
router.put('/:id/status', auth, requireAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    if (user.isAdmin && !isActive) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de désactiver un compte administrateur'
      });
    }
    user.isActive = isActive;
    await user.save();
    res.json({
      success: true,
      message: `Utilisateur ${isActive ? 'activé' : 'désactivé'} avec succès`,
      data: { user: { id: user._id, name: user.name, isActive: user.isActive } }
    });
  } catch (error) {
    console.error('Erreur modification statut utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du statut'
    });
  }
});
// @route   PUT /api/users/:id/admin
// @desc    Promouvoir/rétrograder admin (Admin seulement)
// @access  Private (Admin)
router.put('/:id/admin', auth, requireAdmin, async (req, res) => {
  try {
    const { isAdmin } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de modifier ses propres droits administrateur'
      });
    }
    user.isAdmin = isAdmin;
    await user.save();
    res.json({
      success: true,
      message: `Droits administrateur ${isAdmin ? 'accordés' : 'retirés'} avec succès`,
      data: { user: { id: user._id, name: user.name, isAdmin: user.isAdmin } }
    });
  } catch (error) {
    console.error('Erreur modification droits admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification des droits'
    });
  }
});
// @route   GET /api/users/stats/general
// @desc    Obtenir les statistiques générales (Admin seulement)
// @access  Private (Admin)
router.get('/stats/general', auth, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ isAdmin: true });
    const totalRegistrations = await Registration.countDocuments();
    const totalTournaments = await Tournament.countDocuments();
    const upcomingTournaments = await Tournament.countDocuments({
      date: { $gt: new Date() }
    });
    const registrationStats = await Registration.getStats();
    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          admins: adminUsers,
          inactive: totalUsers - activeUsers
        },
        tournaments: {
          total: totalTournaments,
          upcoming: upcomingTournaments,
          past: totalTournaments - upcomingTournaments
        },
        registrations: registrationStats
      }
    });
  } catch (error) {
    console.error('Erreur récupération statistiques générales:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});
module.exports = router;

