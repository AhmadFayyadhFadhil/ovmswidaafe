import { apiClient } from '../api/api';
import type { UserAccount } from '../../types';
import type { ApiResponse } from '../../types/api';
import { ENDPOINTS } from '../../constants/endpoints';

function resolvePrimaryRole(roles: any[]): string {
  if (!roles || roles.length === 0) return 'Employee';
  const lower = roles.map((r: any) => String(r).toLowerCase());
  if (lower.includes('admin')) return 'Admin';
  if (lower.includes('ga')) return 'GA';
  if (lower.includes('approver')) return 'Approver';
  if (lower.includes('driver')) return 'Driver';
  if (lower.includes('security')) return 'Security';
  
  const first = String(roles[0]);
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export const userService = {
  getAll: async (params?: any): Promise<ApiResponse<UserAccount[]>> => {
    const res = await apiClient.get<any>(ENDPOINTS.USERS, { params });
    const users = Array.isArray(res.data?.data) ? res.data.data : [];
    
    const mapped = users.map((u: any) => ({
      id: String(u.id),
      nik: u.nik || '',
      simNumber: u.sim_number || '',
      simType: u.sim_type || 'SIM A',
      simExpiryDate: u.sim_expiry_date || '',
      simStatus: u.sim_status || (u.sim_expiry_date ? 'valid' : 'not_set'),
      simExpiryDaysLeft: u.sim_expiry_days_left ?? null,
      fullName: u.name || 'No Name',
      username: u.email ? u.email.split('@')[0] : 'user',
      email: u.email || '',
      phone: u.phone || '+62 812-3456-7890',
      department: u.department_name || 'IT',
      department_id: u.department_id ? String(u.department_id) : '',
      position: u.rank || (u.roles?.[0] || 'Employee'),
      roleName: resolvePrimaryRole(u.roles),
      status: (u.availability_status === 'available' || u.availability_status === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE',
      lastLogin: 'Online',
      avatarUrl: u.sim_a_photo_url || undefined,
      isDepartmentHead: !!u.is_department_head,
      simPhoto: u.sim_a_photo_url || undefined,
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
  create: async (user: UserAccount | FormData): Promise<ApiResponse<UserAccount>> => {
    let res: any;
    
    if (user instanceof FormData) {
      try {
        res = await apiClient.post<any>(ENDPOINTS.USERS, user);
      } catch (err: any) {
        if (err.response?.status === 500 || err.response?.status === 422) {
          const nik = user.get('nik') as string;
          const name = user.get('name') as string;
          const email = user.get('email') as string;
          const password = user.get('password') as string;
          const role = (user.get('role') as string) || 'Employee';
          const department_id = user.get('department_id') as string;
          const rank = user.get('rank') as string;
          const is_dept_head = user.get('is_department_head') as string;
          const simFile = user.get('sim_a_photo') as File;

          const jsonPayload: any = {
            name: name || 'User',
            email: email || `user_${Date.now()}@ovms.test`,
            password: password || 'password',
            role: role || 'Employee',
            is_department_head: is_dept_head === '1',
          };
          if (nik) jsonPayload.nik = nik;
          if (rank) jsonPayload.rank = rank;
          const parsedDept = department_id ? parseInt(department_id) : 1;
          jsonPayload.department_id = isNaN(parsedDept) ? 1 : parsedDept;

          res = await apiClient.post<any>(ENDPOINTS.USERS, jsonPayload);
          const newUserId = res.data?.data?.id;

          if (newUserId && simFile && simFile instanceof File) {
            try {
              const photoData = new FormData();
              photoData.append('_method', 'PUT');
              photoData.append('sim_a_photo', simFile);
              await apiClient.post(`${ENDPOINTS.USERS}/${newUserId}`, photoData);
            } catch (fileErr) {
              console.warn("Failed to upload SIM photo after user creation:", fileErr);
            }
          }
        } else {
          throw err;
        }
      }
    } else {
      const parsedDept = user.department ? parseInt(user.department) : 1;
      const jsonPayload = {
        nik: user.nik || undefined,
        name: user.fullName,
        email: user.email,
        password: user.nik || 'password',
        role: user.roleName || 'Employee',
        rank: user.roleName === 'Approver' ? (user.position || 'Manager') : undefined,
        department_id: isNaN(parsedDept) ? 1 : parsedDept,
        is_department_head: (user as any).isDepartmentHead || user.roleName === 'Approver',
      };
      res = await apiClient.post<any>(ENDPOINTS.USERS, jsonPayload);
    }
    
    const u = res.data?.data;
    const mapped: any = {
      id: String(u?.id || (user instanceof FormData ? '' : user.id)),
      nik: u?.nik || (user instanceof FormData ? '' : user.nik) || '',
      fullName: u?.name || (user instanceof FormData ? '' : user.fullName),
      username: u?.email ? u.email.split('@')[0] : (user instanceof FormData ? '' : user.username),
      email: u?.email || (user instanceof FormData ? '' : user.email),
      phone: (user instanceof FormData ? '' : user.phone) || '',
      department: u?.department_name || 'IT',
      department_id: u?.department_id ? String(u.department_id) : '',
      position: u?.rank || (user instanceof FormData ? '' : user.position) || '',
      roleName: u?.roles ? resolvePrimaryRole(u.roles) : (user instanceof FormData ? '' : user.roleName) || '',
      status: (u?.availability_status === 'available' || u?.availability_status === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE',
      lastLogin: 'Online',
      avatarUrl: u?.sim_a_photo_url,
      isDepartmentHead: !!u?.is_department_head,
      simPhoto: u?.sim_a_photo_url || undefined,
    };
    
    return {
      data: mapped,
      message: res.data?.message
    };
  },
  update: async (id: string, user: Partial<UserAccount> | FormData): Promise<ApiResponse<UserAccount>> => {
    let payload: any = user;
    let isFormData = user instanceof FormData;
    if (!isFormData) {
      const u = user as any;
      payload = {};
      if (u.nik !== undefined) payload.nik = u.nik;
      if (u.fullName) payload.name = u.fullName;
      if (u.email) payload.email = u.email;
      if (u.roleName) payload.role = u.roleName;
      if (u.department) payload.department_id = u.department;
      if (u.position) payload.rank = u.position;
      if (u.password) payload.password = u.password;
      if (u.isDepartmentHead !== undefined) payload.is_department_head = u.isDepartmentHead ? '1' : '0';
    } else {
      if (!payload.has('_method')) {
        payload.append('_method', 'PUT');
      }
    }
    
    const url = `${ENDPOINTS.USERS}/${id}`;
    const res = isFormData
      ? await apiClient.post<any>(url, payload)
      : await apiClient.put<any>(url, payload);
      
    const u = res.data?.data;
    
    const mapped: any = {
      id: String(u?.id || id),
      nik: u?.nik || '',
      fullName: u?.name || '',
      username: u?.email ? u.email.split('@')[0] : '',
      email: u?.email || '',
      phone: '',
      department: u?.department_name || 'IT',
      department_id: u?.department_id ? String(u.department_id) : '',
      position: u?.rank || '',
      roleName: u?.roles ? resolvePrimaryRole(u.roles) : '',
      status: (u?.availability_status === 'available' || u?.availability_status === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE',
      lastLogin: 'Online',
      avatarUrl: u?.sim_a_photo_url,
      isDepartmentHead: !!u?.is_department_head,
      simPhoto: u?.sim_a_photo_url || undefined,
    };
    
    return {
      data: mapped,
      message: res.data?.message
    };
  },
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete<any>(`${ENDPOINTS.USERS}/${id}`);
    return {
      data: undefined,
      message: res.data?.message || 'User berhasil dihapus'
    };
  },
};

