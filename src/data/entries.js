const modules = import.meta.glob('./entries/*.json', { eager: true });
const allEntries = Object.values(modules).map(m => m.default).sort((a, b) => new Date(b.date) - new Date(a.date));
export function getAllDates() { return allEntries.map(e => e.date); }
export function getLatestDate() { return allEntries.length > 0 ? allEntries[0].date : null; }
export function getEntry(date) { return allEntries.find(e => e.date === date) || null; }
export function formatDate(s) { return new Date(s+'T12:00:00').toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}); }
export function formatDateShort(s) { return new Date(s+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
export function getMonthYear(s) { return new Date(s+'T12:00:00').toLocaleDateString('en-US',{year:'numeric',month:'long'}); }
