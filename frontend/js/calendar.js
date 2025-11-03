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

function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthElement = document.getElementById('currentMonth');
    
    if (!calendarGrid || !currentMonthElement) {
        return;
    }
    
    if (typeof currentCalendarDate === 'undefined') {
        console.error('currentCalendarDate n\'est pas définie');
        return;
    }
    
    const currentMonth = currentCalendarDate.getMonth();
    const currentYear = currentCalendarDate.getFullYear();
}