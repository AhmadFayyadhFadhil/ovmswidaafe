import { lazy, Suspense, type ComponentType } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import ProtectedRoutes from "./ProtectedRoutes";

// Smart lazy loader with automatic deployment asset chunk retry
function lazyWithRetry<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(() =>
    factory().catch((error) => {
      const storageKey = "ovms_chunk_reload_retry";
      const hasRetried = sessionStorage.getItem(storageKey);
      if (!hasRetried) {
        sessionStorage.setItem(storageKey, "true");
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      sessionStorage.removeItem(storageKey);
      throw error;
    })
  );
}

// Lazy-loaded pages
const LoginPage = lazyWithRetry(() => import("@/pages/auth/login"));
const RegisterPage = lazyWithRetry(() => import("@/pages/auth/register"));
const ForgotPasswordPage = lazyWithRetry(() => import("@/pages/auth/forgot-password"));

// Admin Pages
const Dashboard = lazyWithRetry(() => import("@/pages/admin/dashboard"));
const Driver = lazyWithRetry(() => import("@/pages/admin/drivers"));
const Request = lazyWithRetry(() => import("@/pages/admin/requests"));
const User = lazyWithRetry(() => import("@/pages/admin/users"));
const Vehicle = lazyWithRetry(() => import("@/pages/admin/vehicles"));
const Audit = lazyWithRetry(() => import("@/pages/admin/audit"));
const Roles = lazyWithRetry(() => import("@/pages/admin/roles"));
const AdminNotifications = lazyWithRetry(() => import("@/pages/admin/notifications"));
const Schedules = lazyWithRetry(() => import("@/pages/admin/schedules"));
const Settings = lazyWithRetry(() => import("@/pages/admin/settings"));

// Employee Pages
const CreateRequest = lazyWithRetry(() => import("@/pages/employee/createrequest"));
const EmployeeDashboard = lazyWithRetry(() => import("@/pages/employee/dashboard"));
const MyRequests = lazyWithRetry(() => import("@/pages/employee/myrequests"));
const EmployeeNotifications = lazyWithRetry(() => import("@/pages/admin/notifications"));
const EmployeeProfile = lazyWithRetry(() => import("@/pages/employee/profil"));
const EmployeeHistory = lazyWithRetry(() => import("@/pages/employee/history"));

// Driver Pages
const DriverDashboard = lazyWithRetry(() => import("@/pages/driver/dasboard"));
const DriverNotifications = lazyWithRetry(() => import("@/pages/admin/notifications"));

// Approver Pages
const ApproverDashboard = lazyWithRetry(() => import("@/pages/approver/dashboard"));
const ApproverRequests = lazyWithRetry(() => import("@/pages/approver/requests"));
const ApproverHistory = lazyWithRetry(() => import("@/pages/approver/history"));
const ApproverNotifications = lazyWithRetry(() => import("@/pages/admin/notifications"));

// Security Pages
const SecurityDashboard = lazyWithRetry(() => import("@/pages/security/dashboard"));
const SecurityHistory = lazyWithRetry(() => import("@/pages/security/history"));

// GAHRD Pages
const GAHRDDashboard = lazyWithRetry(() => import("@/pages/gahrd/dashboard"));
const GAHRDRequests = lazyWithRetry(() => import("@/pages/gahrd/requests"));
const GAHRDHistory = lazyWithRetry(() => import("@/pages/gahrd/history"));
const GAHRDNotifications = lazyWithRetry(() => import("@/pages/admin/notifications"));
const GAHRDDrivers = lazyWithRetry(() => import("@/pages/gahrd/driver"));
const GAHRDCalendar = lazyWithRetry(() => import("@/pages/gahrd/calendar"));
const GAHRDUsers = lazyWithRetry(() => import("@/pages/gahrd/users"));
const CreateUrgentRequest = lazyWithRetry(() => import("@/pages/gahrd/urgentrequest"));
const MaintenancePage = lazyWithRetry(() => import("@/pages/common/MaintenancePage"));

function GAHRDDashboardWrapper() {
  const navigate = useNavigate();
  const routeMap: Record<string, string> = {
    'Requests': '/gahrd/requests',
    'Driver Availability': '/gahrd/driver',
    'History': '/gahrd/history',
    'Notifications': '/gahrd/notifications',
    'Dashboard': '/gahrd/dashboard',
  };
  return <GAHRDDashboard onNavigate={(p) => navigate(routeMap[p] || `/gahrd/${p.toLowerCase().replace(/ /g, '-')}`)} />;
}

function LoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#f1f5f9]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#cbd5e1] border-t-[#1e3a8a] rounded-full animate-spin" />
        <span className="text-[13px] font-semibold text-[#64748b]">Loading page...</span>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route element={<ProtectedRoutes />}>
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/drivers" element={<Driver />} />
          <Route path="/admin/requests" element={<Request />} />
          <Route path="/admin/users" element={<User />} />
          <Route path="/admin/vehicles" element={<Vehicle />} />
          <Route path="/admin/audit" element={<Audit />} />
          <Route path="/admin/roles" element={<Roles />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/schedules" element={<Schedules />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/admin/profile" element={<EmployeeProfile />} />

          {/* Employee Routes */}
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          <Route path="/employee/createrequest" element={<CreateRequest />} />
          <Route path="/employee/myrequests" element={<MyRequests />} />
          <Route path="/employee/history" element={<EmployeeHistory />} />
          <Route path="/employee/notifications" element={<EmployeeNotifications />} />
          <Route path="/employee/profile" element={<EmployeeProfile />} />

          {/* Approver Routes */}
          <Route path="/approver/dashboard" element={<ApproverDashboard />} />
          <Route path="/approver/requests" element={<ApproverRequests />} />
          <Route path="/approver/history" element={<ApproverHistory />} />
          <Route path="/approver/notifications" element={<ApproverNotifications />} />
          <Route path="/approver/profile" element={<EmployeeProfile />} />

          {/* Driver Routes */}
          <Route path="/driver/dashboard" element={<DriverDashboard />} />
          <Route path="/driver/notifications" element={<DriverNotifications />} />
          <Route path="/driver/profile" element={<EmployeeProfile />} />

          {/* GAHRD Routes */}
          <Route path="/gahrd/dashboard" element={<GAHRDDashboardWrapper />} />
          <Route path="/gahrd/requests" element={<GAHRDRequests />} />
          <Route path="/gahrd/requests/urgent" element={<CreateUrgentRequest />} />
          <Route path="/gahrd/history" element={<GAHRDHistory onNavigate={(_p) => {}} />} />
          <Route path="/gahrd/notifications" element={<GAHRDNotifications onNavigate={(_p) => {}} />} />
          <Route path="/gahrd/driver" element={<GAHRDDrivers onNavigate={(_p) => {}} />} />
          <Route path="/gahrd/calendar" element={<GAHRDCalendar />} />
          <Route path="/gahrd/users" element={<GAHRDUsers />} />
          <Route path="/gahrd/profile" element={<EmployeeProfile />} />

          {/* Security Routes */}
          <Route path="/security/dashboard" element={<SecurityDashboard />} />
          <Route path="/security/history" element={<SecurityHistory />} />
          {/* Maintenance Page */}
          <Route path="/maintenance" element={<MaintenancePage />} />
        </Route>

        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

