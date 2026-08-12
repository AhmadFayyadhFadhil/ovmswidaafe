import type { TourConfig, GuideRole } from './types';
import { employeeQuickTour } from './employee/quickTour';
import { employeeCreateRequestTour } from './employee/createRequestTour';
import { approverQuickTour } from './approver/quickTour';
import { gahrdQuickTour } from './gahrd/quickTour';
import { driverQuickTour } from './driver/quickTour';
import { adminQuickTour } from './admin/quickTour';

export * from './types';

export const ALL_TOURS: TourConfig[] = [
  employeeQuickTour,
  employeeCreateRequestTour,
  approverQuickTour,
  gahrdQuickTour,
  driverQuickTour,
  adminQuickTour,
];

export function getToursForRole(role?: GuideRole | string | null): TourConfig[] {
  if (!role) return [];
  const normalizedRole = role.toLowerCase() as GuideRole;
  return ALL_TOURS.filter(tour => tour.role === normalizedRole);
}

export function getQuickTourForRole(role?: GuideRole | string | null): TourConfig | undefined {
  if (!role) return undefined;
  const normalizedRole = role.toLowerCase() as GuideRole;
  return ALL_TOURS.find(tour => tour.role === normalizedRole && tour.type === 'quick_tour');
}
