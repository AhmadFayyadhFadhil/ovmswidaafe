import { Route } from "react-router-dom";

import CreateRequest from "@/pages/employee/createrequest";
import EmployeeDashboard from "@/pages/employee/dashboard";
import MyRequests from "@/pages/employee/myrequests";
import Notifications from "@/pages/employee/notifications";

export default function EmployeeRoutes() {
  return (
    <Route path="/employee">
      <Route path="dashboard" element={<EmployeeDashboard />} />
      <Route path="createrequest" element={<CreateRequest />} />
      <Route path="myrequests" element={<MyRequests />} />
      <Route path="notifications" element={<Notifications />} />
    </Route>
  );
}
