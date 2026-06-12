import { Route } from "react-router-dom";
import ApproverDashboard from "@/pages/approver/dashboard";
import ApprovalManagement from "@/pages/approver/requests";
import HistoryPage from "@/pages/approver/history";

export default function ApproverRoutes() {
  return (
    <Route path="/approver">
      <Route path="dashboard" element={<ApproverDashboard />} />
      <Route path="requests" element={<ApprovalManagement />} />
      <Route path="history" element={<HistoryPage />} />
    </Route>
  );
}
