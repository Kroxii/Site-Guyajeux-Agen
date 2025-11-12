let currentUser = null;
let tournaments = [];
let api = null;
let currentCalendarDate = new Date();

// Fonctions utilitaires pour formater les dates
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// Fonctions utilitaires pour le statut des tournois
function getTournamentStatus(tournament) {
    const now = new Date();
    const tournamentDate = new Date(tournament.date);
    const currentPlayers = tournament.currentPlayers || 0;
    
    if (currentPlayers >= tournament.maxPlayers) {
        return 'full';
    } else if (tournamentDate < now) {
        return 'past';
    } else {
        return 'open';
    }
}

function getTournamentStatusText(tournament) {
    const status = getTournamentStatus(tournament);
    switch (status) {
        case 'full':
            return 'Complet';
        case 'past':
            return 'Terminé';
        case 'open':
            return 'Inscriptions ouvertes';
        default:
            return 'Ouvert';
    }
}

// Fonction pour changer de mois dans le calendrier
function changeMonth(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    if (getCurrentSection() === 'calendar') {
        loadCalendarData();
    }
}

function getHomePath() {
    return '/';
}

function getCurrentSection() {
    const path = window.location.pathname;
    const fileName = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
    
    if (fileName === 'index.html' || fileName === '' || path === '/') {
        return 'home';
    } else if (fileName === 'calendrier.html') {
        return 'calendar';
    } else if (fileName === 'tournois.html') {
        return 'tournaments';
    } else if (fileName === 'admin.html') {
        return 'admin';
    }
    return 'home';
}

document.addEventListener('DOMContentLoaded', async function() {
    try {
        api = new ApiService();
        
        initTheme();
        await checkAuthentication();
        await loadInitialData();
        initEventListeners();
        initAuthEventListeners();
        
        // Charger les données de la page actuelle
        await loadCurrentPageData();
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        showNotification('Erreur lors de l\'initialisation de l\'application', 'error');
    }
});

