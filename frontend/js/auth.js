// L'authentification se fait via l'API backend
// La variable 'api' est déclarée globalement dans app.js

// Vérifier l'authentification au chargement
async function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    
    // Si on a des données utilisateur en localStorage, vérifier avec le serveur
    if (savedUser) {
        try {
            // Vérifier si le cookie est toujours valide en appelant l'API
            currentUser = await api.getCurrentUser();
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateAuthUI();
        } catch (error) {
            console.error('Session invalide:', error);
            // Cookie invalide, nettoyer et déconnecter
            localStorage.removeItem('currentUser');
            currentUser = null;
            updateAuthUI();
        }
    } else {
        currentUser = null;
        updateAuthUI();
    }
}
// Mettre à jour l'interface utilisateur selon l'état de connexion
function updateAuthUI() {
    const authButtons = document.getElementById('navAuth');
    const userMenu = document.getElementById('navUser');
    const userName = document.getElementById('userName');
    const adminBtn = document.getElementById('adminBtn');
    
    if (!authButtons || !userMenu) {
        console.warn('⚠️ Éléments de navigation non trouvés');
        return;
    }
    
    if (currentUser) {
        // Utilisateur connecté
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';
        if (userName) userName.textContent = currentUser.name;
        
        // Afficher le bouton admin si l'utilisateur est administrateur
        if (adminBtn) {
            adminBtn.style.display = currentUser.isAdmin ? 'block' : 'none';
        }
    } else {
        // Utilisateur non connecté
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
    }
}
// Fonction de connexion
async function login(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    try {
        const response = await api.login(email, password);
        
        if (response.success) {
            currentUser = response.data.user;
            showNotification('Connexion réussie !', 'success');
            updateAuthUI();
            
            // Recharger les données
            await loadData();
            
            setTimeout(() => {
                showSection('home');
            }, 1500);
            
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
        }
    } catch (error) {
        console.error('Erreur de connexion:', error);
        showNotification('Email ou mot de passe incorrect', 'error');
    }
}
// Fonction d'inscription
async function register(event) {
    event.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!name || !email || !password || !confirmPassword) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Veuillez saisir une adresse email valide', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Les mots de passe ne correspondent pas', 'error');
        return;
    }
    if (password.length < 6) {
        showNotification('Le mot de passe doit contenir au moins 6 caractères', 'error');
        return;
    }
    
    try {
        const response = await api.register(name, email, password);
        
        if (response.success) {
            currentUser = response.data.user;
            showNotification('Compte créé avec succès !', 'success');
            updateAuthUI();
            
            // Recharger les données
            await loadData();
            
            setTimeout(() => {
                showSection('home');
            }, 1500);
            
            document.getElementById('registerName').value = '';
            document.getElementById('registerEmail').value = '';
            document.getElementById('registerPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        }
    } catch (error) {
        console.error('Erreur d\'inscription:', error);
        showNotification('Erreur lors de l\'inscription: ' + error.message, 'error');
    }
}
// Fonction de déconnexion
async function logout() {
    try {
        await api.logout();
        showNotification('Déconnexion réussie', 'success');
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        // Forcer la déconnexion locale même en cas d'erreur
        currentUser = null;
        localStorage.removeItem('currentUser');
        updateAuthUI();
    }
    
    showSection('home');
}
// Validation en temps réel pour l'inscription
document.addEventListener('DOMContentLoaded', function() {
    const confirmPasswordField = document.getElementById('confirmPassword');
    const passwordField = document.getElementById('registerPassword');
    if (confirmPasswordField && passwordField) {
        confirmPasswordField.addEventListener('input', function() {
            if (this.value && passwordField.value && this.value !== passwordField.value) {
                this.setCustomValidity('Les mots de passe ne correspondent pas');
            } else {
                this.setCustomValidity('');
            }
        });
        passwordField.addEventListener('input', function() {
            if (confirmPasswordField.value && this.value && confirmPasswordField.value !== this.value) {
                confirmPasswordField.setCustomValidity('Les mots de passe ne correspondent pas');
            } else {
                confirmPasswordField.setCustomValidity('');
            }
        });
    }
});

