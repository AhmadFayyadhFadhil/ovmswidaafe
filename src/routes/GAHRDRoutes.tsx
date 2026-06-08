import { Route } from "react-router-dom";
import GAHRDDashboard from "@/pages/gahrd/dashboard";

export default function GAHRDRoutes() {
  return (
    <Route path="/gahrd">
      <Route path="dashboard" element={<GAHRDDashboard />} />
    </Route>
  );
}