// Écouter les événements d'authentification
function initAuthEventListeners() {
    window.addEventListener('auth-expired', () => {
        currentUser = null;
        updateAuthUI(false);
        showNotification('Session expirée. Veuillez vous reconnecter.', 'warning');
        window.location.href = getHomePath();
    });
    
    window.addEventListener('user-logout', () => {
        currentUser = null;
        updateAuthUI(false);
    });
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// Charger les données de la page actuelle
async function loadCurrentPageData() {
    const path = window.location.pathname;
    const fileName = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
    
    try {
        switch (fileName) {
            case 'index.html':
            case '':
                await loadHomeData();
                break;
            case 'calendrier.html':
                await loadCalendarData();
                break;
            case 'tournois.html':
                await loadTournamentsData();
                break;
            case 'admin.html':
                if (currentUser && currentUser.isAdmin) {
                    await loadAdminData();
                } else {
                    showNotification('Accès refusé. Vous devez être administrateur.', 'error');
                    window.location.href = getHomePath();
                }
                break;
        }
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        showNotification('Erreur lors du chargement', 'error');
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        const firstInput = modal.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

async function checkAuthentication() {
    try {
        // Essayer de récupérer l'utilisateur sauvegardé
        const savedUser = localStorage.getItem('currentUser');
        
        if (api && savedUser) {
            try {
                // Vérifier si le cookie est toujours valide
                const response = await api.getCurrentUser();
                if (response && response.success && response.data) {
                    currentUser = response.data.user;
                    // Mettre à jour localStorage avec les données à jour
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    updateAuthUI(true);
                    return true;
                }
            } catch (error) {
                console.warn('⚠️ Session invalide:', error.message);
                // Cookie invalide, nettoyer
                localStorage.removeItem('currentUser');
                currentUser = null;
                updateAuthUI(false);
            }
        }
    } catch (error) {
        console.error('❌ Erreur authentification:', error);
    }
    
    currentUser = null;
    updateAuthUI(false);
    return false;
}

function updateAuthUI(isAuthenticated) {
    const navAuth = document.getElementById('navAuth');
    const navUser = document.getElementById('navUser');
    const userName = document.getElementById('userName');
    const adminBtn = document.getElementById('adminBtn');
    
    if (isAuthenticated && currentUser) {
        if (navAuth) navAuth.style.display = 'none';
        if (navUser) navUser.style.display = 'flex';
        if (userName) userName.textContent = currentUser.name;
        
        if (currentUser.isAdmin && adminBtn) {
            adminBtn.style.display = 'block';
        }
    } else {
        if (navAuth) navAuth.style.display = 'flex';
        if (navUser) navUser.style.display = 'none';
        if (adminBtn) adminBtn.style.display = 'none';
    }
}

async function handleLogin(event) {
    event.preventDefault();
    showLoading(true);
    
    try {
        const formData = new FormData(event.target);
        const email = formData.get('email');
        const password = formData.get('password');
        
        const response = await api.login(email, password);
        
        if (response.success) {
            // Sauvegarder l'utilisateur (le token est dans le cookie httpOnly)
            currentUser = response.data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            updateAuthUI(true);
            closeModal('loginModal');
            showNotification(`Bienvenue ${currentUser.name} !`, 'success');
            
            // Recharger les données si nécessaire
            if (getCurrentSection() === 'tournaments') {
                await loadTournamentsData();
            }
        } else {
            throw new Error(response.message || 'Erreur de connexion');
        }
    } catch (error) {
        console.error('❌ Erreur login:', error);
        showNotification(error.message || 'Erreur lors de la connexion', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    showLoading(true);
    
    try {
        const formData = new FormData(event.target);
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };
        
        if (userData.password !== userData.confirmPassword) {
            throw new Error('Les mots de passe ne correspondent pas');
        }
        
        if (userData.password.length < 6) {
            throw new Error('Le mot de passe doit contenir au moins 6 caractères');
        }
        
        const response = await api.register(userData.name, userData.email, userData.password);
        
        if (response.success) {
            // Sauvegarder l'utilisateur (le token est dans le cookie httpOnly)
            currentUser = response.data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            updateAuthUI(true);
            closeModal('registerModal');
            showNotification(`Bienvenue ${currentUser.name} ! Votre compte a été créé avec succès.`, 'success');
        } else {
            throw new Error(response.message || 'Erreur lors de l\'inscription');
        }
    } catch (error) {
        console.error('Erreur register complète:', error);
        showNotification(error.message || 'Erreur lors de l\'inscription', 'error');
    } finally {
        showLoading(false);
    }
}

async function logout() {
    try {
        if (api) {
            await api.logout();
        }
    } catch (error) {
        console.error('Erreur logout:', error);
    } finally {
        currentUser = null;
        localStorage.removeItem('currentUser');
        updateAuthUI(false);
        showNotification('Vous avez été déconnecté', 'info');
        window.location.href = getHomePath();
    }
}

async function loadInitialData() {
    showLoading(true);
    
    try {
        if (api) {
            // Charger les tournois
            const response = await api.getTournaments();
            tournaments = Array.isArray(response) ? response : [];
            
            // Charger les statistiques
            await loadStats();
        }
    } catch (error) {
        console.error('Erreur chargement initial:', error);
        showNotification('Erreur lors du chargement des données', 'error');
        tournaments = [];
    } finally {
        showLoading(false);
    }
}

async function loadStats() {
    try {
        const stats = await api.getStats();
        
        // Mettre à jour les compteurs sur la page d'accueil
        const totalMembersEl = document.getElementById('totalMembers');
        const totalTournamentsEl = document.getElementById('totalTournaments');
        const totalGamesEl = document.getElementById('totalGames');
        
        if (totalMembersEl) {
            totalMembersEl.textContent = stats.totalMembers || 0;
        }
        
        if (totalTournamentsEl) {
            totalTournamentsEl.textContent = stats.totalTournaments || 0;
        }
        
        if (totalGamesEl) {
            totalGamesEl.textContent = stats.totalGames || 0;
        }
        
        // Animation des nombres (compteur)
        animateCounter(totalMembersEl, stats.totalMembers);
        animateCounter(totalTournamentsEl, stats.totalTournaments);
        animateCounter(totalGamesEl, stats.totalGames);
        
    } catch (error) {
        console.error('Erreur chargement statistiques:', error);
        // Garder les valeurs par défaut en cas d'erreur
    }
}

function animateCounter(element, targetValue) {
    if (!element || !targetValue) return;
    
    const duration = 1000; // 1 seconde
    const startValue = 0;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOut);
        
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = targetValue;
        }
    }
    
    requestAnimationFrame(update);
}

async function loadHomeData() {
    try {
        const upcomingContainer = document.getElementById('upcomingTournaments');
        if (upcomingContainer && tournaments.length > 0) {
            const upcomingTournaments = tournaments
                .filter(t => new Date(t.date) > new Date())
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 6);
            
            renderTournamentsGrid(upcomingContainer, upcomingTournaments);
        }
        
        updateStats();
    } catch (error) {
        console.error('Erreur chargement accueil:', error);
    }
}

