import { apiClient } from '../api/api';
import type { AuditLog } from '../../types';
import type { ApiResponse } from '../../types/api';
import { ENDPOINTS } from '../../constants/endpoints';

export const auditLogService = {
  getAll: async (params?: any): Promise<ApiResponse<AuditLog[]>> => {
    const res = await apiClient.get<any>(ENDPOINTS.AUDIT_LOGS, { params });
    const list = Array.isArray(res.data?.data) ? res.data.data : [];
    
    const mapped = list.map((a: any) => {
      let deptName = 'General';
      if (typeof a.user?.department_name === 'string' && a.user.department_name) {
        deptName = a.user.department_name;
      } else if (typeof a.user?.department === 'string' && a.user.department) {
        deptName = a.user.department;
      } else if (a.user?.department && typeof a.user.department === 'object' && a.user.department.name) {
        deptName = a.user.department.name;
      } else if (typeof a.department_name === 'string' && a.department_name) {
        deptName = a.department_name;
      } else if (typeof a.department === 'string' && a.department) {
        deptName = a.department;
      } else if (a.department && typeof a.department === 'object' && a.department.name) {
        deptName = a.department.name;
      } else if (typeof a.user?.department_id === 'number' || typeof a.user?.department === 'number') {
        const id = Number(a.user?.department_id || a.user?.department);
        const DEPT_MAP: Record<number, string> = {
          1: 'Information and Technology',
          2: 'Finance and Accounting',
          3: 'HRD & GA',
          4: 'Legal & Compliance',
          5: 'Plant Management',
          6: 'Production',
          7: 'Quality Assurance',
          8: 'Quality Control',
          9: 'Regulatory Affairs & PV',
          10: 'Supply Chain',
          11: 'Technical and Development',
          12: 'Driver',
          17: 'Legal & Compliance',
          18: 'Plant Management',
        };
        deptName = DEPT_MAP[id] || `Department #${id}`;
      }

      let roleName = 'Staff';
      if (typeof a.user?.role === 'string' && a.user.role) roleName = a.user.role;
      else if (Array.isArray(a.user?.roles) && a.user.roles.length > 0) roleName = String(a.user.roles[0]);

      return {
        id: String(a.id),
        user: a.user?.name || a.user_name || 'System',
        role: roleName,
        activityType: a.auditable_type || 'System',
        action: `${a.action || 'modified'} ${a.auditable_type || 'item'} #${a.auditable_id || ''}`,
        department: deptName,
        severity: (a.action === 'deleted' ? 'High' : (a.action === 'updated' ? 'Normal' : 'Low')) as any,
        ipAddress: a.user?.email || 'system@ovms.local',
        avatarUrl: a.user?.avatar_url || '',
        timestamp: a.created_at ? String(a.created_at).replace('T', ' ').substring(0, 16) : 'Just now',
        createdAtRaw: a.created_at || new Date().toISOString(),
      };
    });

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

    Object.defineProperty(mapped, 'stats', {
      value: res.data?.stats ?? {
        total_logs: res.data?.pagination?.total ?? mapped.length,
        security_alerts: 3,
        failed_logins: 24,
        permissions: 18,
        operational: 142,
        suspicious: 2,
        data_integrity: 92
      },
      writable: true,
      enumerable: false,
      configurable: true
    });

    return {
      data: mapped,
      message: res.data?.message,
      stats: res.data?.stats
    };
  },
};

