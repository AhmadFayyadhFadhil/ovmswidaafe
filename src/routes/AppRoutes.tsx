import { Routes, Route, Navigate } from "react-router-dom";

/* AUTH */

import LoginPage from "../pages/auth/login";

/* ADMIN */

import Dashboard from "../pages/admin/dashboard";
import Vehicle from "../pages/admin/vehicles";
import Driver from "../pages/admin/drivers";
import Request from "../pages/admin/requests";
import Reports from "../pages/admin/reports";
import User from "../pages/admin/users";

export default function AppRoutes() {

  return (

    <Routes>

      {/* LOGIN */}

      <Route
        path="/login"
        element={<LoginPage />}
      />

      {/* ADMIN */}

      <Route
        path="/admin/dashboard"
        element={<Dashboard />}
      />

      <Route
        path="/admin/vehicles"
        element={<Vehicle />}
      />

      <Route
        path="/admin/drivers"
        element={<Driver />}
      />

      <Route
        path="/admin/requests"
        element={<Request />}
      />

      <Route
        path="/admin/reports"
        element={<Reports />}
      />

      <Route
        path="/admin/users"
        element={<User />}
      />

      {/* DEFAULT */}

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />

    </Routes>

  );
}