async function loadTournamentsData() {
    try {
        const tournamentsGrid = document.getElementById('tournamentsGrid');
        if (tournamentsGrid) {
            applyTournamentFilters();
        }
        
        if (currentUser) {
            const myRegistrations = document.getElementById('myRegistrations');
            if (myRegistrations) {
                myRegistrations.style.display = 'block';
                await loadUserRegistrations();
            }
        }
    } catch (error) {
        console.error('Erreur chargement tournois:', error);
    }
}

function applyTournamentFilters() {
    const tournamentsGrid = document.getElementById('tournamentsGrid');
    const searchInput = document.getElementById('tournamentSearch');
    const activeFilter = document.querySelector('.filter-btn.active');
    
    if (!tournamentsGrid) return;
    
    let filteredTournaments = [...tournaments];

    if (activeFilter) {
        const filterType = activeFilter.dataset.filter;
        if (filterType !== 'all') {
            filteredTournaments = filteredTournaments.filter(tournament => {
                const status = getTournamentStatus(tournament);
                return status === filterType;
            });
        }
    }
    
    if (searchInput && searchInput.value.trim() !== '') {
        const searchTerm = searchInput.value.trim();
        filteredTournaments = filteredTournaments.filter(tournament => {
            const searchLower = searchTerm.toLowerCase();
            return tournament.name.toLowerCase().includes(searchLower) ||
                   tournament.game.toLowerCase().includes(searchLower) ||
                   (tournament.description && tournament.description.toLowerCase().includes(searchLower));
        });
    }
    
    renderTournamentsGrid(tournamentsGrid, filteredTournaments);
}

async function loadUserRegistrations() {
    try {
        if (!currentUser || !api) return;
        
        const registrations = await api.getMyRegistrations();
        const registrationsList = document.getElementById('myRegistrationsList');
        
        if (registrationsList && registrations) {
            if (registrations.length === 0) {
                registrationsList.innerHTML = '<p class="text-center">Aucune inscription trouvée.</p>';
            } else {
                renderUserRegistrations(registrationsList, registrations);
            }
        }
    } catch (error) {
        console.error('Erreur chargement inscriptions:', error);
    }
}

async function loadAdminData() {
    try {
        if (!currentUser || !currentUser.isAdmin || !api) {
            return;
        }
        
        const adminTournamentsList = document.getElementById('adminTournamentsList');
        
        if (adminTournamentsList) {
            renderAdminTournaments(adminTournamentsList, tournaments);
        }

        // Charger les utilisateurs
        const usersResponse = await api.getUsers();
        const adminUsersList = document.getElementById('adminUsersList');
        
        if (adminUsersList && usersResponse) {
            renderAdminUsers(adminUsersList, usersResponse);
        }
    } catch (error) {
        console.error('❌ Erreur chargement admin:', error);
    }
}

function renderTournamentsGrid(container, tournamentsList) {
    if (!container) return;
    
    if (tournamentsList.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Aucun tournoi disponible.</p>';
        return;
    }
    
    container.innerHTML = tournamentsList.map(tournament => createTournamentCard(tournament)).join('');
    
    // Ajouter les event listeners
    container.querySelectorAll('.tournament-card').forEach(card => {
        const tournamentId = card.dataset.tournamentId;
        card.addEventListener('click', function() {
            showTournamentDetails(tournamentId);
        });
    });
    
    container.querySelectorAll('.register-tournament-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            registerForTournament(this.dataset.tournamentId);
        });
    });
    
    container.querySelectorAll('.details-tournament-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            showTournamentDetails(this.dataset.tournamentId);
        });
    });
    
    container.querySelectorAll('.login-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            openModal('loginModal');
        });
    });
}

