export type Priority = "URGENT" | "NORMAL" | "CRITICAL";
export type HistoryStatus = "APPROVED" | "REJECTED";

export interface PendingRequest {
  id: string;
  reqId: string;
  requesterName: string;
  role: string;
  department: string;
  avatar: string;
  priority: Priority;
  destination: string;
  schedule: string;
  passengers: string;
  date: string;
  time: string;
  vehicleType: string;
  purpose: string;
  isActive?: boolean;
}

export interface HistoryItem {
  id: string;
  reqId: string;
  title: string;
  requester: string;
  datetime: string;
  priority: Priority;
  status: HistoryStatus;
  statusLabel: string;
  decidedBy?: string;
  notes?: string;
}

export interface ActivityItem {
  id: string;
  type: "approved" | "new" | "rejected";
  text: string;
  time: string;
}

// ── Dashboard data ─────────────────────────────────────────────────────────
export const ACTIVITY_FEED: ActivityItem[] = [
  { id: "1", type: "approved", text: "You approved M. Chen's request for Site Visit", time: "14 minutes ago" },
  { id: "2", type: "new",      text: "New request submitted by Alex Thorne", time: "1 hour ago" },
  { id: "3", type: "rejected", text: "You rejected D. Vance's request (Reason: Overlap)", time: "3 hours ago" },
];

// ── Approval management data ───────────────────────────────────────────────
export const PENDING_REQUESTS: PendingRequest[] = [
  {
    id: "1", reqId: "#RQ-8902",
    requesterName: "Jordan Davis", role: "Logistics Lead", department: "Logistics Department",
    avatar: "https://i.pravatar.cc/40?img=11", priority: "URGENT",
    destination: "North Port Distribution Hub",
    schedule: "Today, 08:00", passengers: "3 Persons",
    date: "Oct 24, 2023", time: "08:00 AM", vehicleType: "Heavy Cargo Truck", purpose: "Emergency Supply",
  },
  {
    id: "2", reqId: "#RQ-8905",
    requesterName: "Sarah Williams", role: "Account Manager", department: "Sales & Marketing",
    avatar: "https://i.pravatar.cc/40?img=5", priority: "NORMAL",
    destination: "Downtown Corporate HQ",
    schedule: "Oct 26, 10:30", passengers: "2 Persons",
    date: "Oct 26, 2023", time: "10:30 AM", vehicleType: "Executive Sedan", purpose: "Client Meeting",
  },
  {
    id: "3", reqId: "#RQ-8911",
    requesterName: "Marcus Knight", role: "Tech Specialist", department: "Maintenance Unit",
    avatar: "https://i.pravatar.cc/40?img=13", priority: "NORMAL",
    destination: "West Side Power Grid",
    schedule: "Oct 25, 14:00", passengers: "1 Person",
    date: "Oct 25, 2023", time: "02:00 PM", vehicleType: "Maintenance Van", purpose: "Regular Repair",
  },
  {
    id: "4", reqId: "#RQ-8944",
    requesterName: "Elena Cruz", role: "Facilities Officer", department: "Admin & Facilities",
    avatar: "https://i.pravatar.cc/40?img=9", priority: "CRITICAL",
    destination: "Airport Terminal 3",
    schedule: "Today, 21:15", passengers: "1 Person",
    date: "Oct 24, 2023", time: "09:15 PM", vehicleType: "Standard Sedan", purpose: "Guest Pickup",
    isActive: true,
  },
];

export const DASHBOARD_PENDING: PendingRequest[] = [
  {
    id: "d1", reqId: "#RQ-8991",
    requesterName: "Sarah Miller", role: "Senior Cloud Architect", department: "Engineering",
    avatar: "https://i.pravatar.cc/40?img=47", priority: "CRITICAL",
    destination: "HQ Data Center B",
    schedule: "Today, 14:30", passengers: "4 Persons",
    date: "Oct 24, 2023", time: "02:30 PM", vehicleType: "SUV Premium", purpose: "Site Inspection",
  },
  {
    id: "d2", reqId: "#RQ-8985",
    requesterName: "Robert King", role: "Procurement Lead", department: "Ops",
    avatar: "https://i.pravatar.cc/40?img=60", priority: "NORMAL",
    destination: "Vendor Warehouse A",
    schedule: "Tomorrow, 09:00", passengers: "1 Person",
    date: "Oct 25, 2023", time: "09:00 AM", vehicleType: "Cargo Van", purpose: "Procurement Run",
  },
];

// ── History data ───────────────────────────────────────────────────────────
export const HISTORY_ITEMS: HistoryItem[] = [
  {
    id: "1", reqId: "REQ-2024-0089", title: "Site Inspection: Northern Hub",
    requester: "Jonathan Sterling", datetime: "Dec 24, 08:30",
    priority: "CRITICAL", status: "APPROVED", statusLabel: "Workflow Completed",
    decidedBy: "Alex Rivera", notes: "Approved for immediate dispatch.",
  },
  {
    id: "2", reqId: "REQ-2024-0075", title: "Regional Logistics Sync",
    requester: "Sarah Chen", datetime: "Dec 23, 14:00",
    priority: "NORMAL", status: "REJECTED", statusLabel: "Action Required",
    decidedBy: "Alex Rivera", notes: "Vehicle unavailable on requested date.",
  },
  {
    id: "3", reqId: "REQ-2024-0068", title: "Airport VIP Transfer",
    requester: "Budi Santoso", datetime: "Dec 22, 11:15",
    priority: "URGENT", status: "APPROVED", statusLabel: "Workflow Completed",
    decidedBy: "Alex Rivera", notes: "Priority escalated by department head.",
  },
  {
    id: "4", reqId: "REQ-2024-0055", title: "Monthly Inventory Run",
    requester: "Rina Dewi", datetime: "Dec 21, 09:00",
    priority: "NORMAL", status: "APPROVED", statusLabel: "Workflow Completed",
    decidedBy: "Alex Rivera",
  },
  {
    id: "5", reqId: "REQ-2024-0041", title: "Emergency Supply Dispatch",
    requester: "Omar Faruk", datetime: "Dec 20, 06:45",
    priority: "CRITICAL", status: "REJECTED", statusLabel: "Policy Violation",
    decidedBy: "Alex Rivera", notes: "Driver not licensed for heavy vehicle.",
  },
];