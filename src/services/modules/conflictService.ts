import { apiClient } from '../api/api';
import type { ScheduleConflict } from '../../types';
import type { ApiResponse } from '../../types/api';
import { ENDPOINTS } from '../../constants/endpoints';

export const conflictService = {
  getAll: async (): Promise<ApiResponse<ScheduleConflict[]>> => {
    const res = await apiClient.get<ApiResponse<ScheduleConflict[]>>(ENDPOINTS.CONFLICTS);
    return res.data;
  },
};
