import { useState } from "react";
import { Layout } from "@/components/layout/RoleLayout";
import { Icon } from "@/components/ui/Icon";

interface StatCard {
  icon: string;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
  sub: string;
}

interface UpcomingTrip {
  id: string;
  date: string;
  time: string;
  destination: string;
  vehicle: string;
  driver: string;
  status: string;
  priority: string;
}

const STATS: StatCard[] = [
  { icon: "receipt_long", iconBg: "bg-[#e5eeff]", iconColor: "text-[#00236f]", value: "24", label: "Total Requests", sub: "Across all time" },
  { icon: "pending_actions", iconBg: "bg-[#ffd9d5]", iconColor: "text-[#ba1a1a]", value: "3", label: "Pending Approval", sub: "Action required" },
  { icon: "commute", iconBg: "bg-[#e5eeff]", iconColor: "text-[#4059aa]", value: "1", label: "Active Requests", sub: "Currently en route" },
  { icon: "task_alt", iconBg: "bg-[#f1f5f9]", iconColor: "text-[#64748b]", value: "20", label: "Completed Requests", sub: "Successfully closed" },
];

const UPCOMING_TRIPS: UpcomingTrip[] = [
  {
    id: "#REQ-9012",
    date: "Oct 28",
    time: "14:30",
    destination: "Soekarno-Hatta Int'l Airport",
    vehicle: "Toyota Camry (B-1234-XYZ)",
    driver: "John Doe",
    status: "In Progress",
    priority: "URGENT",
  },
  {
    id: "#REQ-8291",
    date: "Oct 24",
    time: "09:00",
    destination: "Tech Park Building B",
    vehicle: "Honda Odyssey (B-5678-ABC)",
    driver: "Michael Chen",
    status: "Approved",
    priority: "HIGH",
  },
];

export default function EmployeeDashboard({ onNavigate = () => {} }: { onNavigate?: (page: string) => void }) {
  const [search, setSearch] = useState("");

  return (
    <Layout
      activeNav="Dashboard"
      onNavigate={onNavigate}
      topbarTitle="Dashboard"
      userName="Andi Sullivan"
      userRole="Employee"
      searchPlaceholder="Search requests..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="p-6 space-y-6 animate-fadein">
        {/* Header */}
        <div>
          <h1 className="text-[32px] font-bold text-[#0f172a]">Welcome back, Andi!</h1>
          <p className="text-[14px] text-[#64748b] mt-1">Here's what's happening with your vehicle requests today.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4">
          {STATS.map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon name={stat.icon} className={`${stat.iconColor} text-[24px]`} />
              </div>
              <div className="text-[28px] font-bold text-[#0f172a]">{stat.value}</div>
              <div className="text-[13px] font-semibold text-[#475569] mt-1">{stat.label}</div>
              <div className="text-[11px] text-[#94a3b8]">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Upcoming Trips */}
          <div className="col-span-2">
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm">
              <div className="p-6 border-b border-[#e2e8f0]">
                <h2 className="text-[18px] font-bold text-[#0f172a]">Upcoming Trips</h2>
                <p className="text-[13px] text-[#64748b] mt-1">Your scheduled vehicle requests</p>
              </div>
              <div className="divide-y divide-[#e2e8f0]">
                {UPCOMING_TRIPS.map((trip) => (
                  <div key={trip.id} className="p-6 hover:bg-[#f8fafc] transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="inline-block px-2 py-1 bg-[#e5eeff] text-[#00236f] text-[11px] font-bold rounded-lg mb-2">
                          {trip.id}
                        </span>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#0f172a]">
                            <Icon name="calendar_today" className="text-[16px] text-[#4059aa]" />
                            {trip.date} at {trip.time}
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-[11px] font-bold ${
                        trip.status === "In Progress" ? "bg-[#dce1ff] text-[#00236f]" : "bg-[#dcfce7] text-[#16a34a]"
                      }`}>
                        {trip.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-[13px]">
                      <div className="flex items-center gap-2 text-[#475569]">
                        <Icon name="location_on" className="text-[18px] text-[#ba1a1a]" />
                        {trip.destination}
                      </div>
                      <div className="flex items-center gap-2 text-[#475569]">
                        <Icon name="directions_car" className="text-[18px] text-[#0369a1]" />
                        {trip.vehicle}
                      </div>
                      <div className="flex items-center gap-2 text-[#475569]">
                        <Icon name="person" className="text-[18px] text-[#6d28d9]" />
                        Assigned to {trip.driver}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6">
              <h3 className="text-[16px] font-bold text-[#0f172a] mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => onNavigate("Create Request")}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white rounded-xl text-[13px] font-semibold transition-all"
                >
                  <Icon name="add" className="text-[20px]" />
                  New Request
                </button>
                <button
                  onClick={() => onNavigate("My Requests")}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-[#e2e8f0] hover:bg-[#f8fafc] text-[#0f172a] rounded-xl text-[13px] font-semibold transition-all"
                >
                  <Icon name="list_alt" className="text-[20px]" />
                  View All Requests
                </button>
                <button
                  onClick={() => onNavigate("Notifications")}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-[#e2e8f0] hover:bg-[#f8fafc] text-[#0f172a] rounded-xl text-[13px] font-semibold transition-all"
                >
                  <Icon name="notifications" className="text-[20px]" />
                  Notifications
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 mt-4">
              <h3 className="text-[16px] font-bold text-[#0f172a] mb-4">Recent Activity</h3>
              <div className="space-y-4 text-[13px]">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#1e3a8a] mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-[#0f172a]">Request Approved</p>
                    <p className="text-[#64748b]">Request #REQ-8291 was approved</p>
                    <p className="text-[#94a3b8] text-[12px] mt-1">2 hours ago</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#0369a1] mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-[#0f172a]">Driver Assigned</p>
                    <p className="text-[#64748b]">John Doe assigned to your trip</p>
                    <p className="text-[#94a3b8] text-[12px] mt-1">4 hours ago</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#16a34a] mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-[#0f172a]">Request Submitted</p>
                    <p className="text-[#64748b]">New request submitted successfully</p>
                    <p className="text-[#94a3b8] text-[12px] mt-1">1 day ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
