import { apiClient } from '../api/api';
import type { Role } from '../../types';
import type { ApiResponse } from '../../types/api';
import { ENDPOINTS } from '../../constants/endpoints';

export const roleService = {
  getAll: async (): Promise<ApiResponse<Role[]>> => {
    const res = await apiClient.get<ApiResponse<Role[]>>(ENDPOINTS.ROLES);
    return res.data;
  },
  create: async (role: Role): Promise<ApiResponse<Role>> => {
    const res = await apiClient.post<ApiResponse<Role>>(ENDPOINTS.ROLES, role);
    return res.data;
  },
  update: async (id: string, role: Partial<Role>): Promise<ApiResponse<Role>> => {
    const res = await apiClient.put<ApiResponse<Role>>(`${ENDPOINTS.ROLES}/${id}`, role);
    return res.data;
  },
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete<ApiResponse<void>>(`${ENDPOINTS.ROLES}/${id}`);
    return res.data;
  },
};
