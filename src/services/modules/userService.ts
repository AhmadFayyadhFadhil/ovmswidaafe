import { apiClient } from '../api/api';
import type { UserAccount } from '../../types';
import type { ApiResponse } from '../../types/api';
import { ENDPOINTS } from '../../constants/endpoints';

export const userService = {
  getAll: async (): Promise<ApiResponse<UserAccount[]>> => {
    const res = await apiClient.get<ApiResponse<UserAccount[]>>(ENDPOINTS.USERS);
    return res.data;
  },
  create: async (user: UserAccount): Promise<ApiResponse<UserAccount>> => {
    const res = await apiClient.post<ApiResponse<UserAccount>>(ENDPOINTS.USERS, user);
    return res.data;
  },
  update: async (id: string, user: Partial<UserAccount>): Promise<ApiResponse<UserAccount>> => {
    const res = await apiClient.put<ApiResponse<UserAccount>>(`${ENDPOINTS.USERS}/${id}`, user);
    return res.data;
  },
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete<ApiResponse<void>>(`${ENDPOINTS.USERS}/${id}`);
    return res.data;
  },
};
