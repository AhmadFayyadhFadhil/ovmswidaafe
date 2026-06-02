import { useState } from "react";
import type { SystemNotification } from "./types/index";
import { initialNotifications } from "./mocks/data/notifications";
import Audit from "./pages/admin/Audit";
import Dashboard from "./pages/admin/Dashboard";
import Driver from "./pages/admin/Driver";
import Notification from "./pages/admin/Notification";
import Reports from "./pages/admin/Reports";
import Request from "./pages/admin/Request";
import Role from "./pages/admin/Role";
import Schedule from "./pages/admin/Schedule";
import System from "./pages/admin/System";
import User from "./pages/admin/User";
import Vehicle from "./pages/admin/Vehicle";

type Page =
  | "Dashboard"
  | "Vehicle Schedule"
  | "Vehicle Management"
  | "Driver Management"
  | "Request Monitoring"
  | "Reports & Analytics"
  | "User Management"
  | "Role Management"
  | "Notification Center"
  | "Audit Logs"
  | "System Settings";

// Placeholder untuk halaman yang belum dibuat
function ComingSoon({ page, onNavigate }: { page: string; onNavigate: (p: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#f1f5f9]"
      style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="w-16 h-16 bg-[#e8edf8] rounded-2xl flex items-center justify-center">
        <span className="material-symbols-outlined text-[32px] text-[#1e3a8a]"
          style={{ fontFamily: "'Material Symbols Outlined'" }}>
          construction
        </span>
      </div>
      <div className="text-center">
        <h2 className="text-[20px] font-bold text-[#0f172a]">{page}</h2>
        <p className="text-[14px] text-[#64748b] mt-1">This page is coming soon.</p>
      </div>
      <button
        onClick={() => onNavigate("Dashboard")}
        className="px-5 py-2.5 bg-[#1e3a8a] text-white rounded-xl text-[13px] font-bold hover:bg-[#1e40af] transition-colors"
      >
        ← Back to Dashboard
      </button>
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("Dashboard");
  const [notifications, setNotifications] = useState<SystemNotification[]>(initialNotifications);


  const navigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((current) => current.map((notification) =>
      notification.id === id ? { ...notification, isRead: true } : notification
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id));
  };



  // Render halaman sesuai currentPage
  switch (currentPage) {
    case "Dashboard":
      return <Dashboard onNavigate={navigate} />;
    case "Vehicle Management":
      return <Vehicle onNavigate={navigate} />;
    case "Driver Management":
      return <Driver onNavigate={navigate} />;
    case "Request Monitoring":
      return <Request onNavigate={navigate} />;
    case "Vehicle Schedule":
      return <Schedule onNavigate={navigate} />;
    case "Reports & Analytics":
      return <Reports onNavigate={navigate} />;
    case "User Management":
      return <User onNavigate={navigate} />;
    case "Role Management":
      return <Role onNavigate={navigate} />;
    case "Notification Center":
      return (
        <Notification
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAllAsRead={handleMarkAllAsRead}
          onDeleteNotification={handleDeleteNotification}
          onNavigate={navigate}
        />
      );
    case "Audit Logs":
      return <Audit onNavigate={navigate} />;
    case "System Settings":
      return <System onNavigate={navigate} />;
    default:
      return (
        <div className="flex h-screen">
          <ComingSoon page={currentPage} onNavigate={navigate} />
        </div>
      );
  }
}