import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { useAuthContext } from "@/auth/authContext";
import { systemConfigService } from "@/services/modules/systemConfigService";
import { useGuide } from "@/hooks/useGuide";
import { getQuickTourForRole } from "@/guides";

export interface NavItem {
  icon: string;
  label: string;
  path: string;
  guideKey?: string;
  badge?: string | number;
}

export interface NavFolder {
  id: string;
  title: string;
  icon: string;
  items: NavItem[];
}

export type NavItemOrFolder =
  | { kind: "item"; item: NavItem }
  | { kind: "folder"; folder: NavFolder };

const navItem = (
  icon: string,
  label: string,
  path: string,
  guideKey?: string,
  badge?: string | number
): NavItemOrFolder => ({
  kind: "item",
  item: { icon, label, path, guideKey, badge },
});

const navFolder = (
  id: string,
  title: string,
  icon: string,
  items: NavItem[]
): NavItemOrFolder => ({
  kind: "folder",
  folder: { id, title, icon, items },
});

export function Sidebar({ 
  activeNav, 
  onNavigate, 
  isOpen, 
  onClose,
  isCollapsed = false,
  onToggleCollapse
}: { 
  activeNav: string; 
  onNavigate?: (p: string) => void; 
  isOpen?: boolean; 
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (forceState?: boolean) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthContext();
  const { startTour } = useGuide();

  const [branding, setBranding] = useState({
    systemName: "OVMS",
    companyName: "Enterprise Fleet",
    companyLogo: ""
  });
  const [logoError, setLogoError] = useState(false);

  // Folder accordion states: { [folderId]: boolean }
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("ovms_sidebar_folders");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const getValidLogoUrl = (url: string | undefined | null) => {
    if (!url) return "";
    if (url.startsWith("data:")) return url;
    const slashIdx = url.indexOf("/storage/");
    if (slashIdx !== -1) {
      return `${window.location.origin}${url.substring(slashIdx)}`;
    }
    if (url.startsWith("https://")) {
      return url;
    }
    if (url.startsWith("http://")) {
      return url.replace(/^http:\/\//i, "https://");
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

    loadBrandingFromCache();

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

    window.addEventListener("branding-update", loadBrandingFromCache);
    return () => {
      window.removeEventListener("branding-update", loadBrandingFromCache);
    };
  }, []);

  const isDriverCoordinator = !!(user?.is_driver_coordinator || user?.roles?.includes('driver coordinator') || user?.roles?.includes('driver_coordinator') || user?.roles?.includes('coordinator'));
  const isApprover = user?.role === "approver";
  const isDriver = user?.role === "driver" && !isDriverCoordinator;
  const isGAHRD = user?.role === "gahrd" ||
    user?.roles?.some(r => ["ga", "gahrd", "ga team", "ga_team"].includes(r.toLowerCase())) ||
    !!(user?.email && user.email.toLowerCase().includes("gateam"));
  const isSecurity = user?.role === "security";
  const isAdmin = user?.role === "admin";

  const go = (label: string, path: string) => {
    onNavigate?.(label);
    if (path) {
      navigate(path);
    }
    onClose?.();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {}
    window.location.href = "/login";
  };

  const toggleFolder = (folderId: string) => {
    setOpenFolders(prev => {
      const currentVal = prev[folderId];
      const nextVal = currentVal === undefined ? false : !currentVal;
      const updated = { ...prev, [folderId]: nextVal };
      try {
        localStorage.setItem("ovms_sidebar_folders", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const isItemActive = (item: NavItem) => {
    const currentPath = location.pathname;
    const currentSearch = location.search;

    if (activeNav && (activeNav === item.label || activeNav.toLowerCase() === item.label.toLowerCase())) {
      return true;
    }

    if (item.path.includes('?')) {
      const [basePath, queryStr] = item.path.split('?');
      if (currentPath === basePath) {
        const targetTab = new URLSearchParams(queryStr).get('tab');
        const currentTab = new URLSearchParams(currentSearch).get('tab');
        if (targetTab && currentTab) {
          return targetTab === currentTab;
        }
        if (!currentTab && item.label === "Dashboard") {
          return true;
        }
      }
      return false;
    }

    if (item.path === "/gahrd/urgentrequest" && (currentPath === "/gahrd/urgentrequest" || currentPath === "/gahrd/requests/urgent")) {
      return true;
    }

    if (currentPath === item.path) {
      if (item.path.includes('/driver/dashboard') && currentSearch) {
        return false;
      }
      return true;
    }

    if (item.path !== "/" && !["/driver/dashboard", "/gahrd/dashboard", "/employee/dashboard", "/approver/dashboard", "/security/dashboard", "/admin/dashboard", "/employee/myrequests"].includes(item.path)) {
      if (currentPath.startsWith(item.path)) {
        return true;
      }
    }

    return false;
  };

  // --- MENU CONFIGURATIONS PER ROLE ---

  // 1. Administrator
  const adminNav: NavItemOrFolder[] = [
    navItem("dashboard", "Dashboard", "/admin/dashboard", "admin-dashboard"),
    navFolder("admin_ops", "Operasional Armada", "directions_car", [
      { icon: "directions_car", label: "Manajemen Kendaraan", path: "/admin/vehicles", guideKey: "vehicle-assignment" },
      { icon: "person", label: "Manajemen Driver", path: "/admin/drivers", guideKey: "driver-assignment" },
      { icon: "monitor_heart", label: "Monitoring Permohonan", path: "/admin/requests", guideKey: "reports" },
      { icon: "calendar_month", label: "Jadwal Kendaraan", path: "/admin/schedules", guideKey: "reports" },
    ]),
    navFolder("admin_users", "Administrasi & Pengguna", "manage_accounts", [
      { icon: "group", label: "Manajemen Pengguna", path: "/admin/users", guideKey: "user-management" },
      { icon: "admin_panel_settings", label: "Manajemen Peran & Akses", path: "/admin/roles", guideKey: "role-management" },
      { icon: "notifications", label: "Pusat Notifikasi", path: "/admin/notifications", guideKey: "notification-center" },
    ]),
    navFolder("admin_sys", "Sistem & Audit", "tune", [
      { icon: "history", label: "Log Audit", path: "/admin/audit", guideKey: "audit-logs" },
      { icon: "settings", label: "Pengaturan Sistem", path: "/admin/settings", guideKey: "system-settings" },
      { icon: "person", label: "Profil Saya", path: "/admin/profile", guideKey: "profile" },
    ]),
  ];

  // 2. GA & HRD
  const gahrdNav: NavItemOrFolder[] = [
    navItem("dashboard", "Dashboard", "/gahrd/dashboard", "gahrd-dashboard"),
    navFolder("gahrd_requests", "Permohonan", "description", [
      { icon: "add_box", label: "Buat Permohonan", path: "/gahrd/createrequest", guideKey: "create-request" },
      { icon: "list_alt", label: "Permohonan Saya", path: "/gahrd/myrequests", guideKey: "my-requests" },
      { icon: "warning", label: "Permohonan Urgent", path: "/gahrd/urgentrequest", guideKey: "urgent-request" },
      { icon: "history", label: "Riwayat Permohonan", path: "/gahrd/history", guideKey: "gahrd-history" },
    ]),
    navFolder("gahrd_ops", "Operasional & Alokasi", "directions_car", [
      { icon: "monitor_heart", label: "Alokasi Armada", path: "/gahrd/requests", guideKey: "gahrd-requests" },
      { icon: "directions_car", label: "Manajemen Kendaraan", path: "/admin/vehicles", guideKey: "vehicle-assignment" },
      { icon: "person", label: "Ketersediaan Driver", path: "/gahrd/driver", guideKey: "driver-assignment" },
      { icon: "event", label: "Kalender Operasional", path: "/gahrd/calendar", guideKey: "gahrd-schedule" },
    ]),
    navFolder("gahrd_master", "Master & Pengaturan", "settings", [
      { icon: "group", label: "Manajemen Pengguna", path: "/gahrd/users", guideKey: "user-management" },
      { icon: "settings", label: "Pengaturan Sistem", path: "/admin/settings", guideKey: "system-settings" },
      { icon: "notifications", label: "Pusat Notifikasi", path: "/gahrd/notifications", guideKey: "notifications" },
      { icon: "person", label: "Profil Saya", path: "/gahrd/profile", guideKey: "profile" },
    ]),
  ];

  // 3. Driver Coordinator
  const driverCoordinatorNav: NavItemOrFolder[] = [
    navItem("dashboard", "Dashboard", "/driver/dashboard", "driver-dashboard"),
    navFolder("coord_ops", "Operasional & Alokasi", "directions_car", [
      { icon: "assignment_turned_in", label: "Alokasi Armada", path: "/gahrd/requests", guideKey: "fleet-allocation" },
      { icon: "event", label: "Jadwal & Kalender", path: "/gahrd/calendar", guideKey: "driver-schedule" },
      { icon: "person", label: "Ketersediaan Driver", path: "/gahrd/driver", guideKey: "driver-assignment" },
      { icon: "directions_car", label: "Daftar Kendaraan", path: "/admin/vehicles", guideKey: "driver-vehicle" },
    ]),
    navFolder("coord_driver", "Tugas Driver", "assignment", [
      { icon: "assignment", label: "Tugas Menyetir Saya", path: "/driver/dashboard?tab=assignments", guideKey: "driver-assignment" },
      { icon: "history", label: "Riwayat Perjalanan", path: "/driver/dashboard?tab=schedule", guideKey: "driver-history" },
    ]),
    navFolder("coord_requests", "Permohonan", "description", [
      { icon: "add_box", label: "Buat Permohonan", path: "/employee/createrequest", guideKey: "create-request" },
      { icon: "list_alt", label: "Permohonan Saya", path: "/employee/myrequests", guideKey: "my-requests" },
    ]),
    navFolder("coord_account", "Akun & Notifikasi", "person", [
      { icon: "notifications", label: "Pusat Notifikasi", path: "/driver/notifications", guideKey: "notifications" },
      { icon: "person", label: "Profil Saya", path: "/driver/profile", guideKey: "profile" },
    ]),
  ];

  // 4. Approver
  const approverNav: NavItemOrFolder[] = [
    navItem("dashboard", "Dashboard", "/approver/dashboard", "approver-dashboard"),
    navFolder("approver_approval", "Persetujuan", "fact_check", [
      { icon: "list_alt", label: "Menunggu Persetujuan", path: "/approver/requests", guideKey: "pending-requests" },
      { icon: "history", label: "Riwayat Persetujuan", path: "/approver/history", guideKey: "approval-history" },
    ]),
    navFolder("approver_requests", "Permohonan", "description", [
      { icon: "add_box", label: "Buat Permohonan", path: "/employee/createrequest", guideKey: "create-request" },
      { icon: "list_alt", label: "Permohonan Saya", path: "/employee/myrequests", guideKey: "my-requests" },
    ]),
    navFolder("approver_account", "Akun & Notifikasi", "person", [
      { icon: "notifications", label: "Pusat Notifikasi", path: "/approver/notifications", guideKey: "notifications" },
      { icon: "person", label: "Profil Saya", path: "/approver/profile", guideKey: "profile" },
    ]),
  ];

  // 5. Driver
  const driverNav: NavItemOrFolder[] = [
    navItem("dashboard", "Dashboard", "/driver/dashboard", "driver-dashboard"),
    navFolder("driver_ops", "Tugas & Operasional", "assignment", [
      { icon: "assignment", label: "Tugas Menyetir Saya", path: "/driver/dashboard?tab=assignments", guideKey: "driver-assignment" },
      { icon: "event", label: "Kalender Jadwal", path: "/driver/dashboard?tab=calendar", guideKey: "driver-schedule" },
      { icon: "directions_car", label: "Kendaraan Saya", path: "/driver/dashboard?tab=vehicle", guideKey: "driver-vehicle" },
      { icon: "history", label: "Riwayat Perjalanan", path: "/driver/dashboard?tab=schedule", guideKey: "driver-history" },
    ]),
    navFolder("driver_account", "Akun & Notifikasi", "person", [
      { icon: "notifications", label: "Pusat Notifikasi", path: "/driver/notifications", guideKey: "notifications" },
      { icon: "person", label: "Profil Saya", path: "/driver/profile", guideKey: "profile" },
    ]),
  ];

  // 6. Employee
  const employeeNav: NavItemOrFolder[] = [
    navItem("dashboard", "Dashboard", "/employee/dashboard", "dashboard"),
    navFolder("employee_requests", "Permohonan", "description", [
      { icon: "add_box", label: "Buat Permohonan", path: "/employee/createrequest", guideKey: "create-request" },
      { icon: "list_alt", label: "Permohonan Saya", path: "/employee/myrequests", guideKey: "my-requests" },
      { icon: "history", label: "Riwayat Permohonan", path: "/employee/history", guideKey: "vehicle-schedule" },
    ]),
    navFolder("employee_account", "Akun & Notifikasi", "person", [
      { icon: "notifications", label: "Pusat Notifikasi", path: "/employee/notifications", guideKey: "notifications" },
      { icon: "person", label: "Profil Saya", path: "/employee/profile", guideKey: "profile" },
    ]),
  ];

  // 7. Security
  const securityNav: NavItemOrFolder[] = [
    navItem("dashboard", "Dashboard", "/security/dashboard", "dashboard"),
    navFolder("security_gate", "Pemeriksaan Gerbang", "qr_code_scanner", [
      { icon: "work_history", label: "Riwayat Scan", path: "/security/history", guideKey: "history" },
    ]),
    navFolder("security_account", "Akun & Notifikasi", "person", [
      { icon: "notifications", label: "Pusat Notifikasi", path: "/security/notifications", guideKey: "notifications" },
      { icon: "person", label: "Profil Saya", path: "/security/profile", guideKey: "profile" },
    ]),
  ];

  const currentNav = useMemo(() => {
    if (isAdmin) return adminNav;
    if (isGAHRD) return gahrdNav;
    if (isDriverCoordinator) return driverCoordinatorNav;
    if (isApprover) return approverNav;
    if (isDriver) return driverNav;
    if (isSecurity) return securityNav;
    return employeeNav;
  }, [isAdmin, isGAHRD, isDriverCoordinator, isApprover, isDriver, isSecurity]);

  // Auto-expand folder when a child item inside it is active
  useEffect(() => {
    currentNav.forEach(entry => {
      if (entry.kind === "folder") {
        const hasActiveChild = entry.folder.items.some(item => isItemActive(item));
        if (hasActiveChild) {
          setOpenFolders(prev => {
            if (prev[entry.folder.id]) return prev;
            const updated = { ...prev, [entry.folder.id]: true };
            try {
              localStorage.setItem("ovms_sidebar_folders", JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      }
    });
  }, [location.pathname, location.search, activeNav, currentNav]);

  // Direct Button (like Dashboard)
  const renderDirectBtn = (item: NavItem) => {
    const active = isItemActive(item);

    return (
      <button
        key={item.label}
        data-guide={item.guideKey || item.label.toLowerCase().replace(/\s+/g, '-')}
        onClick={() => go(item.label, item.path)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 select-none ${
          active
            ? "bg-[#1e3a8a] text-white shadow-sm font-semibold scale-[1.01]"
            : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#1e293b] hover:translate-x-0.5"
        }`}
      >
        <Icon
          name={item.icon}
          className={`text-[21px] flex-shrink-0 ${active ? "text-white" : "text-[#64748b]"}`}
        />
        <span className="text-[13.5px] font-semibold truncate">{item.label}</span>
        {item.badge !== undefined && (
          <span
            className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              active ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
            }`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  // Sub-item inside a folder
  const renderSubItem = (item: NavItem) => {
    const active = isItemActive(item);

    return (
      <button
        key={item.label}
        data-guide={item.guideKey || item.label.toLowerCase().replace(/\s+/g, '-')}
        onClick={() => go(item.label, item.path)}
        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-all duration-150 select-none ${
          active
            ? "bg-[#1e3a8a] text-white shadow-xs font-semibold"
            : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
        }`}
      >
        <Icon
          name={item.icon}
          className={`text-[17px] shrink-0 ${active ? "text-white" : "text-[#94a3b8]"}`}
        />
        <span className="text-[12.5px] truncate font-medium">{item.label}</span>
        {item.badge !== undefined && (
          <span
            className={`ml-auto text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              active ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
            }`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  // Folder Accordion Component
  const renderFolder = (folder: NavFolder) => {
    const hasActiveChild = folder.items.some(item => isItemActive(item));
    const isOpen = openFolders[folder.id] !== undefined ? openFolders[folder.id] : hasActiveChild;

    return (
      <div key={folder.id} className="pt-1">
        <button
          type="button"
          onClick={() => toggleFolder(folder.id)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all duration-150 group select-none ${
            hasActiveChild
              ? "text-[#1e3a8a] bg-blue-50/70 font-semibold"
              : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
          }`}
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Icon
              name={folder.icon}
              className={`text-[19px] shrink-0 transition-colors ${
                hasActiveChild ? "text-[#1e3a8a]" : "text-[#64748b] group-hover:text-[#1e293b]"
              }`}
            />
            <span className="text-[13px] font-semibold truncate tracking-tight">{folder.title}</span>
          </div>
          <Icon
            name="keyboard_arrow_down"
            className={`text-[18px] text-[#94a3b8] group-hover:text-[#475569] transition-transform duration-200 shrink-0 ${
              isOpen ? "rotate-0" : "-rotate-90"
            }`}
          />
        </button>

        {isOpen && (
          <div className="ml-5 pl-2.5 border-l border-slate-200 my-1 space-y-0.5 animate-fadein">
            {folder.items.map(subItem => renderSubItem(subItem))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-[#e2e8f0] flex flex-col shrink-0 transition-all duration-300 ease-in-out lg:static ${
          isOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
        } ${
          isCollapsed
            ? "lg:w-0 lg:min-w-0 lg:max-w-0 lg:border-r-0 lg:overflow-hidden lg:opacity-0 lg:pointer-events-none"
            : "lg:w-64 lg:min-w-[16rem] lg:max-w-[16rem] lg:border-r lg:opacity-100"
        }`}
      >
        <div className="w-64 flex flex-col h-full shrink-0">
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0] h-[68px] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {branding.companyLogo && !logoError ? (
              <div className="w-9 h-9 rounded-full bg-white shadow-xs border border-slate-100 flex items-center justify-center p-1 overflow-hidden shrink-0">
                <img 
                  src={getValidLogoUrl(branding.companyLogo)} 
                  alt={branding.companyName || "PT Widatra Bhakti"} 
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#1e3a8a] flex items-center justify-center text-white text-base font-bold shrink-0">
                <Icon name="commute" className="text-white text-[20px]" />
              </div>
            )}
            <div className="min-w-0">
              <span className="font-bold text-[14.5px] tracking-tight text-[#0f172a] block truncate">{branding.systemName || "OVMS"}</span>
              <span className="text-[11px] text-[#64748b] block font-medium truncate">{branding.companyName || "PT Widatra Bhakti"}</span>
            </div>
          </div>
          
          {/* Close button for Mobile Drawer */}
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors lg:hidden cursor-pointer shrink-0"
            aria-label="Tutup menu"
          >
            <Icon name="close" className="text-xl" />
          </button>

          {/* Collapse button for Desktop */}
          <button
            type="button"
            onClick={() => onToggleCollapse?.(true)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-[#1e3a8a] transition-colors cursor-pointer shrink-0"
            title="Sembunyikan Sidebar (Ctrl + B)"
            aria-label="Sembunyikan Sidebar"
          >
            <Icon name="dock_to_left" className="text-[20px]" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {currentNav.map(entry => {
            if (entry.kind === "item") {
              return renderDirectBtn(entry.item);
            }
            return renderFolder(entry.folder);
          })}
        </nav>

        {/* Bottom section for Guide & Logout */}
        <div className="px-3 py-3 border-t border-[#e2e8f0] mt-auto space-y-1">
          <button
            onClick={() => {
              onClose?.();
              const role = user?.role?.toLowerCase() || 'employee';
              // Ensure sidebar is expanded on desktop during quick tour
              onToggleCollapse?.(false);
              // Open all folders so all guide targets are visible in DOM
              const allOpen: Record<string, boolean> = {};
              currentNav.forEach(entry => {
                if (entry.kind === "folder") {
                  allOpen[entry.folder.id] = true;
                }
              });
              setOpenFolders(allOpen);
              try {
                localStorage.setItem("ovms_sidebar_folders", JSON.stringify(allOpen));
              } catch {}
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
            <span className="text-[13px] font-medium">Keluar</span>
          </button>
        </div>
        </div>
      </aside>
    </>
  );
}
