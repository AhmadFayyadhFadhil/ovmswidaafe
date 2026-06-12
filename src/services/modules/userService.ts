import { apiClient } from '../api/api';
import type { UserAccount } from '../../types';
import type { ApiResponse } from '../../types/api';
import { ENDPOINTS } from '../../constants/endpoints';

export const userService = {
  getAll: async (params?: any): Promise<ApiResponse<UserAccount[]>> => {
    const res = await apiClient.get<any>(ENDPOINTS.USERS, { params });
    const users = Array.isArray(res.data?.data) ? res.data.data : [];
    
    const mapped = users.map((u: any) => ({
      id: String(u.id),
      fullName: u.name || 'No Name',
      username: u.email ? u.email.split('@')[0] : 'user',
      email: u.email || '',
      phone: u.phone || '+62 812-3456-7890',
      department: u.department_id || 'IT',
      position: u.rank || (u.roles?.[0] || 'Employee'),
      roleName: u.roles?.[0] || 'Employee',
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
    let payload: any = user;
    if (!(user instanceof FormData)) {
      payload = {
        name: user.fullName,
        email: user.email,
        password: 'password', // Default password
        role: user.roleName || 'Employee',
        rank: user.roleName === 'Approver' ? (user.position || 'Manager') : null,
        department_id: user.department || null,
        is_department_head: (user as any).isDepartmentHead || user.roleName === 'Approver',
      };
    }
    
    const res = await apiClient.post<any>(ENDPOINTS.USERS, payload, {
      headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
    });
    const u = res.data?.data;
    
    const mapped: any = {
      id: String(u?.id || (user instanceof FormData ? '' : user.id)),
      fullName: u?.name || (user instanceof FormData ? '' : user.fullName),
      username: u?.email ? u.email.split('@')[0] : (user instanceof FormData ? '' : user.username),
      email: u?.email || (user instanceof FormData ? '' : user.email),
      phone: (user instanceof FormData ? '' : user.phone) || '',
      department: u?.department_id || (user instanceof FormData ? '' : user.department) || '',
      position: u?.rank || (user instanceof FormData ? '' : user.position) || '',
      roleName: u?.roles?.[0] || (user instanceof FormData ? '' : user.roleName) || '',
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
      ? await apiClient.post<any>(url, payload, { headers: { 'Content-Type': 'multipart/form-data' } })
      : await apiClient.put<any>(url, payload);
      
    const u = res.data?.data;
    
    const mapped: any = {
      id: String(u?.id || id),
      fullName: u?.name || '',
      username: u?.email ? u.email.split('@')[0] : '',
      email: u?.email || '',
      phone: '',
      department: u?.department_id || '',
      position: u?.rank || '',
      roleName: u?.roles?.[0] || '',
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
      message: res.data?.message
    };
  },
};

