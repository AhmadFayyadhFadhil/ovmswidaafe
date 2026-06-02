import { apiClient } from '../api/api';
import type { ScheduleItem } from '../../types';
import type { ApiResponse } from '../../types/api';
import { ENDPOINTS } from '../../constants/endpoints';

export const scheduleService = {
  getAll: async (): Promise<ApiResponse<ScheduleItem[]>> => {
    const res = await apiClient.get<ApiResponse<ScheduleItem[]>>(ENDPOINTS.SCHEDULES);
    return res.data;
  },
};
