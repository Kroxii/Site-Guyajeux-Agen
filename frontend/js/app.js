// ===============================================
// GUYAJEUX AGEN - APPLICATION PRINCIPALE
// ===============================================

// Variables globales
let currentUser = null;
let currentSection = 'home';
let tournaments = [];
let api = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log(' Initialisation de l\'application Guyajeux Agen');
    
    try {
        api = new ApiService();
        console.log(' API Service initialisé');
        
        initTheme();
        initNavigation();
        await checkAuthentication();
        await loadInitialData();
        initEventListeners();
        showSection('home');
        
        console.log(' Application initialisée avec succès');
        
    } catch (error) {
        console.error(' Erreur lors de l\'initialisation:', error);
        showNotification('Erreur lors de l\'initialisation de l\'application', 'error');
    }
});

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

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavClick);
    });
}

function handleNavClick(e) {
    e.preventDefault();
    const section = e.target.closest('.nav-link').getAttribute('data-section');
    if (section) {
        navigateToSection(section);
    }
}

function navigateToSection(sectionName) {
    updateNavigation(sectionName);
    showSection(sectionName);
    loadSectionData(sectionName);
}

function updateNavigation(activeSection) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === activeSection) {
            link.classList.add('active');
        }
    });
    currentSection = activeSection;
}

function showSection(sectionName) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

