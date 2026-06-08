import type { ScheduleConflict } from "@/types";

export const initialConflicts: ScheduleConflict[] = [
  {
    id: "CONF-001",
    vehicleId: "V-9011",
    vehicleLabel: "V-9011 (Sedan)",
    title: "Overlap Detected: V-9011",
    description: "Request #312 and #315 are both scheduled for Oct 15, 09:00 - 13:00 on the same Camry unit.",
    type: "overlap",
    severity: "critical",
    actionRequired: true
  },
  {
    id: "CONF-002",
    vehicleId: "V-1102",
    vehicleLabel: "V-1102 (SUV)",
    title: "Unassigned Request #320",
    description: "High priority VIP transport needed for tomorrow at 08:30. No SUV currently available as V-1102 is currently out of service.",
    type: "unassigned",
    severity: "warning",
    actionRequired: true
  },
  {
    id: "CONF-003",
    vehicleId: "V-2291",
    vehicleLabel: "V-2291 (Sedan)",
    title: "Service Due: V-2291",
    description: "Scheduled service in 48 hours. Ensure vehicle is grounded by tomorrow evening to avoid field failure.",
    type: "unassigned",
    severity: "info",
    actionRequired: false
  }
];
