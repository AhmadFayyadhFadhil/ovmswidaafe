import type { ScheduleItem } from "@/types";

export const initialScheduleItems: ScheduleItem[] = [
  {
    id: "SCH-001",
    vehicleId: "V-8829",
    vehicleLabel: "V-8829 (Sedan)",
    type: "Regular Mission",
    title: "#REQ-294 • John D.",
    driverName: "John Doe",
    startTime: "09:00",
    endTime: "13:00",
    dateLabel: "Mon 12"
  },
  {
    id: "SCH-002",
    vehicleId: "V-8829",
    vehicleLabel: "V-8829 (Sedan)",
    type: "Regular Mission",
    title: "#REQ-301 • Sarah M.",
    driverName: "Sarah Miller",
    startTime: "14:00",
    endTime: "18:00",
    dateLabel: "Mon 12"
  },
  {
    id: "SCH-003",
    vehicleId: "V-1102",
    vehicleLabel: "V-1102 (SUV)",
    type: "Regular Mission",
    title: "Oil Change & Brake Check",
    driverName: "Unassigned",
    startTime: "10:00",
    endTime: "16:00",
    dateLabel: "Tue 13"
  },
  {
    id: "SCH-004",
    vehicleId: "V-5521",
    vehicleLabel: "V-5521 (Van)",
    type: "Recurring",
    title: "RECURRING: STAFF SHUTTLE (ROUTE A)",
    driverName: "Robert Wilson",
    startTime: "07:00",
    endTime: "19:00",
    dateLabel: "Mon 12"
  },
  {
    id: "SCH-005",
    vehicleId: "V-9011",
    vehicleLabel: "V-9011 (Sedan)",
    type: "Regular Mission",
    title: "#REQ-294 • John D. (OVERLAP)",
    driverName: "John Doe",
    startTime: "09:00",
    endTime: "13:00",
    dateLabel: "Tue 13"
  }
];
