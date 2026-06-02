import { apiClient } from '../api/api';
import type { Driver } from '../../types';
import type { ApiResponse } from '../../types/api';
import { ENDPOINTS } from '../../constants/endpoints';

export const driverService = {
  getAll: async (): Promise<ApiResponse<Driver[]>> => {
    const res = await apiClient.get<ApiResponse<Driver[]>>(ENDPOINTS.DRIVERS);
    return res.data;
  },
  create: async (driver: Driver): Promise<ApiResponse<Driver>> => {
    const res = await apiClient.post<ApiResponse<Driver>>(ENDPOINTS.DRIVERS, driver);
    return res.data;
  },
  update: async (id: string, driver: Partial<Driver>): Promise<ApiResponse<Driver>> => {
    const res = await apiClient.put<ApiResponse<Driver>>(`${ENDPOINTS.DRIVERS}/${id}`, driver);
    return res.data;
  },
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete<ApiResponse<void>>(`${ENDPOINTS.DRIVERS}/${id}`);
    return res.data;
  },
};
