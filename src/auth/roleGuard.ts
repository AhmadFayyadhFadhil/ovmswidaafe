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
  const userRole = user.role;

  const routeAccess: Record<string, string[]> = {
    '/admin': ['admin'],
    '/admin/dashboard': ['admin'],
    '/admin/drivers': ['admin'],
    '/admin/requests': ['admin'],
    '/admin/users': ['admin'],
    '/admin/vehicles': ['admin', 'gahrd'],
    '/admin/audit': ['admin'],
    '/admin/roles': ['admin'],
    '/admin/notifications': ['admin'],
    '/admin/schedules': ['admin'],
    '/admin/settings': ['admin'],
    '/admin/profile': ['admin'],

    '/approver': ['approver', 'admin'],
    '/approver/dashboard': ['approver', 'admin'],
    '/approver/requests': ['approver', 'admin'],
    '/approver/history': ['approver', 'admin'],
    '/approver/notifications': ['approver', 'admin'],
    '/approver/profile': ['approver', 'admin'],

    '/employee': ['employee', 'admin', 'approver', 'gahrd', 'driver', 'security'],
    '/employee/dashboard': ['employee', 'admin', 'approver', 'gahrd', 'driver', 'security'],
    '/employee/createrequest': ['employee', 'admin', 'approver', 'gahrd', 'driver', 'security'],
    '/employee/myrequests': ['employee', 'admin', 'approver', 'gahrd', 'driver', 'security'],
    '/employee/history': ['employee', 'admin', 'approver', 'gahrd', 'driver', 'security'],
    '/employee/notifications': ['employee', 'admin', 'approver', 'gahrd', 'driver', 'security'],
    '/employee/profile': ['employee', 'admin', 'approver', 'gahrd', 'driver', 'security'],

    '/driver': ['driver', 'admin'],
    '/driver/dashboard': ['driver', 'admin'],
    '/driver/profile': ['driver', 'admin'],
    '/driver/notifications': ['driver', 'admin'],

    '/gahrd': ['gahrd', 'admin'],
    '/gahrd/dashboard': ['gahrd', 'admin'],
    '/gahrd/requests': ['gahrd', 'admin'],
    '/gahrd/requests/urgent': ['gahrd', 'admin'],
    '/gahrd/history': ['gahrd', 'admin'],
    '/gahrd/notifications': ['gahrd', 'admin'],
    '/gahrd/driver': ['gahrd', 'admin'],
    '/gahrd/calendar': ['gahrd', 'admin'],
    '/gahrd/profile': ['gahrd', 'admin'],
    '/gahrd/users': ['gahrd', 'admin'],

    '/security': ['security', 'admin'],
    '/security/dashboard': ['security', 'admin'],
    '/security/history': ['security', 'admin'],
    '/security/audit': ['admin'],
    '/security/profile': ['security', 'admin'],
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
