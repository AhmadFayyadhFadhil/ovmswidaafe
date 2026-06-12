import { apiClient } from '../api/api';
import type { Driver } from '../../types';
import type { ApiResponse } from '../../types/api';

export const driverService = {
  getAll: async (params?: any): Promise<ApiResponse<Driver[]>> => {
    const res = await apiClient.get<any>('/users', { params: { ...params, role: 'Driver' } });
    const users = Array.isArray(res.data?.data) ? res.data.data : [];
    
    const mapped = users.map((u: any) => ({
      id: String(u.id),
      name: u.name || 'No Name',
      status: u.availability_status === 'available' ? 'AVAILABLE' : (u.availability_status === 'on_trip' ? 'ON DUTY' : 'OFF DUTY'),
      licenseType: 'Class A' as const,
      licenseExpiry: '-',
      performance: 0,
      avatarUrl: u.sim_a_photo_url || undefined,
      phone: u.phone || '',
      email: u.email || '',
      department: u.department_id || 'IT',
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
  create: async (driver: Driver | FormData): Promise<ApiResponse<Driver>> => {
    let payload: any = driver;
    if (!(driver instanceof FormData)) {
      payload = {
        name: driver.name,
        email: driver.email || `${driver.name.toLowerCase().replace(/\s+/g, '')}@ovms.test`,
        password: 'password', // Default password
        role: 'Driver',
        department_id: (driver as any).department || 'IT',
      };
    }
    
    const res = await apiClient.post<any>('/users', payload, {
      headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
    });
    const u = res.data?.data;
    
    const mapped: any = {
      id: String(u?.id || (driver instanceof FormData ? '' : driver.id)),
      name: u?.name || (driver instanceof FormData ? '' : driver.name),
      status: u?.availability_status === 'available' ? 'AVAILABLE' : 'OFF DUTY',
      licenseType: 'Class A',
      licenseExpiry: '-',
      performance: 0,
      avatarUrl: u?.sim_a_photo_url,
      phone: (driver instanceof FormData ? '' : driver.phone) || '',
      email: u?.email || (driver instanceof FormData ? '' : driver.email) || '',
      department: u?.department_id || 'IT',
    };
    
    return {
      data: mapped,
      message: res.data?.message
    };
  },
  update: async (id: string, driver: Partial<Driver> | FormData): Promise<ApiResponse<Driver>> => {
    let payload: any = driver;
    let isFormData = driver instanceof FormData;
    if (!isFormData) {
      const d = driver as any;
      payload = { role: 'Driver' };
      if (d.name) payload.name = d.name;
      if (d.email) payload.email = d.email;
      if (d.department) payload.department_id = d.department;
      if (d.password) payload.password = d.password;
    } else {
      if (!payload.has('_method')) {
        payload.append('_method', 'PUT');
      }
    }
    
    const url = `/users/${id}`;
    const res = isFormData
      ? await apiClient.post<any>(url, payload, { headers: { 'Content-Type': 'multipart/form-data' } })
      : await apiClient.put<any>(url, payload);
      
    const u = res.data?.data;
    
    const mapped: any = {
      id: String(u?.id || id),
      name: u?.name || '',
      status: u?.availability_status === 'available' ? 'AVAILABLE' : 'OFF DUTY',
      licenseType: 'Class A',
      licenseExpiry: '2028-12-31',
      performance: 4.8,
      avatarUrl: u?.sim_a_photo_url,
      phone: '',
      email: u?.email || '',
      department: u?.department_id || 'IT',
    };
    
    return {
      data: mapped,
      message: res.data?.message
    };
  },
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete<any>(`/users/${id}`);
    return {
      data: undefined,
      message: res.data?.message
    };
  },
  updateMyStatus: async (status: 'available' | 'unavailable'): Promise<ApiResponse<any>> => {
    const res = await apiClient.put<any>('/profile/status', { availability_status: status });
    return {
      data: res.data?.data,
      message: res.data?.message
    };
  },
};

