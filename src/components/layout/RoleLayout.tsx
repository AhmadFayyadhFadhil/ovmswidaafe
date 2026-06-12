import type { ReactNode } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuthContext } from "../../auth/authContext";
export { Icon } from "@/components/ui/Icon";
export { Sidebar } from "./Sidebar";
export { Topbar } from "./Topbar";

export function Layout({ activeNav, onNavigate, topbarTitle, userName, userRole, searchPlaceholder, searchValue, onSearchChange, children }:
  { activeNav: string; onNavigate?: (p:string)=>void; topbarTitle: string; userName?: string; userRole?: string; searchPlaceholder?: string; searchValue?: string; onSearchChange?: (value: string) => void; children: ReactNode }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const roleDisplayMap: Record<string, string> = {
    admin: "Administrator",
    gahrd: "GA & HRD",
    approver: "Manager Approver",
    driver: "Driver",
    employee: "Employee"
  };

  const displayUserName = user?.name || userName || "User";
  const displayUserRole = user?.role ? (roleDisplayMap[user.role] || user.role) : (userRole || "User");

  const handleNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
      return;
    }

    const role = user?.role?.toLowerCase() || userRole?.toLowerCase() || "employee";

    if (page === "Logout") {
      logout();
      navigate("/login");
      return;
    }

    if (page === "My Profile") {
      navigate(`/${role}/profile`);
      return;
    }

    if (role === "employee") {
      switch (page) {
        case "Dashboard":
          navigate("/employee/dashboard");
          break;
        case "Create Request":
          navigate("/employee/createrequest");
          break;
        case "My Requests":
          navigate("/employee/myrequests");
          break;
        case "Notifications":
          navigate("/employee/notifications");
          break;
      }
    } else if (role === "driver") {
      switch (page) {
        case "Dashboard":
          navigate("/driver/dashboard");
          break;
        case "My Vehicle":
          navigate("/driver/dashboard?tab=vehicle");
          break;
        case "Schedule":
          navigate("/driver/dashboard?tab=schedule");
          break;
      }
    } else if (role === "approver") {
      switch (page) {
        case "Dashboard":
          navigate("/approver/dashboard");
          break;
        case "Pending Requests":
          navigate("/approver/requests");
          break;
        case "History":
          navigate("/approver/history");
          break;
        case "Driver Assignment":
          navigate("/approver/assignment");
          break;
      }
    } else if (role === "gahrd") {
      switch (page) {
        case "Dashboard":
          navigate("/gahrd/dashboard");
          break;
        case "Requests":
          navigate("/gahrd/requests");
          break;
        case "Driver Availability":
          navigate("/gahrd/driver");
          break;
        case "History":
          navigate("/gahrd/history");
          break;
        case "Notifications":
          navigate("/gahrd/notifications");
          break;
      }
    } else if (role === "admin") {
      switch (page) {
        case "Dashboard":
          navigate("/admin/dashboard");
          break;
        case "Vehicle Management":
          navigate("/admin/vehicles");
          break;
        case "Driver Management":
          navigate("/admin/drivers");
          break;
        case "Request Monitoring":
          navigate("/admin/requests");
          break;
        case "Vehicle Schedule":
          navigate("/admin/schedules");
          break;
        case "User Management":
          navigate("/admin/users");
          break;
        case "Role Management":
          navigate("/admin/roles");
          break;
        case "Notification Center":
          navigate("/admin/notifications");
          break;
        case "Audit Logs":
          navigate("/admin/audit");
          break;
        case "System Settings":
          navigate("/admin/settings");
          break;
      }
    }
  };

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden animate-fadein" style={{ fontFamily:"'Inter',sans-serif" }}>
      <Sidebar 
        activeNav={activeNav} 
        onNavigate={(p) => {
          handleNavigate(p);
          setSidebarOpen(false);
        }} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar 
          title={topbarTitle} 
          userName={displayUserName} 
          userRole={displayUserRole} 
          searchPlaceholder={searchPlaceholder} 
          searchValue={searchValue} 
          onSearchChange={onSearchChange} 
          onMenuClick={() => setSidebarOpen(true)}
          onProfileClick={() => {
            const role = user?.role || "employee";
            navigate(`/${role}/profile`);
            setSidebarOpen(false);
          }}
        />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
        .material-symbols-outlined{font-family:'Material Symbols Outlined';font-weight:normal;font-style:normal;line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-smoothing:antialiased;vertical-align:middle;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:8px;}
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .animate-fadein{animation:fadein 0.25s ease-out;}
        @keyframes slidein{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
        .animate-slidein{animation:slidein 0.2s ease-out;}
        @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}
        .animate-pulse-dot{animation:pulse-dot 1.5s ease-in-out infinite;}
      `}</style>
    </div>
  );
}
