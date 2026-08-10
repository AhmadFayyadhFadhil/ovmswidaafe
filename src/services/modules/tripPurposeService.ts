import { apiClient } from '../api/api';

export interface TripPurposeItem {
  id: number;
  name: string;
  is_active: boolean;
}

export const tripPurposeService = {
  getAll: async (params?: { all?: boolean }): Promise<{ status: string; data: TripPurposeItem[] }> => {
    const res = await apiClient.get<any>('/trip-purposes', { params });
    return res.data;
  },

  create: async (data: { name: string; is_active?: boolean }): Promise<{ status: string; data: TripPurposeItem }> => {
    const res = await apiClient.post<any>('/trip-purposes', data);
    return res.data;
  },

  update: async (id: number, data: { name: string; is_active?: boolean }): Promise<{ status: string; data: TripPurposeItem }> => {
    const res = await apiClient.put<any>(`/trip-purposes/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<{ status: string; message: string }> => {
    const res = await apiClient.delete<any>(`/trip-purposes/${id}`);
    return res.data;
  },
};
