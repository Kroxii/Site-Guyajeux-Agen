// ===============================================
// GUYAJEUX AGEN - MODULE CALENDRIER
// ===============================================

/**
 * Charge les données du calendrier
 */
async function loadCalendarData() {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthElement = document.getElementById('currentMonth');
    
    try {
        renderCalendar();
    } catch (error) {
        console.error('❌ Erreur dans renderCalendar():', error);
    }
    
    try {
        renderCalendarEvents();
    } catch (error) {
        console.error('❌ Erreur dans renderCalendarEvents():', error);
    }
}

/**
 * Affiche le calendrier du mois en cours
 */
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthElement = document.getElementById('currentMonth');
    
    if (!calendarGrid || !currentMonthElement) {
        return;
    }
    
    // Utilise la variable globale currentCalendarDate de app.js
    if (typeof currentCalendarDate === 'undefined') {
        console.error('currentCalendarDate n\'est pas définie');
        return;
    }
    
    const currentMonth = currentCalendarDate.getMonth();
    const currentYear = currentCalendarDate.getFullYear();
    
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

/**
 * Récupère les tournois pour une date donnée
 */
function getTournamentsForDate(date) {
    // Accès à la variable globale tournaments depuis app.js
    if (typeof tournaments === 'undefined') {
        return [];
    }
    
    const dateString = date.toDateString();
    return tournaments.filter(tournament => 
        new Date(tournament.date).toDateString() === dateString
    );
}

/**
 * Affiche la liste des événements du mois
 */
function renderCalendarEvents() {
    const eventsList = document.getElementById('calendarEventsList');
    if (!eventsList) return;
    
    // Accès à la variable globale tournaments depuis app.js
    if (typeof tournaments === 'undefined') {
        eventsList.innerHTML = '<p class="no-events">Aucun événement disponible</p>';
        return;
    }
    
    // Utilise la variable globale currentCalendarDate de app.js
    if (typeof currentCalendarDate === 'undefined') {
        console.error('currentCalendarDate n\'est pas définie');
        return;
    }
    
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
            // Utilise la fonction globale showTournamentDetails de app.js
            if (typeof showTournamentDetails === 'function') {
                showTournamentDetails(this.dataset.tournamentId);
            }
        });
    });
    
    eventsList.querySelectorAll('.calendar-event-item').forEach(item => {
        item.addEventListener('click', function() {
            // Utilise la fonction globale showTournamentDetails de app.js
            if (typeof showTournamentDetails === 'function') {
                showTournamentDetails(this.dataset.tournamentId);
            }
        });
    });
}

/**
 * Change le mois affiché dans le calendrier
 * @param {number} offset - Décalage (1 pour mois suivant, -1 pour mois précédent)
 */
function changeMonth(offset) {
    // Utilise la variable globale currentCalendarDate de app.js
    if (typeof currentCalendarDate !== 'undefined') {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + offset);
        renderCalendar();
        renderCalendarEvents();
    }
}

/**
 * Vérifie si une date a des événements
 * @param {Date} date - Date à vérifier
 * @returns {boolean}
 */
function hasCalendarEvent(date) {
    if (typeof tournaments === 'undefined') {
        return false;
    }
    
    const dateString = date.toDateString();
    return tournaments.some(tournament => 
        new Date(tournament.date).toDateString() === dateString
    );
}

/**
 * Sélectionne un jour du calendrier et affiche ses événements
 * @param {string} dateString - Date au format ISO
 */
function selectCalendarDay(dateString) {
    const date = new Date(dateString);
    const dayEvents = getTournamentsForDate(date);
    
    if (dayEvents.length === 0) {
        // Utilise la fonction globale showNotification de app.js
        if (typeof showNotification === 'function') {
            showNotification('Aucun événement ce jour', 'info');
        }
        return;
    }
    
    // Créer un message avec tous les événements du jour
    let message = `📅 ${dayEvents.length} événement${dayEvents.length > 1 ? 's' : ''} le ${date.toLocaleDateString('fr-FR')} :\n\n`;
    
    dayEvents.forEach((event, index) => {
        message += `${index + 1}. ${event.name} (${event.game})\n`;
        message += `   🕐 ${formatTime(event.date)}\n`;
        message += `   👥 ${event.currentPlayers || 0}/${event.maxPlayers} joueurs\n\n`;
    });
    
    // Utilise la fonction globale showNotification de app.js
    if (typeof showNotification === 'function') {
        showNotification(message, 'info');
    }
}

// Export des fonctions pour utilisation globale
window.loadCalendarData = loadCalendarData;
window.renderCalendar = renderCalendar;
window.renderCalendarEvents = renderCalendarEvents;
window.changeMonth = changeMonth;
window.getTournamentsForDate = getTournamentsForDate;
window.hasCalendarEvent = hasCalendarEvent;
window.selectCalendarDay = selectCalendarDay;
