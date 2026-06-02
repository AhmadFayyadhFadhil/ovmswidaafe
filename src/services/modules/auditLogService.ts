import { apiClient } from '../api/api';
import type { AuditLog } from '../../types';
import type { ApiResponse } from '../../types/api';
import { ENDPOINTS } from '../../constants/endpoints';

export const auditLogService = {
  getAll: async (): Promise<ApiResponse<AuditLog[]>> => {
    const res = await apiClient.get<ApiResponse<AuditLog[]>>(ENDPOINTS.AUDIT_LOGS);
    return res.data;
  },
};
