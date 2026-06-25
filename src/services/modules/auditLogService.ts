import { apiClient } from '../api/api';
import type { AuditLog } from '../../types';
import type { ApiResponse } from '../../types/api';
import { ENDPOINTS } from '../../constants/endpoints';

export const auditLogService = {
  getAll: async (params?: any): Promise<ApiResponse<AuditLog[]>> => {
    const res = await apiClient.get<any>(ENDPOINTS.AUDIT_LOGS, { params });
    const list = Array.isArray(res.data?.data) ? res.data.data : [];
    
    const mapped = list.map((a: any) => ({
      id: String(a.id),
      user: a.user?.name || 'System',
      role: a.user?.role || (a.user ? 'Staff' : 'System'),
      activityType: a.auditable_type || 'System',
      action: `${a.action || 'modified'} ${a.auditable_type || 'item'} #${a.auditable_id || ''}`,
      department: a.user?.department || 'Operations',
      severity: (a.action === 'deleted' ? 'High' : (a.action === 'updated' ? 'Normal' : 'Low')) as any,
      ipAddress: a.user?.email || 'system@ovms.local',
      avatarUrl: a.user?.avatar_url || '',
      timestamp: a.created_at ? a.created_at.replace('T', ' ').substring(0, 16) : 'Just now',
    }));

    Object.defineProperty(mapped, 'pagination', {
      value: {
        total: res.data?.pagination?.total ?? mapped.length,
        perPage: res.data?.pagination?.per_page ?? 15,
        currentPage: res.data?.pagination?.current_page ?? 1,
        lastPage: res.data?.pagination?.last_page ?? 1,
        from: res.data?.pagination?.from ?? null,
        to: res.data?.pagination?.to ?? null,
      },
      writable: true,
      enumerable: false,
      configurable: true
    });

    return {
      data: mapped,
      message: res.data?.message
    };
  },
};

