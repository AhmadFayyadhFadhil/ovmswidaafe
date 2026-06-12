import { Route } from "react-router-dom";
import GAHRDDashboard from "@/pages/gahrd/dashboard";
import RequestsPage from "@/pages/gahrd/requests";

export default function GAHRDRoutes() {
  return (
    <Route path="/gahrd">
      <Route path="dashboard" element={<GAHRDDashboard onNavigate={() => {}} />} />
      <Route path="requests" element={<RequestsPage />} />
    </Route>
  );
}
