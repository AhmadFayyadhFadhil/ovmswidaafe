/**
 * Centralized Utility to format dates & times consistently across the entire application
 * Reading user preferences (dateFormat, timezone, systemLanguage) from System Settings (localStorage)
 */

export interface SystemConfigStorage {
  systemName?: string;
  companyName?: string;
  companyLogo?: string;
  timezone?: string;
  dateFormat?: string;
  systemLanguage?: string;
}

export function getStoredSystemConfig(): SystemConfigStorage {
  try {
    const raw = localStorage.getItem("ovms_system_config");
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback safely
  }
  return {
    timezone: "GMT +7 (Western Indonesia Time)",
    dateFormat: "DD/MM/YYYY",
    systemLanguage: "Bahasa Indonesia",
  };
}

const MONTH_NAMES_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const MONTH_NAMES_EN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function formatDate(
  dateInput: string | Date | null | undefined,
  includeTime: boolean = false,
  customFormat?: string
): string {
  if (!dateInput) return '-';
  try {
    let d: Date;
    if (typeof dateInput === 'string') {
      let cleanStr = dateInput.trim();
      if (/^\d{2}\/\d{2}\/\d{4}/.test(cleanStr)) {
        const [dPart, tPart] = cleanStr.split(' ');
        const [day, month, year] = dPart.split('/');
        cleanStr = `${year}-${month}-${day}${tPart ? 'T' + tPart : ''}`;
      } else if (/^\d{2}-\d{2}-\d{4}/.test(cleanStr)) {
        const [dPart, tPart] = cleanStr.split(' ');
        const [day, month, year] = dPart.split('-');
        cleanStr = `${year}-${month}-${day}${tPart ? 'T' + tPart : ''}`;
      }
      d = new Date(cleanStr);
    } else {
      d = dateInput;
    }

    if (isNaN(d.getTime())) return String(dateInput);

    const config = getStoredSystemConfig();
    const fmt = customFormat || config.dateFormat || "DD/MM/YYYY";
    const isEn = config.systemLanguage === "English";
    const monthNames = isEn ? MONTH_NAMES_EN : MONTH_NAMES_ID;

    // Timezone Offset Calculation relative to WIB (GMT+7 baseline)
    const tzStr = config.timezone || "GMT +7";
    let hourOffset = 0;
    if (tzStr.includes("+8") || tzStr.includes("WITA")) {
      hourOffset = 1;
    } else if (tzStr.includes("+9") || tzStr.includes("WIT")) {
      hourOffset = 2;
    } else if (tzStr.includes("+0") || tzStr.includes("UTC")) {
      hourOffset = -7;
    }

    if (hourOffset !== 0) {
      d = new Date(d.getTime() + hourOffset * 3600 * 1000);
    }

    const dayNum = d.getDate();
    const day = String(dayNum).padStart(2, '0');
    const monthIndex = d.getMonth();
    const month = String(monthIndex + 1).padStart(2, '0');
    const year = d.getFullYear();
    const monthName = monthNames[monthIndex] || month;

    let formattedDate = `${day}/${month}/${year}`;
    if (fmt === "YYYY-MM-DD") {
      formattedDate = `${year}-${month}-${day}`;
    } else if (fmt === "DD MMM YYYY") {
      formattedDate = `${dayNum} ${monthName} ${year}`;
    } else if (fmt === "MM/DD/YYYY") {
      formattedDate = `${month}/${day}/${year}`;
    }

    if (includeTime) {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${formattedDate} ${hours}:${minutes}`;
    }

    return formattedDate;
  } catch {
    return String(dateInput);
  }
}

export function formatDateTime(dateInput: string | Date | null | undefined): string {
  return formatDate(dateInput, true);
}
