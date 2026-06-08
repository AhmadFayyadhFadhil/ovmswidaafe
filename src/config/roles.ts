// Role definitions and configuration
export const ROLE_DEFINITIONS = {
  admin: {
    name: 'Administrator',
    description: 'Full system access and administration',
    permissions: ['*'], // All permissions
  },
  approver: {
    name: 'Request Approver',
    description: 'Approve or reject vehicle requests',
    permissions: [
      'view_requests',
      'approve_requests',
      'reject_requests',
      'view_history',
      'view_dashboard',
    ],
  },
  employee: {
    name: 'Employee',
    description: 'Submit and manage vehicle requests',
    permissions: [
      'create_request',
      'view_own_requests',
      'cancel_request',
      'view_notifications',
      'view_dashboard',
    ],
  },
  driver: {
    name: 'Driver',
    description: 'View assigned vehicles and missions',
    permissions: [
      'view_assigned_vehicles',
      'view_schedule',
      'view_dashboard',
    ],
  },
  gahrd: {
    name: 'GAHRD',
    description: 'General Administration and HR Department',
    permissions: [
      'view_drivers',
      'manage_drivers',
      'view_users',
      'manage_users',
      'view_dashboard',
    ],
  },
};

export type RoleType = keyof typeof ROLE_DEFINITIONS;

export function getRoleDisplayName(role: RoleType): string {
  return ROLE_DEFINITIONS[role]?.name || role;
}

export function getRolePermissions(role: RoleType): string[] {
  return ROLE_DEFINITIONS[role]?.permissions || [];
}

export function hasPermission(userRole: RoleType, requiredPermission: string): boolean {
  if (!userRole) return false;
  
  const permissions = getRolePermissions(userRole);
  
  // Admin has all permissions
  if (permissions.includes('*')) return true;
  
  return permissions.includes(requiredPermission);
}
