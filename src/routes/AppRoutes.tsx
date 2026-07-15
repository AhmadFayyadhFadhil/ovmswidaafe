import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";
import ForgotPasswordPage from "@/pages/auth/forgot-password";
import ProtectedRoutes from "./ProtectedRoutes";

// Admin Pages
import Dashboard from "@/pages/admin/dashboard";
import Driver from "@/pages/admin/drivers";
import Request from "@/pages/admin/requests";
import User from "@/pages/admin/users";
import Vehicle from "@/pages/admin/vehicles";
import Audit from "@/pages/admin/audit";
import Roles from "@/pages/admin/roles";
import AdminNotifications from "@/pages/admin/notifications";
import Schedules from "@/pages/admin/schedules";
import Settings from "@/pages/admin/settings";

// Employee Pages
import CreateRequest from "@/pages/employee/createrequest";
import EmployeeDashboard from "@/pages/employee/dashboard";
import MyRequests from "@/pages/employee/myrequests";
import EmployeeNotifications from "@/pages/employee/notifications";
import EmployeeProfile from "@/pages/employee/profil";
import EmployeeHistory from "@/pages/employee/history";

// Driver Pages
import DriverDashboard from "@/pages/driver/dasboard";
import DriverNotifications from "@/pages/driver/notifications";

// Approver Pages
import ApproverDashboard from "@/pages/approver/dashboard";
import ApproverRequests from "@/pages/approver/requests";
import ApproverHistory from "@/pages/approver/history";
import ApproverNotifications from "@/pages/approver/notifications";

// Security Pages
import SecurityDashboard from "@/pages/security/dashboard";
import SecurityHistory from "@/pages/security/history";

// GAHRD Pages
import GAHRDDashboard from "@/pages/gahrd/dashboard";
import GAHRDRequests from "@/pages/gahrd/requests";
import GAHRDHistory from "@/pages/gahrd/history";
import GAHRDNotifications from "@/pages/gahrd/notifications";
import GAHRDDrivers from "@/pages/gahrd/driver";
import GAHRDUsers from "@/pages/gahrd/users";
import CreateUrgentRequest from "@/pages/gahrd/urgentrequest";

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

export default function AppRoutes() {
  return (
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
  );
}

