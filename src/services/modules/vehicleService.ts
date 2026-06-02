import { apiClient } from '../api/api';
import type { Vehicle } from '../../types';
import type { ApiResponse } from '../../types/api';
import { ENDPOINTS } from '../../constants/endpoints';

export const vehicleService = {
  getAll: async (): Promise<ApiResponse<Vehicle[]>> => {
    const res = await apiClient.get<ApiResponse<Vehicle[]>>(ENDPOINTS.VEHICLES);
    return res.data;
  },
  getById: async (id: string): Promise<ApiResponse<Vehicle>> => {
    const res = await apiClient.get<ApiResponse<Vehicle>>(`${ENDPOINTS.VEHICLES}/${id}`);
    return res.data;
  },
  create: async (vehicle: Vehicle): Promise<ApiResponse<Vehicle>> => {
    const res = await apiClient.post<ApiResponse<Vehicle>>(ENDPOINTS.VEHICLES, vehicle);
    return res.data;
  },
  update: async (id: string, vehicle: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> => {
    const res = await apiClient.put<ApiResponse<Vehicle>>(`${ENDPOINTS.VEHICLES}/${id}`, vehicle);
    return res.data;
  },
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete<ApiResponse<void>>(`${ENDPOINTS.VEHICLES}/${id}`);
    return res.data;
  },
};
