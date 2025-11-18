async function loadCalendarData() {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthElement = document.getElementById('currentMonth');
    
    try {
        renderCalendar();
    } catch (error) {
        // Erreur dans renderCalendar()
    }
    
    try {
        renderCalendarEvents();
    } catch (error) {
        // Erreur dans renderCalendarEvents()
    }
}

function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthElement = document.getElementById('currentMonth');
    
    if (!calendarGrid || !currentMonthElement) {
        return;
    }
    
    if (typeof currentCalendarDate === 'undefined') {
        return;
    }
    
    const currentMonth = currentCalendarDate.getMonth();
    const currentYear = currentCalendarDate.getFullYear();
}