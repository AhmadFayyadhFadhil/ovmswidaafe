import type { Role } from '../../types';
import type { ApiResponse } from '../../types/api';

const DEFAULT_ROLES: Role[] = [
  {
    id: "role-1",
    name: "Admin",
    description: "Full system access to all configurations, user groups, and fleet logs.",
    activePermissionsCount: 30,
    permissions: [
      { module: "Dashboard", view: true, create: true, edit: true, delete: true, approve: true, export: true, manage: true },
      { module: "Vehicles", view: true, create: true, edit: true, delete: true, approve: true, export: true, manage: true },
      { module: "Requests", view: true, create: true, edit: true, delete: true, approve: true, export: true, manage: true },
      { module: "Reports", view: true, create: true, edit: true, delete: true, approve: true, export: true, manage: true }
    ]
  },
  {
    id: "role-2",
    name: "Approver",
    description: "Financial & asset approval oversight for vehicle dispatches.",
    activePermissionsCount: 14,
    permissions: [
      { module: "Dashboard", view: true, create: false, edit: false, delete: false, approve: true, export: true, manage: false },
      { module: "Vehicles", view: true, create: false, edit: false, delete: false, approve: true, export: true, manage: false },
      { module: "Requests", view: true, create: true, edit: true, delete: false, approve: true, export: true, manage: false },
      { module: "Reports", view: true, create: false, edit: false, delete: false, approve: false, export: true, manage: false }
    ]
  },
  {
    id: "role-3",
    name: "GA",
    description: "General Affairs / Fleet & scheduling operations with dispatch allocation privileges.",
    activePermissionsCount: 22,
    permissions: [
      { module: "Dashboard", view: true, create: true, edit: true, delete: false, approve: false, export: true, manage: true },
      { module: "Vehicles", view: true, create: true, edit: true, delete: false, approve: true, export: true, manage: true },
      { module: "Requests", view: true, create: true, edit: true, delete: false, approve: true, export: true, manage: true },
      { module: "Reports", view: true, create: true, edit: false, delete: false, approve: false, export: true, manage: false }
    ]
  },
  {
    id: "role-4",
    name: "Driver",
    description: "Vehicle data access only, logging of route and duty sheets.",
    activePermissionsCount: 6,
    permissions: [
      { module: "Dashboard", view: true, create: false, edit: false, delete: false, approve: false, export: false, manage: false },
      { module: "Vehicles", view: true, create: false, edit: false, delete: false, approve: false, export: false, manage: false },
      { module: "Requests", view: false, create: false, edit: false, delete: false, approve: false, export: false, manage: false },
      { module: "Reports", view: false, create: false, edit: false, delete: false, approve: false, export: false, manage: false }
    ]
  }
];

function getStoredRoles(): Role[] {
  const stored = localStorage.getItem('ovms_roles');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  localStorage.setItem('ovms_roles', JSON.stringify(DEFAULT_ROLES));
  return DEFAULT_ROLES;
}

export const roleService = {
  getAll: async (): Promise<ApiResponse<Role[]>> => {
    const roles = getStoredRoles();
    return {
      data: roles,
      total: roles.length
    };
  },
  create: async (role: Role): Promise<ApiResponse<Role>> => {
    const roles = getStoredRoles();
    roles.push(role);
    localStorage.setItem('ovms_roles', JSON.stringify(roles));
    return { data: role };
  },
  update: async (id: string, role: Partial<Role>): Promise<ApiResponse<Role>> => {
    const roles = getStoredRoles();
    const idx = roles.findIndex(r => r.id === id);
    if (idx !== -1) {
      roles[idx] = { ...roles[idx], ...role } as Role;
      localStorage.setItem('ovms_roles', JSON.stringify(roles));
      return { data: roles[idx] };
    }
    throw new Error('Role not found');
  },
  delete: async (id: string): Promise<ApiResponse<void>> => {
    let roles = getStoredRoles();
    roles = roles.filter(r => r.id !== id);
    localStorage.setItem('ovms_roles', JSON.stringify(roles));
    return { data: undefined };
  },
};

