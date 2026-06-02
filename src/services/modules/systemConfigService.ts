import { apiClient } from '../api/api';
import type { SystemConfig } from '../../types';
import type { ApiResponse } from '../../types/api';
import { ENDPOINTS } from '../../constants/endpoints';

export const systemConfigService = {
  get: async (): Promise<ApiResponse<SystemConfig>> => {
    const res = await apiClient.get<ApiResponse<SystemConfig>>(ENDPOINTS.SYSTEM_CONFIG);
    return res.data;
  },
  update: async (config: Partial<SystemConfig>): Promise<ApiResponse<SystemConfig>> => {
    const res = await apiClient.put<ApiResponse<SystemConfig>>(ENDPOINTS.SYSTEM_CONFIG, config);
    return res.data;
  },
};