async function loadSectionData(sectionName) {
    try {
        switch (sectionName) {
            case 'home':
                await loadHomeData();
                break;
            case 'calendar':
                await loadCalendarData();
                break;
            case 'tournaments':
                await loadTournamentsData();
                break;
            case 'admin':
                if (currentUser && currentUser.isAdmin) {
                    await loadAdminData();
                } else {
                    showNotification('Accès refusé. Vous devez être administrateur.', 'error');
                    navigateToSection('home');
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
        const token = localStorage.getItem('authToken');
        const savedUser = localStorage.getItem('currentUser');
        
        console.log('🔐 Vérification authentification...', { hasToken: !!token, hasSavedUser: !!savedUser });
        
        if (token && savedUser && api) {
            // Restaurer le token dans l'API
            api.token = token;
            
            try {
                // Vérifier que le token est toujours valide
                const user = await api.getCurrentUser();
                if (user) {
                    currentUser = user;
                    // Mettre à jour le localStorage avec les données fraîches
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    console.log('✅ Utilisateur connecté:', user.name);
                    updateAuthUI(true);
                    return true;
                }
            } catch (error) {
                // Token invalide ou expiré
                console.warn('⚠️ Token invalide:', error.message);
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
            }
        } else if (savedUser && !api) {
            // API pas encore initialisée, restaurer temporairement depuis le cache
            try {
                currentUser = JSON.parse(savedUser);
                console.log('📦 Utilisateur restauré depuis le cache:', currentUser.name);
                updateAuthUI(true);
                return true;
            } catch (error) {
                console.error('Erreur parsing savedUser:', error);
            }
        }
    } catch (error) {
        console.error('❌ Erreur authentification:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
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
        
        console.log('🔐 Tentative de connexion pour:', email);
        
        const response = await api.login(email, password);
        
        console.log('📥 Réponse login:', response);
        
        if (response.success) {
            // Le token et l'utilisateur sont déjà sauvegardés dans api.login()
            currentUser = response.data.user;
            
            console.log('✅ Connexion réussie:', currentUser.name);
            console.log('💾 Token sauvegardé:', !!localStorage.getItem('authToken'));
            
            updateAuthUI(true);
            closeModal('loginModal');
            showNotification(`Bienvenue ${currentUser.name} !`, 'success');
            
            // Recharger les données si nécessaire
            if (currentSection === 'tournaments') {
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
        
        console.log('Données d\'inscription:', userData);
        
        if (userData.password !== userData.confirmPassword) {
            throw new Error('Les mots de passe ne correspondent pas');
        }
        
        if (userData.password.length < 6) {
            throw new Error('Le mot de passe doit contenir au moins 6 caractères');
        }
        
        console.log('Envoi de la requête d\'inscription...');
        const response = await api.register(userData.name, userData.email, userData.password);
        console.log('Réponse reçue:', response);
        
        if (response.success) {
            // Le token et l'utilisateur sont déjà sauvegardés dans api.register()
            currentUser = response.data.user;
            
            console.log('✅ Inscription réussie:', currentUser.name);
            console.log('💾 Token sauvegardé:', !!localStorage.getItem('authToken'));
            
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
    console.log('🚪 Déconnexion...');
    
    try {
        if (api) {
            await api.logout();
        }
    } catch (error) {
        console.error('Erreur logout:', error);
    } finally {
        // Nettoyer complètement la session
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        api.token = null;
        currentUser = null;
        
        console.log('✅ Session nettoyée');
        
        updateAuthUI(false);
        showNotification('Vous avez été déconnecté', 'info');
        navigateToSection('home');
    }
}

async function loadInitialData() {
    showLoading(true);
    
    try {
        if (api) {
            tournaments = await api.getTournaments() || [];
            console.log(' ' + tournaments.length + ' tournois chargés');
        }
    } catch (error) {
        console.error('Erreur chargement initial:', error);
        showNotification('Erreur lors du chargement des données', 'error');
        tournaments = [];
    } finally {
        showLoading(false);
    }
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

async function loadCalendarData() {
    renderCalendar();
}

async function loadTournamentsData() {
    try {
        const tournamentsGrid = document.getElementById('tournamentsGrid');
        if (tournamentsGrid) {
            renderTournamentsGrid(tournamentsGrid, tournaments);
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
        if (!currentUser || !currentUser.isAdmin || !api) return;
        
        const adminTournamentsList = document.getElementById('adminTournamentsList');
        if (adminTournamentsList) {
            renderAdminTournaments(adminTournamentsList, tournaments);
        }
    } catch (error) {
        console.error('Erreur chargement admin:', error);
    }
}

function renderTournamentsGrid(container, tournamentsList) {
    if (!container) return;
    
    if (tournamentsList.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Aucun tournoi disponible.</p>';
        return;
    }
    
    container.innerHTML = tournamentsList.map(tournament => createTournamentCard(tournament)).join('');
}

function createTournamentCard(tournament) {
    const tournamentId = tournament._id || tournament.id;
    
    return '<div class="tournament-card" onclick="showTournamentDetails(\'' + tournamentId + '\')">' +
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
        return '<button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); registerForTournament(\'' + tournamentId + '\')">' +
                '<i class="fas fa-plus"></i>' +
                '<span>S\'inscrire</span>' +
            '</button>' +
            '<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); showTournamentDetails(\'' + tournamentId + '\')">' +
                '<i class="fas fa-info-circle"></i>' +
                '<span>Détails</span>' +
            '</button>';
    } else {
        return '<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); openModal(\'loginModal\')">' +
                '<i class="fas fa-sign-in-alt"></i>' +
                '<span>Se connecter</span>' +
            '</button>' +
            '<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); showTournamentDetails(\'' + tournamentId + '\')">' +
                '<i class="fas fa-info-circle"></i>' +
                '<span>Détails</span>' +
            '</button>';
    }
}

function renderUserRegistrations(container, registrations) {
    container.innerHTML = registrations.map(registration => 
        '<div class="registration-card">' +
            '<h4>' + registration.tournamentName + '</h4>' +
            '<p>Date: ' + formatDate(registration.tournamentDate) + '</p>' +
            '<p>Statut: ' + registration.status + '</p>' +
            '<button class="btn btn-danger btn-sm" onclick="cancelRegistration(\'' + registration._id + '\')">' +
                'Annuler l\'inscription' +
            '</button>' +
        '</div>'
    ).join('');
}

function renderAdminTournaments(container, tournamentsList) {
    container.innerHTML = tournamentsList.map(tournament => 
        '<div class="admin-tournament-item">' +
            '<div class="tournament-info">' +
                '<h4>' + tournament.name + '</h4>' +
                '<p>' + tournament.game + ' - ' + formatDate(tournament.date) + '</p>' +
                '<p>' + (tournament.currentPlayers || 0) + '/' + tournament.maxPlayers + ' joueurs</p>' +
            '</div>' +
            '<div class="admin-actions">' +
                '<button class="btn btn-ghost btn-sm" onclick="editTournament(\'' + tournament._id + '\')">' +
                    '<i class="fas fa-edit"></i>' +
                    'Modifier' +
                '</button>' +
                '<button class="btn btn-danger btn-sm" onclick="deleteTournament(\'' + tournament._id + '\')">' +
                    '<i class="fas fa-trash"></i>' +
                    'Supprimer' +
                '</button>' +
            '</div>' +
        '</div>'
    ).join('');
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
            if (currentSection === 'tournaments') {
                await loadTournamentsData();
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

async function handleCreateTournament(event) {
    event.preventDefault();
    
    if (!currentUser || !currentUser.isAdmin) {
        showNotification('Accès refusé', 'error');
        return;
    }
    
    try {
        showLoading(true);
        const formData = new FormData(event.target);
        const tournamentData = {
            name: formData.get('name'),
            game: formData.get('game'),
            date: formData.get('date'),
            maxPlayers: parseInt(formData.get('maxPlayers')),
            description: formData.get('description')
        };
        
        const response = await api.createTournament(tournamentData);
        
        if (response.success) {
            closeModal('createTournamentModal');
            showNotification('Tournoi créé avec succès !', 'success');
            await loadInitialData();
            if (currentSection === 'admin') {
                await loadAdminData();
            }
        } else {
            throw new Error(response.message || 'Erreur lors de la création');
        }
    } catch (error) {
        console.error('Erreur création tournoi:', error);
        showNotification(error.message || 'Erreur lors de la création du tournoi', 'error');
    } finally {
        showLoading(false);
    }
}

function showTournamentDetails(tournamentId) {
    const tournament = tournaments.find(t => (t._id || t.id) === tournamentId);
    if (tournament) {
        showNotification('Détails de ' + tournament.name + ' - ' + tournament.game, 'info');
    }
}

function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthElement = document.getElementById('currentMonth');
    
    if (!calendarGrid || !currentMonthElement) return;
    
    const date = new Date();
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    
    currentMonthElement.textContent = date.toLocaleDateString('fr-FR', { 
        month: 'long', 
        year: 'numeric' 
    });
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    let calendarHTML = '';
    
    const dayHeaders = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    dayHeaders.forEach(day => {
        calendarHTML += '<div class="calendar-day-header">' + day + '</div>';
    });
    
    for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const isCurrentMonth = currentDate.getMonth() === currentMonth;
        const isToday = currentDate.toDateString() === new Date().toDateString();
        const hasEvent = hasCalendarEvent(currentDate);
        
        let classes = 'calendar-day';
        if (!isCurrentMonth) classes += ' other-month';
        if (isToday) classes += ' today';
        if (hasEvent) classes += ' has-event';
        
        calendarHTML += '<div class="' + classes + '" onclick="selectCalendarDay(\'' + currentDate.toISOString() + '\')">' +
                '<span class="day-number">' + currentDate.getDate() + '</span>' +
                (hasEvent ? '<div class="event-indicator"></div>' : '') +
            '</div>';
    }
    
    calendarGrid.innerHTML = calendarHTML;
}

function hasCalendarEvent(date) {
    const dateString = date.toDateString();
    return tournaments.some(tournament => 
        new Date(tournament.date).toDateString() === dateString
    );
}

function selectCalendarDay(dateString) {
    const date = new Date(dateString);
    const dayEvents = tournaments.filter(tournament => 
        new Date(tournament.date).toDateString() === date.toDateString()
    );
    
    if (dayEvents.length > 0) {
        showNotification(dayEvents.length + ' événement(s) ce jour', 'info');
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getTournamentStatus(tournament) {
    const now = new Date();
    const tournamentDate = new Date(tournament.date);
    
    if (tournamentDate < now) {
        return 'finished';
    } else if (Math.abs(tournamentDate - now) < 24 * 60 * 60 * 1000) {
        return 'ongoing';
    } else {
        return 'upcoming';
    }
}

function getTournamentStatusText(tournament) {
    const status = getTournamentStatus(tournament);
    switch (status) {
        case 'finished': return 'Terminé';
        case 'ongoing': return 'En cours';
        case 'upcoming': return 'À venir';
        default: return 'À venir';
    }
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
        console.log('Notification ' + type + ': ' + message);
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

function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        navMenu.classList.toggle('mobile-active');
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
            case 'admin':
                showAdminPanel();
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
}

window.toggleTheme = toggleTheme;
window.navigateToSection = navigateToSection;
window.openModal = openModal;
window.closeModal = closeModal;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.logout = logout;
window.registerForTournament = registerForTournament;
window.handleCreateTournament = handleCreateTournament;
window.showNotification = showNotification;
window.toggleMobileMenu = toggleMobileMenu;
