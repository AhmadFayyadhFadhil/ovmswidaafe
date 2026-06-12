import { Route } from "react-router-dom";

import Dashboard from "@/pages/admin/dashboard";
import Driver from "@/pages/admin/drivers";
import Request from "@/pages/admin/requests";
import User from "@/pages/admin/users";
import Vehicle from "@/pages/admin/vehicles";

export default function AdminRoutes() {
  return (
    <Route path="/admin">
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="drivers" element={<Driver />} />
      <Route path="requests" element={<Request />} />
      <Route path="users" element={<User />} />
      <Route path="vehicles" element={<Vehicle />} />
    </Route>
  );
}