function createTournamentCard(tournament) {
    const tournamentId = tournament._id || tournament.id;
    
    return '<div class="tournament-card" data-tournament-id="' + tournamentId + '">' +
        '<div class="tournament-header">' +
            '<h3 class="tournament-title">' + tournament.name + '</h3>' +
            '<p class="tournament-game">' + tournament.game + '</p>' +
        '</div>' +
        '<div class="tournament-body">' +
            '<div class="tournament-info">' +
                '<div class="tournament-detail">' +
                    '<i class="fas fa-calendar"></i>' +
                    '<span>' + formatDate(tournament.date) + '</span>' +
                '</div>' +
                '<div class="tournament-detail">' +
                    '<i class="fas fa-clock"></i>' +
                    '<span>' + formatTime(tournament.date) + '</span>' +
                '</div>' +
                '<div class="tournament-detail">' +
                    '<i class="fas fa-users"></i>' +
                    '<span>' + (tournament.currentPlayers || 0) + '/' + tournament.maxPlayers + ' joueurs</span>' +
                '</div>' +
                '<div class="tournament-status ' + getTournamentStatus(tournament) + '">' +
                    '<i class="fas fa-circle"></i>' +
                    '<span>' + getTournamentStatusText(tournament) + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="tournament-actions">' +
                createTournamentActions(tournamentId) +
            '</div>' +
        '</div>' +
    '</div>';
}

function createTournamentActions(tournamentId) {
    if (currentUser) {
        return '<button class="btn btn-primary btn-sm register-tournament-btn" data-tournament-id="' + tournamentId + '">' +
                '<i class="fas fa-plus"></i>' +
                '<span>S\'inscrire</span>' +
            '</button>' +
            '<button class="btn btn-ghost btn-sm details-tournament-btn" data-tournament-id="' + tournamentId + '">' +
                '<i class="fas fa-info-circle"></i>' +
                '<span>Détails</span>' +
            '</button>';
    } else {
        return '<button class="btn btn-ghost btn-sm login-btn">' +
                '<i class="fas fa-sign-in-alt"></i>' +
                '<span>Se connecter</span>' +
            '</button>' +
            '<button class="btn btn-ghost btn-sm details-tournament-btn" data-tournament-id="' + tournamentId + '">' +
                '<i class="fas fa-info-circle"></i>' +
                '<span>Détails</span>' +
            '</button>';
    }
}

function renderUserRegistrations(container, registrations) {
    container.innerHTML = registrations.map(registration => {
        const tournamentId = registration.tournament?._id || registration.tournament;
        const tournamentName = registration.tournament?.name || registration.tournamentName || 'Tournoi';
        const tournamentDate = registration.tournament?.date || registration.tournamentDate;
        
        return '<div class="registration-card">' +
            '<h4>' + tournamentName + '</h4>' +
            '<p>Date: ' + formatDate(tournamentDate) + '</p>' +
            '<p>Statut: ' + registration.status + '</p>' +
            '<button class="btn btn-danger btn-sm cancel-registration-btn" data-tournament-id="' + tournamentId + '">' +
                'Annuler l\'inscription' +
            '</button>' +
        '</div>';
    }).join('');
    
    // Ajouter les event listeners
    container.querySelectorAll('.cancel-registration-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            cancelRegistration(this.dataset.tournamentId);
        });
    });
}

function renderAdminTournaments(container, tournamentsList) {
    container.innerHTML = tournamentsList.map(tournament => {
        const tournamentId = tournament._id || tournament.id;
        const price = tournament.entryFee ? tournament.entryFee.toFixed(2) + ' €' : 'Gratuit';
        return '<div class="admin-tournament-item">' +
            '<div class="tournament-info">' +
                '<h4>' + tournament.name + '</h4>' +
                '<p>' + tournament.game + ' - ' + formatDate(tournament.date) + '</p>' +
                '<p>' + (tournament.currentPlayers || 0) + '/' + tournament.maxPlayers + ' joueurs - ' + price + '</p>' +
            '</div>' +
            '<div class="admin-actions">' +
                '<button class="btn btn-ghost btn-sm edit-tournament-btn" data-tournament-id="' + tournamentId + '">' +
                    '<i class="fas fa-edit"></i>' +
                    'Modifier' +
                '</button>' +
            '</div>' +
        '</div>';
    }).join('');
    
    // Ajouter les event listeners après le rendu
    container.querySelectorAll('.edit-tournament-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            openEditTournamentModal(this.dataset.tournamentId);
        });
    });
}

