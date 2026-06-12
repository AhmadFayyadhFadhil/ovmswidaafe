import { apiClient } from '../api/api';
import type { FleetRequest } from '../../types';
import type { ApiResponse } from '../../types/api';
import { ENDPOINTS } from '../../constants/endpoints';

function mapStatus(backendStatus: string): "APPROVED" | "PENDING" | "ONGOING" | "COMPLETED" | "REJECTED" {
  switch (backendStatus) {
    case 'completed':
      return 'COMPLETED';
    case 'rejected':
      return 'REJECTED';
    case 'on_going':
      return 'ONGOING';
    case 'driver_assigned':
    case 'approved_hrd_ga':
    case 'approved_hrd':
      return 'APPROVED';
    case 'submitted':
    case 'approved_department':
    case 'waiting_driver':
    default:
      return 'PENDING';
  }
}

function mapPriority(backendPriority: string): "HIGH" | "URGENT" | "NORMAL" | "LOW" {
  switch (backendPriority) {
    case 'Critical':
      return 'URGENT';
    case 'Urgent':
      return 'HIGH';
    case 'Normal':
    default:
      return 'NORMAL';
  }
}

function mapRequestFromBackend(r: any): FleetRequest {
  return {
    id: String(r.id),
    employee: r.requested_by?.name || 'Staff',
    email: r.requested_by?.email || '',
    department: r.department_id || 'IT',
    destination: `${r.destination_city || ''}${r.destination_place ? ' - ' + r.destination_place : ''}`,
    vehicleModel: r.operational_trip?.vehicle?.name || 'Not Assigned',
    driverName: r.operational_trip?.driver?.name || 'Not Assigned',
    date: r.start_time ? r.start_time.split(' ')[0] : '',
    time: r.start_time ? r.start_time.split(' ')[1] || '09:00' : '09:00',
    status: mapStatus(r.status),
    priority: mapPriority(r.priority),
    // data tambahan detail:
    rawDestinationCity: r.destination_city || '',
    rawDestinationPlace: r.destination_place || '',
    purpose: r.purpose || '',
    startTime: r.start_time || '',
    endTime: r.end_time || '',
    passengerCount: r.passenger_count || 1,
    rawPriority: r.priority || 'Normal',
    notes: r.notes || '',
    passengers: r.passengers || [],
    // data tambahan alur persetujuan:
    canApprove: !!r.can_approve,
    canReject: !!r.can_reject,
    rawStatus: r.status,
    approvals: r.approvals || [],
  } as any;
}

export const requestService = {
  getAll: async (params?: any): Promise<ApiResponse<FleetRequest[]>> => {
    const res = await apiClient.get<any>(ENDPOINTS.REQUESTS, { params });
    const list = Array.isArray(res.data?.data) ? res.data.data : [];
    
    const mapped = list.map((r: any) => mapRequestFromBackend(r));

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
  create: async (request: any): Promise<ApiResponse<FleetRequest>> => {
    let payload: any;
    if (request.destination_city && request.start_time) {
      // It's already the detailed/raw payload format
      payload = request;
    } else {
      // It's the legacy FleetRequest format
      const destParts = request.destination.split(' - ');
      const city = destParts[0] || 'Jakarta';
      const place = destParts[1] || destParts[0] || 'Office';
      
      let startTimeStr = '';
      try {
        const parsedDate = new Date(request.date);
        if (isNaN(parsedDate.getTime()) || parsedDate.getTime() < Date.now()) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(9, 0, 0, 0);
          startTimeStr = tomorrow.toISOString().replace('T', ' ').substring(0, 19);
        } else {
          const timeParts = (request.time || '09:00').split(':');
          parsedDate.setHours(parseInt(timeParts[0]) || 9, parseInt(timeParts[1]) || 0, 0, 0);
          startTimeStr = parsedDate.toISOString().replace('T', ' ').substring(0, 19);
        }
      } catch {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        startTimeStr = tomorrow.toISOString().replace('T', ' ').substring(0, 19);
      }
      
      let priorityVal = 'Normal';
      if (request.priority === 'URGENT') priorityVal = 'Critical';
      else if (request.priority === 'HIGH') priorityVal = 'Urgent';
      else if (request.priority === 'NORMAL') priorityVal = 'Normal';
      
      payload = {
        department_id: request.department || 'IT',
        destination_city: city,
        destination_place: place,
        purpose: 'Operational Trip for ' + (request.employee || 'Staff'),
        start_time: startTimeStr,
        end_time: null,
        passenger_count: 1,
        priority: priorityVal,
        notes: 'Created via Frontend Dashboard',
        passengers: [
          { name: request.employee || 'Staff Member', department_id: request.department || 'IT' }
        ]
      };
    }
    
    const res = await apiClient.post<any>(ENDPOINTS.REQUESTS, payload);
    const r = res.data?.data;
    
    return {
      data: mapRequestFromBackend(r || request),
      message: res.data?.message
    };
  },
  update: async (id: string, request: any): Promise<ApiResponse<FleetRequest>> => {
    let payload: any = {};
    if (request.destination_city && request.start_time) {
      payload = request;
    } else {
      if (request.department) payload.department_id = request.department;
      if (request.destination) {
        const parts = request.destination.split(' - ');
        payload.destination_city = parts[0] || 'Jakarta';
        payload.destination_place = parts[1] || parts[0] || 'Office';
      }
    }
    
    const res = await apiClient.put<any>(`${ENDPOINTS.REQUESTS}/${id}`, payload);
    return {
      data: mapRequestFromBackend(res.data?.data),
      message: res.data?.message
    };
  },
  approve: async (id: string, notes?: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<any>(`${ENDPOINTS.REQUESTS}/${id}/approve`, { notes });
    return {
      data: undefined,
      message: res.data?.message
    };
  },
  reject: async (id: string, notes?: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<any>(`${ENDPOINTS.REQUESTS}/${id}/reject`, { notes });
    return {
      data: undefined,
      message: res.data?.message
    };
  },
  start: async (id: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<any>(`${ENDPOINTS.REQUESTS}/${id}/start`);
    return {
      data: undefined,
      message: res.data?.message
    };
  },
  complete: async (id: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<any>(`${ENDPOINTS.REQUESTS}/${id}/complete`);
    return {
      data: undefined,
      message: res.data?.message
    };
  },
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete<any>(`${ENDPOINTS.REQUESTS}/${id}`);
    return {
      data: undefined,
      message: res.data?.message
    };
  },
};

