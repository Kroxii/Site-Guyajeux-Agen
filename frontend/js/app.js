let currentUser = null;
let tournaments = [];
let userRegistrations = [];
const api = new ApiService();

document.addEventListener('DOMContentLoaded', async function() {
    // Vérifier si un utilisateur est connecté
    await checkAuth();
    // Charger les données depuis l'API
    await loadData();
    // Charger les tournois de la semaine et du mois
    loadHomeTournaments();
    // Initialiser le calendrier
    initCalendar();
});

// Gestion des données via API
async function loadData() {
    try {
        // Charger les tournois depuis l'API
        tournaments = await api.getTournaments();
        
        // Charger les inscriptions de l'utilisateur connecté
        if (currentUser) {
            userRegistrations = await api.getMyRegistrations();
        }
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        showMessage('Erreur lors du chargement des données', 'error');
    }
}

// Les tournois d'exemple sont maintenant créés via l'API backend
function getTournamentGameName(index) {
    const games = ['Magic: The Gathering', 'Yu-Gi-Oh!', 'Pokémon', 'Warhammer 40k', 'Échecs'];
    return games[index % games.length];
}
// Gestion des sections
function showSection(sectionName) {
    // Cacher toutes les sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    // Afficher la section demandée
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        // Actions spécifiques selon la section
        switch(sectionName) {
            case 'home':
                loadHomeTournaments();
                break;
            case 'calendar':
                renderCalendar();
                break;
            case 'tournaments':
                loadMyTournaments();
                break;
            case 'admin':
                if (currentUser && currentUser.isAdmin) {
                    loadAdminTournaments();
                } else {
                    showMessage('Accès refusé. Vous devez être administrateur.', 'error');
                    showSection('home');
                }
                break;
        }
    }
}
// Charger les tournois de la page d'accueil
async function loadHomeTournaments() {
    try {
        // Charger les tournois de la semaine et du mois via l'API
        const weeklyTournaments = await api.getWeeklyTournaments();
        const monthlyTournaments = await api.getMonthlyTournaments();
        
        displayTournamentSection('weeklyTournaments', weeklyTournaments, 'Aucun tournoi prévu cette semaine.');
        displayTournamentSection('monthlyTournaments', monthlyTournaments, 'Aucun tournoi prévu ce mois-ci.');
    } catch (error) {
        console.error('Erreur lors du chargement des tournois d\'accueil:', error);
        // Afficher des sections vides en cas d'erreur
        displayTournamentSection('weeklyTournaments', [], 'Erreur lors du chargement des tournois.');
        displayTournamentSection('monthlyTournaments', [], 'Erreur lors du chargement des tournois.');
    }
}

// Fonction pour afficher une section de tournois
function displayTournamentSection(containerId, tournamentList, emptyMessage) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (tournamentList.length === 0) {
        container.innerHTML = `<p>${emptyMessage}</p>`;
        return;
    }
    
    renderTournamentGrid(containerId, tournamentList.slice(0, containerId === 'weeklyTournaments' ? 3 : 6));
}

