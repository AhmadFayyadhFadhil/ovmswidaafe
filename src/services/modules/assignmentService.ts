import { apiClient } from '../api/api';
import type { ApiResponse } from '../../types/api';
import { requestService } from './requestService';

let assignmentCache: { data: ApiResponse<any[]>; timestamp: number; key: string } | null = null;
const CACHE_TTL_MS = 15000; // 15 seconds short TTL cache

export const assignmentService = {
  clearCache: () => {
    assignmentCache = null;
  },
  getAll: async (params?: any): Promise<ApiResponse<any[]>> => {
    const key = JSON.stringify(params || {});
    const now = Date.now();

    if (assignmentCache && assignmentCache.key === key && (now - assignmentCache.timestamp < CACHE_TTL_MS)) {
      return assignmentCache.data;
    }

    const res = await apiClient.get<any>('/assignments', { params });
    const response: ApiResponse<any[]> = {
      data: res.data?.data || [],
      message: res.data?.message
    };

    assignmentCache = { data: response, timestamp: now, key };
    return response;
  },
  create: async (payload: any): Promise<ApiResponse<any>> => {
    assignmentCache = null;
    requestService.clearCache();
    const res = await apiClient.post<any>('/assignments', payload);
    return {
      data: res.data?.data,
      message: res.data?.message
    };
  },
  respond: async (id: string, payload: { response: 'accepted' | 'rejected'; vehicle_id?: string; reject_reason?: string }): Promise<ApiResponse<any>> => {
    assignmentCache = null;
    requestService.clearCache();
    const res = await apiClient.put<any>(`/assignments/${id}`, payload);
    return {
      data: res.data?.data,
      message: res.data?.message
    };
  },
  cancel: async (id: string): Promise<ApiResponse<void>> => {
    assignmentCache = null;
    requestService.clearCache();
    const res = await apiClient.post<any>(`/assignments/${id}/cancel`);
    return {
      data: undefined,
      message: res.data?.message
    };
  },
};
