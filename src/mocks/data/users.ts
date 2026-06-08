import type { UserAccount } from "@/types";

export const initialUserAccounts: UserAccount[] = [
  {
    id: "EMP-90231",
    fullName: "Alex Rivera",
    username: "arivera_admin",
    email: "arivera@ovms-logistics.com",
    phone: "+1 (555) 902-3142",
    department: "Fleet Operations",
    position: "Administrator",
    roleName: "Administrator",
    status: "ACTIVE",
    lastLogin: "Online",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "EMP-2840",
    fullName: "Johnnathan Doe",
    username: "john_doe_mgr",
    email: "j.doe@ovms-enterprise.com",
    phone: "+1 (555) 019-2834",
    department: "Logistics Ops",
    position: "Administrator",
    roleName: "Transport Coordinator",
    status: "ACTIVE",
    lastLogin: "2 mins ago",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "EMP-2915",
    fullName: "Alina Smith",
    username: "alina_smith_apv",
    email: "a.smith@ovms-enterprise.com",
    phone: "+1 (555) 018-2940",
    department: "Finance",
    position: "Approver",
    roleName: "Approver",
    status: "INACTIVE",
    lastLogin: "3 days ago",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "EMP-3042",
    fullName: "Marcus Knight",
    username: "marcus_maint",
    email: "m.knight@ovms-enterprise.com",
    phone: "+1 (555) 012-9214",
    department: "Fleet Operations",
    position: "Lead Mechanic",
    roleName: "Driver",
    status: "ACTIVE",
    lastLogin: "1 hour ago",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120"
  },
  {
    id: "EMP-1102",
    fullName: "Robert Hanger",
    username: "robert_driver",
    email: "r.hanger@ovms-enterprise.com",
    phone: "+1 (555) 902-3142",
    department: "Operations",
    position: "Driver",
    roleName: "Driver",
    status: "SUSPENDED",
    lastLogin: "Oct 12, 2023",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120"
  }
];