function renderAdminUsers(container, usersData) {
    if (!container) return;
    
    const usersList = Array.isArray(usersData) ? usersData : (usersData.users || []);
    
    container.innerHTML = usersList.map(user => {
        const userId = user._id || user.id;
        const createdAt = user.createdAt ? formatDate(user.createdAt) : 'N/A';
        const lastLogin = user.lastLogin ? formatDate(user.lastLogin) : 'Jamais connecté';
        const isAdmin = user.isAdmin ? '<span class="badge badge-admin">Admin</span>' : '';
        const userName = user.name || user.username || 'Utilisateur';
        
        return '<div class="admin-user-item">' +
            '<div class="user-info">' +
                '<h4>' + userName + ' ' + isAdmin + '</h4>' +
                '<p><i class="fas fa-envelope"></i> ' + user.email + '</p>' +
                '<p><i class="fas fa-calendar-plus"></i> Inscription: ' + createdAt + '</p>' +
                '<p><i class="fas fa-clock"></i> Dernière connexion: ' + lastLogin + '</p>' +
            '</div>' +
        '</div>';
    }).join('');
}

async function registerForTournament(tournamentId) {
    if (!currentUser) {
        openModal('loginModal');
        return;
    }
    
    try {
        showLoading(true);
        const response = await api.registerForTournament(tournamentId);
        
        if (response.success) {
            showNotification('Inscription réussie !', 'success');
            await loadInitialData();
            if (getCurrentSection() === 'tournaments') {
                await loadTournamentsData();
            }
            if (getCurrentSection() === 'home') {
                await loadHomeData();
            }
        } else {
            throw new Error(response.message || 'Erreur lors de l\'inscription');
        }
    } catch (error) {
        console.error('Erreur inscription tournoi:', error);
        showNotification(error.message || 'Erreur lors de l\'inscription au tournoi', 'error');
    } finally {
        showLoading(false);
    }
}

