import type { SystemConfig } from '../../types';
import type { ApiResponse } from '../../types/api';

const DEFAULT_CONFIG: SystemConfig = {
  systemName: "OVMS Enterprise",
  timezone: "UTC+07:00 (Asia/Jakarta)",
  dateFormat: "YYYY-MM-DD",
  systemLanguage: "Bahasa Indonesia",
  companyName: "OVMS Logistics Corp",
  supportEmail: "support@ovms.test",
  hqAddress: "Kawasan Industri Subang, Jawa Barat, Indonesia",
  mfaEnabled: true,
  sessionTimeout: 60,
  loginRetryLimit: "5 Attempts",
  ipWhitelist: "192.168.1.1/24, 10.0.0.1/16",
  advancedEncryption: true,
};

function getStoredConfig(): SystemConfig {
  const stored = localStorage.getItem('ovms_system_config');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  localStorage.setItem('ovms_system_config', JSON.stringify(DEFAULT_CONFIG));
  return DEFAULT_CONFIG;
}

export const systemConfigService = {
  get: async (): Promise<ApiResponse<SystemConfig>> => {
    const config = getStoredConfig();
    return {
      data: config
    };
  },
  update: async (config: Partial<SystemConfig>): Promise<ApiResponse<SystemConfig>> => {
    const current = getStoredConfig();
    const updated = { ...current, ...config };
    localStorage.setItem('ovms_system_config', JSON.stringify(updated));
    return {
      data: updated
    };
  },
};

