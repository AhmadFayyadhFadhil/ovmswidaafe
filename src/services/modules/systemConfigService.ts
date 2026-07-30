import { apiClient } from '../api/api';
import type { SystemConfig } from '../../types';
import type { ApiResponse } from '../../types/api';

export const systemConfigService = {
  get: async (): Promise<ApiResponse<SystemConfig>> => {
    const res = await apiClient.get<ApiResponse<SystemConfig>>('/system-config');
    return res.data;
  },
  update: async (config: Partial<SystemConfig>): Promise<ApiResponse<SystemConfig>> => {
    const res = await apiClient.put<ApiResponse<SystemConfig>>('/system-config', config);
    return res.data;
  },
  uploadLogo: async (file: File): Promise<ApiResponse<{ logo_url: string }>> => {
    const formData = new FormData();
    formData.append('logo', file);
    const res = await apiClient.post<ApiResponse<{ logo_url: string }>>('/system-config/logo', formData);
    return res.data;
  },
  getStats: async (): Promise<ApiResponse<any>> => {
    const res = await apiClient.get<ApiResponse<any>>('/system-config/stats');
    return res.data;
  },
  purgeLogs: async (): Promise<ApiResponse<any>> => {
    const res = await apiClient.post<ApiResponse<any>>('/system-config/purge-logs');
    return res.data;
  },
  flushCache: async (): Promise<ApiResponse<any>> => {
    const res = await apiClient.post<ApiResponse<any>>('/system-config/flush-cache');
    return res.data;
  },
};
