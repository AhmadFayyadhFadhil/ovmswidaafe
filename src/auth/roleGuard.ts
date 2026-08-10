// Role-based access guards
import type { UserRole, AuthUser } from './authContext';
import { checkPermission } from '@/config/permissions';

export type GuardResult = 'allowed' | 'forbidden' | 'unauthorized';

/**
 * Check if user has permission for a specific resource
 */
export function checkRolePermission(userRole: UserRole | null, requiredPermission: string): GuardResult {
  if (!userRole) return 'unauthorized';
  return checkPermission(userRole, requiredPermission) ? 'allowed' : 'forbidden';
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(user: AuthUser | null, route: string): GuardResult {
  if (!user) return 'unauthorized';

  // Gather all roles assigned to user
  const allRoles: string[] = [];
  if (user.role) allRoles.push(user.role.toLowerCase());
  if (user.roles && Array.isArray(user.roles)) {
    user.roles.forEach((r) => {
      if (r && !allRoles.includes(r.toLowerCase())) {
        allRoles.push(r.toLowerCase());
      }
    });
  }
  // Map 'ga' alias to 'gahrd'
  if (allRoles.includes('ga') && !allRoles.includes('gahrd')) {
    allRoles.push('gahrd');
  }
  // If is_department_head is true, user also has approver capability!
  if (user.is_department_head && !allRoles.includes('approver')) {
    allRoles.push('approver');
  }

  // Normalize path: strip query params, hashes, and trailing slashes
  const pathWithoutQuery = (route || '').split('?')[0].split('#')[0];
  const cleanPath = (pathWithoutQuery.replace(/\/+$/, '') || '/').toLowerCase();

  // Admin can access all routes
  if (allRoles.includes('admin')) {
    return 'allowed';
  }

  // Common employee routes (accessible by ALL logged in users)
  if (cleanPath.startsWith('/employee')) {
    return 'allowed';
  }

  // Universal notification routes (accessible by ALL logged in users)
  if (cleanPath.endsWith('/notifications') || cleanPath === '/notifications') {
    return 'allowed';
  }

  // Role-specific prefix checks
  if (cleanPath.startsWith('/gahrd')) {
    return allRoles.includes('gahrd') ? 'allowed' : 'forbidden';
  }

  if (cleanPath.startsWith('/approver')) {
    return allRoles.includes('approver') ? 'allowed' : 'forbidden';
  }

  if (cleanPath.startsWith('/driver')) {
    return allRoles.includes('driver') ? 'allowed' : 'forbidden';
  }

  if (cleanPath.startsWith('/security')) {
    return allRoles.includes('security') ? 'allowed' : 'forbidden';
  }

  if (cleanPath.startsWith('/admin')) {
    if (allRoles.includes('gahrd') && cleanPath.startsWith('/admin/vehicles')) {
      return 'allowed';
    }
    return 'forbidden';
  }

  // Default fallback for any unspecified routes
  return 'allowed';
}

/**
 * Get the default dashboard route based on user role
 */
export function getDefaultDashboardRoute(userRole: UserRole): string {
  const dashboardRoutes: Record<UserRole, string> = {
    admin: '/admin/dashboard',
    approver: '/approver/dashboard',
    employee: '/employee/dashboard',
    driver: '/driver/dashboard',
    gahrd: '/gahrd/dashboard',
    security: '/security/dashboard',
  };

  return dashboardRoutes[userRole] || '/login';
}

/**
 * Check if user can access a specific route
 */
export function getAllowedRoutes(user: AuthUser | null): string[] {
  if (!user) return [];
  const userRole = user.role;

  const roleRoutes: Record<UserRole, string[]> = {
    admin: [
      '/admin/dashboard',
      '/admin/drivers',
      '/admin/requests',
      '/gahrd/requests/urgent',
      '/admin/users',
      '/admin/vehicles',
      '/admin/audit',
      '/admin/roles',
      '/admin/notifications',
      '/admin/schedules',
      '/admin/settings',
      '/admin/profile',
    ],
    approver: [
      '/approver/dashboard',
      '/approver/requests',
      '/approver/history',
      '/approver/notifications',
      '/approver/profile',
      '/employee/createrequest',
      '/employee/myrequests',
      '/employee/history',
      '/employee/notifications',
      '/employee/profile',
    ],
    employee: [
      '/employee/dashboard',
      '/employee/createrequest',
      '/employee/myrequests',
      '/employee/history',
      '/employee/notifications',
      '/employee/profile',
    ],
    driver: [
      '/driver/dashboard',
      '/driver/profile',
      '/driver/notifications',
      '/employee/createrequest',
      '/employee/myrequests',
      '/employee/history',
      '/employee/notifications',
      '/employee/profile',
    ],
    gahrd: [
      '/gahrd/dashboard',
      '/gahrd/requests',
      '/gahrd/requests/urgent',
      '/gahrd/history',
      '/gahrd/notifications',
      '/gahrd/driver',
      '/gahrd/calendar',
      '/gahrd/users',
      '/gahrd/profile',
      '/admin/vehicles',
      '/employee/createrequest',
      '/employee/myrequests',
      '/employee/history',
      '/employee/notifications',
      '/employee/profile',
    ],
    security: [
      '/security/dashboard',
      '/security/history',
      '/security/notifications',
      '/security/profile',
      '/employee/createrequest',
      '/employee/myrequests',
      '/employee/history',
      '/employee/notifications',
      '/employee/profile',
    ],
  };

  return roleRoutes[userRole] || [];
}
