/**
 * Returns the school year range (July 1st to June 30th) for a given date.
 * If no date is provided, the current date is used.
 * @param {Date|string} date 
 * @returns {{ start: Date, end: Date }}
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
            start: new Date(`${startYear}-07-01T00:00:00`),
            end: new Date(`${endYear}-06-30T23:59:59`)
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
        start: new Date(`${startYear}-07-01T00:00:00`),
        end: new Date(`${endYear}-06-30T23:59:59`)
    }
}

/**
 * Returns the range for the calendar month of a given date.
 */
export function getMonthRange(date = new Date()) {
    const d = new Date(date);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
}

/**
 * Returns the range for the ISO week (Monday to Sunday) of a given date.
 */
export function getWeekRange(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
}
