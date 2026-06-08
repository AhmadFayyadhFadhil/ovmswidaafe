import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { useAuthContext } from "@/auth/authContext";

export function Sidebar({ activeNav, onNavigate }: { activeNav: string; onNavigate?: (p: string) => void }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  
  const isEmployee = user?.role === "employee";
  const isApprover = user?.role === "approver";
  const isDriver = user?.role === "driver";
  const isGAHRD = user?.role === "gahrd";
  const isAdmin = user?.role === "admin";

  const go = (label: string, path: string) => {
    onNavigate?.(label);
    if (path) {
      navigate(path);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const btn = (item: { icon: string; label: string }, path: string) => (
    <button
      key={item.label}
      onClick={() => go(item.label, path)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
        activeNav === item.label
          ? "bg-[#1e3a8a] text-white shadow-sm scale-[1.01]"
          : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#1e293b] hover:translate-x-0.5"
      }`}
    >
      <Icon
        name={item.icon}
        className={`text-[21px] flex-shrink-0 ${activeNav === item.label ? "text-white" : "text-[#64748b]"}`}
      />
      <span className="text-[13.5px] font-semibold truncate">{item.label}</span>
    </button>
  );

  // Employee menu
  const employeeMenu = [
    { icon: "dashboard", label: "Dashboard", path: "/employee/dashboard" },
    { icon: "add_box", label: "Create Request", path: "/employee/createrequest" },
    { icon: "list_alt", label: "My Requests", path: "/employee/myrequests" },
    { icon: "notifications", label: "Notifications", path: "/employee/notifications" },
    { icon: "person", label: "My Profile", path: "/employee/profile" },
  ];

  // Approver menu
  const approverMenu = [
    { icon: "dashboard", label: "Dashboard", path: "/approver/dashboard" },
    { icon: "list_alt", label: "Pending Requests", path: "/approver/requests" },
    { icon: "history", label: "History", path: "/approver/historys" },
  ];

  // Driver menu
  const driverMenu = [
    { icon: "dashboard", label: "Dashboard", path: "/driver/dashboard" },
    { icon: "directions_car", label: "My Vehicle", path: "/driver/dashboard" },
    { icon: "calendar_month", label: "Schedule", path: "/driver/dashboard" },
  ];

  // GAHRD menu
  const gahrdMenu = [
    { icon: "dashboard", label: "Dashboard", path: "/gahrd/dashboard" },
    { icon: "person", label: "Driver Management", path: "/gahrd/dashboard" },
    { icon: "group", label: "User Management", path: "/gahrd/dashboard" },
  ];

  // Admin menu navigation
  const adminNavMain = [
    { icon: "dashboard", label: "Dashboard", path: "/admin/dashboard" },
    { icon: "directions_car", label: "Vehicle Management", path: "/admin/vehicles" },
    { icon: "person", label: "Driver Management", path: "/admin/drivers" },
    { icon: "monitor_heart", label: "Request Monitoring", path: "/admin/requests" },
    { icon: "calendar_month", label: "Vehicle Schedule", path: "/admin/schedules" },
    { icon: "analytics", label: "Reports & Analytics", path: "/admin/reports" },
  ];

  const adminNavAdmin = [
    { icon: "group", label: "User Management", path: "/admin/users" },
    { icon: "admin_panel_settings", label: "Role Management", path: "/admin/roles" },
    { icon: "notifications", label: "Notification Center", path: "/admin/notifications" },
    { icon: "history", label: "Audit Logs", path: "/admin/audit" },
    { icon: "settings", label: "System Settings", path: "/admin/settings" },
  ];

  return (
    <aside className="w-[220px] flex-shrink-0 bg-white border-r border-[#e2e8f0] flex flex-col overflow-y-auto">
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-6">
        <div className="w-10 h-10 bg-[#1e3a8a] rounded-xl flex items-center justify-center shadow-sm">
          <Icon name="directions_car" className="text-white text-[22px]" />
        </div>
        <div>
          <div className="text-[17px] font-bold text-[#0f172a] leading-tight">OVMS</div>
          <div className="text-[11px] text-[#94a3b8] font-medium">Enterprise Fleet</div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 space-y-0.5">
        {isEmployee && (
          employeeMenu.map(item => btn(item, item.path))
        )}

        {isApprover && (
          approverMenu.map(item => btn(item, item.path))
        )}

        {isDriver && (
          driverMenu.map(item => btn(item, item.path))
        )}

        {isGAHRD && (
          gahrdMenu.map(item => btn(item, item.path))
        )}

        {isAdmin && (
          <>
            {adminNavMain.map(item => btn(item, item.path))}
            <div className="pt-4 pb-2 px-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Administration</span>
            </div>
            {adminNavAdmin.map(item => btn(item, item.path))}
          </>
        )}
      </nav>

      {/* Bottom section for Settings and Logout */}
      <div className="px-3 py-4 border-t border-[#e2e8f0] mt-auto">
        {!isAdmin && (
          <button
            onClick={() => go("Settings", "/admin/settings")}
            className="w-full flex items-center gap-3 py-2.5 rounded-md hover:bg-[#f1f5f9] text-[#475569] transition-colors"
          >
            <Icon name="settings" className="text-[20px]" />
            <span className="text-[13px] font-medium">Settings</span>
          </button>
        )}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 py-2.5 rounded-md hover:bg-[#f1f5f9] text-[#475569] transition-colors ${!isAdmin ? "mt-2" : ""}`}
        >
          <Icon name="logout" className="text-[20px]" />
          <span className="text-[13px] font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}