// Afficher une grille de tournois
function renderTournamentGrid(containerId, tournamentList) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (tournamentList.length === 0) {
        container.innerHTML = '<p>Aucun tournoi programmé pour cette période.</p>';
        return;
    }
    container.innerHTML = tournamentList.map(tournament => `
        <div class="tournament-card" onclick="showTournamentDetails('${tournament._id}')">
            <h4>${tournament.name}</h4>
            <div class="tournament-info">
                <span><i class="fas fa-calendar"></i> ${formatDate(tournament.date)}</span>
                <span><i class="fas fa-gamepad"></i> ${tournament.game}</span>
                <span><i class="fas fa-users"></i> ${tournament.currentPlayers}/${tournament.maxPlayers} joueurs</span>
                <span><i class="fas fa-clock"></i> ${formatTime(tournament.date)}</span>
            </div>
            <p>${tournament.description}</p>
            ${tournament.currentPlayers < tournament.maxPlayers ? 
                '<div class="tournament-status available">Places disponibles</div>' : 
                '<div class="tournament-status full">Complet</div>'
            }
        </div>
    `).join('');
}
// Charger mes tournois
async function loadMyTournaments() {
    const container = document.getElementById('myTournaments');
    if (!currentUser) {
        container.innerHTML = '<p class="login-required">Connectez-vous pour voir vos inscriptions.</p>';
        return;
    }
    
    try {
        const myRegistrations = await api.getMyRegistrations();
        
        if (myRegistrations.length === 0) {
            container.innerHTML = '<p>Vous n\'êtes inscrit à aucun tournoi.</p>';
            return;
        }
        
        container.innerHTML = myRegistrations.map(registration => {
            const tournament = registration.tournament;
            const tournamentDate = new Date(tournament.date);
            const now = new Date();
            const isPast = tournamentDate < now;
            
            return `
                <div class="my-tournament-card ${isPast ? 'past-tournament' : ''}">
                    <div class="tournament-header">
                        <h4>${tournament.name}</h4>
                        <div class="tournament-info">
                            <span><i class="fas fa-calendar"></i> ${formatDate(tournament.date)}</span>
                            <span><i class="fas fa-clock"></i> ${formatTime(tournament.date)}</span>
                            <span><i class="fas fa-gamepad"></i> ${tournament.game}</span>
                            ${isPast ? '<span class="tournament-status past"><i class="fas fa-history"></i> Terminé</span>' : '<span class="tournament-status registered"><i class="fas fa-check"></i> Inscrit</span>'}
                        </div>
                    </div>
                    <p>${tournament.description}</p>
                    ${!isPast ? `
                        <div class="tournament-actions">
                            <button class="btn-danger" onclick="unregisterFromTournament('${tournament._id}')">
                                <i class="fas fa-times"></i> Se désinscrire
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Erreur lors du chargement de mes tournois:', error);
        container.innerHTML = '<p>Erreur lors du chargement de vos inscriptions.</p>';
    }
}

// Afficher les détails d'un tournoi dans un modal
async function showTournamentDetails(tournamentId) {
    try {
        const tournament = await api.getTournament(tournamentId);
        
        let isRegistered = false;
        if (currentUser) {
            const myRegistrations = await api.getMyRegistrations();
            isRegistered = myRegistrations.some(reg => reg.tournament._id === tournamentId);
        }
        
        const canRegister = currentUser && !isRegistered && tournament.currentPlayers < tournament.maxPlayers;
        
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <h3>${tournament.name}</h3>
            <div class="tournament-details">
                <div class="tournament-info-detailed">
                    <p><i class="fas fa-calendar"></i> <strong>Date :</strong> ${formatDate(tournament.date)}</p>
                    <p><i class="fas fa-clock"></i> <strong>Heure :</strong> ${formatTime(tournament.date)}</p>
                    <p><i class="fas fa-gamepad"></i> <strong>Jeu :</strong> ${tournament.game}</p>
                    <p><i class="fas fa-users"></i> <strong>Participants :</strong> ${tournament.currentPlayers}/${tournament.maxPlayers}</p>
                </div>
                <div class="tournament-description">
                    <p><strong>Description :</strong></p>
                    <p>${tournament.description}</p>
                </div>
                <div class="tournament-actions">
                    ${canRegister ? 
                        `<button class="btn-primary" onclick="registerForTournament('${tournament._id}')">
                            <i class="fas fa-plus"></i> S'inscrire
                        </button>` : ''
                    }
                    ${isRegistered ? 
                        `<button class="btn-danger" onclick="unregisterFromTournament('${tournament._id}')">
                            <i class="fas fa-minus"></i> Se désinscrire
                        </button>` : ''
                    }
                    ${!currentUser ? 
                        '<p class="login-required">Connectez-vous pour vous inscrire</p>' : ''
                    }
                    ${tournament.currentPlayers >= tournament.maxPlayers && !isRegistered ? 
                        '<p class="tournament-full">Tournoi complet</p>' : ''
                    }
                </div>
            </div>
            <button class="btn-secondary" onclick="closeModal()">Fermer</button>
        `;
        showModal();
    } catch (error) {
        console.error('Erreur lors du chargement des détails du tournoi:', error);
        showMessage('Erreur lors du chargement des détails du tournoi', 'error');
    }
}

// Gestion du modal
function showModal() {
    document.getElementById('tournamentModal').classList.add('active');
}
function closeModal() {
    document.getElementById('tournamentModal').classList.remove('active');
}
// Inscription à un tournoi
async function registerForTournament(tournamentId) {
    if (!currentUser) {
        showMessage('Vous devez être connecté pour vous inscrire', 'error');
        return;
    }
    
    try {
        await api.registerForTournament(tournamentId);
        showMessage('Inscription réussie !', 'success');
        closeModal();
        
        // Recharger les données
        await loadData();
        
        // Mettre à jour les sections actives
        const activeSection = document.querySelector('.section.active');
        if (activeSection) {
            const sectionId = activeSection.id;
            if (sectionId === 'home') {
                loadHomeTournaments();
            } else if (sectionId === 'tournaments') {
                loadMyTournaments();
            }
        }
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        showMessage('Erreur lors de l\'inscription: ' + error.message, 'error');
    }
}

// Désinscription d'un tournoi
async function unregisterFromTournament(tournamentId) {
    if (!currentUser) {
        showMessage('Vous devez être connecté', 'error');
        return;
    }
    
    const confirmUnregister = confirm('Êtes-vous sûr de vouloir vous désinscrire de ce tournoi ?');
    if (!confirmUnregister) return;
    
    try {
        await api.unregisterFromTournament(tournamentId);
        showMessage('Désinscription réussie', 'success');
        closeModal();
        
        // Recharger les données
        await loadData();
        
        // Mettre à jour les sections actives
        const activeSection = document.querySelector('.section.active');
        if (activeSection) {
            const sectionId = activeSection.id;
            if (sectionId === 'home') {
                loadHomeTournaments();
            } else if (sectionId === 'tournaments') {
                loadMyTournaments();
            }
        }
    } catch (error) {
        console.error('Erreur lors de la désinscription:', error);
        showMessage('Erreur lors de la désinscription: ' + error.message, 'error');
    }
}

// Afficher un message
function showMessage(text, type) {
    // Supprimer les anciens messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    // Créer le nouveau message
    const message = document.createElement('div');
    message.className = "message " + type;
    message.textContent = text;
    // Ajouter au début de la section active
    const activeSection = document.querySelector('.section.active .container');
    if (activeSection) {
        activeSection.insertBefore(message, activeSection.firstChild);
        // Supprimer automatiquement après 5 secondes
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 5000);
    }
}

// Fonctions utilitaires
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

