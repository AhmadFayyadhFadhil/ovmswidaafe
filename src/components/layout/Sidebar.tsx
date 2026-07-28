import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { useAuthContext } from "@/auth/authContext";
import { systemConfigService } from "@/services/modules/systemConfigService";

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

  const [branding, setBranding] = useState({
    systemName: "OVMS",
    companyName: "Enterprise Fleet",
    companyLogo: ""
  });

  useEffect(() => {
    const loadBrandingFromCache = () => {
      const cached = localStorage.getItem("ovms_branding_config");
      if (cached) {
        try {
          setBranding(JSON.parse(cached));
        } catch (e) {
          // ignore
        }
      }
    };

    // 1. Load from cache for instant shift-free rendering
    loadBrandingFromCache();

    // 2. Fetch fresh config in background
    const fetchBranding = async () => {
      const lastFetch = localStorage.getItem("ovms_branding_last_fetch");
      const cached = localStorage.getItem("ovms_branding_config");
      const now = Date.now();
      
      if (cached && lastFetch && (now - parseInt(lastFetch, 10) < 10 * 60 * 1000)) {
        return;
      }

      try {
        const res = await systemConfigService.get();
        if (res && res.data) {
          const newBranding = {
            systemName: res.data.systemName || "OVMS",
            companyName: res.data.companyName || "Enterprise Fleet",
            companyLogo: res.data.companyLogo || ""
          };
          setBranding(newBranding);
          localStorage.setItem("ovms_branding_config", JSON.stringify(newBranding));
          localStorage.setItem("ovms_branding_last_fetch", now.toString());
        }
      } catch (err) {
        console.error("Failed to load branding in sidebar", err);
      }
    };

    fetchBranding();

    // 3. Listen to local updates (like saving settings or uploading logo)
    window.addEventListener("branding-update", loadBrandingFromCache);
    return () => {
      window.removeEventListener("branding-update", loadBrandingFromCache);
    };
  }, []);
  
  const isEmployee = user?.role === "employee";
  const isApprover = user?.role === "approver";
  const isDriver = user?.role === "driver";
  const isGAHRD = user?.role === "gahrd";
  const isSecurity = user?.role === "security";
  const isAdmin = user?.role === "admin";

  const go = (label: string, path: string) => {
    onNavigate?.(label);
    if (path) {
      navigate(path);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {}
    window.location.href = "/login";
  };

  const btn = (item: { icon: string; label: string }, path: string) => {
    const currentPath = window.location.pathname;
    const cleanPath = path.split('?')[0];
    const isPathMatch = cleanPath !== "" && (currentPath === cleanPath || (cleanPath !== "/" && currentPath.startsWith(cleanPath) && cleanPath !== "/employee/myrequests"));
    const isActive = activeNav === item.label || isPathMatch;

    return (
      <button
        key={item.label}
        onClick={() => go(item.label, path)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
          isActive
            ? "bg-[#1e3a8a] text-white shadow-sm scale-[1.01]"
            : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#1e293b] hover:translate-x-0.5"
        }`}
      >
        <Icon
          name={item.icon}
          className={`text-[21px] flex-shrink-0 ${isActive ? "text-white" : "text-[#64748b]"}`}
        />
        <span className="text-[13.5px] font-semibold truncate">{item.label}</span>
      </button>
    );
  };

  // Employee menu
  const employeeMenu = [
    { icon: "dashboard", label: "Dashboard", path: "/employee/dashboard" },
    { icon: "add_box", label: "Create Request", path: "/employee/createrequest" },
    { icon: "list_alt", label: "My Requests", path: "/employee/myrequests" },
    { icon: "history", label: "History", path: "/employee/history" },
    { icon: "notifications", label: "Notifications", path: "/employee/notifications" },
    { icon: "person", label: "My Profile", path: "/employee/profile" },
  ];


  // Approver menu
  const approverMenu = [
    { icon: "dashboard", label: "Dashboard", path: "/approver/dashboard" },
    { icon: "add_box", label: "Create Request", path: "/employee/createrequest" },
    { icon: "list_alt", label: "My Requests", path: "/employee/myrequests" },
    { icon: "list_alt", label: "Pending Requests", path: "/approver/requests" },
    { icon: "history", label: "History", path: "/approver/history" },
    { icon: "notifications", label: "Notifications", path: "/approver/notifications" },
    { icon: "person", label: "My Profile", path: "/approver/profile" },
  ];

  // Driver menu
  const driverMenu = [
    { icon: "dashboard", label: "Dashboard", path: "/driver/dashboard" },
    { icon: "assignment", label: "My Tasks", path: "/driver/dashboard?tab=assignments" },
    { icon: "history", label: "History", path: "/driver/dashboard?tab=schedule" },
    { icon: "event", label: "Calendar", path: "/driver/dashboard?tab=calendar" },
    { icon: "directions_car", label: "My Vehicle", path: "/driver/dashboard?tab=vehicle" },
    { icon: "notifications", label: "Notifications", path: "/driver/notifications" },
    { icon: "person", label: "My Profile", path: "/driver/profile" },
  ];

  // GAHRD menu
  const gahrdMenu = [
    { icon: "dashboard",        label: "Dashboard",           path: "/gahrd/dashboard" },
    { icon: "monitor_heart",    label: "Requests",            path: "/gahrd/requests" },
    { icon: "directions_car",   label: "Vehicle Management",  path: "/admin/vehicles" },
    { icon: "person",           label: "Driver Availability", path: "/gahrd/driver" },
    { icon: "event",            label: "Calendar",            path: "/gahrd/calendar" },
    { icon: "history",          label: "History",             path: "/gahrd/history" },
    { icon: "notifications",    label: "Notifications",       path: "/gahrd/notifications" },
    { icon: "group",            label: "User Activation",     path: "/gahrd/users" },
    { icon: "person",           label: "My Profile",          path: "/gahrd/profile" },
  ];

  // Security menu
  const securityMenu = [
    { icon: "dashboard", label: "Dashboard", path: "/security/dashboard" },
    { icon: "work_history", label: "Scan History", path: "/security/history" },
    { icon: "person", label: "My Profile", path: "/security/profile" },
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
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 overflow-hidden ${branding.companyLogo ? "bg-white border border-[#e2e8f0]" : "bg-[#1e3a8a]"}`}>
              {branding.companyLogo ? (
                <img src={branding.companyLogo} alt="Logo" className="w-full h-full object-contain p-0.5" />
              ) : (
                <Icon name="directions_car" className="text-white text-[22px]" />
              )}
            </div>
            <div>
              <div className="text-[17px] font-bold text-[#0f172a] leading-tight truncate max-w-[130px] notranslate" translate="no">
                {branding.systemName}
              </div>
              <div className="text-[11px] text-[#94a3b8] font-medium truncate max-w-[130px] notranslate" translate="no">
                {branding.companyName}
              </div>
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

        {isSecurity && (
          securityMenu.map(item => btn(item, item.path))
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