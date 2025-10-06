let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];
const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
function initCalendar() {
    renderCalendar();
}
// Changer de mois
function changeMonth(direction) {
    currentMonth += direction;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}
// Afficher le calendrier
function renderCalendar() {
    const calendar = document.getElementById('calendar-grid');
    const monthTitle = document.getElementById('currentMonth');
    if (!calendar || !monthTitle) return;
    // Mettre à jour le titre du mois
    monthTitle.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    // Vider le calendrier
    calendar.innerHTML = '';
    // Ajouter les en-têtes des jours
    dayNames.forEach(dayName => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = dayName;
        calendar.appendChild(header);
    });
    // Calculer le premier jour du mois et le nombre de jours
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    // Calculer les jours du mois précédent à afficher
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
    // Ajouter les jours du mois précédent
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayElement = createDayElement(day, prevMonth, prevYear, true);
        calendar.appendChild(dayElement);
    }
    // Ajouter les jours du mois courant
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = createDayElement(day, currentMonth, currentYear, false);
        calendar.appendChild(dayElement);
    }
    // Ajouter les jours du mois suivant pour compléter la grille
    const totalCells = calendar.children.length - 7; // -7 pour les en-têtes
    const remainingCells = 42 - totalCells; // 6 semaines * 7 jours = 42 cellules
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = createDayElement(day, nextMonth, nextYear, true);
        calendar.appendChild(dayElement);
    }
}
// Créer un élément jour du calendrier
function createDayElement(day, month, year, isOtherMonth) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    if (isOtherMonth) {
        dayElement.classList.add('other-month');
    }
    // Vérifier si c'est aujourd'hui
    const today = new Date();
    if (!isOtherMonth && 
        day === today.getDate() && 
        month === today.getMonth() && 
        year === today.getFullYear()) {
        dayElement.classList.add('today');
    }
    // Créer le numéro du jour
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayElement.appendChild(dayNumber);
    // Ajouter les tournois de ce jour
    const dayTournaments = getTournamentsForDay(day, month, year);
    if (dayTournaments.length > 0) {
        const tournamentsContainer = document.createElement('div');
        tournamentsContainer.className = 'day-tournaments';
        dayTournaments.forEach(tournament => {
            const badge = document.createElement('div');
            badge.className = 'tournament-badge';
            badge.textContent = tournament.name.length > 15 ? 
                tournament.name.substring(0, 15) + '...' : tournament.name;
            badge.onclick = (e) => {
                e.stopPropagation();
                showTournamentDetails(tournament._id || tournament.id);
            };
            tournamentsContainer.appendChild(badge);
        });
        dayElement.appendChild(tournamentsContainer);
    }
    // Ajouter un gestionnaire de clic pour créer un tournoi (admin seulement)
    dayElement.onclick = () => {
        if (currentUser && currentUser.isAdmin) {
            openTournamentCreationModal(day, month, year);
        }
    };
    return dayElement;
}
// Obtenir les tournois pour un jour donné
function getTournamentsForDay(day, month, year) {
    return tournaments.filter(tournament => {
        const tournamentDate = new Date(tournament.date);
        return tournamentDate.getDate() === day &&
               tournamentDate.getMonth() === month &&
               tournamentDate.getFullYear() === year;
    });
}
// Ouvrir le modal de création de tournoi (pour les admins)
function openTournamentCreationModal(day, month, year) {
    const date = new Date(year, month, day);
    const formattedDate = date.toISOString().slice(0, 16); // Format pour datetime-local
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <h3>Créer un tournoi</h3>
        <form onsubmit="createTournamentFromCalendar(event)">
            <div class="form-group">
                <label for="quickTournamentName">Nom du tournoi :</label>
                <input type="text" id="quickTournamentName" required>
            </div>
            <div class="form-group">
                <label for="quickTournamentDate">Date et heure :</label>
                <input type="datetime-local" id="quickTournamentDate" value="${formattedDate}" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="quickTournamentMaxPlayers">Nombre max de joueurs :</label>
                    <input type="number" id="quickTournamentMaxPlayers" min="2" value="8" required>
                </div>
                <div class="form-group">
                    <label for="quickTournamentGame">Jeu :</label>
                    <input type="text" id="quickTournamentGame" required>
                </div>
            </div>
            <div class="form-group">
                <label for="quickTournamentDescription">Description :</label>
                <textarea id="quickTournamentDescription" rows="3"></textarea>
            </div>
            <button type="submit" class="btn-primary">Créer le tournoi</button>
            <button type="button" class="btn-secondary" onclick="closeModal()">Annuler</button>
        </form>
    `;
    showModal();
}
// Créer un tournoi depuis le calendrier
function createTournamentFromCalendar(event) {
    event.preventDefault();
    if (!currentUser || !currentUser.isAdmin) {
        showMessage('Accès refusé', 'error');
        return;
    }
    const name = document.getElementById('quickTournamentName').value;
    const date = document.getElementById('quickTournamentDate').value;
    const maxPlayers = parseInt(document.getElementById('quickTournamentMaxPlayers').value);
    const game = document.getElementById('quickTournamentGame').value;
    const description = document.getElementById('quickTournamentDescription').value;
    if (!name || !date || !maxPlayers || !game) {
        showMessage('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    const tournament = {
        id: 'tournament-' + Date.now(),
        name: name,
        date: date,
        maxPlayers: maxPlayers,
        currentPlayers: 0,
        game: game,
        description: description,
        participants: []
    };
    tournaments.push(tournament);
    saveData();
    showMessage('Tournoi créé avec succès !', 'success');
    closeModal();
    renderCalendar();
    // Mettre à jour les autres sections si nécessaires
    if (document.getElementById('home').classList.contains('active')) {
        loadHomeTournaments();
    }
}
// Navigation rapide par année
function goToYear(year) {
    currentYear = year;
    renderCalendar();
}
// Navigation rapide par mois
function goToMonth(month) {
    currentMonth = month;
    renderCalendar();
}
// Aller à aujourd'hui
function goToToday() {
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
    renderCalendar();
}
// Fonctions utilitaires pour le calendrier
function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}
function getDaysInMonth(month, year) {
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month === 1 && isLeapYear(year)) {
        return 29;
    }
    return daysInMonth[month];
}

