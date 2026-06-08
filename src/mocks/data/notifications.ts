import type { SystemNotification } from "@/types";

export const initialNotifications: SystemNotification[] = [
  {
    id: "NOT-001",
    title: "Collision Detected - Vehicle V-8821",
    description: "G-Force impact detected on Vehicle V-8821 at North Junction. Driver: Alex Rivera. Immediate dispatch required.",
    timeAgo: "2 mins ago",
    severity: "critical",
    category: "Operational",
    isRead: false,
    metadata: "Sector 7-B"
  },
  {
    id: "NOT-002",
    title: "Fuel Expense Approval Required",
    description: "Driver Sarah Jenkins has submitted a high-value fuel expense ($420.50) for approval. Fleet standard limit exceeded.",
    timeAgo: "45 mins ago",
    severity: "high",
    category: "Approvals",
    isRead: false,
    metadata: "Sarah Jenkins"
  },
  {
    id: "NOT-003",
    title: "Service Reminder: Brake Inspection",
    description: "Vehicle V-1102 has reached 15,000 km since last brake service. Service window opening in 48 hours.",
    timeAgo: "2 hours ago",
    severity: "medium",
    category: "Operational",
    isRead: false,
    metadata: "V-1102 (Semi-Truck)"
  },
  {
    id: "NOT-004",
    title: "System Update Completed",
    description: "OVMS Core v2.4.1 has been successfully deployed. Check the changelog for new telematics reporting features.",
    timeAgo: "6 hours ago",
    severity: "info",
    category: "System",
    isRead: true,
    metadata: "Info"
  }
];
