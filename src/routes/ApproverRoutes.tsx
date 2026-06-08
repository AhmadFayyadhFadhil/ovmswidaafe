import { Route } from "react-router-dom";
import ApproverDashboard from "@/pages/approver/dashboard";
import ApprovalManagement from "@/pages/approver/requests";
import HistoryPage from "@/pages/approver/history";

export default function ApproverRoutes() {
  const handleNavigate = (page: string) => {
    // Navigation will be handled by the router
    console.log("Navigate to:", page);
  };

  return (
    <Route path="/approver">
      <Route path="dashboard" element={<ApproverDashboard onNavigate={handleNavigate} />} />
      <Route path="requests" element={<ApprovalManagement />} />
      <Route path="history" element={<HistoryPage />} />
    </Route>
  );
}
