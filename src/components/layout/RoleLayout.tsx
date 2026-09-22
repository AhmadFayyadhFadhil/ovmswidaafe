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
    approver: "Approver (Atasan)",
    driver: (user?.is_driver_coordinator || user?.roles?.includes('driver coordinator')) ? "Koordinator Driver" : "Driver",
    employee: "Karyawan",
    security: "Petugas Keamanan"
  };

  const displayUserName = user?.name || userName || "User";
  const displayUserRole = user?.role ? (roleDisplayMap[user.role] || user.role) : (userRole || "User");
  const displayUserSubtitle = user?.department_name || displayUserRole;

  const handleNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
      return;
    }

    const isDriverCoordinator = !!(user?.is_driver_coordinator || user?.roles?.includes('driver coordinator') || user?.roles?.includes('driver_coordinator') || user?.roles?.includes('coordinator'));

    if (page === "Logout" || page === "Keluar") {
      Promise.resolve(logout()).finally(() => {
        window.location.href = "/login";
      });
      return;
    }

    if (page === "My Profile" || page === "Profil Saya" || page === "Profil") {
      navigate(`/driver/profile`);
      return;
    }

    if (isDriverCoordinator) {
      switch (page) {
        case "Dashboard":
          navigate("/driver/dashboard");
          break;
        case "Alokasi Armada":
        case "Requests":
        case "Fleet Requests":
          navigate("/gahrd/requests");
          break;
        case "Tugas Menyetir Saya":
        case "Tugas Menyetir":
        case "Tugas Saya":
        case "My Tasks":
          navigate("/driver/dashboard?tab=assignments");
          break;
        case "Jadwal & Kalender":
        case "Kalender Jadwal":
        case "Calendar":
          navigate("/gahrd/calendar");
          break;
        case "Daftar Kendaraan":
        case "Kendaraan Saya":
        case "Vehicle Management":
        case "Vehicles":
          navigate("/admin/vehicles");
          break;
        case "Ketersediaan Driver":
        case "Driver Availability":
          navigate("/gahrd/driver");
          break;
        case "Riwayat Perjalanan":
        case "Riwayat":
        case "Schedule":
        case "History":
          navigate("/driver/dashboard?tab=schedule");
          break;
        case "Notifikasi":
        case "Notifications":
          navigate("/driver/notifications");
          break;
        default:
          break;
      }
      return;
    }

    const role = user?.role?.toLowerCase() || userRole?.toLowerCase() || "employee";

    if (role === "employee") {
      switch (page) {
        case "Dashboard":
          navigate("/employee/dashboard");
          break;
        case "Buat Permohonan":
        case "Create Request":
          navigate("/employee/createrequest");
          break;
        case "Permohonan Saya":
        case "My Requests":
          navigate("/employee/myrequests");
          break;
        case "Riwayat":
        case "History":
          navigate("/employee/history");
          break;
        case "Notifikasi":
        case "Notifications":
          navigate("/employee/notifications");
          break;
        case "Profil Saya":
        case "My Profile":
          navigate("/employee/profile");
          break;
      }
    } else if (role === "driver") {
      switch (page) {
        case "Dashboard":
          navigate("/driver/dashboard");
          break;
        case "Tugas Saya":
        case "My Tasks":
          navigate("/driver/dashboard?tab=assignments");
          break;
        case "Kalender Jadwal":
        case "Kalender":
        case "Calendar":
          navigate("/driver/dashboard?tab=calendar");
          break;
        case "Kendaraan Saya":
        case "My Vehicle":
          navigate("/driver/dashboard?tab=vehicle");
          break;
        case "Riwayat":
        case "Jadwal":
        case "Schedule":
        case "History":
          navigate("/driver/dashboard?tab=schedule");
          break;
        case "Notifikasi":
        case "Notifications":
          navigate("/driver/notifications");
          break;
        case "Profil Saya":
        case "My Profile":
          navigate("/driver/profile");
          break;
      }
    } else if (role === "approver") {
      switch (page) {
        case "Dashboard":
          navigate("/approver/dashboard");
          break;
        case "Menunggu Persetujuan":
        case "Pending Requests":
          navigate("/approver/requests");
          break;
        case "Riwayat":
        case "History":
          navigate("/approver/history");
          break;
        case "Notifikasi":
        case "Notifications":
          navigate("/approver/notifications");
          break;
        case "Profil Saya":
        case "My Profile":
          navigate("/approver/profile");
          break;
      }
    } else if (role === "gahrd") {
      switch (page) {
        case "Dashboard":
          navigate("/gahrd/dashboard");
          break;
        case "Alokasi Armada":
        case "Requests":
        case "Fleet Requests":
          navigate("/gahrd/requests");
          break;
        case "Manajemen Kendaraan":
        case "Vehicle Management":
          navigate("/admin/vehicles");
          break;
        case "Ketersediaan Driver":
        case "Driver Availability":
          navigate("/gahrd/driver");
          break;
        case "Kalender Operasional":
        case "Jadwal & Kalender":
        case "Calendar":
          navigate("/gahrd/calendar");
          break;
        case "Riwayat":
        case "History":
          navigate("/gahrd/history");
          break;
        case "Notifikasi":
        case "Notifications":
          navigate("/gahrd/notifications");
          break;
        case "Manajemen Pengguna":
        case "Aktivasi Pengguna":
        case "User Activation":
        case "User Management":
          navigate("/gahrd/users");
          break;
        case "Pengaturan Sistem":
        case "System Settings":
          navigate("/admin/settings");
          break;
        case "Profil Saya":
        case "My Profile":
          navigate("/gahrd/profile");
          break;
      }
    } else if (role === "security") {
      switch (page) {
        case "Dashboard":
          navigate("/security/dashboard");
          break;
        case "Riwayat Scan":
        case "Scan History":
          navigate("/security/history");
          break;
        case "Notifikasi":
        case "Notifications":
          navigate("/security/notifications");
          break;
        case "Log Audit":
        case "Audit Logs":
          navigate("/security/audit");
          break;
        case "Profil Saya":
        case "My Profile":
          navigate("/security/profile");
          break;
      }
    } else if (role === "admin") {
      switch (page) {
        case "Dashboard":
          navigate("/admin/dashboard");
          break;
        case "Manajemen Kendaraan":
        case "Vehicle Management":
          navigate("/admin/vehicles");
          break;
        case "Manajemen Driver":
        case "Driver Management":
          navigate("/admin/drivers");
          break;
        case "Monitoring Permohonan":
        case "Request Monitoring":
          navigate("/admin/requests");
          break;
        case "Jadwal Kendaraan":
        case "Vehicle Schedule":
          navigate("/admin/schedules");
          break;
        case "Manajemen Pengguna":
        case "User Management":
          navigate("/admin/users");
          break;
        case "Manajemen Peran & Akses":
        case "Role Management":
          navigate("/admin/roles");
          break;
        case "Pusat Notifikasi":
        case "Notifikasi":
        case "Notification Center":
        case "Notifications":
          navigate("/admin/notifications");
          break;
        case "Log Audit":
        case "Audit Logs":
          navigate("/admin/audit");
          break;
        case "Pengaturan Sistem":
        case "System Settings":
          navigate("/admin/settings");
          break;
        case "Profil Saya":
        case "My Profile":
          navigate("/admin/profile");
          break;
      }
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans antialiased overflow-hidden text-[#0f172a]">
      <Sidebar 
        activeNav={activeNav} 
        onNavigate={handleNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar 
          title={topbarTitle} 
          userName={displayUserName} 
          userRole={displayUserSubtitle} 
          avatarUrl={user?.avatar_url}
          searchPlaceholder={searchPlaceholder} 
          searchValue={searchValue} 
          onSearchChange={onSearchChange} 
          showSearch={activeNav === "History" || window.location.pathname.includes('/history') || window.location.pathname.includes('/audit')}
          onMenuClick={() => setSidebarOpen(true)}
          onProfileClick={() => {
            const role = user?.role || "employee";
            navigate(`/${role}/profile`);
            setSidebarOpen(false);
          }}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <style>{`
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
