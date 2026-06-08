// Permission definitions for role-based access control
export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'view_dashboard',

  // Request Management
  CREATE_REQUEST: 'create_request',
  VIEW_REQUEST: 'view_requests',
  APPROVE_REQUEST: 'approve_requests',
  REJECT_REQUEST: 'reject_requests',
  CANCEL_REQUEST: 'cancel_request',
  VIEW_OWN_REQUESTS: 'view_own_requests',

  // History
  VIEW_HISTORY: 'view_history',

  // Vehicle Management
  VIEW_VEHICLES: 'view_vehicles',
  MANAGE_VEHICLES: 'manage_vehicles',
  VIEW_ASSIGNED_VEHICLES: 'view_assigned_vehicles',

  // Driver Management
  VIEW_DRIVERS: 'view_drivers',
  MANAGE_DRIVERS: 'manage_drivers',

  // User Management
  VIEW_USERS: 'view_users',
  MANAGE_USERS: 'manage_users',

  // Role Management
  VIEW_ROLES: 'view_roles',
  MANAGE_ROLES: 'manage_roles',

  // Notification
  VIEW_NOTIFICATIONS: 'view_notifications',

  // Schedule
  VIEW_SCHEDULE: 'view_schedule',
  MANAGE_SCHEDULE: 'manage_schedule',

  // Audit Logs
  VIEW_AUDIT_LOGS: 'view_audit_logs',

  // Reports
  VIEW_REPORTS: 'view_reports',
  GENERATE_REPORTS: 'generate_reports',

  // Settings
  VIEW_SETTINGS: 'view_settings',
  MANAGE_SETTINGS: 'manage_settings',

  // Conflicts
  VIEW_CONFLICTS: 'view_conflicts',
} as const;

// Role-Permission Matrix
export const ROLE_PERMISSION_MATRIX: Record<string, string[]> = {
  admin: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.CREATE_REQUEST,
    PERMISSIONS.VIEW_REQUEST,
    PERMISSIONS.APPROVE_REQUEST,
    PERMISSIONS.REJECT_REQUEST,
    PERMISSIONS.VIEW_HISTORY,
    PERMISSIONS.VIEW_VEHICLES,
    PERMISSIONS.MANAGE_VEHICLES,
    PERMISSIONS.VIEW_DRIVERS,
    PERMISSIONS.MANAGE_DRIVERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_ROLES,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.VIEW_SCHEDULE,
    PERMISSIONS.MANAGE_SCHEDULE,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.VIEW_CONFLICTS,
  ],
  approver: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_REQUEST,
    PERMISSIONS.APPROVE_REQUEST,
    PERMISSIONS.REJECT_REQUEST,
    PERMISSIONS.VIEW_HISTORY,
    PERMISSIONS.VIEW_NOTIFICATIONS,
  ],
  employee: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.CREATE_REQUEST,
    PERMISSIONS.VIEW_OWN_REQUESTS,
    PERMISSIONS.CANCEL_REQUEST,
    PERMISSIONS.VIEW_NOTIFICATIONS,
  ],
  driver: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ASSIGNED_VEHICLES,
    PERMISSIONS.VIEW_SCHEDULE,
  ],
  gahrd: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_DRIVERS,
    PERMISSIONS.MANAGE_DRIVERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
  ],
};

export function checkPermission(userRole: string, permission: string): boolean {
  const permissions = ROLE_PERMISSION_MATRIX[userRole] || [];
  return permissions.includes(permission);
}

export function hasAllPermissions(userRole: string, permissions: string[]): boolean {
  return permissions.every(permission => checkPermission(userRole, permission));
}

export function hasAnyPermission(userRole: string, permissions: string[]): boolean {
  return permissions.some(permission => checkPermission(userRole, permission));
}
