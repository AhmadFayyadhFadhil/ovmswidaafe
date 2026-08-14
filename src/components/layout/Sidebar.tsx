import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { useAuthContext } from "@/auth/authContext";
import { systemConfigService } from "@/services/modules/systemConfigService";
import { useGuide } from "@/hooks/useGuide";
import { getQuickTourForRole } from "@/guides";

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
  const { startTour } = useGuide();

  const [branding, setBranding] = useState({
    systemName: "OVMS",
    companyName: "Enterprise Fleet",
    companyLogo: ""
  });
  const [logoError, setLogoError] = useState(false);

  const getValidLogoUrl = (url: string | undefined | null) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url;
    }
    if (url.startsWith("/")) {
      return `${window.location.origin}${url}`;
    }
    return `${window.location.origin}/${url}`;
  };

  useEffect(() => {
    const loadBrandingFromCache = () => {
      const cached = localStorage.getItem("ovms_branding_config");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setBranding(parsed);
          setLogoError(false);
        } catch (e) {
          // ignore
        }
      }
    };

    // 1. Load from cache for instant shift-free rendering
    loadBrandingFromCache();

    // 2. Fetch fresh config in background
    const fetchBranding = async () => {
      try {
        const res = await systemConfigService.get();
        if (res && res.data) {
          const newBranding = {
            systemName: res.data.systemName || "OVMS",
            companyName: res.data.companyName || "Enterprise Fleet",
            companyLogo: res.data.companyLogo || ""
          };
          setBranding(newBranding);
          setLogoError(false);
          localStorage.setItem("ovms_branding_config", JSON.stringify(newBranding));
          localStorage.setItem("ovms_branding_last_fetch", Date.now().toString());
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

  const btn = (item: { icon: string; label: string; guideKey?: string }, path: string) => {
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    
    let isActive = activeNav === item.label;

    if (path.includes('?')) {
      const [basePath, queryStr] = path.split('?');
      if (currentPath === basePath) {
        const tabVal = new URLSearchParams(queryStr).get('tab');
        const currentTab = new URLSearchParams(currentSearch).get('tab');
        
        if (tabVal && currentTab) {
          isActive = (tabVal === currentTab) || (activeNav === item.label);
        } else if (!currentTab) {
          isActive = (item.label === "Dashboard" && activeNav === "Dashboard");
        }
      }
    } else if (!isActive) {
      const isExactMatch = currentPath === path;
      const isPrefixMatch = path !== "/" && currentPath.startsWith(path) && !["/driver/dashboard", "/employee/myrequests"].includes(path);
      isActive = (isExactMatch || isPrefixMatch) && !currentSearch;
    }

    return (
      <button
        key={item.label}
        data-guide={item.guideKey || item.label.toLowerCase().replace(/\s+/g, '-')}
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
    { icon: "dashboard", label: "Dashboard", path: "/employee/dashboard", guideKey: "dashboard" },
    { icon: "add_box", label: "Create Request", path: "/employee/createrequest", guideKey: "create-request" },
    { icon: "list_alt", label: "My Requests", path: "/employee/myrequests", guideKey: "my-requests" },
    { icon: "history", label: "History", path: "/employee/history", guideKey: "vehicle-schedule" },
    { icon: "notifications", label: "Notifications", path: "/employee/notifications", guideKey: "notifications" },
    { icon: "person", label: "My Profile", path: "/employee/profile", guideKey: "profile" },
  ];


  // Approver menu
  const approverMenu = [
    { icon: "dashboard", label: "Dashboard", path: "/approver/dashboard", guideKey: "approver-dashboard" },
    { icon: "add_box", label: "Create Request", path: "/employee/createrequest", guideKey: "create-request" },
    { icon: "list_alt", label: "My Requests", path: "/employee/myrequests", guideKey: "my-requests" },
    { icon: "list_alt", label: "Pending Requests", path: "/approver/requests", guideKey: "pending-requests" },
    { icon: "history", label: "History", path: "/approver/history", guideKey: "approval-history" },
    { icon: "notifications", label: "Notifications", path: "/approver/notifications", guideKey: "notifications" },
    { icon: "person", label: "My Profile", path: "/approver/profile", guideKey: "profile" },
  ];

  // Driver menu
  const driverMenu = [
    { icon: "dashboard", label: "Dashboard", path: "/driver/dashboard", guideKey: "driver-dashboard" },
    { icon: "assignment", label: "My Tasks", path: "/driver/dashboard?tab=assignments", guideKey: "driver-assignment" },
    { icon: "history", label: "History", path: "/driver/dashboard?tab=schedule", guideKey: "driver-history" },
    { icon: "event", label: "Calendar", path: "/driver/dashboard?tab=calendar", guideKey: "driver-schedule" },
    { icon: "directions_car", label: "My Vehicle", path: "/driver/dashboard?tab=vehicle", guideKey: "driver-vehicle" },
    { icon: "notifications", label: "Notifications", path: "/driver/notifications", guideKey: "notifications" },
    { icon: "person", label: "My Profile", path: "/driver/profile", guideKey: "profile" },
  ];

  // GAHRD menu
  const gahrdMenu = [
    { icon: "dashboard",        label: "Dashboard",           path: "/gahrd/dashboard", guideKey: "gahrd-dashboard" },
    { icon: "add_box",          label: "Create Request",      path: "/gahrd/createrequest", guideKey: "create-request" },
    { icon: "list_alt",         label: "My Requests",         path: "/gahrd/myrequests", guideKey: "my-requests" },
    { icon: "monitor_heart",    label: "Fleet Requests",      path: "/gahrd/requests", guideKey: "gahrd-requests" },
    { icon: "directions_car",   label: "Vehicle Management",  path: "/admin/vehicles", guideKey: "vehicle-assignment" },
    { icon: "person",           label: "Driver Availability", path: "/gahrd/driver", guideKey: "driver-assignment" },
    { icon: "event",            label: "Calendar",            path: "/gahrd/calendar", guideKey: "gahrd-schedule" },
    { icon: "history",          label: "History",             path: "/gahrd/history", guideKey: "gahrd-history" },
    { icon: "notifications",    label: "Notifications",       path: "/gahrd/notifications", guideKey: "notifications" },
    { icon: "group",            label: "User Management",     path: "/gahrd/users", guideKey: "user-management" },
    { icon: "settings",         label: "System Settings",     path: "/admin/settings", guideKey: "system-settings" },
    { icon: "person",           label: "My Profile",          path: "/gahrd/profile", guideKey: "profile" },
  ];

  // Security menu
  const securityMenu = [
    { icon: "dashboard", label: "Dashboard", path: "/security/dashboard", guideKey: "dashboard" },
    { icon: "work_history", label: "Scan History", path: "/security/history", guideKey: "history" },
    { icon: "notifications", label: "Notifications", path: "/security/notifications", guideKey: "notifications" },
    { icon: "person", label: "My Profile", path: "/security/profile", guideKey: "profile" },
  ];


  // Admin menu navigation
  const adminNavMain = [
    { icon: "dashboard", label: "Dashboard", path: "/admin/dashboard", guideKey: "admin-dashboard" },
    { icon: "directions_car", label: "Vehicle Management", path: "/admin/vehicles", guideKey: "vehicle-assignment" },
    { icon: "person", label: "Driver Management", path: "/admin/drivers", guideKey: "driver-assignment" },
    { icon: "monitor_heart", label: "Request Monitoring", path: "/admin/requests", guideKey: "reports" },
    { icon: "calendar_month", label: "Vehicle Schedule", path: "/admin/schedules", guideKey: "reports" },
  ];

  const adminNavAdmin = [
    { icon: "group", label: "User Management", path: "/admin/users", guideKey: "user-management" },
    { icon: "admin_panel_settings", label: "Role Management", path: "/admin/roles", guideKey: "role-management" },
    { icon: "notifications", label: "Notification Center", path: "/admin/notifications", guideKey: "notification-center" },
    { icon: "history", label: "Audit Logs", path: "/admin/audit", guideKey: "audit-logs" },
    { icon: "settings", label: "System Settings", path: "/admin/settings", guideKey: "system-settings" },
    { icon: "person", label: "My Profile", path: "/admin/profile", guideKey: "profile" },
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
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 overflow-hidden ${branding.companyLogo && !logoError ? "bg-white border border-[#e2e8f0]" : "bg-[#1e3a8a]"}`}>
              {branding.companyLogo && !logoError ? (
                <img 
                  src={getValidLogoUrl(branding.companyLogo)} 
                  alt="Logo" 
                  className="w-full h-full object-contain p-0.5" 
                  onError={() => setLogoError(true)}
                />
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

      {/* Bottom section for Guide & Logout */}
      <div className="px-3 py-3 border-t border-[#e2e8f0] mt-auto space-y-1">
        <button
          onClick={() => {
            onClose?.();
            const role = user?.role?.toLowerCase() || 'employee';
            const quickTour = getQuickTourForRole(role);
            if (quickTour) startTour(quickTour.id);
          }}
          className="w-full flex items-center gap-3 py-2 px-3 rounded-md hover:bg-blue-50 text-[#1e3a8a] transition-colors cursor-pointer"
        >
          <Icon name="help_outline" className="text-[20px]" />
          <span className="text-[13px] font-bold">Panduan Sistem</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 py-2 px-3 rounded-md hover:bg-[#f1f5f9] text-[#475569] transition-colors cursor-pointer"
        >
          <Icon name="logout" className="text-[20px]" />
          <span className="text-[13px] font-medium">Logout</span>
        </button>
      </div>
    </aside>
    </>
  );
}