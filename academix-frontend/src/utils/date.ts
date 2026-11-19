export const formatDateHe = (date?: string | Date | null): string => {
  if (!date) return "";                     // ערך ריק אם אין תאריך
  const d = typeof date === "string" ? new Date(date) : date;
  // מקומי עברי – מחזיר `dd.mm.yyyy` (לדוגמה 22.10.2025)
  return d.toLocaleDateString("he-IL");
};