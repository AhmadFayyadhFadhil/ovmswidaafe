import { apiClient } from '../api/api';
import type { FleetRequest } from '../../types';
import type { ApiResponse } from '../../types/api';
import { ENDPOINTS } from '../../constants/endpoints';

function mapStatus(backendStatus: string): "APPROVED" | "PENDING" | "ONGOING" | "COMPLETED" | "REJECTED" | "CANCELLED" {
  switch (backendStatus) {
    case 'completed':
      return 'COMPLETED';
    case 'rejected':
      return 'REJECTED';
    case 'cancelled':
      return 'CANCELLED';
    case 'on_going':
      return 'ONGOING';
    case 'driver_assigned':
    case 'approved_hrd_ga':
    case 'approved_hrd':
      return 'APPROVED';
    case 'submitted':
    case 'approved_department':
    case 'waiting_driver':
    case 'assigned_by_ga':
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

function parseDateTime(dtStr: string | undefined) {
  if (!dtStr) return { date: '', time: '' };

  let datePart = '';
  let timePart = '';

  if (dtStr.includes('T')) {
    const parts = dtStr.split('T');
    datePart = parts[0];
    if (parts[1]) {
      timePart = parts[1].substring(0, 5);
    }
  } else if (dtStr.includes(' ')) {
    const parts = dtStr.split(' ');
    datePart = parts[0];
    if (parts[1]) {
      timePart = parts[1].substring(0, 5);
    }
  } else {
    datePart = dtStr;
  }

  const dateSubparts = datePart.split('-');
  if (dateSubparts.length === 3) {
    let day = dateSubparts[2];
    let monthStr = dateSubparts[1];
    let year = dateSubparts[0];
    
    if (year.length < 4 && day.length === 4) {
      day = dateSubparts[0];
      year = dateSubparts[2];
    }
    
    const dayNum = parseInt(day, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthName = monthNames[monthIndex] || monthStr;
    datePart = `${dayNum} ${monthName} ${year}`;
  }

  return { date: datePart, time: timePart };
}

function mapRequestFromBackend(r: any): FleetRequest {
  const start = parseDateTime(r.start_time);
  const end = parseDateTime(r.end_time);
  return {
    id: String(r.id),
    employee: r.requested_by?.name || 'Staff',
    email: r.requested_by?.email || '',
    userPhone: r.requested_by?.phone || '',
    requestedById: r.requested_by?.id ? String(r.requested_by.id) : (r.user_id ? String(r.user_id) : null),
    department: r.department_name || r.department_id || 'IT',
    destination: `${r.destination_city || ''}${r.destination_place ? ' - ' + r.destination_place : ''}`,
    vehicleModel: r.vehicle_model || r.operational_trip?.vehicle?.name || r.vehicle?.name || 'Not Assigned',
    driverName: r.driver_name || r.operational_trip?.driver?.name || r.driver?.name || 'Not Assigned',
    driverPhone: r.driver?.phone || r.operational_trip?.driver?.phone || '',
    driverId: r.driver?.id || r.operational_trip?.driver?.id || null,
    rating: r.rating || null,
    ratingNotes: r.rating_notes || '',
    ratedAt: r.rated_at || null,
    vehicleId: r.vehicle?.id || r.operational_trip?.vehicle?.id || null,
    date: start.date,
    time: start.time,
    endDate: end.date,
    endTime: end.time,
    status: mapStatus(r.status),
    priority: mapPriority(r.priority),
    // data tambahan detail:
    rawDestinationCity: r.destination_city || '',
    rawDestinationPlace: r.destination_place || '',
    purpose: r.purpose || '',
    startTime: r.start_time || '',
    rawEndTime: r.end_time || '',
    estimated_duration: r.estimated_duration || null,
    is_external: !!r.is_external,
    third_party_cost: r.third_party_cost || 0,
    passengerCount: r.passenger_count || 1,
    rawPriority: r.priority || 'Normal',
    notes: r.notes || '',
    passengers: r.passengers || [],
    // data tambahan alur persetujuan:
    canApprove: !!r.can_approve,
    canReject: !!r.can_reject,
    rawStatus: r.status,
    approvals: r.approvals || [],
    qr_code_token: r.qr_code_token || '',
    security_checked_out_at: r.security_checked_out_at || null,
    security_checked_in_at: r.security_checked_in_at || null,
    security_checkout_by: r.security_checkout_by || null,
    security_checkin_by: r.security_checkin_by || null,
    security_checkout_notes: r.security_checkout_notes || null,
    security_checkin_notes: r.security_checkin_notes || null,
    started_at: r.started_at || null,
    completed_at: r.completed_at || null,
    external_fleet_info: r.external_fleet_info || '',
    external_photo_url: r.external_photo_url || null,
    external_trip_type: r.external_trip_type || 'round_trip',
    external_departure_cost: r.external_departure_cost || 0,
    external_return_cost: r.external_return_cost || 0,
    external_return_fleet_info: r.external_return_fleet_info || '',
    external_return_photo_url: r.external_return_photo_url || null,
    external_driver_name: r.external_driver_name || '',
    external_license_plate: r.external_license_plate || '',
    external_return_driver_name: r.external_return_driver_name || '',
    external_return_license_plate: r.external_return_license_plate || '',
    external_provider: r.external_provider || null,

    // Second external vehicle:
    external_driver_name_2: r.external_driver_name_2 || '',
    external_license_plate_2: r.external_license_plate_2 || '',
    external_fleet_info_2: r.external_fleet_info_2 || '',
    external_photo_url_2: r.external_photo_url_2 || null,
    external_departure_cost_2: r.external_departure_cost_2 || 0,
    external_return_cost_2: r.external_return_cost_2 || 0,
    external_return_driver_name_2: r.external_return_driver_name_2 || '',
    external_return_license_plate_2: r.external_return_license_plate_2 || '',
    external_return_fleet_info_2: r.external_return_fleet_info_2 || '',
    external_return_photo_url_2: r.external_return_photo_url_2 || null,
    third_party_cost_2: r.third_party_cost_2 || 0,

    itinerary_file_url: r.itinerary_file_url || null,
    itineraries: r.itineraries || [],
    is_overtime: !!r.is_overtime,
    overtime_minutes: r.overtime_minutes || 0,
    overtime_formatted: r.overtime_formatted || null,

    assignments: r.assignments || [],
    operational_trips: r.operational_trips || [],
  } as any;
}

let requestCache: { data: ApiResponse<FleetRequest[]>; timestamp: number; key: string } | null = null;
const REQUEST_CACHE_TTL_MS = 15000; // 15 seconds short TTL cache

export const requestService = {
  clearCache: () => {
    requestCache = null;
  },
  getAll: async (params?: any): Promise<ApiResponse<FleetRequest[]>> => {
    const key = JSON.stringify(params || {});
    const now = Date.now();

    if (requestCache && requestCache.key === key && (now - requestCache.timestamp < REQUEST_CACHE_TTL_MS)) {
      return requestCache.data;
    }

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

    const response: ApiResponse<FleetRequest[]> = {
      data: mapped,
      message: res.data?.message
    };

    requestCache = { data: response, timestamp: now, key };
    return response;
  },
  getById: async (id: string): Promise<ApiResponse<FleetRequest>> => {
    const res = await apiClient.get<any>(`${ENDPOINTS.REQUESTS}/${id}`);
    return {
      data: mapRequestFromBackend(res.data?.data),
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
    
    let finalPayload: any = payload;
    const hasItineraryFile = request.itinerary_file && request.itinerary_file instanceof File;
    if (hasItineraryFile) {
      const formData = new FormData();
      Object.keys(payload).forEach(key => {
        if (payload[key] === null || payload[key] === undefined) return;
        if (key === 'passengers' || key === 'itineraries') {
          formData.append(key, JSON.stringify(payload[key]));
        } else if (key === 'itinerary_file') {
          if (payload[key] instanceof File) {
            formData.append(key, payload[key]);
          }
        } else {
          formData.append(key, payload[key]);
        }
      });
      finalPayload = formData;
    } else {
      delete payload.itinerary_file;
    }
    
    const res = await apiClient.post<any>(ENDPOINTS.REQUESTS, finalPayload);
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
  delete: async (id: string, reason?: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete<any>(`${ENDPOINTS.REQUESTS}/${id}`, {
      data: { rejected_reason: reason || '' }
    });
    return {
      data: undefined,
      message: res.data?.message
    };
  },
  storeDailyAssignments: async (id: string, dailyAssignments: any[]): Promise<ApiResponse<FleetRequest>> => {
    const res = await apiClient.post<any>(`${ENDPOINTS.REQUESTS}/${id}/daily-assignments`, {
      daily_assignments: dailyAssignments
    });
    return {
      data: mapRequestFromBackend(res.data?.data),
      message: res.data?.message
    };
  },
  rateDriver: async (id: string | number, ratingData: { rating: number; rating_notes?: string }): Promise<ApiResponse<FleetRequest>> => {
    const res = await apiClient.post<any>(`${ENDPOINTS.REQUESTS}/${id}/rate-driver`, ratingData);
    return {
      data: mapRequestFromBackend(res.data?.data),
      message: res.data?.message
    };
  },
};

