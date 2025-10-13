const express = require('express');
const User = require('../models/User');
const { auth, generateToken } = require('../middleware/auth');
const router = express.Router();
// @route   POST /api/auth/register
// @desc    Créer un nouveau compte utilisateur
// @access  Public
router.post('/register', async (req, res) => {
  try {
    console.log('📝 Tentative d\'inscription reçue:', req.body);
    const { name, email, password } = req.body;
    // Validation
    if (!name || !email || !password) {
      console.log('❌ Validation échouée: champs manquants');
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }
    if (password.length < 6) {
      console.log('❌ Validation échouée: mot de passe trop court');
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('❌ Utilisateur existe déjà:', email);
      return res.status(409).json({
        success: false,
        message: 'Un compte avec cet email existe déjà'
      });
    }
    // Créer le nouvel utilisateur
    console.log('✅ Création de l\'utilisateur...');
    const user = new User({
      name,
      email: email.toLowerCase(),
      password
    });
    await user.save();
    console.log('✅ Utilisateur créé avec succès:', user._id);
    // Générer le token
    const token = generateToken(user._id);
    console.log('✅ Token généré pour:', user._id);
    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin
        },
        token
      }
    });
  } catch (error) {
    console.error('❌ Erreur inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du compte'
    });
  }
});
// @route   POST /api/auth/login
// @desc    Connexion utilisateur
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }
    // Trouver l'utilisateur
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé. Contactez l\'administrateur.'
      });
    }
    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();
    // Générer le token
    const token = generateToken(user._id);
    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          lastLogin: user.lastLogin
        },
        token
      }
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion'
    });
  }
});
// @route   GET /api/auth/me
// @desc    Obtenir les informations de l'utilisateur connecté
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          lastLogin: user.lastLogin,
          stats: user.getStats(),
          preferences: user.preferences
        }
      }
    });
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
});
// @route   PUT /api/auth/profile
// @desc    Mettre à jour le profil utilisateur
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, preferences } = req.body;
    const user = await User.findById(req.user.id);
    if (name) user.name = name;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };
    await user.save();
    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          preferences: user.preferences
        }
      }
    });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil'
    });
  }
});
// @route   POST /api/auth/change-password
// @desc    Changer le mot de passe
// @access  Private
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau mot de passe requis'
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }
    const user = await User.findById(req.user.id).select('+password');
    // Vérifier le mot de passe actuel
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }
    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();
    res.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });
  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe'
    });
  }
});
// @route   POST /api/auth/logout
// @desc    Déconnexion (côté client principalement)
// @access  Private
router.post('/logout', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});
module.exports = router;

