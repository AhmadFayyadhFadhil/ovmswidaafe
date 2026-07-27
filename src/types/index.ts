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
  stnkPhotoUrl?: string;
}

export interface Driver {
  id: string;
  nik?: string;
  name: string;
  status: "AVAILABLE" | "ON DUTY" | "OFF DUTY" | "ASSIGNED";
  licenseType: "Class A" | "Class B" | "Class C";
  licenseExpiry: string;
  performance: number; // e.g. 4.8
  assignedVehicleId?: string;
  avatarUrl?: string;
  simPhotoUrl?: string;
  phone?: string;
  email?: string;
}

export interface FleetRequest {
  id: string;
  employee: string;
  email?: string;
  userPhone?: string;
  driverPhone?: string;
  rating?: number | null;
  ratingNotes?: string;
  ratedAt?: string | null;
  requestedById?: string | null;
  department: string;
  destination: string;
  vehicleModel: string;
  driverName: string;
  date: string;
  time?: string;
  status: "APPROVED" | "PENDING" | "ONGOING" | "COMPLETED" | "REJECTED" | "CANCELLED";
  priority: "HIGH" | "URGENT" | "NORMAL" | "LOW";
  canApprove?: boolean;
  canReject?: boolean;
  rawStatus?: string;
  is_external?: boolean;
  approvals?: any[];
  passengers?: any[];
  purpose?: string;
  startTime?: string;
  passengerCount?: number;
  notes?: string;
  driverId?: string | number | null;
  security_checked_out_at?: string | null;
  security_checked_in_at?: string | null;
  security_checkout_by?: string | null;
  security_checkin_by?: string | null;
  security_checkout_notes?: string | null;
  security_checkin_notes?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  qr_code_token?: string;
  external_fleet_info?: string;
  external_photo_url?: string | null;
  external_trip_type?: "round_trip" | "one_way";
  external_departure_cost?: number;
  external_return_cost?: number;
  external_return_fleet_info?: string;
  external_return_photo_url?: string | null;
  external_driver_name?: string;
  external_license_plate?: string;
  external_return_driver_name?: string;
  external_return_license_plate?: string;
  external_provider?: string | null;

  // Second external vehicle:
  external_driver_name_2?: string;
  external_license_plate_2?: string;
  external_fleet_info_2?: string;
  external_photo_url_2?: string | null;
  external_departure_cost_2?: number;
  external_return_cost_2?: number;
  external_return_driver_name_2?: string;
  external_return_license_plate_2?: string;
  external_return_fleet_info_2?: string;
  external_return_photo_url_2?: string | null;
  third_party_cost_2?: number;

  itinerary_file_url?: string | null;
  itineraries?: RequestItinerary[];
  is_overtime?: boolean;
  overtime_minutes?: number;
  overtime_formatted?: string | null;
  operational_trips?: OperationalTrip[];
}

export interface RequestItinerary {
  id?: number | string;
  date: string;
  morning_time?: string | null;
  morning_destination?: string | null;
  afternoon_time?: string | null;
  afternoon_destination?: string | null;
  passengers_notes?: string | null;
  driver_id?: number | string | null;
  driver_name?: string | null;
  vehicle_id?: number | string | null;
  vehicle_name?: string | null;
  is_external?: boolean;
  external_driver_name?: string | null;
  external_license_plate?: string | null;
  external_fleet_info?: string | null;
  third_party_cost?: number;
  security_checked_out_at?: string | null;
  security_checked_in_at?: string | null;
  status?: string;
  is_overtime?: boolean;
  overtime_minutes?: number;
  overtime_formatted?: string | null;
}

export interface OperationalTrip {
  id: number;
  driver: {
    id: number;
    name: string;
    email: string;
  };
  vehicle: {
    id: number;
    name: string;
    plate_number: string;
    type: string;
  };
  status: string;
  security_checked_out_at?: string | null;
  security_checked_in_at?: string | null;
  security_checkout_by?: string | null;
  security_checkin_by?: string | null;
  security_checkout_notes?: string | null;
  security_checkin_notes?: string | null;
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
  nik?: string;
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
