import { apiClient } from '../api/api';
import type { Driver } from '../../types';
import type { ApiResponse } from '../../types/api';

let driverCache: { data: ApiResponse<Driver[]>; timestamp: number } | null = null;
const CACHE_TTL_MS = 20000; // 20 seconds short TTL cache

export const driverService = {
  clearCache: () => {
    driverCache = null;
  },
  getAll: async (params?: any): Promise<ApiResponse<Driver[]>> => {
    const isDefaultFetch = !params || (Object.keys(params).length === 0) || (Object.keys(params).length === 1 && params.per_page === 1000);
    const now = Date.now();

    if (isDefaultFetch && driverCache && (now - driverCache.timestamp < CACHE_TTL_MS)) {
      return driverCache.data;
    }

    const res = await apiClient.get<any>('/users', { params: { ...params, role: 'Driver' } });
    const users = Array.isArray(res.data?.data) ? res.data.data : [];
    
    const mapped = users.map((u: any) => ({
      id: String(u.id),
      nik: u.nik || '',
      name: u.name || 'No Name',
      status: u.availability_status === 'available' ? 'AVAILABLE' : (u.availability_status === 'on_trip' ? 'ON DUTY' : (u.availability_status === 'assigned' ? 'ASSIGNED' : 'OFF DUTY')),
      licenseType: 'Class A' as const,
      licenseExpiry: '-',
      performance: 0,
      avatarUrl: u.avatar_url || undefined,
      simPhotoUrl: u.sim_a_photo_url || undefined,
      phone: u.phone || '',
      email: u.email || '',
      department: u.department_name || 'IT',
      department_id: u.department_id ? String(u.department_id) : '',
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

    const response: ApiResponse<Driver[]> = {
      data: mapped,
      message: res.data?.message
    };

    if (isDefaultFetch) {
      driverCache = { data: response, timestamp: now };
    }

    return response;
  },
  create: async (driver: Driver | FormData): Promise<ApiResponse<Driver>> => {
    driverCache = null;
    let payload: any = driver;
    if (!(driver instanceof FormData)) {
      payload = {
        nik: (driver as any).nik || undefined,
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
      nik: u?.nik || (driver instanceof FormData ? '' : (driver as any).nik) || '',
      name: u?.name || (driver instanceof FormData ? '' : driver.name),
      status: u?.availability_status === 'available' ? 'AVAILABLE' : 'OFF DUTY',
      licenseType: 'Class A',
      licenseExpiry: '-',
      performance: 0,
      avatarUrl: u?.avatar_url,
      simPhotoUrl: u?.sim_a_photo_url,
      phone: (driver instanceof FormData ? '' : driver.phone) || '',
      email: u?.email || (driver instanceof FormData ? '' : driver.email) || '',
      department: u?.department_name || 'IT',
      department_id: u?.department_id ? String(u.department_id) : '',
    };
    
    return {
      data: mapped,
      message: res.data?.message
    };
  },
  update: async (id: string, driver: Partial<Driver> | FormData): Promise<ApiResponse<Driver>> => {
    driverCache = null;
    let payload: any = driver;
    let isFormData = driver instanceof FormData;
    if (!isFormData) {
      const d = driver as any;
      payload = { role: 'Driver' };
      if (d.nik) payload.nik = d.nik;
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
      nik: u?.nik || '',
      name: u?.name || '',
      status: u?.availability_status === 'available' ? 'AVAILABLE' : 'OFF DUTY',
      licenseType: 'Class A',
      licenseExpiry: '2028-12-31',
      performance: 4.8,
      avatarUrl: u?.avatar_url,
      simPhotoUrl: u?.sim_a_photo_url,
      phone: '',
      email: u?.email || '',
      department: u?.department_name || 'IT',
      department_id: u?.department_id ? String(u.department_id) : '',
    };
    
    return {
      data: mapped,
      message: res.data?.message
    };
  },
  delete: async (id: string): Promise<ApiResponse<void>> => {
    driverCache = null;
    const res = await apiClient.delete<any>(`/users/${id}`);
    return {
      data: undefined,
      message: res.data?.message
    };
  },
  updateMyStatus: async (status: 'available' | 'unavailable'): Promise<ApiResponse<any>> => {
    driverCache = null;
    const res = await apiClient.put<any>('/profile/status', { availability_status: status });
    return {
      data: res.data?.data,
      message: res.data?.message
    };
  },
  setAvailable: async (id: string): Promise<ApiResponse<any>> => {
    driverCache = null;
    const res = await apiClient.put<any>(`/users/${id}/status`, { availability_status: 'available' });
    return {
      data: res.data?.data,
      message: res.data?.message
    };
  },
  setUnavailable: async (id: string): Promise<ApiResponse<any>> => {
    driverCache = null;
    const res = await apiClient.put<any>(`/users/${id}/status`, { availability_status: 'unavailable' });
    return {
      data: res.data?.data,
      message: res.data?.message
    };
  },
};
