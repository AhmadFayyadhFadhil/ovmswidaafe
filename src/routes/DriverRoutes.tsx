import { Route } from "react-router-dom";
import DriverDashboard from "@/pages/driver/dasboard";

export default function DriverRoutes() {
  return (
    <Route path="/driver">
      <Route path="dashboard" element={<DriverDashboard />} />
    </Route>
  );
}
