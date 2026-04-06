/**
 * Returns the school year range (July 1st to June 30th) for a given date.
 * @param {Date|string} date 
 * @returns {{ start: Date, end: Date, label: string }}
 */
export function getSchoolYearRange(date = new Date()) {
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
    
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    
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
    
    return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })
}
