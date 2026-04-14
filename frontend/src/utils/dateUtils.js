/**
 * Returns the school year range (July 1st to June 30th) for a given date.
 * @param {Date|string} date 
 * @returns {{ start: Date, end: Date, label: string }}
 */
export function getSchoolYearRange(date = new Date()) {
    // Si se pasa un año explícito (número o string YYYY), usarlo como inicio del ciclo.
    const numericYear = Number(date)
    const isExplicitYear =
        (typeof date === 'number' && Number.isInteger(date) && date > 1900 && date < 2100) ||
        (typeof date === 'string' && /^\d{4}$/.test(date) && numericYear > 1900 && numericYear < 2100)

    if (isExplicitYear) {
        const startYear = numericYear
        const endYear = startYear + 1
        return {
            start: new Date(startYear, 6, 1, 0, 0, 0),
            end: new Date(endYear, 5, 30, 23, 59, 59),
            label: `${startYear}-${endYear}`
        }
    }

    const d = new Date(date)
    const month = d.getMonth() + 1 // 1-12
    const year = d.getFullYear()

    let startYear, endYear
    if (month < 7) {
        startYear = year - 1
        endYear = year
    } else {
        startYear = year
        endYear = year + 1
    }

    return {
        start: new Date(startYear, 6, 1, 0, 0, 0), // July is 6 (0-indexed)
        end: new Date(endYear, 5, 30, 23, 59, 59), // June is 5 (0-indexed)
        label: `${startYear}-${endYear}`
    }
}

/**
 * Formats a date to DD/MM/YYYY
 * @param {Date|string} date 
 * @returns {string}
 */
export function formatDateToDDMMYYYY(date) {
    if (!date) return ''
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    
    const day = String(d.getUTCDate()).padStart(2, '0')
    const month = String(d.getUTCMonth() + 1).padStart(2, '0')
    const year = d.getUTCFullYear()
    
    return `${day}/${month}/${year}`
}

/**
 * Formats a date to "DD de Mes de YYYY"
 * @param {Date|string} date 
 * @returns {string}
 */
export function formatLongDate(date) {
    if (!date) return ''
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    
    return d.toLocaleDateString('es-EC', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric',
        timeZone: 'UTC'
    })
}
/**
 * Returns the range for the calendar month of a given date.
 */
export function getMonthRange(date = new Date()) {
    const d = new Date(date);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    
    const formatDate = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    return { 
        start: formatDate(start), 
        end: formatDate(end) 
    };
}

/**
 * Returns the range for the ISO week (Monday to Sunday) of a given date.
 */
export function getISOWeekRange(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const formatDate = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    return { 
        start: formatDate(start), 
        end: formatDate(end) 
    };
}

/**
 * Returns the range for the current calendar quarter.
 */
export function getQuarterRange(date = new Date()) {
    const d = new Date(date);
    const quarter = Math.floor(d.getMonth() / 3);
    const start = new Date(d.getFullYear(), quarter * 3, 1);
    const end = new Date(d.getFullYear(), (quarter + 1) * 3, 0);

    const formatDate = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    return { 
        start: formatDate(start), 
        end: formatDate(end) 
    };
}
