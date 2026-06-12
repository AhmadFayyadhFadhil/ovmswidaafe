import { apiClient } from '../api/api';
import type { ScheduleItem } from '../../types';
import type { ApiResponse } from '../../types/api';
import { ENDPOINTS } from '../../constants/endpoints';

export const scheduleService = {
  getAll: async (): Promise<ApiResponse<ScheduleItem[]>> => {
    const res = await apiClient.get<any>(ENDPOINTS.REQUESTS);
    const list = Array.isArray(res.data?.data) ? res.data.data : [];
    
    // Filter requests that have operational_trip assignments
    const activeRequests = list.filter((r: any) => r.operational_trip && r.operational_trip.vehicle);
    
    const mapped: ScheduleItem[] = activeRequests.map((r: any) => {
      let dateLabelVal = 'Today';
      let startTimeVal = '09:00';
      let endTimeVal = '17:00';
      
      if (r.start_time) {
        try {
          const d = new Date(r.start_time);
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          dateLabelVal = `${days[d.getDay()]} ${d.getDate()}`;
          
          const time = r.start_time.split(' ')[1];
          if (time) startTimeVal = time.substring(0, 5);
        } catch {
          dateLabelVal = 'Today';
        }
      }
      
      if (r.end_time) {
        try {
          const time = r.end_time.split(' ')[1];
          if (time) endTimeVal = time.substring(0, 5);
        } catch {
          endTimeVal = '17:00';
        }
      }

      return {
        id: String(r.id),
        vehicleId: String(r.operational_trip.vehicle.id),
        vehicleLabel: `${r.operational_trip.vehicle.name} (${r.operational_trip.vehicle.plate_number || ''})`,
        type: 'Regular Mission' as const,
        title: r.purpose || 'Operational Duty',
        driverName: r.operational_trip.driver?.name || 'Driver Not Assigned',
        startTime: startTimeVal,
        endTime: endTimeVal,
        dateLabel: dateLabelVal
      };
    });

    return {
      data: mapped,
      total: mapped.length,
      message: res.data?.message
    };
  },
};

