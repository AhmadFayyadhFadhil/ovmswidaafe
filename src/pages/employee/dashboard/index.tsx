import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/RoleLayout";
import { Icon } from "@/components/ui/Icon";
import { useApi } from "@/hooks/useApi";
import { requestService } from "@/services/modules/requestService";
import { useAuthContext } from "@/auth/authContext";

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

export default function EmployeeDashboard() {
  const [search, setSearch] = useState("");
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const { data: fetchedRequests, loading, error } = useApi(async () => {
    const res = await requestService.getAll({ per_page: 1000 });
    return { data: res.data || [] };
  }, true, []);

  const requestsList = fetchedRequests || [];

  // Calculate dynamic stats
  const totalRequests = requestsList.length;
  const pendingApproval = requestsList.filter(r => r.status === "PENDING").length;
  const activeRequests = requestsList.filter(r => r.status === "ONGOING").length;
  const completedRequests = requestsList.filter(r => r.status === "COMPLETED").length;

  const STATS: StatCard[] = [
    { icon: "receipt_long", iconBg: "bg-[#e5eeff]", iconColor: "text-[#00236f]", value: String(totalRequests), label: "Total Requests", sub: "Across all time" },
    { icon: "pending_actions", iconBg: "bg-[#ffd9d5]", iconColor: "text-[#ba1a1a]", value: String(pendingApproval), label: "Pending Approval", sub: "Action required" },
    { icon: "commute", iconBg: "bg-[#e5eeff]", iconColor: "text-[#4059aa]", value: String(activeRequests), label: "Active Requests", sub: "Currently en route" },
    { icon: "task_alt", iconBg: "bg-emerald-50 border border-emerald-100", iconColor: "text-emerald-600", value: String(completedRequests), label: "Completed Requests", sub: "Successfully closed" },
  ];

  // Map to upcoming trips (Approved or Pending trips)
  const UPCOMING_TRIPS: UpcomingTrip[] = requestsList
    .filter(r => {
      const raw = (r.rawStatus || r.status || "").toLowerCase();
      if (["completed", "cancelled", "rejected"].includes(raw)) return false;
      return r.status === "APPROVED" || r.status === "PENDING" || r.status === "ONGOING";
    })
    .map(r => {
      let statusLabel = "Pending";
      if (r.status === "APPROVED") statusLabel = "Approved";
      else if (r.status === "ONGOING") statusLabel = "In Progress";

      return {
        id: `#REQ-${r.id}`,
        date: r.date || "Today",
        time: r.time || "09:00",
        destination: r.destination || "Not Specified",
        vehicle: r.vehicleModel || "Unassigned",
        driver: r.driverName || "Unassigned",
        status: statusLabel,
        priority: r.priority || "NORMAL"
      };
    })
    .slice(0, 3);

  return (
    <Layout
      activeNav="Dashboard"
      topbarTitle="Dashboard"
      userName={user?.name || "Employee"}
      userRole="Employee"
      searchPlaceholder="Search requests..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="p-4 sm:p-6 space-y-6 animate-fadein">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-[32px] font-bold text-[#0f172a] leading-tight">Welcome back, {user?.name || "User"}!</h1>
          <p className="text-[14px] text-[#64748b] mt-1">Here's what's happening with your vehicle requests today.</p>
        </div>

        {/* Stat Cards Row */}
        <div data-guide="employee-dashboard-stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {STATS.map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon name={stat.icon} className={`${stat.iconColor} text-[24px]`} />
              </div>
              <div className="text-[28px] font-bold text-[#0f172a]">{loading ? "..." : stat.value}</div>
              <div className="text-[13px] font-semibold text-[#475569] mt-1">{stat.label}</div>
              <div className="text-[11px] text-[#94a3b8]">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - Upcoming Trips */}
          <div className="lg:col-span-2">
            <div data-guide="employee-upcoming-trips" className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[#e2e8f0]">
                <h3 className="text-[16px] font-bold text-[#0f172a]">Upcoming Trips</h3>
                <p className="text-[12px] text-[#64748b] mt-1">Your scheduled vehicle bookings and drivers</p>
              </div>
              <div className="divide-y divide-[#e2e8f0]">
                {loading ? (
                  <div className="p-6 text-center text-[13px] text-[#64748b]">Loading trips...</div>
                ) : error ? (
                  <div className="p-6 text-center text-[13px] text-red-500">Failed to load trips.</div>
                ) : UPCOMING_TRIPS.length === 0 ? (
                  <div className="p-6 text-center text-[13px] text-[#94a3b8]">No upcoming trips scheduled.</div>
                ) : (
                  UPCOMING_TRIPS.map((trip) => (
                    <div 
                      key={trip.id} 
                      onClick={() => navigate(`/employee/myrequests?id=${trip.id.replace('#REQ-', '')}`)}
                      className="p-6 hover:bg-[#f8fafc] transition-colors cursor-pointer"
                      title="Klik untuk melihat detail di My Requests"
                    >
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
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div data-guide="employee-quick-actions" className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6">
              <h3 className="text-[16px] font-bold text-[#0f172a] mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate("/employee/createrequest")}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white rounded-xl text-[13px] font-semibold transition-all cursor-pointer"
                >
                  <Icon name="add" className="text-[20px]" />
                  New Request
                </button>
                <button
                  onClick={() => navigate("/employee/myrequests")}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-[#e2e8f0] hover:bg-[#f8fafc] text-[#0f172a] rounded-xl text-[13px] font-semibold transition-all cursor-pointer"
                >
                  <Icon name="list_alt" className="text-[20px]" />
                  View All Requests
                </button>
                <button
                  onClick={() => navigate("/employee/notifications")}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-[#e2e8f0] hover:bg-[#f8fafc] text-[#0f172a] rounded-xl text-[13px] font-semibold transition-all cursor-pointer"
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
                {loading ? (
                  <div className="text-center text-[#94a3b8]">Loading activity...</div>
                ) : requestsList.length === 0 ? (
                  <div className="text-center text-[#94a3b8]">No recent activity.</div>
                ) : (
                  requestsList.slice(0, 3).map((r, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className={`w-2 h-2 rounded-full ${r.status === 'APPROVED' ? 'bg-[#16a34a]' : r.status === 'PENDING' ? 'bg-[#1e3a8a]' : 'bg-[#dc2626]'} mt-2 flex-shrink-0`} />
                      <div>
                        <p className="font-semibold text-[#0f172a]">
                          {r.status === 'APPROVED' ? 'Request Approved' : r.status === 'PENDING' ? 'Request Submitted' : 'Request Processed'}
                        </p>
                        <p className="text-[#64748b]">Trip to {r.destination}</p>
                        <p className="text-[#94a3b8] text-[12px] mt-1">{r.date || 'Recently'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
