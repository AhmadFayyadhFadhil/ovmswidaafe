import type { FleetRequest } from "@/types";

export const initialFleetRequests: FleetRequest[] = [
  {
    id: "REQ-2048",
    employee: "Sarah Donovan",
    email: "s.donovan@kinetic-fleet.com",
    department: "Corporate Park, Sector 4",
    destination: "Regional HQ Conference",
    vehicleModel: "Audi A6",
    driverName: "Mark Wilson",
    date: "Oct 14, 2023",
    time: "08:30",
    status: "APPROVED",
    priority: "HIGH"
  },
  {
    id: "REQ-2049",
    employee: "James Doe",
    email: "j.doe@kinetic-fleet.com",
    department: "Logistics Ops",
    destination: "Central Warehouse Inventory Audit",
    vehicleModel: "Toyota Hilux",
    driverName: "John Doe",
    date: "Oct 24, 2024",
    time: "08:00",
    status: "APPROVED",
    priority: "URGENT"
  },
  {
    id: "REQ-2050",
    employee: "Sarah White",
    email: "s.white@kinetic-fleet.com",
    department: "Marketing",
    destination: "Tech Expo Plaza Event Setup",
    vehicleModel: "Honda CR-V",
    driverName: "Marcus Lee",
    date: "Oct 24, 2024",
    time: "10:00",
    status: "ONGOING",
    priority: "NORMAL"
  },
  {
    id: "REQ-2051",
    employee: "Alan Kim",
    email: "a.kim@kinetic-fleet.com",
    department: "Engineering",
    destination: "Power Substation 4 Site Inspection",
    vehicleModel: "Ford Ranger",
    driverName: "Unassigned",
    date: "Oct 25, 2024",
    time: "07:00",
    status: "PENDING",
    priority: "HIGH"
  },
  {
    id: "REQ-2052",
    employee: "Elena Post",
    email: "e.post@kinetic-fleet.com",
    department: "Admin",
    destination: "Airport Terminal 2 Guest Pickup",
    vehicleModel: "Nissan Urvan",
    driverName: "Robert Fox",
    date: "Oct 23, 2024",
    time: "23:30",
    status: "COMPLETED",
    priority: "NORMAL"
  }
];
