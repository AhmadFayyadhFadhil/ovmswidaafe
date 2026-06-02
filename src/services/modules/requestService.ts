import { apiClient } from '../api/api';
import type { FleetRequest } from '../../types';
import type { ApiResponse } from '../../types/api';
import { ENDPOINTS } from '../../constants/endpoints';

export const requestService = {
  getAll: async (): Promise<ApiResponse<FleetRequest[]>> => {
    const res = await apiClient.get<ApiResponse<FleetRequest[]>>(ENDPOINTS.REQUESTS);
    return res.data;
  },
  create: async (request: FleetRequest): Promise<ApiResponse<FleetRequest>> => {
    const res = await apiClient.post<ApiResponse<FleetRequest>>(ENDPOINTS.REQUESTS, request);
    return res.data;
  },
  update: async (id: string, request: Partial<FleetRequest>): Promise<ApiResponse<FleetRequest>> => {
    const res = await apiClient.put<ApiResponse<FleetRequest>>(`${ENDPOINTS.REQUESTS}/${id}`, request);
    return res.data;
  },
};
