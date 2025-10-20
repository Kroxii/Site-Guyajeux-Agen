// ===============================================
// GUYAJEUX AGEN - APPLICATION PRINCIPALE
// ===============================================

// Variables globales
let currentUser = null;
let currentSection = 'home';
let tournaments = [];
let api = null;
let currentCalendarDate = new Date(); // Pour la navigation du calendrier

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
    console.log('📍 showSection appelé:', sectionName);
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    const targetSection = document.getElementById(sectionName);
    console.log('Section trouvée:', targetSection);
    if (targetSection) {
        targetSection.classList.add('active');
        console.log('Classe active ajoutée, classes:', targetSection.className);
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
            // Charger les tournois
            tournaments = await api.getTournaments() || [];
            console.log(' ' + tournaments.length + ' tournois chargés');
            
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
        console.log('📊 Statistiques chargées:', stats);
        
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

async function loadCalendarData() {
    console.log('🔄 Chargement des données du calendrier...');
    console.log('📋 Tournois disponibles:', tournaments.length, tournaments);
    
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthElement = document.getElementById('currentMonth');
    console.log('🔍 Éléments trouvés:', {
        calendarGrid: calendarGrid,
        currentMonth: currentMonthElement
    });
    
    try {
        renderCalendar();
        console.log('✅ renderCalendar() terminé');
    } catch (error) {
        console.error('❌ Erreur dans renderCalendar():', error);
    }
    
    try {
        renderCalendarEvents();
        console.log('✅ renderCalendarEvents() terminé');
    } catch (error) {
        console.error('❌ Erreur dans renderCalendarEvents():', error);
    }
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
        console.log('📊 loadAdminData appelé');
        console.log('Current user admin?', currentUser?.isAdmin);
        console.log('Tournaments:', tournaments);
        
        if (!currentUser || !currentUser.isAdmin || !api) {
            console.warn('⚠️ Accès refusé ou API non disponible');
            return;
        }
        
        const adminTournamentsList = document.getElementById('adminTournamentsList');
        console.log('Container admin tournois:', adminTournamentsList);
        
        if (adminTournamentsList) {
            renderAdminTournaments(adminTournamentsList, tournaments);
            console.log('✅ Tournois admin rendus');
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
            if (currentSection === 'home') {
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
    
    if (!confirm('Êtes-vous sûr de vouloir annuler votre inscription à ce tournoi ?')) {
        return;
    }
    
    try {
        showLoading(true);
        const response = await api.unregisterFromTournament(tournamentId);
        
        if (response.success) {
            showNotification('Désinscription réussie !', 'success');
            await loadInitialData();
            if (currentSection === 'tournaments') {
                await loadTournamentsData();
            }
            if (currentSection === 'home') {
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
        
        const response = await api.createTournament(tournamentData);
        
        if (response) {
            closeModal('createTournamentModal');
            event.target.reset();
            showNotification('Tournoi créé avec succès !', 'success');
            await loadInitialData();
            if (currentSection === 'admin') {
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
        
        const tournamentData = {
            name: formData.get('name'),
            game: formData.get('game'),
            date: dateTime.toISOString(),
            entryFee: parseFloat(formData.get('price')),
            maxPlayers: parseInt(formData.get('maxPlayers')),
            description: formData.get('description')
        };
        
        const response = await api.updateTournament(tournamentId, tournamentData);
        
        if (response) {
            closeModal('editTournamentModal');
            showNotification('Tournoi modifié avec succès !', 'success');
            await loadInitialData();
            if (currentSection === 'admin') {
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
    let confirmMessage = 'Êtes-vous sûr de vouloir supprimer ce tournoi ?\n';
    if (playerCount > 0) {
        confirmMessage += `\n⚠️ ATTENTION : Ce tournoi a ${playerCount} joueur${playerCount > 1 ? 's' : ''} inscrit${playerCount > 1 ? 's' : ''}.\n`;
        confirmMessage += 'La suppression sera impossible tant que des joueurs sont inscrits.\n\n';
        confirmMessage += 'Vous devez d\'abord annuler toutes les inscriptions.';
    } else {
        confirmMessage += '\nCette action est irréversible.';
    }
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        showLoading(true);
        const response = await api.deleteTournament(tournamentId);
        
        if (response) {
            closeModal('editTournamentModal');
            showNotification('Tournoi supprimé avec succès !', 'success');
            await loadInitialData();
            if (currentSection === 'admin') {
                await loadAdminData();
            }
        } else {
            throw new Error('Erreur lors de la suppression');
        }
    } catch (error) {
        console.error('Erreur suppression tournoi:', error);
        
        // Gestion spécifique de l'erreur d'inscriptions
        if (error.message && error.message.includes('inscriptions')) {
            showNotification(
                `❌ Impossible de supprimer ce tournoi.\n\n` +
                `Ce tournoi a des joueurs inscrits. Vous devez d'abord annuler toutes les inscriptions avant de pouvoir le supprimer.\n\n` +
                `Nombre de joueurs inscrits : ${playerCount}`,
                'error'
            );
        } else {
            showNotification(error.message || 'Erreur lors de la suppression du tournoi', 'error');
        }
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
    
    // Gérer le bouton de suppression en fonction des inscriptions
    const deleteBtn = document.getElementById('deleteTournamentBtn');
    if (deleteBtn) {
        if (playerCount > 0) {
            deleteBtn.disabled = true;
            deleteBtn.title = `Impossible de supprimer : ${playerCount} joueur${playerCount > 1 ? 's' : ''} inscrit${playerCount > 1 ? 's' : ''}`;
            deleteBtn.innerHTML = '<i class="fas fa-lock"></i><span>Suppression bloquée (' + playerCount + ' inscrit' + (playerCount > 1 ? 's' : '') + ')</span>';
        } else {
            deleteBtn.disabled = false;
            deleteBtn.title = 'Supprimer ce tournoi définitivement';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i><span>Supprimer</span>';
        }
    }
    
    openModal('editTournamentModal');
}

function showTournamentDetails(tournamentId) {
    const tournament = tournaments.find(t => (t._id || t.id) === tournamentId);
    if (tournament) {
        showNotification('Détails de ' + tournament.name + ' - ' + tournament.game, 'info');
    }
}

function renderCalendar() {
    console.log('🎯 DÉBUT renderCalendar()');
    
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthElement = document.getElementById('currentMonth');
    
    console.log('🔍 Dans renderCalendar, éléments:', {
        grid: calendarGrid,
        month: currentMonthElement
    });
    
    if (!calendarGrid || !currentMonthElement) {
        console.warn('⚠️ Éléments du calendrier non trouvés');
        return;
    }
    
    const currentMonth = currentCalendarDate.getMonth();
    const currentYear = currentCalendarDate.getFullYear();
    
    console.log('📅 Rendu du calendrier:', {
        mois: currentMonth + 1,
        année: currentYear,
        date: currentCalendarDate.toLocaleDateString('fr-FR')
    });
    
    currentMonthElement.textContent = currentCalendarDate.toLocaleDateString('fr-FR', { 
        month: 'long', 
        year: 'numeric' 
    }).replace(/^\w/, c => c.toUpperCase());
    
    // Premier jour du mois
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    // Calculer le jour de la semaine du premier jour (0 = dimanche, 6 = samedi)
    let firstDayOfWeek = firstDayOfMonth.getDay();
    
    // Calculer la date de début (premier dimanche à afficher)
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfWeek);
    
    console.log('📊 Infos calendrier:', {
        premierJourDuMois: firstDayOfMonth.toLocaleDateString('fr-FR'),
        dernierJourDuMois: lastDayOfMonth.toLocaleDateString('fr-FR'),
        premierJourSemaine: firstDayOfWeek,
        dateDebut: startDate.toLocaleDateString('fr-FR')
    });
    
    let calendarHTML = '';
    
    // En-têtes des jours
    const dayHeaders = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    dayHeaders.forEach(day => {
        calendarHTML += '<div class="calendar-day-header">' + day.substring(0, 3) + '</div>';
    });
    
    // Générer 6 semaines (42 jours)
    let eventCount = 0;
    for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const isCurrentMonth = currentDate.getMonth() === currentMonth;
        const isToday = currentDate.toDateString() === new Date().toDateString();
        const dayTournaments = getTournamentsForDate(currentDate);
        const hasEvent = dayTournaments.length > 0;
        
        if (hasEvent) eventCount++;
        
        let classes = 'calendar-day';
        if (!isCurrentMonth) classes += ' other-month';
        if (isToday) classes += ' today';
        if (hasEvent) classes += ' has-event';
        
        let eventHTML = '';
        if (hasEvent && isCurrentMonth) {
            eventHTML = '<div class="event-indicator">' + dayTournaments.length + '</div>';
        }
        
        calendarHTML += '<div class="' + classes + '" data-date="' + currentDate.toISOString() + '" title="' + currentDate.toLocaleDateString('fr-FR') + '">' +
                '<span class="day-number">' + currentDate.getDate() + '</span>' +
                eventHTML +
            '</div>';
    }
    
    console.log('✅ Calendrier généré:', {
        totalJours: 42,
        joursAvecEvenements: eventCount
    });
    
    calendarGrid.innerHTML = calendarHTML;
    
    // Ajouter les event listeners après le rendu
    calendarGrid.querySelectorAll('.calendar-day').forEach(day => {
        day.addEventListener('click', function() {
            selectCalendarDay(this.dataset.date);
        });
    });
    
    // Mettre à jour la liste des événements du mois
    renderCalendarEvents();
}

function getTournamentsForDate(date) {
    const dateString = date.toDateString();
    return tournaments.filter(tournament => 
        new Date(tournament.date).toDateString() === dateString
    );
}

function renderCalendarEvents() {
    const eventsList = document.getElementById('calendarEventsList');
    if (!eventsList) return;
    
    const currentMonth = currentCalendarDate.getMonth();
    const currentYear = currentCalendarDate.getFullYear();
    
    // Filtrer les tournois du mois en cours
    const monthTournaments = tournaments.filter(tournament => {
        const tournamentDate = new Date(tournament.date);
        return tournamentDate.getMonth() === currentMonth && 
               tournamentDate.getFullYear() === currentYear;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (monthTournaments.length === 0) {
        eventsList.innerHTML = '<p class="no-events">Aucun événement ce mois-ci</p>';
        return;
    }
    
    eventsList.innerHTML = monthTournaments.map(tournament => {
        const tournamentId = tournament._id || tournament.id;
        const tournamentDate = new Date(tournament.date);
        const dayOfWeek = tournamentDate.toLocaleDateString('fr-FR', { weekday: 'long' });
        const dayNum = tournamentDate.getDate();
        const price = tournament.entryFee ? tournament.entryFee.toFixed(2) + ' €' : 'Gratuit';
        
        return '<div class="calendar-event-item" data-tournament-id="' + tournamentId + '">' +
            '<div class="event-date">' +
                '<span class="event-day">' + dayNum + '</span>' +
                '<span class="event-weekday">' + dayOfWeek + '</span>' +
            '</div>' +
            '<div class="event-details">' +
                '<h4 class="event-title">' + tournament.name + '</h4>' +
                '<p class="event-game"><i class="fas fa-gamepad"></i> ' + tournament.game + '</p>' +
                '<div class="event-info">' +
                    '<span><i class="fas fa-clock"></i> ' + formatTime(tournament.date) + '</span>' +
                    '<span><i class="fas fa-users"></i> ' + (tournament.currentPlayers || 0) + '/' + tournament.maxPlayers + '</span>' +
                    '<span><i class="fas fa-euro-sign"></i> ' + price + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="event-actions">' +
                '<button class="btn btn-sm btn-primary view-event-btn" data-tournament-id="' + tournamentId + '">' +
                    '<i class="fas fa-eye"></i> Voir' +
                '</button>' +
            '</div>' +
        '</div>';
    }).join('');
    
    // Ajouter les event listeners
    eventsList.querySelectorAll('.view-event-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            showTournamentDetails(this.dataset.tournamentId);
        });
    });
    
    eventsList.querySelectorAll('.calendar-event-item').forEach(item => {
        item.addEventListener('click', function() {
            showTournamentDetails(this.dataset.tournamentId);
        });
    });
}

function changeMonth(offset) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + offset);
    renderCalendar();
    renderCalendarEvents();
}

function hasCalendarEvent(date) {
    const dateString = date.toDateString();
    return tournaments.some(tournament => 
        new Date(tournament.date).toDateString() === dateString
    );
}

function selectCalendarDay(dateString) {
    const date = new Date(dateString);
    const dayEvents = getTournamentsForDate(date);
    
    if (dayEvents.length === 0) {
        showNotification('Aucun événement ce jour', 'info');
        return;
    }
    
    // Créer un message avec tous les événements du jour
    let message = `📅 ${dayEvents.length} événement${dayEvents.length > 1 ? 's' : ''} le ${date.toLocaleDateString('fr-FR')} :\n\n`;
    
    dayEvents.forEach((event, index) => {
        message += `${index + 1}. ${event.name} (${event.game})\n`;
        message += `   🕐 ${formatTime(event.date)}\n`;
        message += `   👥 ${event.currentPlayers || 0}/${event.maxPlayers} joueurs\n\n`;
    });
    
    showNotification(message, 'info');
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

function showAdminPanel() {
    console.log('🔧 showAdminPanel appelé');
    console.log('Current user:', currentUser);
    navigateToSection('admin');
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
    
    const editTournamentForm = document.getElementById('editTournamentForm');
    if (editTournamentForm) {
        editTournamentForm.addEventListener('submit', handleEditTournament);
    }
    
    const deleteTournamentBtn = document.getElementById('deleteTournamentBtn');
    if (deleteTournamentBtn) {
        deleteTournamentBtn.addEventListener('click', handleDeleteTournament);
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
window.cancelRegistration = cancelRegistration;
window.changeMonth = changeMonth;
window.handleCreateTournament = handleCreateTournament;
window.handleEditTournament = handleEditTournament;
window.handleDeleteTournament = handleDeleteTournament;
window.openEditTournamentModal = openEditTournamentModal;
window.showNotification = showNotification;
window.toggleMobileMenu = toggleMobileMenu;
