/**
 * Centralized Utility to format dates consistently across the entire application as DD/MM/YYYY or DD/MM/YYYY HH:mm
 */
export function formatDate(dateInput: string | Date | null | undefined, includeTime: boolean = false): string {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    if (includeTime) {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateInput);
  }
}

export function formatDateTime(dateInput: string | Date | null | undefined): string {
  return formatDate(dateInput, true);
}
