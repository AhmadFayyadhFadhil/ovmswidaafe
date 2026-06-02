import { apiClient } from '../api/api';
import type { SystemNotification } from '../../types';
import type { ApiResponse } from '../../types/api';
import { ENDPOINTS } from '../../constants/endpoints';

export const notificationService = {
  getAll: async (): Promise<ApiResponse<SystemNotification[]>> => {
    const res = await apiClient.get<ApiResponse<SystemNotification[]>>(ENDPOINTS.NOTIFICATIONS);
    return res.data;
  },
  markAsRead: async (id: string): Promise<ApiResponse<SystemNotification>> => {
    const res = await apiClient.put<ApiResponse<SystemNotification>>(`${ENDPOINTS.NOTIFICATIONS}/${id}/read`);
    return res.data;
  },
  markAllAsRead: async (): Promise<ApiResponse<void>> => {
    const res = await apiClient.put<ApiResponse<void>>(`${ENDPOINTS.NOTIFICATIONS}/mark-all-read`);
    return res.data;
  },
};
