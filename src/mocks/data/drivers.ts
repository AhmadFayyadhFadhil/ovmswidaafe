import type { Driver } from "@/types";

export const initialDrivers: Driver[] = [
  {
    id: "D-001",
    name: "John Doe",
    status: "AVAILABLE",
    licenseType: "Class A",
    licenseExpiry: "Oct 24, 2025",
    performance: 4.9,
    assignedVehicleId: "V-4029",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
    phone: "+1 (555) 019-2834",
    email: "john.doe@kinetic-fleet.com"
  },
  {
    id: "D-002",
    name: "Sarah Miller",
    status: "ON DUTY",
    licenseType: "Class B",
    licenseExpiry: "Nov 12, 2024",
    performance: 4.7,
    assignedVehicleId: "V-9912",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
    phone: "+1 (555) 018-2940",
    email: "sarah.miller@kinetic-fleet.com"
  },
  {
    id: "D-003",
    name: "Mark Wilson",
    status: "AVAILABLE",
    licenseType: "Class A",
    licenseExpiry: "Mar 15, 2026",
    performance: 4.8,
    assignedVehicleId: "V-8829",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
    phone: "+1 (555) 012-9214",
    email: "mark.wilson@kinetic-fleet.com"
  },
  {
    id: "D-004",
    name: "Sarah Jenkins",
    status: "ON DUTY",
    licenseType: "Class B",
    licenseExpiry: "Jun 10, 2025",
    performance: 4.6,
    assignedVehicleId: "V-1104",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120",
    phone: "+1 (555) 021-9988",
    email: "s.jenkins@kinetic-fleet.com"
  },
  {
    id: "D-005",
    name: "Robert Wilson",
    status: "OFF DUTY",
    licenseType: "Class A",
    licenseExpiry: "Jun 15, 2024",
    performance: 4.2,
    assignedVehicleId: "V-5521",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120",
    phone: "+1 (555) 902-3142",
    email: "robert.wilson@kinetic-fleet.com"
  },
  {
    id: "D-006",
    name: "Elena Rodriguez",
    status: "OFF DUTY",
    licenseType: "Class B",
    licenseExpiry: "Jan 08, 2026",
    performance: 4.8,
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120",
    phone: "+1 (555) 035-1829",
    email: "e.rodriguez@kinetic-fleet.com"
  }
];
