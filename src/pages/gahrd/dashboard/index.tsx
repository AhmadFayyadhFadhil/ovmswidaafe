import { Layout } from "@/components/layout/RoleLayout";
import { useState } from "react";

export default function GAHRDDashboard() {
  const [activeNav, setActiveNav] = useState("Dashboard");

  return (
    <Layout activeNav={activeNav} onNavigate={setActiveNav} topbarTitle="GAHRD Dashboard" userName="GAHRD User" userRole="GAHRD">
      <div className="p-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Welcome to GAHRD Dashboard</h2>
        <p className="text-slate-600">This is the GAHRD role dashboard.</p>
      </div>
    </Layout>
  );
}

