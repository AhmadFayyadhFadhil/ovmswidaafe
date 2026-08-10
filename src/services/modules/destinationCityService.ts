import { apiClient } from '../api/api';

export interface DestinationCityItem {
  id: number;
  name: string;
  province?: string | null;
  is_active: boolean;
}

export const destinationCityService = {
  getAll: async (params?: { all?: boolean; search?: string }): Promise<{ status: string; data: DestinationCityItem[] }> => {
    const res = await apiClient.get<any>('/destination-cities', { params });
    return res.data;
  },

  create: async (data: { name: string; province?: string; is_active?: boolean }): Promise<{ status: string; data: DestinationCityItem }> => {
    const res = await apiClient.post<any>('/destination-cities', data);
    return res.data;
  },

  update: async (id: number, data: { name: string; province?: string; is_active?: boolean }): Promise<{ status: string; data: DestinationCityItem }> => {
    const res = await apiClient.put<any>(`/destination-cities/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<{ status: string; message: string }> => {
    const res = await apiClient.delete<any>(`/destination-cities/${id}`);
    return res.data;
  },
};
