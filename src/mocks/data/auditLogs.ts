import type { AuditLog } from "@/types";

export const initialAuditLogs: AuditLog[] = [
  {
    id: "#EV-92831",
    user: "Marcus Chen",
    role: "Administrator",
    activityType: "Vehicle Deletion",
    action: "Action: Permanent Removal of Vehicle V-1102",
    department: "IT",
    severity: "Critical",
    ipAddress: "192.168.1.45",
    timestamp: "2 mins ago",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "#EV-92830",
    user: "Sarah Jenkins",
    role: "Administrator",
    activityType: "Permission Change",
    action: "Action: Grant Admin Role on System Modules",
    department: "FA",
    severity: "High",
    ipAddress: "10.0.4.112",
    timestamp: "12 mins ago",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "#EV-92829",
    user: "Alex Rivera",
    role: "Administrator",
    activityType: "Route Optimization",
    action: "AI suggested route optimization for logistics grid A-3",
    department: "Engineering",
    severity: "Stable",
    ipAddress: "192.168.1.10",
    timestamp: "45 mins ago",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120"
  }
];
