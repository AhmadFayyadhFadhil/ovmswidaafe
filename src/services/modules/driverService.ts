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
    let res: any;
    
    if (driver instanceof FormData) {
      try {
        res = await apiClient.post<any>('/users', driver);
      } catch (err: any) {
        if (err.response?.status === 500 || err.response?.status === 422) {
          const nik = driver.get('nik') as string;
          const name = driver.get('name') as string;
          const email = driver.get('email') as string;
          const password = driver.get('password') as string;
          const department_id = driver.get('department_id') as string;
          const simFile = driver.get('sim_a_photo') as File;

          const jsonPayload: any = {
            name: name || 'Driver',
            email: email || `driver_${Date.now()}@ovms.test`,
            password: password || 'password',
            role: 'Driver',
            role_name: 'Driver',
            roles: ['Driver'],
            position: 'Driver',
          };
          if (nik) jsonPayload.nik = nik;
          const parsedDept = department_id ? parseInt(department_id) : 1;
          jsonPayload.department_id = isNaN(parsedDept) ? 1 : parsedDept;

          res = await apiClient.post<any>('/users', jsonPayload);
          const newUserId = res.data?.data?.id;

          if (newUserId && simFile && simFile instanceof File) {
            try {
              const photoData = new FormData();
              photoData.append('_method', 'PUT');
              photoData.append('sim_a_photo', simFile);
              await apiClient.post(`/users/${newUserId}`, photoData);
            } catch (fileErr) {
              console.warn("Failed to upload SIM photo after driver creation:", fileErr);
            }
          }
        } else {
          throw err;
        }
      }
    } else {
      const parsedDept = (driver as any).department ? parseInt((driver as any).department) : 1;
      const jsonPayload = {
        nik: (driver as any).nik || undefined,
        name: driver.name,
        email: driver.email || `${driver.name.toLowerCase().replace(/\s+/g, '')}@ovms.test`,
        password: 'password',
        role: 'Driver',
        role_name: 'Driver',
        roles: ['Driver'],
        position: 'Driver',
        department_id: isNaN(parsedDept) ? 1 : parsedDept,
      };
      res = await apiClient.post<any>('/users', jsonPayload);
    }
    
    const u = res.data?.data;
    const mapped: any = {
      id: String(u?.id || ''),
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
      ? await apiClient.post<any>(url, payload)
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
    try {
      const res = await apiClient.delete<any>(`/users/${id}?force=1&cascade=1`);
      return {
        data: undefined,
        message: res.data?.message
      };
    } catch (err: any) {
      try {
        const res2 = await apiClient.delete<any>(`/users/${id}`);
        return {
          data: undefined,
          message: res2.data?.message
        };
      } catch (err2: any) {
        try {
          const res3 = await apiClient.post<any>(`/users/${id}`, { _method: 'DELETE', force: true, cascade: true });
          return {
            data: undefined,
            message: res3.data?.message
          };
        } catch (err3: any) {
          const res4 = await apiClient.put<any>(`/users/${id}`, {
            availability_status: 'unavailable',
            status: 'INACTIVE'
          });
          return {
            data: undefined,
            message: res4.data?.message || 'Driver berhasil dinonaktifkan.'
          };
        }
      }
    }
  },
  updateMyStatus: async (status: 'available' | 'unavailable'): Promise<ApiResponse<any>> => {
    driverCache = null;
    const payload = { availability_status: status };
    try {
      const res = await apiClient.put<any>('/profile/status', payload);
      return { data: res.data?.data, message: res.data?.message };
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.status === 405) {
        const res2 = await apiClient.put<any>('/profile', payload);
        return { data: res2.data?.data, message: res2.data?.message };
      }
      throw err;
    }
  },
  setAvailable: async (id: string): Promise<ApiResponse<any>> => {
    driverCache = null;
    const payload = { availability_status: 'available' };
    try {
      const res = await apiClient.put<any>(`/users/${id}/status`, payload);
      return { data: res.data?.data, message: res.data?.message };
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.status === 405) {
        try {
          const res2 = await apiClient.put<any>(`/users/${id}`, payload);
          return { data: res2.data?.data, message: res2.data?.message };
        } catch (err2: any) {
          if (err2.response?.status === 404 || err2.response?.status === 405) {
            const res3 = await apiClient.post<any>(`/users/${id}`, { ...payload, _method: 'PUT' });
            return { data: res3.data?.data, message: res3.data?.message };
          }
          throw err2;
        }
      }
      throw err;
    }
  },
  setUnavailable: async (id: string): Promise<ApiResponse<any>> => {
    driverCache = null;
    const payload = { availability_status: 'unavailable' };
    try {
      const res = await apiClient.put<any>(`/users/${id}/status`, payload);
      return { data: res.data?.data, message: res.data?.message };
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.status === 405) {
        try {
          const res2 = await apiClient.put<any>(`/users/${id}`, payload);
          return { data: res2.data?.data, message: res2.data?.message };
        } catch (err2: any) {
          if (err2.response?.status === 404 || err2.response?.status === 405) {
            const res3 = await apiClient.post<any>(`/users/${id}`, { ...payload, _method: 'PUT' });
            return { data: res3.data?.data, message: res3.data?.message };
          }
          throw err2;
        }
      }
      throw err;
    }
  },
};
