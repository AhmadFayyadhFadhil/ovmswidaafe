import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "@/pages/auth/login";
import ProtectedRoutes from "./ProtectedRoutes";

// Admin Pages
import Dashboard from "@/pages/admin/dashboard";
import Driver from "@/pages/admin/drivers";
import Reports from "@/pages/admin/reports";
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

// Approver Pages
import ApproverDashboard from "@/pages/approver/dashboard";
import ApproverRequests from "@/pages/approver/requests";
import ApproverHistory from "@/pages/approver/history";

// Driver Pages
import DriverDashboard from "@/pages/driver/dashboard";

// GAHRD Pages
import GAHRDDashboard from "@/pages/gahrd/dashboard";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoutes />}>
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/drivers" element={<Driver />} />
        <Route path="/admin/requests" element={<Request />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/users" element={<User />} />
        <Route path="/admin/vehicles" element={<Vehicle />} />
        <Route path="/admin/audit" element={<Audit />} />
        <Route path="/admin/roles" element={<Roles />} />
        <Route path="/admin/notifications" element={<AdminNotifications />} />
        <Route path="/admin/schedules" element={<Schedules />} />
        <Route path="/admin/settings" element={<Settings />} />

        {/* Employee Routes */}
        <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
        <Route path="/employee/createrequest" element={<CreateRequest />} />
        <Route path="/employee/myrequests" element={<MyRequests />} />
        <Route path="/employee/notifications" element={<EmployeeNotifications />} />
        <Route path="/employee/profile" element={<EmployeeProfile />} />

        {/* Approver Routes */}
        <Route path="/approver/dashboard" element={<ApproverDashboard onNavigate={() => {}} />} />
        <Route path="/approver/requests" element={<ApproverRequests />} />
        <Route path="/approver/history" element={<ApproverHistory />} />

        {/* Driver Routes */}
        <Route path="/driver/dashboard" element={<DriverDashboard />} />

        {/* GAHRD Routes */}
        <Route path="/gahrd/dashboard" element={<GAHRDDashboard />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

