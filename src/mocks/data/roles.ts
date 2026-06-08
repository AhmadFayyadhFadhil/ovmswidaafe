import type { Role } from "@/types";

export const initialRoles: Role[] = [
  {
    id: "role-1",
    name: "Administrator",
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
    name: "Administrator.",
    description: "Fleet & scheduling operations with dispatch allocation privileges.",
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
