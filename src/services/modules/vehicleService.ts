import { apiClient } from '../api/api';
import type { Vehicle } from '../../types';
import type { ApiResponse } from '../../types/api';
import { ENDPOINTS } from '../../constants/endpoints';

export const vehicleService = {
  getAll: async (params?: any): Promise<ApiResponse<Vehicle[]>> => {
    const res = await apiClient.get<any>(ENDPOINTS.VEHICLES, { params });
    const list = Array.isArray(res.data?.data) ? res.data.data : [];
    
    const mapped = list.map((v: any) => ({
      id: String(v.id),
      model: v.name || 'Generic Model',
      plate: v.plate_number || 'N/A',
      type: v.type || 'Electric',
      driverId: '',
      driverName: 'Not Assigned',
      status: (v.status === 'In Use' || v.status === 'IN TRANSIT') ? 'IN TRANSIT' : 'AVAILABLE',
      battery: 85,
      fuelType: (v.type === 'Electric' ? 'Electric' : 'Gasoline') as any,
      odometer: v.odometer || 0,
      nextMaint: v.last_maintained || 'N/A',
      imageType: (v.type?.toLowerCase().includes('truck') ? 'truck' : (v.type?.toLowerCase().includes('tesla') ? 'tesla' : 'generic')) as any,
      backendStatus: v.status || 'Available',
      capacity: v.capacity || 5,
      photoUrl: v.photo_url || '',
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
  getById: async (id: string): Promise<ApiResponse<Vehicle>> => {
    const res = await apiClient.get<any>(`${ENDPOINTS.VEHICLES}/${id}`);
    const v = res.data?.data;
    
    const mapped: any = {
      id: String(v?.id || id),
      model: v?.name || 'Generic Model',
      plate: v?.plate_number || 'N/A',
      type: v?.type || 'Electric',
      driverId: '',
      driverName: 'Not Assigned',
      status: (v?.status === 'In Use' || v?.status === 'IN TRANSIT') ? 'IN TRANSIT' : 'AVAILABLE',
      battery: 85,
      fuelType: (v?.type === 'Electric' ? 'Electric' : 'Gasoline') as any,
      odometer: v?.odometer || 0,
      nextMaint: v?.last_maintained || 'N/A',
      imageType: (v?.type?.toLowerCase().includes('truck') ? 'truck' : (v?.type?.toLowerCase().includes('tesla') ? 'tesla' : 'generic')) as any,
      backendStatus: v?.status || 'Available',
      capacity: v?.capacity || 5,
      photoUrl: v?.photo_url || '',
    };

    return {
      data: mapped,
      message: res.data?.message
    };
  },
  create: async (vehicle: Vehicle | FormData): Promise<ApiResponse<Vehicle>> => {
    let payload: any = vehicle;
    if (!(vehicle instanceof FormData)) {
      payload = {
        name: vehicle.model,
        plate_number: vehicle.plate,
        type: vehicle.type || 'Electric',
        capacity: (vehicle as any).capacity || 5,
        odometer: vehicle.odometer || 0,
        status: (vehicle as any).backendStatus || 'Available',
      };
    }
    
    const res = await apiClient.post<any>(ENDPOINTS.VEHICLES, payload, {
      headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
    });
    const v = res.data?.data;
    
    const mapped: any = {
      id: String(v?.id || (vehicle instanceof FormData ? '' : vehicle.id)),
      model: v?.name || (vehicle instanceof FormData ? '' : vehicle.model),
      plate: v?.plate_number || (vehicle instanceof FormData ? '' : vehicle.plate),
      type: v?.type || (vehicle instanceof FormData ? '' : vehicle.type),
      driverId: '',
      driverName: 'Not Assigned',
      status: (v?.status === 'In Use' || v?.status === 'IN TRANSIT') ? 'IN TRANSIT' : 'AVAILABLE',
      battery: (vehicle instanceof FormData ? 85 : vehicle.battery) || 85,
      fuelType: (vehicle instanceof FormData ? 'Electric' : vehicle.fuelType) || 'Electric',
      odometer: v?.odometer || (vehicle instanceof FormData ? 0 : vehicle.odometer) || 0,
      nextMaint: v?.last_maintained || 'N/A',
      imageType: (vehicle instanceof FormData ? 'generic' : vehicle.imageType) || 'generic',
      backendStatus: v?.status || 'Available',
      capacity: v?.capacity || 5,
      photoUrl: v?.photo_url || '',
    };

    return {
      data: mapped,
      message: res.data?.message
    };
  },
  update: async (id: string, vehicle: Partial<Vehicle> | FormData): Promise<ApiResponse<Vehicle>> => {
    let payload: any = vehicle;
    let isFormData = vehicle instanceof FormData;
    if (!isFormData) {
      const v = vehicle as any;
      payload = {};
      if (v.model) payload.name = v.model;
      if (v.plate) payload.plate_number = v.plate;
      if (v.type) payload.type = v.type;
      if (v.capacity) payload.capacity = v.capacity;
      if (v.odometer) payload.odometer = v.odometer;
      if (v.backendStatus) payload.status = v.backendStatus;
      else if (v.status) payload.status = v.status === 'IN TRANSIT' ? 'In Use' : 'Available';
    } else {
      // In Laravel, PUT/PATCH with multipart FormData doesn't parse files natively.
      // We append '_method: PUT' and use POST to spoof the request method.
      if (!payload.has('_method')) {
        payload.append('_method', 'PUT');
      }
    }
    
    const url = `${ENDPOINTS.VEHICLES}/${id}`;
    const res = isFormData 
      ? await apiClient.post<any>(url, payload, { headers: { 'Content-Type': 'multipart/form-data' } })
      : await apiClient.put<any>(url, payload);
      
    const v = res.data?.data;
    
    const mapped: any = {
      id: String(v?.id || id),
      model: v?.name || '',
      plate: v?.plate_number || '',
      type: v?.type || '',
      driverId: '',
      driverName: 'Not Assigned',
      status: (v?.status === 'In Use' || v?.status === 'IN TRANSIT') ? 'IN TRANSIT' : 'AVAILABLE',
      battery: 85,
      fuelType: 'Electric',
      odometer: v?.odometer || 0,
      nextMaint: v?.last_maintained || 'N/A',
      imageType: 'generic',
      backendStatus: v?.status || 'Available',
      capacity: v?.capacity || 5,
      photoUrl: v?.photo_url || '',
    };

    return {
      data: mapped,
      message: res.data?.message
    };
  },
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete<any>(`${ENDPOINTS.VEHICLES}/${id}`);
    return {
      data: undefined,
      message: res.data?.message
    };
  },
};

