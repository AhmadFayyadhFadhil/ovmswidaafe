import { apiClient } from '../api/api';
import type { ScheduleConflict } from '../../types';
import type { ApiResponse } from '../../types/api';
import { ENDPOINTS } from '../../constants/endpoints';

export const conflictService = {
  getAll: async (): Promise<ApiResponse<ScheduleConflict[]>> => {
    const res = await apiClient.get<any>(ENDPOINTS.REQUESTS);
    const list = Array.isArray(res.data?.data) ? res.data.data : [];
    
    const conflicts: ScheduleConflict[] = [];
    const approvedRequests = list.filter((r: any) => 
      ['approved_hrd_ga', 'driver_assigned', 'on_going'].includes(r.status)
    );
    
    approvedRequests.forEach((r: any) => {
      const driverAssigned = r.operational_trip?.driver?.name;
      const vehicleAssigned = r.operational_trip?.vehicle?.name;
      
      if (!driverAssigned || !vehicleAssigned) {
        conflicts.push({
          id: `unassigned-${r.id}`,
          vehicleId: r.operational_trip?.vehicle?.id ? String(r.operational_trip.vehicle.id) : '0',
          vehicleLabel: r.operational_trip?.vehicle?.name || 'Unassigned Vehicle',
          title: `Mission Assignment Pending`,
          description: `Request REQ-${r.id} is approved but lacks an assigned ${!vehicleAssigned ? 'vehicle' : ''}${!vehicleAssigned && !driverAssigned ? ' and ' : ''}${!driverAssigned ? 'driver' : ''}.`,
          type: 'unassigned' as const,
          severity: 'warning' as const,
          actionRequired: true
        });
      }
    });
    
    for (let i = 0; i < approvedRequests.length; i++) {
      const r1 = approvedRequests[i];
      const v1 = r1.operational_trip?.vehicle;
      if (!v1) continue;
      
      const start1 = r1.start_time ? new Date(r1.start_time).getTime() : 0;
      const end1 = r1.end_time ? new Date(r1.end_time).getTime() : start1 + 4 * 3600000;
      
      for (let j = i + 1; j < approvedRequests.length; j++) {
        const r2 = approvedRequests[j];
        const v2 = r2.operational_trip?.vehicle;
        if (!v2 || String(v1.id) !== String(v2.id)) continue;
        
        const start2 = r2.start_time ? new Date(r2.start_time).getTime() : 0;
        const end2 = r2.end_time ? new Date(r2.end_time).getTime() : start2 + 4 * 3600000;
        
        if (start1 < end2 && start2 < end1) {
          conflicts.push({
            id: `overlap-${r1.id}-${r2.id}`,
            vehicleId: String(v1.id),
            vehicleLabel: `${v1.name} (${v1.plate_number || ''})`,
            title: `Vehicle Schedule Conflict`,
            description: `Overlap detected between Request REQ-${r1.id} and Request REQ-${r2.id} on vehicle ${v1.name}.`,
            type: 'overlap' as const,
            severity: 'critical' as const,
            actionRequired: true
          });
        }
      }
    }

    return {
      data: conflicts,
      total: conflicts.length,
      message: res.data?.message
    };
  },
};

