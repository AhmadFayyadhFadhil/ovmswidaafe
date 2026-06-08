// Role-based access guards
import type { UserRole } from './authContext';
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
export function canAccessRoute(userRole: UserRole | null, route: string): GuardResult {
  if (!userRole) return 'unauthorized';

  // Define role-based route access
  const routeAccess: Record<string, string[]> = {
    '/admin': ['admin'],
    '/admin/dashboard': ['admin'],
    '/admin/drivers': ['admin'],
    '/admin/requests': ['admin'],
    '/admin/reports': ['admin'],
    '/admin/users': ['admin'],
    '/admin/vehicles': ['admin'],
    '/admin/audit': ['admin'],
    '/admin/roles': ['admin'],
    '/admin/notifications': ['admin'],
    '/admin/schedules': ['admin'],
    '/admin/settings': ['admin'],

    '/approver': ['approver', 'admin'],
    '/approver/dashboard': ['approver', 'admin'],
    '/approver/requests': ['approver', 'admin'],
    '/approver/historys': ['approver', 'admin'],
    '/approver/profile': ['approver', 'admin'],

    '/employee': ['employee', 'admin'],
    '/employee/dashboard': ['employee', 'admin'],
    '/employee/createrequest': ['employee', 'admin'],
    '/employee/myrequests': ['employee', 'admin'],
    '/employee/notifications': ['employee', 'admin'],
    '/employee/profile': ['employee', 'admin'],

    '/driver': ['driver', 'admin'],
    '/driver/dashboard': ['driver', 'admin'],

    '/gahrd': ['gahrd', 'admin'],
    '/gahrd/dashboard': ['gahrd', 'admin'],
  };

  const allowedRoles = routeAccess[route] || [];
  
  if (allowedRoles.length === 0) {
    // If no specific rules, allow admin only
    return userRole === 'admin' ? 'allowed' : 'forbidden';
  }

  return allowedRoles.includes(userRole) ? 'allowed' : 'forbidden';
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
  };

  return dashboardRoutes[userRole] || '/login';
}

/**
 * Get allowed routes for a specific role
 */
export function getAllowedRoutes(userRole: UserRole): string[] {
  const roleRoutes: Record<UserRole, string[]> = {
    admin: [
      '/admin/dashboard',
      '/admin/drivers',
      '/admin/requests',
      '/admin/reports',
      '/admin/users',
      '/admin/vehicles',
      '/admin/audit',
      '/admin/roles',
      '/admin/notifications',
      '/admin/schedules',
      '/admin/settings',
    ],
    approver: [
      '/approver/dashboard',
      '/approver/requests',
      '/approver/historys',
      '/approver/profile',
    ],
    employee: [
      '/employee/dashboard',
      '/employee/createrequest',
      '/employee/myrequests',
      '/employee/notifications',
      '/employee/profile',
    ],
    driver: [
      '/driver/dashboard',
    ],
    gahrd: [
      '/gahrd/dashboard',
    ],
  };

  return roleRoutes[userRole] || [];
}
