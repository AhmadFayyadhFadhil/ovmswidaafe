export type Tab =
  | "Dashboard"
  | "Vehicle Management"
  | "Driver Management"
  | "Request Monitoring"
  | "Vehicle Schedule"
  | "Reports & Analytics"
  | "User Management"
  | "Role Management"
  | "Notification Center"
  | "Audit Logs"
  | "System Settings";

export interface Vehicle {
  id: string;
  model: string;
  plate: string;
  type: string;
  driverId: string;
  driverName: string;
  status: "AVAILABLE" | "IN TRANSIT";
  battery: number; // percentage
  fuelType: "Electric" | "Diesel" | "Hybrid" | "Gasoline";
  odometer: number; // km
  nextMaint: string; // date or "OVERDUE"
  imageType: "tesla" | "truck" | "rav4" | "ranger" | "generic";
  vin?: string;
  photoUrl?: string;
  backendStatus?: string;
  capacity?: number;
}

export interface Driver {
  id: string;
  name: string;
  status: "AVAILABLE" | "ON DUTY" | "OFF DUTY" ;
  licenseType: "Class A" | "Class B" | "Class C";
  licenseExpiry: string;
  performance: number; // e.g. 4.8
  assignedVehicleId?: string;
  avatarUrl?: string;
  phone?: string;
  email?: string;
}

export interface FleetRequest {
  id: string;
  employee: string;
  email?: string;
  department: string;
  destination: string;
  vehicleModel: string;
  driverName: string;
  date: string;
  time?: string;
  status: "APPROVED" | "PENDING" | "ONGOING" | "COMPLETED" | "REJECTED";
  priority: "HIGH" | "URGENT" | "NORMAL" | "LOW";
  canApprove?: boolean;
  canReject?: boolean;
  rawStatus?: string;
  approvals?: any[];
  passengers?: any[];
  purpose?: string;
  startTime?: string;
  passengerCount?: number;
  notes?: string;
}

export interface ScheduleItem {
  id: string;
  vehicleId: string;
  vehicleLabel: string;
  type: "Regular Mission" | "Recurring" ;
  title: string;
  driverName: string;
  startTime: string; // e.g. "09:00"
  endTime: string; // e.g. "13:00"
  dateLabel: string; // e.g. "Mon 12"
}

export interface ScheduleConflict {
  id: string;
  vehicleId: string;
  vehicleLabel: string;
  title: string;
  description: string;
  type: "overlap" | "unassigned" ;
  severity: "critical" | "warning" | "info";
  actionRequired: boolean;
}

export interface SystemNotification {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: "Operational" | "Approvals" | "Security" | "Announcements" | "System";
  isRead: boolean;
  metadata?: string;
  userInitiated?: string;
}

export interface AuditLog {
  id: string;
  user: string;
  role: string;
  activityType: string;
  action: string;
  department: string;
  severity: "Critical" | "High" | "Normal" | "Low" | "Stable";
  ipAddress: string;
  timestamp: string;
  avatarUrl?: string;
}

export interface UserAccount {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  roleName: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  lastLogin: string;
  avatarUrl?: string;
}

export interface RolePermission {
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  export: boolean;
  manage: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  activePermissionsCount: number;
  permissions: RolePermission[];
}

export interface SystemConfig {
  systemName: string;
  timezone: string;
  dateFormat: string;
  systemLanguage: string;
  companyName: string;
  supportEmail: string;
  hqAddress: string;
  mfaEnabled: boolean;
  sessionTimeout: number;
  loginRetryLimit: string;
  ipWhitelist: string;
  advancedEncryption: boolean;
  companyLogo?: string;
}
