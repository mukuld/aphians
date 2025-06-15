export const formatToDDMMYYYY = (date) => {
  if (!date) return null;
  let d;
  // If date is a string in YYYY-MM-DD format, parse it explicitly as UTC
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    d = new Date(`${date}T00:00:00.000Z`); // Treat as UTC date
  } else {
    d = new Date(date); // Handle Date objects or other formats
  }
  if (isNaN(d.getTime())) return null;
  const day = String(d.getUTCDate()).padStart(2, '0'); // Use UTC to avoid timezone shifts
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`; // Changed to DD/MM/YYYY
};

export const parseFromDDMMYYYY = (dateStr) => {
  if (!dateStr || dateStr.length !== 8) return null;
  const day = dateStr.substring(0, 2);
  const month = dateStr.substring(2, 4);
  const year = dateStr.substring(4, 8);
  const date = new Date(`${year}-${month}-${day}`);
  return isNaN(date.getTime()) ? null : date;
};