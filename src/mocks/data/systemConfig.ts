import type { SystemConfig } from "@/types";

export const initialSystemConfig: SystemConfig = {
  systemName: "OVMS Enterprise Hub",
  timezone: "UTC (Coordinated Universal Time)",
  dateFormat: "MM/DD/YYYY",
  systemLanguage: "English (United States)",
  companyName: "Global Logistics Solutions Inc.",
  supportEmail: "support@gls-logistics.com",
  hqAddress: "1200 Enterprise Way, Tech District, San Francisco, CA 94105",
  mfaEnabled: true,
  sessionTimeout: 30,
  loginRetryLimit: "5 Attempts",
  ipWhitelist: "10.42.100.5, 10.42.100.12, 192.174.4.21",
  advancedEncryption: true
};
