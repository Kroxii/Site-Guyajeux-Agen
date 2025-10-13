const express = require('express');
const User = require('../models/User');
const Tournament = require('../models/Tournament');
const router = express.Router();

// @route   GET /api/stats
// @desc    Obtenir les statistiques du site
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Compter le nombre total d'utilisateurs
    const totalMembers = await User.countDocuments();
    
    // Compter le nombre total de tournois
    const totalTournaments = await Tournament.countDocuments();
    
    // Compter les tournois actifs (à venir et en cours)
    const activeTournaments = await Tournament.countDocuments({
      date: { $gte: new Date() },
      status: { $in: ['upcoming', 'ongoing'] }
    });
    
    // Compter les tournois terminés
    const finishedTournaments = await Tournament.countDocuments({
      status: 'finished'
    });
    
    // Nombre de jeux uniques (extraire tous les noms de jeux distincts)
    const uniqueGames = await Tournament.distinct('game');
    const totalGames = uniqueGames.length;
    
    // Statistiques supplémentaires
    const stats = {
      totalMembers,
      totalTournaments,
      activeTournaments,
      finishedTournaments,
      totalGames,
      upcomingTournaments: activeTournaments
    };
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Erreur récupération statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

module.exports = router;
