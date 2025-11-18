const express = require('express');
const User = require('../models/User');
const { auth, generateToken } = require('../middleware/auth');
const router = express.Router();
// @route   POST /api/auth/register
// @desc    Créer un nouveau compte utilisateur
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Un compte avec cet email existe déjà'
      });
    }
    // Créer le nouvel utilisateur
    const user = new User({
      name,
      email: email,
      password
    });
    await user.save();
    // Générer le token
    const token = generateToken(user._id);
    
    // Définir le cookie sécurisé
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin
        }
      }
    });
  } catch (error) {
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
    // Trouver l'utilisateur (y compris le mot de passe)
    const user = await User.findOne({ email: email }).select('+password');
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

    // Générer le token
    const token = generateToken(user._id);
    
    // Définir le cookie sécurisé
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
        }
      }
    });
  } catch (error) {
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
          stats: user.getStats(),
          preferences: user.preferences
        }
      }
    });
  } catch (error) {
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
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe'
    });
  }
});
// @route   POST /api/auth/logout
// @desc    Déconnexion et suppression du cookie
// @access  Private
router.post('/logout', auth, (req, res) => {
  // Supprimer le cookie
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});
module.exports = router;

