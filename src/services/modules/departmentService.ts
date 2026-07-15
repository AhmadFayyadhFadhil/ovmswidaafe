import { apiClient } from '../api/api';
import type { ApiResponse } from '../../types/api';

export interface Department {
  id: number;
  name: string;
}

export const departmentService = {
  getAll: async (): Promise<ApiResponse<Department[]>> => {
    const res = await apiClient.get<any>('/departments');
    const list = Array.isArray(res.data?.data) ? res.data.data : [];
    return {
      data: list.map((d: any) => ({
        id: Number(d.id),
        name: d.name,
      })),
      message: res.data?.message
    };
  },
};
