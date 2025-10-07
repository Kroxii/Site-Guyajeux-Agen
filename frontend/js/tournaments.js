async function createTournament(event) {
    event.preventDefault();
    if (!currentUser || !currentUser.isAdmin) {
        showMessage('Accès refusé. Vous devez être administrateur.', 'error');
        return;
    }
    const name = document.getElementById('tournamentName').value;
    const date = document.getElementById('tournamentDate').value;
    const maxPlayers = parseInt(document.getElementById('tournamentMaxPlayers').value);
    const game = document.getElementById('tournamentGame').value;
    const description = document.getElementById('tournamentDescription').value;
    
    // Validation côté client (la vraie validation se fait côté serveur)
    if (!name || !date || !maxPlayers || !game) {
        showMessage('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    if (maxPlayers < 2) {
        showMessage('Le nombre minimum de joueurs est 2', 'error');
        return;
    }
    if (maxPlayers > 100) {
        showMessage('Le nombre maximum de joueurs est 100', 'error');
        return;
    }
    
    // Validation de date améliorée
    const tournamentDate = new Date(date);
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    // Vérifier que la date est valide
    if (isNaN(tournamentDate.getTime())) {
        showMessage('Date invalide', 'error');
        return;
    }
    
    // Vérifier que la date n'est pas dans le passé (avec marge d'1 heure)
    if (tournamentDate < oneHourFromNow) {
        showMessage('Le tournoi doit être programmé au moins 1 heure à l\'avance', 'error');
        return;
    }
    
    // Vérifier que la date n'est pas trop éloignée (max 1 an)
    if (tournamentDate > oneYearFromNow) {
        showMessage('Le tournoi ne peut pas être programmé plus d\'un an à l\'avance', 'error');
        return;
    }
    
    // Vérifier qu'il n'y a pas déjà un tournoi avec le même nom à la même date
    const existingTournament = tournaments.find(t => 
        t.name.toLowerCase() === name.toLowerCase() && 
        new Date(t.date).toDateString() === tournamentDate.toDateString()
    );
    if (existingTournament) {
        showMessage('Un tournoi avec ce nom existe déjà à cette date', 'error');
        return;
    }
    
    try {
        // Créer le tournoi via l'API
        const tournamentData = {
            name: name,
            date: date,
            maxPlayers: maxPlayers,
            game: game,
            description: description
        };
        
        const newTournament = await api.createTournament(tournamentData);
        
        showMessage('Tournoi créé avec succès !', 'success');
        
        // Réinitialiser le formulaire
        document.getElementById('tournamentName').value = '';
        document.getElementById('tournamentDate').value = '';
        document.getElementById('tournamentMaxPlayers').value = '';
        document.getElementById('tournamentGame').value = '';
        document.getElementById('tournamentDescription').value = '';
        
        // Recharger les données
        await loadData();
        loadAdminTournaments();
        
        // Mettre à jour le calendrier si visible
        if (document.getElementById('calendar').classList.contains('active')) {
            renderCalendar();
        }
    } catch (error) {
        console.error('Erreur lors de la création du tournoi:', error);
        showMessage('Erreur lors de la création du tournoi: ' + error.message, 'error');
    }
}
// Charger les tournois pour l'administration
function loadAdminTournaments() {
    const container = document.getElementById('adminTournamentsList');
    if (!container) return;
    if (tournaments.length === 0) {
        container.innerHTML = '<p>Aucun tournoi créé pour le moment.</p>';
        return;
    }
    // Trier les tournois par date
    const sortedTournaments = [...tournaments].sort((a, b) => new Date(a.date) - new Date(b.date));
    container.innerHTML = sortedTournaments.map(tournament => {
        const tournamentDate = new Date(tournament.date);
        const now = new Date();
        const isPast = tournamentDate < now;
        return `
            <div class="admin-tournament-card ${isPast ? 'past-tournament' : ''}">
                <div class="admin-tournament-header">
                    <div>
                        <h4>${tournament.name}</h4>
                        <div class="tournament-info">
                            <span><i class="fas fa-calendar"></i> ${formatDate(tournament.date)}</span>
                            <span><i class="fas fa-clock"></i> ${formatTime(tournament.date)}</span>
                            <span><i class="fas fa-gamepad"></i> ${tournament.game}</span>
                            <span><i class="fas fa-users"></i> ${tournament.currentPlayers}/${tournament.maxPlayers} joueurs</span>
                            ${isPast ? '<span class="tournament-status past"><i class="fas fa-history"></i> Terminé</span>' : ''}
                        </div>
                    </div>
                    <div class="admin-tournament-actions">
                        <button class="btn-edit" onclick="editTournament('${tournament._id}')">
                            <i class="fas fa-edit"></i> Modifier
                        </button>
                        <button class="btn-delete" onclick="deleteTournament('${tournament._id}')">
                            <i class="fas fa-trash"></i> Supprimer
                        </button>
                    </div>
                </div>
                <p>${tournament.description}</p>
                ${tournament.participants.length > 0 ? 
                    `<div class="admin-participants">
                        <strong>Participants :</strong> ${tournament.participants.join(', ')}
                    </div>` : ''
                }
            </div>
        `;
    }).join('');
}
// Éditer un tournoi
function editTournament(tournamentId) {
    const tournament = tournaments.find(t => t._id === tournamentId);
    if (!tournament) return;
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <h3>Modifier le tournoi</h3>
        <form onsubmit="updateTournament(event, '${tournamentId}')">
            <div class="form-group">
                <label for="editTournamentName">Nom du tournoi :</label>
                <input type="text" id="editTournamentName" value="${tournament.name}" required>
            </div>
            <div class="form-group">
                <label for="editTournamentDate">Date et heure :</label>
                <input type="datetime-local" id="editTournamentDate" value="${tournament.date}" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="editTournamentMaxPlayers">Nombre max de joueurs :</label>
                    <input type="number" id="editTournamentMaxPlayers" min="${tournament.currentPlayers}" value="${tournament.maxPlayers}" required>
                </div>
                <div class="form-group">
                    <label for="editTournamentGame">Jeu :</label>
                    <input type="text" id="editTournamentGame" value="${tournament.game}" required>
                </div>
            </div>
            <div class="form-group">
                <label for="editTournamentDescription">Description :</label>
                <textarea id="editTournamentDescription" rows="3">${tournament.description}</textarea>
            </div>
            <div class="form-group">
                <p><strong>Participants inscrits :</strong> ${tournament.currentPlayers}</p>
                <p><small>Note: Vous ne pouvez pas réduire le nombre maximum de places en dessous du nombre de participants actuels.</small></p>
            </div>
            <button type="submit" class="btn-primary">Mettre à jour</button>
            <button type="button" class="btn-secondary" onclick="closeModal()">Annuler</button>
        </form>
    `;
    showModal();
}
// Mettre à jour un tournoi
async function updateTournament(event, tournamentId) {
    event.preventDefault();
    const tournament = tournaments.find(t => t._id === tournamentId);
    if (!tournament) return;
    
    const name = document.getElementById('editTournamentName').value;
    const date = document.getElementById('editTournamentDate').value;
    const maxPlayers = parseInt(document.getElementById('editTournamentMaxPlayers').value);
    const game = document.getElementById('editTournamentGame').value;
    const description = document.getElementById('editTournamentDescription').value;
    
    // Validation
    if (!name || !date || !maxPlayers || !game) {
        showMessage('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    if (maxPlayers < tournament.currentPlayers) {
        showMessage(`Vous ne pouvez pas réduire le nombre de places en dessous de ${tournament.currentPlayers} (nombre de participants actuels)`, 'error');
        return;
    }
    
    try {
        // Mettre à jour le tournoi via l'API
        const tournamentData = {
            name: name,
            date: date,
            maxPlayers: maxPlayers,
            game: game,
            description: description
        };
        
        await api.updateTournament(tournamentId, tournamentData);
        
        showMessage('Tournoi mis à jour avec succès !', 'success');
        closeModal();
        
        // Recharger les données
        await loadData();
        loadAdminTournaments();
        
        // Mettre à jour les autres sections si nécessaires
        if (document.getElementById('calendar').classList.contains('active')) {
            renderCalendar();
        }
        if (document.getElementById('home').classList.contains('active')) {
            loadHomeTournaments();
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du tournoi:', error);
        showMessage('Erreur lors de la mise à jour du tournoi: ' + error.message, 'error');
    }
}
async function deleteTournament(tournamentId) {
    const tournament = tournaments.find(t => t._id === tournamentId);
    if (!tournament) return;
    
    const confirmDelete = confirm(
        `Êtes-vous sûr de vouloir supprimer le tournoi "${tournament.name}" ?\n\n` +
        `${tournament.currentPlayers} participants sont inscrits à ce tournoi.\n` +
        `Cette action est irréversible.`
    );
    if (!confirmDelete) return;
    
    try {
        // Supprimer le tournoi via l'API
        await api.deleteTournament(tournamentId);
        
        showMessage('Tournoi supprimé avec succès', 'success');
        
        // Recharger les données
        await loadData();
        loadAdminTournaments();
        
        // Mettre à jour les autres sections si nécessaires
        if (document.getElementById('calendar').classList.contains('active')) {
            renderCalendar();
        }
        if (document.getElementById('home').classList.contains('active')) {
            loadHomeTournaments();
        }
        if (document.getElementById('tournaments').classList.contains('active')) {
            loadMyTournaments();
        }
    } catch (error) {
        console.error('Erreur lors de la suppression du tournoi:', error);
        showMessage('Erreur lors de la suppression du tournoi: ' + error.message, 'error');
    }
}

// Exporter les données des tournois (pour sauvegarde)
function exportTournaments() {
    if (!currentUser || !currentUser.isAdmin) {
        showMessage('Accès refusé', 'error');
        return;
    }
    const data = {
        tournaments: tournaments,
        users: users.map(user => ({ // Exporter sans les mots de passe
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin
        })),
        registrations: userRegistrations,
        exportDate: new Date().toISOString()
    };
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `guyajeux-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    showMessage('Données exportées avec succès', 'success');
}
// Obtenir les statistiques des tournois via l'API
async function getTournamentStats() {
    try {
        const response = await api.request('/tournaments/stats');
        return response.data.stats;
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        // Retourner des stats par défaut en cas d'erreur
        return {
            totalTournaments: 0,
            upcomingTournaments: 0,
            pastTournaments: 0,
            totalRegistrations: 0,
            averageParticipants: 0
        };
    }
}
// Afficher les statistiques
async function showStats() {
    if (!currentUser || !currentUser.isAdmin) {
        showMessage('Accès refusé', 'error');
        return;
    }
    
    try {
        const stats = await getTournamentStats();
        const usersResponse = await api.getUsers();
        const totalUsers = usersResponse.length || 0;
        
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <h3>Statistiques des tournois</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>${stats.totalTournaments}</h4>
                    <p>Tournois créés</p>
                </div>
                <div class="stat-card">
                    <h4>${stats.upcomingTournaments}</h4>
                    <p>Tournois à venir</p>
                </div>
                <div class="stat-card">
                    <h4>${stats.pastTournaments}</h4>
                    <p>Tournois terminés</p>
                </div>
                <div class="stat-card">
                    <h4>${stats.totalRegistrations}</h4>
                    <p>Inscriptions totales</p>
                </div>
                <div class="stat-card">
                    <h4>${stats.averageParticipants}</h4>
                    <p>Participants moyens</p>
                </div>
                <div class="stat-card">
                    <h4>${totalUsers}</h4>
                    <p>Utilisateurs inscrits</p>
                </div>
            </div>
            <div class="stats-actions">
                <button class="btn-primary" onclick="exportTournaments()">
                    <i class="fas fa-download"></i> Exporter les données
                </button>
                <button class="btn-secondary" onclick="closeModal()">Fermer</button>
            </div>
        `;
        showModal();
    } catch (error) {
        console.error('Erreur lors de l\'affichage des statistiques:', error);
        showMessage('Erreur lors du chargement des statistiques', 'error');
    }
}
// Rechercher dans les tournois
function searchTournaments(query) {
    if (!query) return tournaments;
    const searchTerms = query.toLowerCase().split(' ');
    return tournaments.filter(tournament => {
        const searchableText = (
            tournament.name + ' ' +
            tournament.game + ' ' +
            tournament.description + ' ' +
            formatDate(tournament.date)
        ).toLowerCase();
        return searchTerms.every(term => searchableText.includes(term));
    });
}
// Filtrer les tournois par jeu
function filterTournamentsByGame(game) {
    if (!game) return tournaments;
    return tournaments.filter(tournament => tournament.game.toLowerCase().includes(game.toLowerCase()));
}
// Obtenir la liste unique des jeux
function getUniqueGames() {
    const games = tournaments.map(t => t.game);
    return [...new Set(games)].sort();
}