async function cancelRegistration(tournamentId) {
    if (!currentUser) {
        openModal('loginModal');
        return;
    }
    
    const confirmed = await showConfirm(
        'Êtes-vous sûr de vouloir annuler votre inscription à ce tournoi ?',
        'Annuler l\'inscription'
    );
    
    if (!confirmed) {
        return;
    }
    
    try {
        showLoading(true);
        const response = await api.unregisterFromTournament(tournamentId);
        
        if (response.success) {
            showNotification('Désinscription réussie !', 'success');
            await loadInitialData();
            if (getCurrentSection() === 'tournaments') {
                await loadTournamentsData();
            }
            if (getCurrentSection() === 'home') {
                await loadHomeData();
            }
        } else {
            throw new Error(response.message || 'Erreur lors de la désinscription');
        }
    } catch (error) {
        console.error('Erreur désinscription tournoi:', error);
        showNotification(error.message || 'Erreur lors de l\'annulation de l\'inscription', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleCreateTournament(event) {
    event.preventDefault();
    
    if (!currentUser || !currentUser.isAdmin) {
        showNotification('Accès refusé', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const formData = new FormData(event.target);
        
        // Combiner date et heure
        const date = formData.get('date');
        const time = formData.get('time');
        const dateTime = new Date(`${date}T${time}`);
        
        const tournamentData = {
            name: formData.get('name'),
            game: formData.get('game'),
            date: dateTime.toISOString(),
            entryFee: parseFloat(formData.get('price')),
            maxPlayers: parseInt(formData.get('maxPlayers')),
            description: formData.get('description')
        };
        
        const registrationDeadline = formData.get('registrationDeadline');
        if (registrationDeadline) {
            tournamentData.registrationDeadline = new Date(registrationDeadline).toISOString();
        }
        
        const response = await api.createTournament(tournamentData);
        
        if (response) {
            closeModal('createTournamentModal');
            event.target.reset();
            showNotification('Tournoi créé avec succès !', 'success');
            await loadInitialData();
            if (getCurrentSection() === 'admin') {
                await loadAdminData();
            }
        } else {
            throw new Error('Erreur lors de la création');
        }
    } catch (error) {
        console.error('Erreur création tournoi:', error);
        showNotification(error.message || 'Erreur lors de la création du tournoi', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleEditTournament(event) {
    event.preventDefault();
    
    if (!currentUser || !currentUser.isAdmin) {
        showNotification('Accès refusé', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const formData = new FormData(event.target);
        const tournamentId = formData.get('id');
        
        // Combiner date et heure
        const date = formData.get('date');
        const time = formData.get('time');
        const dateTime = new Date(`${date}T${time}`);
        
        // Validation
        if (isNaN(dateTime.getTime())) {
            throw new Error('Date invalide');
        }
        
        const entryFee = parseFloat(formData.get('price')) || 0;
        const maxPlayers = parseInt(formData.get('maxPlayers'), 10);
        
        if (isNaN(maxPlayers) || maxPlayers < 4) {
            throw new Error('Le nombre de joueurs doit être au moins 4');
        }
        
        if (isNaN(entryFee) || entryFee < 0) {
            throw new Error('Le prix d\'entrée doit être un nombre positif');
        }
        
        const tournamentData = {
            name: formData.get('name'),
            game: formData.get('game'),
            date: dateTime.toISOString(),
            entryFee: entryFee,
            maxPlayers: maxPlayers,
            description: formData.get('description')
        };
        
        const registrationDeadline = formData.get('registrationDeadline');
        if (registrationDeadline) {
            tournamentData.registrationDeadline = new Date(registrationDeadline).toISOString();
        }
        
        const response = await api.updateTournament(tournamentId, tournamentData);
        
        if (response) {
            closeModal('editTournamentModal');
            showNotification('Tournoi modifié avec succès !', 'success');
            await loadInitialData();
            if (getCurrentSection() === 'admin') {
                await loadAdminData();
            }
        } else {
            throw new Error('Erreur lors de la modification');
        }
    } catch (error) {
        console.error('Erreur modification tournoi:', error);
        showNotification(error.message || 'Erreur lors de la modification du tournoi', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleDeleteTournament() {
    const tournamentId = document.getElementById('editTournamentId').value;
    
    if (!tournamentId) {
        showNotification('Erreur: ID du tournoi non trouvé', 'error');
        return;
    }
    
    // Trouver le tournoi pour afficher ses informations
    const tournament = tournaments.find(t => (t._id || t.id) === tournamentId);
    const playerCount = tournament ? (tournament.currentPlayers || 0) : 0;
    
    // Message de confirmation adapté
    let confirmMessage = 'Êtes-vous sûr de vouloir supprimer ce tournoi ?\n\n';
    if (playerCount > 0) {
        confirmMessage += `⚠️ ATTENTION : Ce tournoi a ${playerCount} joueur${playerCount > 1 ? 's' : ''} inscrit${playerCount > 1 ? 's' : ''}.\n`;
        confirmMessage += 'Toutes les inscriptions seront automatiquement annulées.\n\n';
    }
    confirmMessage += 'Cette action est irréversible.';
    
    const confirmed = await showConfirm(confirmMessage, 'Supprimer le tournoi');
    
    if (!confirmed) {
        return;
    }
    
    try {
        showLoading(true);
        const response = await api.deleteTournament(tournamentId);
        
        if (response) {
            closeModal('editTournamentModal');
            showNotification('Tournoi supprimé avec succès !', 'success');
            await loadInitialData();
            if (getCurrentSection() === 'admin') {
                await loadAdminData();
            }
        } else {
            throw new Error('Erreur lors de la suppression');
        }
    } catch (error) {
        console.error('Erreur suppression tournoi:', error);
        showNotification(error.message || 'Erreur lors de la suppression du tournoi', 'error');
    } finally {
        showLoading(false);
    }
}

function openEditTournamentModal(tournamentId) {
    const tournament = tournaments.find(t => (t._id || t.id) === tournamentId);
    
    if (!tournament) {
        showNotification('Tournoi non trouvé', 'error');
        return;
    }
    
    const playerCount = tournament.currentPlayers || 0;
    
    // Remplir le formulaire avec les données du tournoi
    document.getElementById('editTournamentId').value = tournament._id || tournament.id;
    document.getElementById('editTournamentName').value = tournament.name;
    document.getElementById('editTournamentGame').value = tournament.game;
    
    // Séparer date et heure
    const tournamentDate = new Date(tournament.date);
    const dateStr = tournamentDate.toISOString().split('T')[0];
    const timeStr = tournamentDate.toTimeString().substring(0, 5);
    
    document.getElementById('editTournamentDate').value = dateStr;
    document.getElementById('editTournamentTime').value = timeStr;
    document.getElementById('editTournamentPrice').value = tournament.entryFee || 0;
    document.getElementById('editTournamentMaxPlayers').value = tournament.maxPlayers;
    document.getElementById('editTournamentDescription').value = tournament.description || '';
    
    // Remplir la date limite d'inscription si elle existe
    if (tournament.registrationDeadline) {
        const deadlineDate = new Date(tournament.registrationDeadline);
        // Format datetime-local: YYYY-MM-DDTHH:MM
        const deadlineStr = deadlineDate.toISOString().slice(0, 16);
        document.getElementById('editTournamentRegistrationDeadline').value = deadlineStr;
    } else {
        document.getElementById('editTournamentRegistrationDeadline').value = '';
    }
    
    // Gérer le bouton de suppression - toujours actif, avec avertissement si inscriptions
    const deleteBtn = document.getElementById('deleteTournamentBtn');
    if (deleteBtn) {
        deleteBtn.disabled = false;
        if (playerCount > 0) {
            deleteBtn.title = `Supprimer ce tournoi (${playerCount} inscription${playerCount > 1 ? 's' : ''} sera${playerCount > 1 ? 'nt' : ''} annulée${playerCount > 1 ? 's' : ''})`;
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i><span>Supprimer (' + playerCount + ' inscrit' + (playerCount > 1 ? 's' : '') + ')</span>';
        } else {
            deleteBtn.title = 'Supprimer ce tournoi définitivement';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i><span>Supprimer</span>';
        }
    }
    
    openModal('editTournamentModal');
}

function showTournamentDetails(tournamentId) {
    const tournament = tournaments.find(t => (t._id || t.id) === tournamentId);
    if (!tournament) {
        showNotification('Tournoi non trouvé', 'error');
        return;
    }

    // Remplir les détails du tournoi dans la modale
    document.getElementById('detailsTournamentName').textContent = tournament.name;
    document.getElementById('detailsTournamentGame').textContent = tournament.game;
    
    const dateStr = formatDate(tournament.date) + ' à ' + formatTime(tournament.date);
    document.getElementById('detailsTournamentDate').textContent = dateStr;
    
    const playerCount = tournament.currentPlayers || 0;
    document.getElementById('detailsTournamentPlayers').textContent = `${playerCount}/${tournament.maxPlayers} joueurs`;
    
    const price = tournament.entryFee ? tournament.entryFee.toFixed(2) + ' €' : 'Gratuit';
    document.getElementById('detailsTournamentPrice').textContent = price;
    
    const status = getTournamentStatusText(tournament);
    document.getElementById('detailsTournamentStatus').textContent = status;
    
    document.getElementById('detailsTournamentDescription').textContent = tournament.description || 'Aucune description disponible';
    
    // Configurer le bouton d'inscription
    const registerBtn = document.getElementById('detailsRegisterBtn');
    if (currentUser && status === 'À venir') {
        registerBtn.style.display = 'inline-flex';
        registerBtn.onclick = () => {
            closeModal('tournamentDetailsModal');
            registerForTournament(tournamentId);
        };
    } else {
        registerBtn.style.display = 'none';
    }
    
    // Ouvrir la modale
    openModal('tournamentDetailsModal');
}

function updateStats() {
    const totalTournaments = document.getElementById('totalTournaments');
    const totalGames = document.getElementById('totalGames');
    
    if (totalTournaments) {
        totalTournaments.textContent = tournaments.length;
    }
    
    if (totalGames) {
        const uniqueGames = [...new Set(tournaments.map(t => t.game))];
        totalGames.textContent = uniqueGames.length;
    }
}

function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

function showNotification(message, type, duration) {
    type = type || 'info';
    duration = duration || 5000;
    
    const notificationsContainer = document.getElementById('notifications');
    if (!notificationsContainer) {
        return;
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification ' + type;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    notification.innerHTML = '<div class="notification-icon">' +
            '<i class="' + (icons[type] || icons.info) + '"></i>' +
        '</div>' +
        '<div class="notification-content">' +
            '<div class="notification-message">' + message + '</div>' +
        '</div>' +
        '<button class="notification-close" data-action="close-notification">' +
            '<i class="fas fa-times"></i>' +
        '</button>';
    
    notificationsContainer.appendChild(notification);
    
    // Gestion du bouton de fermeture
    const closeBtn = notification.querySelector('[data-action="close-notification"]');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            notification.remove();
        });
    }
    
    setTimeout(function() {
        if (notification.parentElement) {
            notification.remove();
        }
    }, duration);
}

function showConfirm(message, title = 'Confirmation') {
    return new Promise((resolve) => {
        const confirmModal = document.getElementById('confirmModal');
        const confirmModalTitle = document.getElementById('confirmModalTitle');
        const confirmModalMessage = document.getElementById('confirmModalMessage');
        const confirmBtn = document.getElementById('confirmModalConfirm');
        const cancelBtn = document.getElementById('confirmModalCancel');
        
        if (!confirmModal) {
            // Fallback vers confirm natif si la modale n'existe pas
            resolve(confirm(message));
            return;
        }
        
        // Configurer la modale
        confirmModalTitle.textContent = title;
        confirmModalMessage.textContent = message;
        
        // Afficher la modale
        confirmModal.style.display = 'block';
        setTimeout(() => {
            confirmModal.classList.add('active');
        }, 10);
        
        // Gestionnaire pour la confirmation
        const handleConfirm = () => {
            cleanup();
            resolve(true);
        };
        
        // Gestionnaire pour l'annulation
        const handleCancel = () => {
            cleanup();
            resolve(false);
        };
        
        // Gestionnaire pour la touche Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
            }
        };
        
        // Fonction de nettoyage
        const cleanup = () => {
            confirmModal.classList.remove('active');
            setTimeout(() => {
                confirmModal.style.display = 'none';
            }, 300);
            
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            document.removeEventListener('keydown', handleEscape);
        };
        
        // Ajouter les event listeners
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        document.addEventListener('keydown', handleEscape);
        
        // Clic sur l'overlay pour annuler
        const overlay = confirmModal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', handleCancel, { once: true });
        }
    });
}

function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        navMenu.classList.toggle('mobile-active');
    }
}

function switchAdminTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    const activeContent = document.getElementById(`admin${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    if (activeContent) {
        activeContent.classList.add('active');
    }
}

function initEventListeners() {
    // Gestion des touches clavier
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                closeModal(activeModal.id);
            }
        }
    });
    
    // Fermeture des modales par clic sur le fond
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
    
    // Gestion des actions via data-action
    document.addEventListener('click', function(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        
        const action = target.dataset.action;
        
        switch(action) {
            case 'login':
                openModal('loginModal');
                break;
            case 'register':
                openModal('registerModal');
                break;
            case 'logout':
                logout();
                break;
            case 'theme':
                toggleTheme();
                break;
            case 'mobile-menu':
                toggleMobileMenu();
                break;
            case 'create-tournament':
                openModal('createTournamentModal');
                break;
            case 'calendar-prev':
                if (typeof changeMonth === 'function') changeMonth(-1);
                break;
            case 'calendar-next':
                if (typeof changeMonth === 'function') changeMonth(1);
                break;
            case 'switch-to-register':
                e.preventDefault();
                closeModal('loginModal');
                openModal('registerModal');
                break;
            case 'switch-to-login':
                e.preventDefault();
                closeModal('registerModal');
                openModal('loginModal');
                break;
        }
    });
    
    // Gestion de la fermeture des modales
    document.addEventListener('click', function(e) {
        const closeTarget = e.target.closest('[data-close-modal]');
        if (closeTarget) {
            const modalId = closeTarget.dataset.closeModal;
            closeModal(modalId);
        }
    });
    
    // Gestion des formulaires
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    const createTournamentForm = document.getElementById('createTournamentForm');
    if (createTournamentForm) {
        createTournamentForm.addEventListener('submit', handleCreateTournament);
    }
    
    const editTournamentForm = document.getElementById('editTournamentForm');
    if (editTournamentForm) {
        editTournamentForm.addEventListener('submit', handleEditTournament);
    }
    
    const deleteTournamentBtn = document.getElementById('deleteTournamentBtn');
    if (deleteTournamentBtn) {
        deleteTournamentBtn.addEventListener('click', handleDeleteTournament);
    }

    const tournamentSearch = document.getElementById('tournamentSearch');
    if (tournamentSearch) {
        tournamentSearch.addEventListener('input', function() {
            if (getCurrentSection() === 'tournaments') {
                applyTournamentFilters();
            }
        });
    }

    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            if (getCurrentSection() === 'tournaments') {
                applyTournamentFilters();
            }
        });
    });

    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchAdminTab(tabName);
        });
    });
}

window.toggleTheme = toggleTheme;
window.openModal = openModal;
window.closeModal = closeModal;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.logout = logout;
window.registerForTournament = registerForTournament;
window.cancelRegistration = cancelRegistration;
window.changeMonth = changeMonth;
window.handleCreateTournament = handleCreateTournament;
window.handleEditTournament = handleEditTournament;
window.handleDeleteTournament = handleDeleteTournament;
window.openEditTournamentModal = openEditTournamentModal;
window.showNotification = showNotification;
window.showConfirm = showConfirm;
window.toggleMobileMenu = toggleMobileMenu;
window.switchAdminTab = switchAdminTab;
window.applyTournamentFilters = applyTournamentFilters;
