import { apiClient } from '../api/api';
import type { ApiResponse } from '../../types/api';

export const assignmentService = {
  getAll: async (params?: any): Promise<ApiResponse<any[]>> => {
    const res = await apiClient.get<any>('/assignments', { params });
    return {
      data: res.data?.data || [],
      message: res.data?.message
    };
  },
  create: async (payload: { request_id: string; driver_id: string; notes?: string }): Promise<ApiResponse<any>> => {
    const res = await apiClient.post<any>('/assignments', payload);
    return {
      data: res.data?.data,
      message: res.data?.message
    };
  },
  respond: async (id: string, payload: { response: 'accepted' | 'rejected'; vehicle_id?: string; reject_reason?: string }): Promise<ApiResponse<any>> => {
    const res = await apiClient.put<any>(`/assignments/${id}`, payload);
    return {
      data: res.data?.data,
      message: res.data?.message
    };
  },
  cancel: async (id: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<any>(`/assignments/${id}/cancel`);
    return {
      data: undefined,
      message: res.data?.message
    };
  },
};
