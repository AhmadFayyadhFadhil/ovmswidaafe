import { Layout } from "@/components/layout/RoleLayout";
import { useState } from "react";

export default function DriverDashboard() {
  const [activeNav, setActiveNav] = useState("Dashboard");

  return (
    <Layout activeNav={activeNav} onNavigate={setActiveNav} topbarTitle="Driver Dashboard" userName="Driver User" userRole="Driver">
      <div className="p-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Welcome to Driver Dashboard</h2>
        <p className="text-slate-600">This is the driver role dashboard.</p>
      </div>
    </Layout>
  );
}
