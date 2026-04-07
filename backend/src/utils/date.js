/**
 * Returns the school year range (July 1st to June 30th) for a given date.
 * If no date is provided, the current date is used.
 * @param {Date|string} date 
 * @returns {{ start: Date, end: Date }}
 */
export function getSchoolYearRange(date = new Date()) {
    // Si se pasa un número de 4 dígitos, tratarlo como el año
    let d
    if (typeof date === 'number' && date > 1900 && date < 2100) {
        d = new Date(`${date}-01-01T12:00:00`)
    } else {
        d = new Date(date)
    }
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
        start: new Date(`${startYear}-07-01T00:00:00`),
        end: new Date(`${endYear}-06-30T23:59:59`)
    }
}
