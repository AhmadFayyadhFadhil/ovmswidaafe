import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import ProtectedRoutes from "./ProtectedRoutes";

// Lazy-loaded pages
const LoginPage = lazy(() => import("@/pages/auth/login"));
const RegisterPage = lazy(() => import("@/pages/auth/register"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/forgot-password"));

// Admin Pages
const Dashboard = lazy(() => import("@/pages/admin/dashboard"));
const Driver = lazy(() => import("@/pages/admin/drivers"));
const Request = lazy(() => import("@/pages/admin/requests"));
const User = lazy(() => import("@/pages/admin/users"));
const Vehicle = lazy(() => import("@/pages/admin/vehicles"));
const Audit = lazy(() => import("@/pages/admin/audit"));
const Roles = lazy(() => import("@/pages/admin/roles"));
const AdminNotifications = lazy(() => import("@/pages/admin/notifications"));
const Schedules = lazy(() => import("@/pages/admin/schedules"));
const Settings = lazy(() => import("@/pages/admin/settings"));

// Employee Pages
const CreateRequest = lazy(() => import("@/pages/employee/createrequest"));
const EmployeeDashboard = lazy(() => import("@/pages/employee/dashboard"));
const MyRequests = lazy(() => import("@/pages/employee/myrequests"));
const EmployeeNotifications = lazy(() => import("@/pages/employee/notifications"));
const EmployeeProfile = lazy(() => import("@/pages/employee/profil"));
const EmployeeHistory = lazy(() => import("@/pages/employee/history"));

// Driver Pages
const DriverDashboard = lazy(() => import("@/pages/driver/dasboard"));
const DriverNotifications = lazy(() => import("@/pages/driver/notifications"));

// Approver Pages
const ApproverDashboard = lazy(() => import("@/pages/approver/dashboard"));
const ApproverRequests = lazy(() => import("@/pages/approver/requests"));
const ApproverHistory = lazy(() => import("@/pages/approver/history"));
const ApproverNotifications = lazy(() => import("@/pages/approver/notifications"));

// Security Pages
const SecurityDashboard = lazy(() => import("@/pages/security/dashboard"));
const SecurityHistory = lazy(() => import("@/pages/security/history"));

// GAHRD Pages
const GAHRDDashboard = lazy(() => import("@/pages/gahrd/dashboard"));
const GAHRDRequests = lazy(() => import("@/pages/gahrd/requests"));
const GAHRDHistory = lazy(() => import("@/pages/gahrd/history"));
const GAHRDNotifications = lazy(() => import("@/pages/gahrd/notifications"));
const GAHRDDrivers = lazy(() => import("@/pages/gahrd/driver"));
const GAHRDUsers = lazy(() => import("@/pages/gahrd/users"));
const CreateUrgentRequest = lazy(() => import("@/pages/gahrd/urgentrequest"));

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
          <Route path="/gahrd/users" element={<GAHRDUsers />} />
          <Route path="/gahrd/profile" element={<EmployeeProfile />} />

          {/* Security Routes */}
          <Route path="/security/dashboard" element={<SecurityDashboard />} />
          <Route path="/security/history" element={<SecurityHistory />} />
          <Route path="/security/profile" element={<EmployeeProfile />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

