import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { useAuthContext } from "@/auth/authContext";

export function Sidebar({ 
  activeNav, 
  onNavigate, 
  isOpen, 
  onClose 
}: { 
  activeNav: string; 
  onNavigate?: (p: string) => void; 
  isOpen?: boolean; 
  onClose?: () => void 
}) {
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

  // Detect if user is Head of HRD & GA
  const isHrGaHead = user?.role === "approver" && 
    (user?.department_id === "HR&GA" || user?.department_id === "HRD&GA") && 
    !!user?.is_department_head;

  // Approver menu
  const approverMenu = [
    { icon: "dashboard", label: "Dashboard", path: "/approver/dashboard" },
    { icon: "list_alt", label: "Pending Requests", path: "/approver/requests" },
    ...(isHrGaHead ? [
      { icon: "assignment_ind", label: "Driver Assignment", path: "/approver/assignment" },
    ] : []),
    { icon: "history", label: "History", path: "/approver/history" },
    { icon: "person", label: "My Profile", path: "/approver/profile" },
  ];

  // Driver menu
  const driverMenu = [
    { icon: "dashboard", label: "Dashboard", path: "/driver/dashboard" },
    { icon: "directions_car", label: "My Vehicle", path: "/driver/dashboard?tab=vehicle" },
    { icon: "calendar_month", label: "Schedule", path: "/driver/dashboard?tab=schedule" },
    { icon: "person", label: "My Profile", path: "/driver/profile" },
  ];

  // GAHRD menu
  const gahrdMenu = [
    { icon: "dashboard",        label: "Dashboard",           path: "/gahrd/dashboard" },
    { icon: "monitor_heart",    label: "Requests",            path: "/gahrd/requests" },
    { icon: "directions_car",   label: "Driver Availability", path: "/gahrd/driver" },
    { icon: "history",          label: "History",             path: "/gahrd/history" },
    { icon: "notifications",    label: "Notifications",       path: "/gahrd/notifications" },
    { icon: "person",           label: "My Profile",          path: "/gahrd/profile" },
  ];


  // Admin menu navigation
  const adminNavMain = [
    { icon: "dashboard", label: "Dashboard", path: "/admin/dashboard" },
    { icon: "directions_car", label: "Vehicle Management", path: "/admin/vehicles" },
    { icon: "person", label: "Driver Management", path: "/admin/drivers" },
    { icon: "monitor_heart", label: "Request Monitoring", path: "/admin/requests" },
    { icon: "calendar_month", label: "Vehicle Schedule", path: "/admin/schedules" },
  ];

  const adminNavAdmin = [
    { icon: "group", label: "User Management", path: "/admin/users" },
    { icon: "admin_panel_settings", label: "Role Management", path: "/admin/roles" },
    { icon: "notifications", label: "Notification Center", path: "/admin/notifications" },
    { icon: "history", label: "Audit Logs", path: "/admin/audit" },
    { icon: "settings", label: "System Settings", path: "/admin/settings" },
    { icon: "person", label: "My Profile", path: "/admin/profile" },
  ];

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
        />
      )}

      {/* Sidebar container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-[240px] bg-white border-r border-[#e2e8f0] flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out lg:static lg:w-[220px] lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between px-5 pt-6 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1e3a8a] rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <Icon name="directions_car" className="text-white text-[22px]" />
            </div>
            <div>
              <div className="text-[17px] font-bold text-[#0f172a] leading-tight">OVMS</div>
              <div className="text-[11px] text-[#94a3b8] font-medium">Enterprise Fleet</div>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] lg:hidden cursor-pointer"
            >
              <Icon name="close" className="text-[20px]" />
            </button>
          )}
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

      {/* Bottom section for Logout */}
      <div className="px-3 py-4 border-t border-[#e2e8f0] mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 py-2.5 rounded-md hover:bg-[#f1f5f9] text-[#475569] transition-colors"
        >
          <Icon name="logout" className="text-[20px]" />
          <span className="text-[13px] font-medium">Logout</span>
        </button>
      </div>
    </aside>
    </>
  );
}